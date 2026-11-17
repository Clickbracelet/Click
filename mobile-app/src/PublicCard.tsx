import { useEffect, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type PublicSocial = {
  platform_name: string;
  handle: string;
  action_label: string;
  open_type: 'link' | 'copy' | 'link_or_copy' | 'lookup';
  profile_url: string | null;
  copy_value: string | null;
  copy_note: string | null;
};

type PublicCardData = {
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  interests: string[];
  current_preset_name: string;
  socials: PublicSocial[];
};

const WAITLIST_URL = 'https://clickbracelet.com/?waitlist=1&src=nfc';
const PUBLIC_CARDS: Record<string, PublicCardData> = {
  '8PfX05P4HA': {
  display_name: 'Audrey Guinn Stephenson',
  photo_url: null,
  bio: 'Founded Click. Electro-pop musician who writes, sings, and produces her own music. Startup founder, marketing, entrepreneur.',
  interests: ['Click founder', 'Electro-pop musician', 'Business', 'Cal Poly'],
  current_preset_name: 'Networking',
  socials: [
    { platform_name: 'Instagram', handle: '@audreyguinn', action_label: 'Follow', open_type: 'link', profile_url: 'https://www.instagram.com/audreyguinn/', copy_value: null, copy_note: null },
    { platform_name: 'LinkedIn', handle: 'Audrey Guinn Stephenson', action_label: 'Connect', open_type: 'lookup', profile_url: 'https://www.linkedin.com/search/results/people/?keywords=Audrey%20Guinn%20Stephenson', copy_value: null, copy_note: null },
    { platform_name: 'Website', handle: 'clickbracelet.com', action_label: 'Visit', open_type: 'link', profile_url: 'https://clickbracelet.com', copy_value: null, copy_note: null },
  ],
  },
};

export default function PublicCard({ shareToken }: { shareToken: string }) {
  const [card, setCard] = useState<PublicCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCard() {
      const row = PUBLIC_CARDS[shareToken];
      if (active) {
        if (!row) setMessage('This Click is no longer available.');
        else setCard(row);
        setLoading(false);
      }
    }

    void loadCard();
    return () => { active = false; };
  }, [shareToken]);

  const openWaitlist = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(WAITLIST_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    void Linking.openURL(WAITLIST_URL);
  };

  const useSocial = async (social: PublicSocial) => {
    const shouldCopy = social.open_type === 'copy'
      || (social.open_type === 'link_or_copy' && !isHttpUrl(social.profile_url));
    if (shouldCopy) {
      const value = social.copy_value || social.handle;
      try {
        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(value);
        }
        setMessage(social.copy_note || `${social.platform_name} copied.`);
      } catch {
        setMessage(`Copy ${value} to connect on ${social.platform_name}.`);
      }
      return;
    }

    if (!isHttpUrl(social.profile_url)) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(social.profile_url, '_blank', 'noopener,noreferrer');
    } else {
      void Linking.openURL(social.profile_url);
    }
  };

  if (loading || !card) {
    return (
      <View style={styles.page}>
        <View style={styles.statusCard}>
          <Text style={styles.brand}>CLICK</Text>
          <Text style={styles.status}>{loading ? 'Opening your Click…' : message}</Text>
          {!loading && <Text style={styles.statusHint}>Ask the person who shared this link for an updated Click.</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.brand}>CLICK</Text>
          {card.photo_url ? (
            <Image source={{ uri: card.photo_url }} style={styles.photo} accessibilityLabel={`${card.display_name}'s profile photo`} />
          ) : (
            <View style={styles.photoFallback}>
              <Text style={styles.initial}>{card.display_name.trim().slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{card.display_name}</Text>
          {!!card.bio?.trim() && <Text style={styles.bio}>{card.bio.trim()}</Text>}

          {!!card.interests?.length && (
            <View style={styles.interests}>
              {card.interests.filter(Boolean).map((interest, index) => (
                <View key={`${interest}-${index}`} style={styles.interest}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Connect</Text>
          <View style={styles.socials}>
            {card.socials?.map((social, index) => (
              <Pressable key={`${social.platform_name}-${index}`} onPress={() => void useSocial(social)} style={styles.social}>
                <View style={styles.socialIcon}>
                  <Text style={styles.socialInitials}>{social.platform_name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.socialCopy}>
                  <Text style={styles.socialName}>{social.platform_name}</Text>
                  {!!social.handle && <Text style={styles.socialHandle}>{social.handle}</Text>}
                </View>
                <Text style={styles.socialAction}>{social.action_label || 'Open'}</Text>
              </Pressable>
            ))}
            {!card.socials?.length && <Text style={styles.emptySocials}>No socials are shared in this preset.</Text>}
          </View>

          {!!message && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{message}</Text>}
          <Pressable onPress={openWaitlist} style={({ pressed }) => [styles.waitlist, webGradient, pressed && styles.pressed]}>
            <Text style={styles.waitlistText}>Join the waitlist</Text>
          </Pressable>
        </View>
        <Text style={styles.footer}>Shared with Click</Text>
      </ScrollView>
    </View>
  );
}

function isHttpUrl(value: string | null): value is string {
  return !!value && /^https:\/\//i.test(value);
}

// Expo Web passes this web-only CSS property through to the browser.
const webGradient = {
  backgroundImage: 'linear-gradient(90deg, #E0C27F 0%, #C9A14A 50%, #C38A6C 100%)',
} as any;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  card: { width: '100%', maxWidth: 460, alignItems: 'center', padding: 26, borderRadius: 28, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DFD6' },
  statusCard: { width: '88%', maxWidth: 460, alignItems: 'center', padding: 28, borderRadius: 24, backgroundColor: '#FFFFFF' },
  brand: { marginBottom: 22, color: '#7A5E66', fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  previewLabel: { marginTop: -14, marginBottom: 14, color: '#7A5E66', fontSize: 10, fontWeight: '600', letterSpacing: 1.2 },
  photo: { width: 132, height: 132, borderRadius: 66, backgroundColor: '#F5F0E8' },
  photoFallback: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0E8' },
  initial: { color: '#4A1A2C', fontFamily: 'Georgia', fontSize: 50 },
  name: { marginTop: 18, color: '#4A1A2C', fontFamily: 'Georgia', fontSize: 30, fontWeight: '600', textAlign: 'center' },
  bio: { marginTop: 10, color: '#7A5E66', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  interests: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 18 },
  interest: { borderRadius: 999, backgroundColor: '#F5F0E8', paddingHorizontal: 12, paddingVertical: 7 },
  interestText: { color: '#4A1A2C', fontSize: 13 },
  divider: { alignSelf: 'stretch', height: 1, marginTop: 24, backgroundColor: '#E7DFD6' },
  sectionTitle: { alignSelf: 'flex-start', marginTop: 20, marginBottom: 10, color: '#4A1A2C', fontFamily: 'Georgia', fontSize: 21 },
  socials: { alignSelf: 'stretch', gap: 9 },
  social: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 58, padding: 9, borderRadius: 15, backgroundColor: '#FAF7F2' },
  socialIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#FFFFFF' },
  socialInitials: { color: '#4A1A2C', fontSize: 11, fontWeight: '700' },
  socialCopy: { flex: 1 },
  socialName: { color: '#4A1A2C', fontSize: 15, fontWeight: '600' },
  socialHandle: { marginTop: 2, color: '#7A5E66', fontSize: 13 },
  socialAction: { paddingHorizontal: 12, paddingVertical: 8, overflow: 'hidden', borderRadius: 999, backgroundColor: '#6B1E2E', color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  emptySocials: { color: '#7A5E66', fontSize: 14 },
  feedback: { alignSelf: 'stretch', marginTop: 12, color: '#7A5E66', fontSize: 13 },
  waitlist: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', minHeight: 54, marginTop: 18, borderRadius: 999, backgroundColor: '#C9A14A' },
  waitlistText: { color: '#4A1A2C', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.86 },
  status: { color: '#4A1A2C', fontFamily: 'Georgia', fontSize: 22, textAlign: 'center' },
  statusHint: { marginTop: 8, color: '#7A5E66', fontSize: 14, textAlign: 'center' },
  footer: { marginTop: 14, color: '#7A5E66', fontSize: 12 },
});
