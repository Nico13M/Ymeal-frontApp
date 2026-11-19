import { brandGradient, MAX_CONTENT_WIDTH, palette, radius, shadow } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type HomeHeaderProps = {
  displayName?: string;
};

/** Accroches affichées en titre : une nouvelle à chaque ouverture / actualisation. */
export const HOME_TAGLINES = [
  "Qu'est-ce qu'on cuisine aujourd'hui ?",
  'Une petite faim ? On a ce qu’il te faut.',
  'Bien manger sans se ruiner, c’est parti !',
  'Ton frigo a plein d’idées pour toi.',
  'Envie de nouveauté ce soir ?',
  'Fini les pâtes au ketchup !',
  'Planifie, cuisine, savoure.',
  'Un bon repas en 20 minutes, ça te dit ?',
  'Zéro gaspi, 100 % gourmand.',
  'Prêt à épater tes colocs ?',
  'Cuisiner malin, même avec un petit budget.',
  'Laisse-toi inspirer par l’IA YMeal.',
];

function pickTagline(): string {
  return HOME_TAGLINES[Math.floor(Math.random() * HOME_TAGLINES.length)];
}

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Bonne nuit';
  if (h < 18) return 'Bonjour';
  return 'Bonsoir';
}

export default function HomeHeader({ displayName }: HomeHeaderProps) {
  const router = useRouter();
  const name = displayName?.trim();
  // Tirée au montage : change à chaque actualisation de la page
  const [tagline] = useState(pickTagline);
  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 14 : 54;

  return (
    <LinearGradient
      colors={brandGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: topPad }]}
    >
      <View style={styles.halo} pointerEvents="none" />
      <View style={styles.halo2} pointerEvents="none" />

      <View style={styles.inner}>
      <View style={styles.topRow}>
        <Image
          source={require('@/assets/images/logo_ymeal_small.png')}
          style={styles.brandLogo}
          resizeMode="contain"
          accessibilityLabel="YMeal"
        />
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityLabel="Mon profil"
        >
          {name ? (
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          ) : (
            <Ionicons name="person" size={18} color={palette.primaryDark} />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.hello}>
        {greetingForNow()}
        {name ? `, ${name}` : ''}
      </Text>
      <Text style={styles.title}>{tagline}</Text>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 60,
    paddingHorizontal: 22,
    borderBottomLeftRadius: radius.xl + 6,
    borderBottomRightRadius: radius.xl + 6,
    overflow: 'hidden',
  },
  halo: {
    position: 'absolute',
    right: -70,
    top: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  halo2: {
    position: 'absolute',
    left: -50,
    bottom: -90,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  inner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH - 12, alignSelf: 'center' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandLogo: { width: 62, height: 80 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  avatarText: { fontSize: 17, fontWeight: '800', color: palette.primaryDark },
  hello: { fontSize: 16, color: 'rgba(255,255,255,0.95)', fontWeight: '600' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.6,
    lineHeight: 34,
    marginTop: 4,
    maxWidth: 520,
  },
});

/**
 * Barre compacte qui apparaît en haut quand on fait défiler l'accueil :
 * le grand en-tête défile et se « réduit » progressivement en cette barre.
 */
export function HomeCompactBar({ scrollY, displayName }: { scrollY: Animated.Value; displayName?: string }) {
  const router = useRouter();
  const name = displayName?.trim();
  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 6 : Platform.OS === 'web' ? 12 : 46;
  const opacity = scrollY.interpolate({ inputRange: [90, 150], outputRange: [0, 1], extrapolate: 'clamp' });
  const translateY = scrollY.interpolate({ inputRange: [90, 150], outputRange: [-16, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      style={[compact.bar, { paddingTop: topPad, opacity, transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={compact.inner}>
        <Image
          source={require('@/assets/images/logo_ymeal_small.png')}
          style={compact.logo}
          resizeMode="contain"
          accessibilityLabel="YMeal"
        />
        <TouchableOpacity
          style={compact.avatar}
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityLabel="Mon profil"
        >
          {name ? (
            <Text style={compact.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          ) : (
            <Ionicons name="person" size={15} color={palette.primaryDark} />
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const compact = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.soft,
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH - 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 30, height: 38 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: palette.primaryDark },
});
