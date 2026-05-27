import DailyTipCard from '@/components/home/DailyTipCard';
import HomeHeader from '@/components/home/HomeHeader';
import QuickActions from '@/components/home/QuickActions';
import TrendingSection from '@/components/home/TrendingSection';
import type { TrendingRecipeItem } from '@/components/home/types';
import { STORAGE_KEYS } from '@/constants/storage';
import useRequireAuth from '@/src/hooks/useRequireAuth';
import { getTrendingRecipes } from '@/src/services/recipes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

const TIPS = [
  "Achète tes légumes au marché le samedi aprés-midi : les prix baissent jusqu'à 50% !",
  "Cuisine en gros lots le dimanche (batch cooking) pour gagner du temps et de l'argent la semaine.",
  "Regarde toujours le prix au kilo, pas le prix du paquet, pour trouver les vraies bonnes affaires.",
  "Utilise les applications anti-gaspillage pour récupérer des paniers surprises petit prix.",
  "Ne jette pas tes fanes de radis ou carottes, elles font d'excellentes soupes !",
  "Congèle tes restes de pain pour en faire du pain perdu ou de la chapelure plus tard.",
  "Remplace la viande par des lentilles ou des pois chiches une fois par semaine : c'est moins cher et protéiné !",
];

type StoredAccountProfile = {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  pseudo?: string;
};

function toCleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export default function DashboardScreen() {
  const { checking } = useRequireAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const numColumns = isDesktop ? 4 : isTablet ? 2 : 1;

  const [todaysTip, setTodaysTip] = useState(TIPS[0]);
  const [displayName, setDisplayName] = useState('');
  const [fridgeCount, setFridgeCount] = useState(0);
  const [trendingRecipes, setTrendingRecipes] = useState<TrendingRecipeItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * TIPS.length);
    setTodaysTip(TIPS[randomIndex]);
  }, []);

  const loadTrending = useCallback(async () => {
    if (checking) return;

    setTrendingLoading(true);
    setTrendingError(null);

    try {
      const result = await getTrendingRecipes();
      const recipes = (result.recipes ?? []) as TrendingRecipeItem[];
      setTrendingRecipes(recipes);
    } catch (error) {
      setTrendingError(
        error instanceof Error
          ? error.message
          : 'Impossible de charger les recettes tendances'
      );
      setTrendingRecipes([]);
    } finally {
      setTrendingLoading(false);
    }
  }, [checking]);

  const loadDisplayName = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.accountProfile);
      if (!raw) {
        setDisplayName('');
        return;
      }

      const parsed = JSON.parse(raw) as StoredAccountProfile;
      const nickname = toCleanString(parsed.nickname || parsed.pseudo);
      const fullName = [toCleanString(parsed.firstName), toCleanString(parsed.lastName)]
        .filter(Boolean)
        .join(' ');

      setDisplayName(nickname || fullName);
    } catch {
      setDisplayName('');
    }
  }, []);

  const loadFridgeCount = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.frigoIngredients);
      if (!raw) {
        setFridgeCount(0);
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, { quantity?: number }>;
      if (!parsed || typeof parsed !== 'object') {
        setFridgeCount(0);
        return;
      }

      const count = Object.values(parsed).filter((item) => (item?.quantity ?? 0) > 0).length;
      setFridgeCount(count);
    } catch {
      setFridgeCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTrending();
      void loadDisplayName();
      void loadFridgeCount();
    }, [loadTrending, loadDisplayName, loadFridgeCount])
  );

  const getRatingsCount = useCallback((recipe: TrendingRecipeItem): number => {
    if (typeof recipe.ratings?.stats?.count === 'number') return recipe.ratings.stats.count;
    if (typeof recipe.ratings_count === 'number') return recipe.ratings_count;
    if (typeof recipe.reviews_count === 'number') return recipe.reviews_count;
    if (typeof recipe.comments_count === 'number') return recipe.comments_count;
    return 0;
  }, []);

  const getAverageRating = useCallback((recipe: TrendingRecipeItem): number => {
    if (typeof recipe.ratings?.stats?.average === 'number') {
      return recipe.ratings.stats.average;
    }

    if (typeof recipe.average_rating === 'number') {
      return recipe.average_rating;
    }

    if (typeof recipe.avg_rating === 'number') {
      return recipe.avg_rating;
    }

    if (typeof recipe.rating_average === 'number') {
      return recipe.rating_average;
    }

    return 0;
  }, []);

  const formatAverageRating = useCallback((average: number): string => {
    if (!Number.isFinite(average) || average <= 0) return '0.0';
    return average.toFixed(1);
  }, []);

  if (checking) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF9F1C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF9F1C" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <HomeHeader displayName={displayName} />

        <QuickActions isMobile={isMobile} fridgeCount={fridgeCount} />

        <TrendingSection
          recipes={trendingRecipes}
          loading={trendingLoading}
          error={trendingError}
          numColumns={numColumns}
          isDesktop={isDesktop}
          isTablet={isTablet}
          isMobile={isMobile}
          getRatingsCount={getRatingsCount}
          getAverageRating={getAverageRating}
          formatAverageRating={formatAverageRating}
        />

        <DailyTipCard tip={todaysTip} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F2',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 30,
  },
});
