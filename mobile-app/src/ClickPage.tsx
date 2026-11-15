import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// The prototype page, plus the bridge App.tsx talks to it through. The page sends
// messages with window.ReactNativeWebView.postMessage; App.tsx runs code in it with
// injectJavaScript. ClickPage.web.tsx gives the browser the same bridge.
export type ClickPageHandle = { injectJavaScript: (script: string) => void };
type ClickPageProps = { html: string; onMessage: (message: string) => void };

export const ClickPage = forwardRef<ClickPageHandle, ClickPageProps>(({ html, onMessage }, ref) => {
  const webView = useRef<WebView<{}>>(null);
  useImperativeHandle(ref, () => ({ injectJavaScript: (script) => webView.current?.injectJavaScript(script) }), []);
  return (
    <WebView<{}>
      ref={webView}
      style={styles.page}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={(event) => onMessage(event.nativeEvent.data)}
    />
  );
});

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
});
