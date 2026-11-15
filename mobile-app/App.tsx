import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './src/supabase';

WebBrowser.maybeCompleteAuthSession();

const html: string = require('./html.json');

export default function App() {
  const webView = useRef<WebView<{}>>(null);

  const continueAfterSignIn = () => {
    webView.current?.injectJavaScript(`
      window.__clickGoogleAuthed = true;
      Array.from(document.querySelectorAll('button'))
        .find((button) => button.textContent?.includes('Continue with Google'))?.click();
      true;
    `);
  };

  const handleMessage = async (message: string) => {
    if (message === 'google-sign-in') {
      try {
        const { data: current } = await supabase.auth.getSession();
        if (current.session) {
          if (__DEV__) console.log(`Google sign-in skipped: already signed in as ${current.session.user.email}. Sign out in Settings to see the Google page again.`);
          continueAfterSignIn();
          return;
        }

        const redirectTo = Linking.createURL('auth/callback');
        // Supabase falls back to its Site URL (often localhost) unless this exact URL is allow-listed.
        if (__DEV__) console.log(`Google sign-in redirect URL (add to Supabase Redirect URLs): ${redirectTo}`);
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
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

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        continueAfterSignIn();
      } catch (error) {
        Alert.alert('Google sign-in failed', error instanceof Error ? error.message : 'Please try again.');
      }
    } else if (message === 'sign-out') {
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
