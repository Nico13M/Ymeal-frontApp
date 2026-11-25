import { palette, radius, shadow } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type QuickActionsProps = {
  isMobile: boolean;
  fridgeCount: number;
};

/** Couleurs de l'accueil */
const FRIDGE_BG = '#9ca257';
const OLIVE = '#1A1A2E'; // texte de la carte Recettes (fond transparent)
const ACCENT = '#FF9C1A';

/**
 * Accès rapides, l'un sous l'autre :
 *  1. « Ingrédients au frigo » (fond #FF9C1A)
 *  2. « Recettes » juste en dessous (fond transparent) avec raccourcis
 */
export default function QuickActions({ fridgeCount }: QuickActionsProps) {
  const router = useRouter();

  const goRecipes = (params: Record<string, string> = {}) =>
    router.push({ pathname: '/(tabs)/recipes', params: { ...params, t: String(Date.now()) } });

  return (
    <View style={styles.wrap}>
      {/* Ingrédients au frigo (en premier) */}
      <Pressable
        onPress={() => router.push('/(tabs)/fridge')}
        style={({ pressed }) => [styles.card, styles.fridge, { backgroundColor: FRIDGE_BG }, pressed && styles.pressed]}
        accessibilityRole="link"
        accessibilityLabel="Mon Frigo"
      >
        <View style={styles.iconBoxWhite}>
          <Ionicons name="nutrition" size={20} color={FRIDGE_BG} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.fridgeCount}>
            {fridgeCount}{' '}
            <Text style={styles.fridgeLabel}>ingrédient{fridgeCount > 1 ? 's' : ''} au frigo</Text>
          </Text>
          <Text style={styles.fridgeSub}>
            Gère ton frigo et évite le gaspillage
          </Text>
        </View>
        {/* Flèche ronde : laisse toute la largeur à la description sur mobile */}
        <View style={styles.ctaRound}>
          <Ionicons name="arrow-forward" size={18} color={FRIDGE_BG} />
        </View>
      </Pressable>

      {/* Recettes (juste en dessous, fond transparent) */}
      <View style={[styles.card, styles.recipesCard]}>
        <Pressable
          onPress={() => goRecipes()}
          style={({ pressed }) => [styles.head, pressed && { opacity: 0.85 }]}
          accessibilityRole="link"
          accessibilityLabel="Voir les recettes"
        >
          <View style={styles.iconBox}>
            <Ionicons name="restaurant" size={20} color={ACCENT} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.title, { color: OLIVE }]}>Recettes</Text>
            <Text style={[styles.sub, { color: OLIVE }]} numberOfLines={1}>
              Trouve, génère ou crée ta recette
            </Text>
          </View>
          <View style={[styles.arrow, { backgroundColor: ACCENT }]}>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </View>
        </Pressable>

        <View style={styles.shortcuts}>
          {(
            [
              ['sparkles', 'Générateur IA', { generator: 'open' }],
              ['book-outline', 'Mes recettes', { mode: 'mine' }],
            ] as const
          ).map(([icon, label, params]) => (
            <Pressable
              key={label}
              onPress={() => goRecipes(params)}
              style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name={icon} size={15} color={ACCENT} />
              <Text style={[styles.shortcutText, { color: OLIVE }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: -34, gap: 12 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.95 },
  card: { borderRadius: radius.xl, padding: 14, ...shadow.soft },
  recipesCard: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: palette.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  sub: { fontSize: 12.5, fontWeight: '600', opacity: 0.85, marginTop: 1 },
  arrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  shortcuts: { flexDirection: 'row', gap: 8, marginTop: 12 },
  shortcut: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: palette.border,
  },
  shortcutText: { fontSize: 13, fontWeight: '800' },

  fridge: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 3, borderColor: '#FFF', ...shadow.lifted },
  ctaRound: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  iconBoxWhite: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  fridgeCount: { color: '#FFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  fridgeLabel: { fontSize: 14, fontWeight: '700' },
  fridgeSub: { color: 'rgba(255,255,255,0.95)', fontSize: 12.5, fontWeight: '600', lineHeight: 17, marginTop: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  ctaText: { color: FRIDGE_BG, fontWeight: '800', fontSize: 12.5 },
});
