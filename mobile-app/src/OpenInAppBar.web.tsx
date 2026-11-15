import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// On iPhone and iPad, the website offers to open the same link in the Click app.
// A browser can't tell whether the app is installed, so this is a button rather than
// a redirect: without the app, Safari says it can't open the address.
const DISMISSED_KEY = 'click-open-in-app-dismissed';

const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac, but Macs have no touch screen.
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// The app's own address for the page that was opened, so the app lands in the same place.
// Read on first render, before App.tsx clears an add link from the address bar.
const appUrlForPage = () => {
  const path = window.location.pathname;
  const click = /^\/click\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i.exec(path);
  if (click) return `clickbracelet://click/${click[1].toLowerCase()}`;
  const add = /^\/add\/([0-9A-Za-z]{10})\/?$/.exec(path);
  if (add) return `clickbracelet://add/${add[1]}`;
  return 'clickbracelet://';
};

const wasDismissed = () => {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};

export const OpenInAppBar = () => {
  const [appUrl] = useState(appUrlForPage);
  const [visible, setVisible] = useState(() => isAppleMobile() && !wasDismissed());
  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Private browsing can block storage; the bar just comes back next visit.
    }
  };

  return (
    <View style={styles.bar}>
      <Text style={styles.label}>Have the Click app?</Text>
      <Pressable accessibilityRole="link" onPress={() => window.location.assign(appUrl)} style={styles.open}>
        <Text style={styles.openText}>Open in app</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={dismiss} style={styles.close}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7DFD6',
  },
  label: {
    flex: 1,
    color: '#4A1A2C',
    fontSize: 14,
  },
  open: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#C9A14A',
  },
  openText: {
    color: '#4A1A2C',
    fontSize: 14,
    fontWeight: '600',
  },
  close: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#7A5E66',
    fontSize: 16,
  },
});
