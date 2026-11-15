import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert, Platform, SafeAreaView, Share, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { FunctionsHttpError } from '@supabase/supabase-js';
import qrcode from 'qrcode-generator';
import { ClickPage, type ClickPageHandle } from './src/ClickPage';
import { OpenInAppBar } from './src/OpenInAppBar';
import { supabase } from './src/supabase';

// On web this closes the Google sign-in popup and hands its result to the app.
WebBrowser.maybeCompleteAuthSession();

const html: string = require('./html.json');

// Alert.alert does nothing in the browser, so the web build uses window.alert.
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};

// Resolves true if the user picks the action, false if they cancel.
const confirmAction = (title: string, message: string, action: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(window.confirm(`${title}\n\n${message}`))
    : new Promise<boolean>((resolve) =>
        Alert.alert(
          title,
          message,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: action, onPress: () => resolve(true) },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        ),
      );

// Sent by Frontend.html after the profile or socials screen.
type ProfileMessage = {
  name: string;
  bio: string;
  interests: string[];
  socials: Record<string, string>;
  customLinks: unknown[];
  photo?: string;
};

// Sent by Frontend.html after a click's note or event is edited, or the click is removed.
type ClickChange = { id: string; removed?: true; event?: string; note?: string };

// Sent by Frontend.html's Ask tab. The answer is the ask-clicks function's reply.
type AskMessage = {
  type: 'ask';
  id: string;
  question: string;
  history: { role: 'user' | 'assistant'; text: string }[];
  localTime: string;
};
type AskAnswer = { text: string; people: { id: string; reason: string }[] };

// Links the app opens, for example from an NFC tag or a shared link:
//   click/<click id>    opens one of your clicks, expanded in the clicks list
//   add/<share code>    adds the person who shared the link as a click (SHAREPLAN.md)
// In Expo Go they look like exp://<computer IP>:8081/--/click/<click id>, in app builds
// clickbracelet://click/<click id>, and on web http://localhost:8081/click/<click id>.
type AppLink = { kind: 'click'; id: string } | { kind: 'add'; code: string };
const parseLink = (url: string | null): AppLink | null => {
  if (!url) return null;
  const { hostname, path } = Linking.parse(url);
  const route = hostname === 'click' || hostname === 'add' ? `${hostname}/${path ?? ''}` : (path ?? '');
  const click = /^click\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i.exec(route);
  if (click) return { kind: 'click', id: click[1].toLowerCase() };
  const add = /^add\/([0-9A-Za-z]{10})\/?$/.exec(route);
  return add ? { kind: 'add', code: add[1] } : null;
};

type PageMessage =
  | { type: 'save-profile'; profile: ProfileMessage }
  | { type: 'update-clicks'; changes: ClickChange[] }
  | { type: 'add-share-answer'; add: boolean }
  | { type: 'open-url'; url: string }
  | AskMessage;

// Share links open the website, which works for anyone. On an iPhone with the app
// installed, the website's Open in app bar hands the link to the app.
const SHARE_SITE = 'https://click-bracelet.vercel.app';
const shareLinks = (code: string) => ({
  // The web build shares its own address, so local previews link to themselves.
  url: Platform.OS === 'web' ? Linking.createURL(`add/${code}`) : `${SHARE_SITE}/add/${code}`,
  // For NFC tags: opens the installed app directly (exp://… in Expo Go).
  tagUrl: Platform.OS === 'web' ? `clickbracelet://add/${code}` : Linking.createURL(`add/${code}`),
});

// The page can't load a QR library from the internet, so the app draws the code.
const qrDataUrl = (text: string) => {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }))}`;
};

export default function App() {
  const page = useRef<ClickPageHandle>(null);
  const pageReady = useRef(false);
  // Web only: a sign-in finished by redirecting this tab, waiting for the page to load.
  const pendingSignInUserId = useRef<string | null>(null);
  // Set once the signed-in user's profile and clicks are loaded into the page.
  const loadedUserId = useRef<string | null>(null);
  const loadedClickIds = useRef(new Set<string>());
  const pendingClickId = useRef<string | null>(null);
  const pendingShareCode = useRef<string | null>(null);
  // Answers the page's "Add this person?" card.
  const pendingAddAnswer = useRef<((add: boolean) => void) | null>(null);

  const setPageState = (patch: Record<string, unknown>) => {
    page.current?.injectJavaScript(`window.__clickApp && window.__clickApp.setState(${JSON.stringify(patch)}); true;`);
  };

  const loadProfile = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (!data) return false;
    const socials: Record<string, string> = data.socials ?? {};
    const [tag1 = '', tag2 = '', tag3 = '', tag4 = ''] = data.interests ?? [];
    setPageState({
      profName: data.display_name,
      profBio: data.bio,
      tag1, tag2, tag3, tag4,
      photo: data.photo_url ?? '',
      on: Object.fromEntries(Object.keys(socials).map((id) => [id, true])),
      handles: socials,
      customLinks: data.custom_links ?? [],
    });
    return true;
  };

  const saveProfile = async (profile: ProfileMessage) => {
    const { data: current } = await supabase.auth.getSession();
    if (!current.session) return;
    const userId = current.session.user.id;

    let photoUrl: string | undefined;
    if (profile.photo?.startsWith('data:')) {
      const [meta, base64] = profile.photo.split(',');
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const path = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, bytes, { contentType: meta.slice(5).split(';')[0], upsert: true });
      if (uploadError) throw uploadError;
      // Cache-bust so a replaced photo shows up instead of the old one.
      photoUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      display_name: profile.name,
      bio: profile.bio,
      interests: profile.interests,
      socials: profile.socials,
      custom_links: profile.customLinks,
      updated_at: new Date().toISOString(),
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    });
    if (error) throw error;
    if (photoUrl) setPageState({ photo: photoUrl });
  };

  const loadClicks = async () => {
    // Until the bracelet exists, new accounts get the prototype's demo clicks in dev
    // and in phone builds (IOSPLAN.md), but not on the public website.
    if (__DEV__ || Platform.OS !== 'web') {
      const { error: seedError } = await supabase.rpc('seed_demo_clicks');
      if (seedError) throw seedError;
    }
    // Access rules limit this to the signed-in user's own clicks.
    const { data, error } = await supabase
      .from('clicks')
      .select('id, snapshot, location, event, note, clicked_at')
      .order('clicked_at', { ascending: false });
    if (error) throw error;
    loadedClickIds.current = new Set(data.map((row) => row.id));
    page.current?.injectJavaScript(`window.__clickSetClicks && window.__clickSetClicks(${JSON.stringify(data)}); true;`);
  };

  const updateClicks = async (changes: ClickChange[]) => {
    for (const { id, removed, ...fields } of changes) {
      const { error } = removed
        ? await supabase.from('clicks').delete().eq('id', id)
        : await supabase.from('clicks').update(fields).eq('id', id);
      if (error) throw error;
    }
  };

  // Sends null when Ask AI can't answer, so the page falls back to its keyword search.
  const askClicks = async ({ id, question, history, localTime }: AskMessage) => {
    const { data, error } = await supabase.functions.invoke<AskAnswer>('ask-clicks', {
      body: { question, history, localTime },
    });
    if (error && __DEV__) {
      const detail = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
      console.warn('Ask AI failed, using keyword search instead:', detail?.error ?? error.message);
    }
    const answer = error ? null : data;
    page.current?.injectJavaScript(
      `window.__clickAnswer && window.__clickAnswer(${JSON.stringify(id)}, ${JSON.stringify(answer)}); true;`,
    );
  };

  const continueAfterSignIn = async (userId: string) => {
    let loaded = false;
    let hasRegisteredProfile = false;
    try {
      const [profileExists] = await Promise.all([loadProfile(userId), loadClicks()]);
      hasRegisteredProfile = profileExists;
      loaded = true;
    } catch (error) {
      showAlert('Could not load your Click data', error instanceof Error ? error.message : 'Please try again.');
    }
    if (hasRegisteredProfile) {
      // Returning users have already completed setup, so take them straight to
      // their Clicks rather than replaying bracelet, profile, and preset steps.
      page.current?.injectJavaScript('window.__clickGoogleAuthed = true; true;');
      setPageState({ screen: 'clicks', fromSettings: false });
    } else {
      page.current?.injectJavaScript(`
        window.__clickGoogleAuthed = true;
        Array.from(document.querySelectorAll('button'))
          .find((button) => button.textContent?.includes('Continue with Google'))?.click();
        true;
      `);
    }
    if (loaded) {
      loadedUserId.current = userId;
      await openPendingLink();
    }
  };

  // The signed-in user's links that add them as a click on someone else's phone.
  const getShareLinks = async () => {
    const { data: code, error } = await supabase.rpc('get_my_share_code');
    if (error) throw error;
    return shareLinks(code as string);
  };

  // Fills the page's Share sheet with the links and a QR code of the web link.
  const showShareLinks = ({ url, tagUrl }: ReturnType<typeof shareLinks>) =>
    setPageState({ shareLink: url, shareQr: qrDataUrl(url), shareTagLink: tagUrl });

  const resetShareLink = async () => {
    const reset = await confirmAction(
      'Reset your share link?',
      "Links and QR codes you've already shared will stop working. You'll get a new one.",
      'Reset',
    );
    if (!reset) return;
    const { data: code, error } = await supabase.rpc('reset_share_code');
    if (error) throw error;
    showShareLinks(shareLinks(code as string));
  };

  // Shows the page's "Add this person?" card and waits for the answer.
  const askToAdd = (preview: { name: string; description: string | null; photo_url: string | null }) =>
    new Promise<boolean>((resolve) => {
      pendingAddAnswer.current?.(false);
      pendingAddAnswer.current = resolve;
      setPageState({ addPreview: { name: preview.name, description: preview.description ?? '', photo: preview.photo_url ?? '' } });
    });

  // Deletes the avatar files (Storage doesn't allow deleting them with SQL), then the
  // account and everything stored about it, then the session saved on this device.
  const deleteAccount = async () => {
    const { data: current } = await supabase.auth.getSession();
    if (!current.session) throw new Error('Sign in again, then delete your account.');
    const userId = current.session.user.id;
    const { data: files, error: listError } = await supabase.storage.from('avatars').list(userId);
    if (listError) throw listError;
    if (files.length) {
      const { error: removeError } = await supabase.storage.from('avatars').remove(files.map((file) => `${userId}/${file.name}`));
      if (removeError) throw removeError;
    }
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
    // The account is gone, so only the local session is left to clear.
    await supabase.auth.signOut({ scope: 'local' });
  };

  const shareProfile = async () => {
    const { url } = await getShareLinks();
    const message = `Add me on Click: ${url}`;
    if (Platform.OS !== 'web') {
      await Share.share({ message });
    } else if (navigator.share) {
      // Closing the browser's share sheet rejects; that isn't an error.
      await navigator.share({ title: 'Add me on Click', url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      showAlert('Link copied', `Send this link to add you as a click:\n${url}`);
    }
  };

  // Shows who a share link belongs to and, if the user agrees, adds them as a click.
  // Returns the click's id, or null if nothing was added.
  const addFromShare = async (code: string) => {
    const { data: preview, error } = await supabase.rpc('get_share_preview', { code }).maybeSingle<{
      name: string;
      photo_url: string | null;
      description: string | null;
      is_self: boolean;
    }>();
    if (error) throw error;
    if (!preview) {
      showAlert('Link not valid', 'That share link is no longer valid. Ask them to send a new one.');
      return null;
    }
    if (preview.is_self) {
      showAlert('This is your link', 'Send it to someone else so they can add you as a click.');
      return null;
    }
    if (!(await askToAdd(preview))) return null;
    const { data: clickId, error: addError } = await supabase.rpc('add_click_from_share', { code });
    if (addError) throw addError;
    await loadClicks();
    return clickId as string;
  };

  // Acts on the link that opened the app once the page is up and the user's clicks are loaded.
  const openPendingLink = async () => {
    if ((!pendingClickId.current && !pendingShareCode.current) || !pageReady.current) return;
    if (!loadedUserId.current) {
      // Still signed in from an earlier visit: load their data without the welcome screen.
      // Otherwise the link waits until they sign in.
      const { data: current } = await supabase.auth.getSession();
      if (current.session) await continueAfterSignIn(current.session.user.id);
      return;
    }
    const code = pendingShareCode.current;
    if (code) {
      pendingShareCode.current = null;
      try {
        const clickId = await addFromShare(code);
        if (clickId) pendingClickId.current = clickId;
      } catch (error) {
        showAlert('Could not add this person', error instanceof Error ? error.message : 'Please try again.');
      }
    }
    const id = pendingClickId.current;
    if (!id) return;
    pendingClickId.current = null;
    if (!loadedClickIds.current.has(id)) {
      showAlert('Click not found', "That click isn't in this account.");
      return;
    }
    page.current?.injectJavaScript(`window.__clickOpenClick && window.__clickOpenClick(${JSON.stringify(id)}); true;`);
  };

  const openPendingSignIn = async () => {
    const userId = pendingSignInUserId.current;
    if (!userId || !pageReady.current) return;
    pendingSignInUserId.current = null;
    await continueAfterSignIn(userId);
  };

  // Web only: when the sign-in popup was blocked, Google sends this tab back to
  // /auth/callback. Finish signing in, then continue once the page has loaded.
  useEffect(() => {
    if (Platform.OS !== 'web' || window.opener) return;
    const callback = new URL(window.location.href);
    if (!callback.pathname.endsWith('/auth/callback')) return;
    window.history.replaceState(null, '', '/');
    const authError = callback.searchParams.get('error_description');
    const code = callback.searchParams.get('code');
    if (authError || !code) {
      showAlert('Google sign-in failed', authError ?? 'The Google callback did not include an authorization code.');
      return;
    }
    void supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error) {
        showAlert('Google sign-in failed', error.message);
        return;
      }
      pendingSignInUserId.current = data.user.id;
      void openPendingSignIn();
    });
  }, []);

  // Listens to every incoming link, so tapping the same tag twice opens it again.
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      const link = parseLink(url);
      if (!link) return;
      if (link.kind === 'click') pendingClickId.current = link.id;
      else pendingShareCode.current = link.code;
      // So refreshing the page doesn't ask to add the same person again.
      if (Platform.OS === 'web' && link.kind === 'add') window.history.replaceState(null, '', '/');
      void openPendingLink();
    };
    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => subscription.remove();
  }, []);

  const handleMessage = async (message: string) => {
    if (message.startsWith('{')) {
      const parsed = JSON.parse(message) as PageMessage;
      if (parsed.type === 'save-profile') {
        try {
          await saveProfile(parsed.profile);
        } catch (error) {
          showAlert('Could not save your profile', error instanceof Error ? error.message : 'Please try again.');
        }
      } else if (parsed.type === 'update-clicks') {
        try {
          await updateClicks(parsed.changes);
        } catch (error) {
          showAlert('Could not save your click changes', error instanceof Error ? error.message : 'Please try again.');
        }
      } else if (parsed.type === 'add-share-answer') {
        pendingAddAnswer.current?.(parsed.add);
        pendingAddAnswer.current = null;
      } else if (parsed.type === 'ask') {
        await askClicks(parsed);
      } else if (parsed.type === 'open-url') {
        const url = new URL(parsed.url);
        if (url.protocol !== 'https:') return;
        await Linking.openURL(url.toString());
      }
    } else if (message === 'google-sign-in') {
      try {
        const { data: current } = await supabase.auth.getSession();
        if (current.session) {
          if (__DEV__) console.log(`Google sign-in skipped: already signed in as ${current.session.user.email}. Sign out in Settings to see the Google page again.`);
          await continueAfterSignIn(current.session.user.id);
          return;
        }

        const redirectTo = Linking.createURL('auth/callback');
        // Supabase falls back to its Site URL (often localhost) unless this exact URL is allow-listed.
        if (__DEV__) console.log(`Google sign-in redirect URL (add to Supabase Redirect URLs): ${redirectTo}`);
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          // Always show Google's account picker. Otherwise a phone whose browser is signed in
          // to one Google account is signed in with it again, even after signing out of Click.
          options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
        });
        if (error) throw error;
        if (!data.url) throw new Error('Supabase did not return a Google sign-in URL.');

        let result: Awaited<ReturnType<typeof WebBrowser.openAuthSessionAsync>>;
        try {
          // On web this opens Google in a popup window.
          result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        } catch (error) {
          // A browser can block the popup. Sign in in this tab instead; finishWebRedirectSignIn
          // picks up the result when Google sends the browser back.
          if (Platform.OS === 'web' && (error as { code?: string }).code === 'ERR_WEB_BROWSER_BLOCKED') {
            window.location.assign(data.url);
            return;
          }
          throw error;
        }
        if (result.type !== 'success' || !result.url) return;

        const callback = new URL(result.url);
        const authError = callback.searchParams.get('error_description');
        if (authError) throw new Error(authError);
        const code = callback.searchParams.get('code');
        if (!code) throw new Error('The Google callback did not include an authorization code.');

        const { data: signedIn, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        await continueAfterSignIn(signedIn.user.id);
      } catch (error) {
        showAlert('Google sign-in failed', error instanceof Error ? error.message : 'Please try again.');
      }
    } else if (message === 'page-ready') {
      pageReady.current = true;
      await openPendingSignIn();
      await openPendingLink();
    } else if (message === 'get-share-link') {
      try {
        showShareLinks(await getShareLinks());
      } catch (error) {
        setPageState({ shareOpen: false });
        showAlert('Could not get your share link', error instanceof Error ? error.message : 'Please try again.');
      }
    } else if (message === 'reset-share-link') {
      try {
        await resetShareLink();
      } catch (error) {
        showAlert('Could not reset your share link', error instanceof Error ? error.message : 'Please try again.');
      }
    } else if (message === 'share-profile') {
      try {
        await shareProfile();
      } catch (error) {
        showAlert('Could not share your Click', error instanceof Error ? error.message : 'Please try again.');
      }
    } else if (message === 'sign-out') {
      pendingAddAnswer.current?.(false);
      pendingAddAnswer.current = null;
      loadedUserId.current = null;
      loadedClickIds.current = new Set();
      const { error } = await supabase.auth.signOut();
      if (error) showAlert('Sign-out failed', error.message);
    } else if (message === 'delete-account') {
      try {
        await deleteAccount();
        pendingAddAnswer.current?.(false);
        pendingAddAnswer.current = null;
        loadedUserId.current = null;
        loadedClickIds.current = new Set();
        page.current?.injectJavaScript('window.__clickAccountDeleted && window.__clickAccountDeleted(true); true;');
      } catch (error) {
        page.current?.injectJavaScript('window.__clickAccountDeleted && window.__clickAccountDeleted(false); true;');
        showAlert('Could not delete your account', error instanceof Error ? error.message : 'Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <OpenInAppBar />
      <ClickPage ref={page} html={html} onMessage={(message) => void handleMessage(message)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
});
