import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { ClickPageHandle } from './ClickPage';

export type { ClickPageHandle } from './ClickPage';
type ClickPageProps = { html: string; onMessage: (message: string) => void };

// react-native-webview has no browser support, so the web build hosts the page in an
// iframe and recreates the WebView bridge: this script, added before the page's own,
// gives it window.ReactNativeWebView.postMessage, and its messages come back here.
const BRIDGE_SCRIPT =
  '<script>window.ReactNativeWebView = { postMessage: function (message) { window.parent.postMessage({ clickBridge: String(message) }, "*"); } };</script>';

export const ClickPage = forwardRef<ClickPageHandle, ClickPageProps>(({ html, onMessage }, ref) => {
  const frame = useRef<HTMLIFrameElement>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  // srcDoc frames share this page's origin, so the app can run code in the page directly.
  useImperativeHandle(
    ref,
    () => ({
      injectJavaScript: (script) => {
        const page = frame.current?.contentWindow as (Window & { eval: (code: string) => unknown }) | null | undefined;
        page?.eval(script);
      },
    }),
    [],
  );

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || typeof event.data?.clickBridge !== 'string') return;
      onMessageRef.current(event.data.clickBridge);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

  const srcDoc = useMemo(() => html.replace(/<head[^>]*>/i, (head) => head + BRIDGE_SCRIPT), [html]);
  return <iframe ref={frame} title="Click" srcDoc={srcDoc} style={{ flex: 1, width: '100%', height: '100%', border: 0 }} />;
});
