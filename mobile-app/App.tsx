import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './src/supabase';

WebBrowser.maybeCompleteAuthSession();

const html: string = require('./html.json');

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

// Links that open one click's profile, for example from an NFC tag:
//   Expo Go:    exp://<computer IP>:8081/--/click/<click id>
//   App builds: clickbracelet://click/<click id>
const clickIdFromUrl = (url: string | null) => {
  if (!url) return null;
  const { hostname, path } = Linking.parse(url);
  const route = hostname === 'click' ? `click/${path ?? ''}` : (path ?? '');
  const match = /^click\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i.exec(route);
  return match ? match[1].toLowerCase() : null;
};

type PageMessage =
  | { type: 'save-profile'; profile: ProfileMessage }
  | { type: 'update-clicks'; changes: ClickChange[] }
  | AskMessage;

export default function App() {
  const webView = useRef<WebView<{}>>(null);
  const pageReady = useRef(false);
  // Set once the signed-in user's profile and clicks are loaded into the page.
  const loadedUserId = useRef<string | null>(null);
  const loadedClickIds = useRef(new Set<string>());
  const pendingClickId = useRef<string | null>(null);

  const setPageState = (patch: Record<string, unknown>) => {
    webView.current?.injectJavaScript(`window.__clickApp && window.__clickApp.setState(${JSON.stringify(patch)}); true;`);
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (!data) return;
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
    // Until the bracelet exists, dev builds give each account the prototype's demo clicks.
    if (__DEV__) {
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
    webView.current?.injectJavaScript(`window.__clickSetClicks && window.__clickSetClicks(${JSON.stringify(data)}); true;`);
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
    webView.current?.injectJavaScript(
      `window.__clickAnswer && window.__clickAnswer(${JSON.stringify(id)}, ${JSON.stringify(answer)}); true;`,
    );
  };

  const continueAfterSignIn = async (userId: string) => {
    let loaded = false;
    try {
      await Promise.all([loadProfile(userId), loadClicks()]);
      loaded = true;
    } catch (error) {
      Alert.alert('Could not load your Click data', error instanceof Error ? error.message : 'Please try again.');
    }
    webView.current?.injectJavaScript(`
      window.__clickGoogleAuthed = true;
      Array.from(document.querySelectorAll('button'))
        .find((button) => button.textContent?.includes('Continue with Google'))?.click();
      true;
    `);
    if (loaded) {
      loadedUserId.current = userId;
      await openPendingClick();
    }
  };

  // Opens the click a link asked for once the page is up and the user's clicks are loaded.
  const openPendingClick = async () => {
    const id = pendingClickId.current;
    if (!id || !pageReady.current) return;
    if (!loadedUserId.current) {
      // Still signed in from an earlier visit: load their data without the welcome screen.
      // Otherwise the link waits until they sign in.
      const { data: current } = await supabase.auth.getSession();
      if (current.session) await continueAfterSignIn(current.session.user.id);
      return;
    }
    pendingClickId.current = null;
    if (!loadedClickIds.current.has(id)) {
      Alert.alert('Click not found', "That click isn't in this account.");
      return;
    }
    webView.current?.injectJavaScript(`window.__clickOpenClick && window.__clickOpenClick(${JSON.stringify(id)}); true;`);
  };

  // Listens to every incoming link, so tapping the same tag twice opens it again.
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      const id = clickIdFromUrl(url);
      if (!id) return;
      pendingClickId.current = id;
      void openPendingClick();
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
          Alert.alert('Could not save your profile', error instanceof Error ? error.message : 'Please try again.');
        }
      } else if (parsed.type === 'update-clicks') {
        try {
          await updateClicks(parsed.changes);
        } catch (error) {
          Alert.alert('Could not save your click changes', error instanceof Error ? error.message : 'Please try again.');
        }
      } else if (parsed.type === 'ask') {
        await askClicks(parsed);
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

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
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
        Alert.alert('Google sign-in failed', error instanceof Error ? error.message : 'Please try again.');
      }
    } else if (message === 'page-ready') {
      pageReady.current = true;
      await openPendingClick();
    } else if (message === 'sign-out') {
      loadedUserId.current = null;
      loadedClickIds.current = new Set();
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert('Sign-out failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <WebView<{}>
        ref={webView}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={(event) => void handleMessage(event.nativeEvent.data)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDE7F0',
  },
  webview: {
    flex: 1,
  },
});
