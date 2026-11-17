import { StyleSheet, View } from 'react-native';
import PublicCard from './src/PublicCard';

// Web-only preview: react-native-webview has no browser support, so render the
// same HTML in an iframe. Native sign-in bridging (window.ReactNativeWebView) is
// absent here, so "Continue with Google" skips straight to the next screen.
const html: string = require('./html.json');

export default function App() {
  const shareToken = getShareToken();
  if (shareToken) return <PublicCard shareToken={shareToken} />;

  return (
    <View style={styles.container}>
      <iframe title="Click" srcDoc={html} style={{ flex: 1, width: '100%', height: '100%', border: 0 }} />
    </View>
  );
}

function getShareToken() {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/add\/([A-Za-z0-9_-]+)\/?$/);
  return match?.[1] ?? null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDE7F0',
  },
});
