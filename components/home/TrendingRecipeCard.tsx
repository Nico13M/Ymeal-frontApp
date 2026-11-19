import type { TrendingRecipeItem } from '@/components/home/types';
import { palette, radius, shadow } from '@/constants/design';
import { RECIPE_IMAGE_FALLBACK, translateDifficulty } from '@/constants/recipePresentation';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type TrendingRecipeCardProps = {
  item: TrendingRecipeItem;
  rank: number;
  /** largeur fixe (carrousel) ou en % (grille) */
  width: number | `${number}%`;
  reviewCount: number;
  averageRating: number;
  formatAverageRating: (average: number) => string;
};

const DIFFICULTY_STYLE: Record<string, { bg: string; fg: string }> = {
  Débutant: { bg: '#E8F5E9', fg: '#1B7F3B' },
  Moyen: { bg: '#FFF4D6', fg: '#9A6B00' },
  Difficile: { bg: '#FEE2E2', fg: '#B91C1C' },
};

export default function TrendingRecipeCard({
  item,
  rank,
  width,
  reviewCount,
  averageRating,
  formatAverageRating,
}: TrendingRecipeCardProps) {
  const totalTime = (item.timing?.prep_time ?? 0) + (item.timing?.duration ?? 0);
  const difficulty = translateDifficulty(item.difficulty);
  const diff = DIFFICULTY_STYLE[difficulty] ?? { bg: palette.primarySoft, fg: palette.primaryDark };

  const router = useRouter();
  return (
      <Pressable
        onPress={() => router.push(`/recipe/${item.id}`)}
        accessibilityRole="link"
        style={({ pressed }) => [styles.card, { width }, pressed && { transform: [{ scale: 0.985 }] }]}
      >
        <View>
          <Image
            source={{ uri: item.image || RECIPE_IMAGE_FALLBACK }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.rank}>
            <Ionicons name="flame" size={12} color="#FFF" />
            <Text style={styles.rankText}>#{rank}</Text>
          </View>
          <View style={styles.fav}>
            <Ionicons name="heart" size={12} color={palette.heart} />
            <Text style={styles.favText}>{item.favorites_count ?? 0}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text numberOfLines={2} style={styles.title}>
            {item.name}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.pill}>
              <Ionicons name="time-outline" size={13} color={palette.textMuted} />
              <Text style={styles.pillText}>{totalTime} min</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: diff.bg, borderColor: diff.bg }]}>
              <Text style={[styles.pillText, { color: diff.fg }]}>{difficulty}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Ionicons
              name={reviewCount > 0 ? 'star' : 'star-outline'}
              size={15}
              color={reviewCount > 0 ? palette.gold : palette.textFaint}
            />
            <Text style={styles.rating}>
              {reviewCount > 0 ? formatAverageRating(averageRating) : '–'}
              <Text style={styles.ratingSub}> ({reviewCount} avis)</Text>
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="arrow-forward-circle" size={22} color={palette.primary} />
          </View>
        </View>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.soft,
  },
  image: { width: '100%', height: 150 },
  rank: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: palette.primaryDark,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  rankText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  fav: {
    position: 'absolute',
    right: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  favText: { fontWeight: '800', fontSize: 12, color: palette.ink },
  body: { padding: 14 },
  title: { fontSize: 16.5, fontWeight: '800', color: palette.ink, letterSpacing: -0.2, minHeight: 42 },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: palette.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  rating: { fontSize: 13.5, fontWeight: '800', color: palette.ink },
  ratingSub: { fontSize: 12, fontWeight: '600', color: palette.textMuted },
});
