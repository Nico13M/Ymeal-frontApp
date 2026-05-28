import type { TrendingRecipeItem } from '@/components/home/types';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TrendingRecipeCardProps = {
  item: TrendingRecipeItem;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  reviewCount: number;
  averageRating: number;
  formatAverageRating: (average: number) => string;
};

function getDifficultyColors(difficulty: string | null) {
  const normalizedDifficulty = (difficulty || 'Moyen').toLowerCase().trim();
  if (normalizedDifficulty.includes('débutant')) return { backgroundColor: '#1B5E20', textColor: '#FFFFFF' };
  if (normalizedDifficulty.includes('moyen')) return { backgroundColor: '#F9A825', textColor: '#1F1F1F' };
  if (normalizedDifficulty.includes('difficile')) return { backgroundColor: '#C62828', textColor: '#FFFFFF' };
  return { backgroundColor: '#E8F5E9', textColor: '#2E7D32' };
}

export default function TrendingRecipeCard({
  item,
  isDesktop,
  isTablet,
  isMobile,
  reviewCount,
  averageRating,
  formatAverageRating,
}: TrendingRecipeCardProps) {
  const difficultyColors = getDifficultyColors(item.difficulty);
  const totalTime = (item.timing?.prep_time ?? 0) + (item.timing?.duration ?? 0);

  return (
    <Link href={`/recipe/${item.id}`} asChild>
      <TouchableOpacity
        style={StyleSheet.flatten([
          styles.recipeCard,
          isDesktop && styles.recipeCardDesktop,
          isTablet && styles.recipeCardTablet,
          isMobile && styles.recipeCardMobile,
        ])}
      >
        <Image source={{ uri: item.image || 'https://via.placeholder.com/300' }} style={styles.recipeImage} resizeMode="cover" />
        <View style={styles.recipeContent}>
          <View style={styles.recipeTitleRow}>
            <Text numberOfLines={2} style={styles.recipeTitle}>{item.name}</Text>
          </View>
          <View style={styles.recipeMeta}>
            <View style={styles.recipeMetaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.recipeTime}>{totalTime} min</Text>
            </View>
            <View style={[styles.recipeTag, { backgroundColor: difficultyColors.backgroundColor }]}>
              <Text style={[styles.recipeTagText, { color: difficultyColors.textColor }]}>{item.difficulty || 'Moyen'}</Text>
            </View>
          </View>
          <View style={styles.recipeTagRow}>
            <View style={styles.recipeStatsRow}>
              <View style={styles.recipeStatPill}>
                <Ionicons name="heart" size={12} color="#FF1744" />
                <Text style={styles.recipeStatText}>{item.favorites_count} favoris</Text>
              </View>
              <View style={styles.recipeStatPill}>
                <Text style={styles.recipeStatText}>{reviewCount} avis</Text>
              </View>
              {reviewCount > 0 && (
                <View style={styles.recipeStatPill}>
                  <Ionicons name="star" size={12} color="#FFC107" />
                  <Text style={styles.recipeStatText}>{formatAverageRating(averageRating)}/5</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.recipeFooter}>
            <Text style={styles.recipeLinkText}>Voir ➔</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  recipeCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  recipeCardMobile: { width: '100%' },
  recipeCardTablet: { width: '48%' },
  recipeCardDesktop: {
    width: '23.3%',
    marginRight: '2.2%',
  },
  recipeImage: { width: '100%', height: 180 },
  recipeContent: { padding: 16 },
  recipeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  recipeTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A2E', flex: 1 },
  recipeMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 },
  recipeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recipeTime: { color: '#666', fontSize: 13 },
  recipeTagRow: { marginTop: 2 },
  recipeTag: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    marginRight: 2,
  },
  recipeStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  recipeStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  recipeStatText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
  },
  recipeTagText: { fontSize: 12, fontWeight: 'bold' },
  recipeFooter: { marginTop: 'auto', paddingTop: 12, alignSelf: 'flex-end' },
  recipeLinkText: { color: '#FF9F1C', fontWeight: 'bold', fontSize: 14, alignSelf: 'center' },
});
