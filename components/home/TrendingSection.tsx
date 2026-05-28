import TrendingRecipeCard from '@/components/home/TrendingRecipeCard';
import type { SortOption, TrendingRecipeItem } from '@/components/home/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  { value: 'ratings_count_desc', label: 'Plus d\'avis' },
  { value: 'average_rating_desc', label: 'Meilleure moyenne' },
  { value: 'created_at_desc', label: 'Plus récent' },
  { value: 'created_at_asc', label: 'Plus ancien' },
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
  isDesktop,
  isTablet,
  isMobile,
  getRatingsCount,
  getAverageRating,
  formatAverageRating,
}: TrendingSectionProps) {
  const [sortBy, setSortBy] = useState<SortOption>('ratings_count_desc');
  const [showSortOptions, setShowSortOptions] = useState(false);

  const sortedTrendingRecipes = useMemo(() => {
    const items = [...recipes];

    items.sort((a, b) => {
      if (sortBy === 'ratings_count_desc') {
        return getRatingsCount(b) - getRatingsCount(a);
      }

      if (sortBy === 'average_rating_desc') {
        return getAverageRating(b) - getAverageRating(a);
      }

      if (sortBy === 'created_at_desc') {
        return getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a);
      }

      return getCreatedAtTimestamp(a) - getCreatedAtTimestamp(b);
    });

    return items;
  }, [recipes, sortBy, getRatingsCount, getAverageRating]);

  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? 'Trier';

  const getColumnWrapperStyle = () => {
    if (numColumns === 1) return undefined;
    if (isDesktop) return styles.columnWrapperDesktop;
    return styles.columnWrapperTablet;
  };

  return (
    <View style={styles.sectionContainer}>
      {showSortOptions && (
        <View style={styles.sortOverlay} pointerEvents="box-none">
          <View style={styles.sortDropdown}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy(option.value);
                  setShowSortOptions(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderTitle}>
          <Ionicons name="trending-up" size={24} color="#FF9F1C" style={styles.trendingIcon} />
          <Text style={styles.sectionTitle}>Recettes tendances</Text>
        </View>
        <View style={styles.sortControl}>
          <TouchableOpacity
            style={styles.sortSelect}
            onPress={() => setShowSortOptions((prev) => !prev)}
          >
            <Text style={styles.sortSelectText}>Tri: {selectedSortLabel}</Text>
            <Ionicons
              name={showSortOptions ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#555"
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F1C" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={sortedTrendingRecipes}
          keyExtractor={(item) => item.id.toString()}
          key={numColumns}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? getColumnWrapperStyle() : undefined}
          contentContainerStyle={[styles.listContent, !isMobile && styles.listContentDesktop]}
          style={styles.trendingList}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TrendingRecipeCard
              item={item}
              isDesktop={isDesktop}
              isTablet={isTablet}
              isMobile={isMobile}
              reviewCount={getRatingsCount(item)}
              averageRating={getAverageRating(item)}
              formatAverageRating={formatAverageRating}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 25,
    marginHorizontal: '3.60%',
    position: 'relative',
    zIndex: 20,
    elevation: 20,
    overflow: 'visible',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 12,
  },
  sectionHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  trendingIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  sortControl: {
    position: 'relative',
    alignItems: 'flex-end',
    zIndex: 100,
    elevation: 100,
  },
  sortSelect: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 1,
    minWidth: 150,
  },
  sortSelectText: {
    color: '#333',
    fontWeight: '600',
  },
  sortOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  sortDropdown: {
    position: 'absolute',
    top: 45,
    right: 20,
    width: 220,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 9999,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortOptionActive: {
    backgroundColor: '#FFF3E6',
  },
  sortOptionText: {
    color: '#555',
  },
  sortOptionTextActive: {
    color: '#FF9F1C',
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: 20,
  },
  errorText: {
    color: '#DC2626',
  },
  listContent: {
    paddingBottom: 0,
  },
  listContentDesktop: {
    paddingHorizontal: 0,
  },
  trendingList: {
    zIndex: 0,
    elevation: 0,
  },
  columnWrapperDesktop: {
    justifyContent: 'space-between',
  },
  columnWrapperTablet: {
    justifyContent: 'space-between',
  },
});
