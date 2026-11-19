import TrendingRecipeCard from '@/components/home/TrendingRecipeCard';
import type { SortOption, TrendingRecipeItem } from '@/components/home/types';
import { palette, radius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

type TrendingSectionProps = {
  recipes: TrendingRecipeItem[];
  loading: boolean;
  error: string | null;
  numColumns: number;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  getRatingsCount: (recipe: TrendingRecipeItem) => number;
  getAverageRating: (recipe: TrendingRecipeItem) => number;
  formatAverageRating: (average: number) => string;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'ratings_count_desc', label: "Plus d'avis" },
  { value: 'average_rating_desc', label: 'Mieux notées' },
  { value: 'created_at_desc', label: 'Récentes' },
  { value: 'created_at_asc', label: 'Anciennes' },
];

function getCreatedAtTimestamp(recipe: TrendingRecipeItem): number {
  const createdAt = recipe.created_at ?? recipe.timestamps?.created_at;
  if (!createdAt) return 0;
  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function TrendingSection({
  recipes,
  loading,
  error,
  numColumns,
  isMobile,
  getRatingsCount,
  getAverageRating,
  formatAverageRating,
}: TrendingSectionProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>('ratings_count_desc');

  // ── Carrousel : flèches pour faire défiler les recettes ──
  const CARD_STEP = 252; // largeur d'une carte (240) + espacement (12)
  const carouselRef = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const maxScroll = Math.max(0, contentWidth - screenWidth);
  const canPrev = scrollX > 4;
  const canNext = scrollX < maxScroll - 4;
  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setScrollX(e.nativeEvent.contentOffset.x);
  const scrollByCards = (dir: 1 | -1) => {
    const target = Math.max(0, Math.min(maxScroll, Math.round(scrollX / CARD_STEP + dir) * CARD_STEP));
    carouselRef.current?.scrollTo({ x: target, animated: true });
  };

  const sorted = useMemo(() => {
    const items = [...recipes];
    items.sort((a, b) => {
      if (sortBy === 'ratings_count_desc') return getRatingsCount(b) - getRatingsCount(a);
      if (sortBy === 'average_rating_desc') return getAverageRating(b) - getAverageRating(a);
      if (sortBy === 'created_at_desc') return getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a);
      return getCreatedAtTimestamp(a) - getCreatedAtTimestamp(b);
    });
    return items;
  }, [recipes, sortBy, getRatingsCount, getAverageRating]);

  const renderCard = (item: TrendingRecipeItem, index: number, width: number | `${number}%`) => (
    <TrendingRecipeCard
      key={item.id}
      item={item}
      rank={index + 1}
      width={width}
      reviewCount={getRatingsCount(item)}
      averageRating={getAverageRating(item)}
      formatAverageRating={formatAverageRating}
    />
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>EN CE MOMENT</Text>
          <Text style={styles.title}>Recettes tendances</Text>
        </View>
          <TouchableOpacity style={styles.seeAll} onPress={() => router.push('/(tabs)/recipes')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
            <Ionicons name="chevron-forward" size={16} color={palette.primaryDark} />
          </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
      >
        {SORT_OPTIONS.map((o) => {
          const on = sortBy === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              style={[styles.sortChip, on && styles.sortChipOn]}
              onPress={() => setSortBy(o.value)}
            >
              <Text style={[styles.sortText, on && styles.sortTextOn]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.emptyText}>Pas encore de tendance cette semaine.</Text>
        </View>
      ) : isMobile ? (
        // Carrousel horizontal sur mobile, avec flèches de défilement
        <View>
        <ScrollView
          ref={carouselRef}
          onScroll={onCarouselScroll}
          scrollEventThrottle={16}
          onContentSizeChange={(w) => setContentWidth(w)}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={252}
          decelerationRate="fast"
          contentContainerStyle={styles.carousel}
        >
          {sorted.map((item, i) => renderCard(item, i, 240))}
        </ScrollView>
        {sorted.length > 1 && (
          <View style={styles.arrows}>
            <TouchableOpacity
              onPress={() => scrollByCards(-1)}
              disabled={!canPrev}
              style={[styles.arrowBtn, !canPrev && styles.arrowOff]}
              accessibilityLabel="Recettes précédentes"
            >
              <Ionicons name="chevron-back" size={20} color={canPrev ? '#FFF' : palette.textFaint} />
            </TouchableOpacity>
            <View style={styles.dots}>
              {sorted.slice(0, 8).map((r, i) => {
                const active = Math.round(scrollX / CARD_STEP) === i;
                return <View key={r.id} style={[styles.dot, active && styles.dotOn]} />;
              })}
            </View>
            <TouchableOpacity
              onPress={() => scrollByCards(1)}
              disabled={!canNext}
              style={[styles.arrowBtn, !canNext && styles.arrowOff]}
              accessibilityLabel="Recettes suivantes"
            >
              <Ionicons name="chevron-forward" size={20} color={canNext ? '#FFF' : palette.textFaint} />
            </TouchableOpacity>
          </View>
        )}
        </View>
      ) : (
        // Grille sur tablette / desktop
        <View style={styles.grid}>
          {sorted.map((item, i) =>
            renderCard(item, i, `${100 / Math.max(numColumns, 2) - 2}%` as `${number}%`),
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  kicker: { fontSize: 11.5, fontWeight: '800', color: palette.primaryDark, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: palette.ink, letterSpacing: -0.4 },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: palette.primarySoft,
  },
  seeAllText: { color: palette.primaryDark, fontWeight: '800', fontSize: 13 },
  sortRow: { gap: 8, paddingHorizontal: 20, paddingBottom: 14 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sortChipOn: { backgroundColor: palette.ink, borderColor: palette.ink },
  sortText: { fontSize: 13, fontWeight: '700', color: palette.textMuted },
  sortTextOn: { color: '#FFF' },
  carousel: { gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  arrows: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 2 },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOff: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5D5BF' },
  dotOn: { width: 16, backgroundColor: palette.primary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 20,
  },
  state: { paddingVertical: 30, alignItems: 'center', paddingHorizontal: 20 },
  errorText: { color: palette.danger, fontWeight: '600' },
  emptyText: { color: palette.textMuted },
});
