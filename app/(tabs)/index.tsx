import useRequireAuth from "@/src/hooks/useRequireAuth";
import { getTrendingRecipes, type RecipeMinimal } from "@/src/services/recipes";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router'; // <--- IMPORT IMPORTANT
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
// --- LISTE DES ASTUCES ---
const TIPS = [
  "Achète tes légumes au marché le samedi après-midi : les prix baissent jusqu'à 50% !",
  "Cuisine en gros lots le dimanche (batch cooking) pour gagner du temps et de l'argent la semaine.",
  "Regarde toujours le prix au kilo, pas le prix du paquet, pour trouver les vraies bonnes affaires.",
  "Utilise les applications anti-gaspillage pour récupérer des paniers surprises à petit prix.",
  "Ne jette pas tes fanes de radis ou carottes, elles font d'excellentes soupes !",
  "Congèle tes restes de pain pour en faire du pain perdu ou de la chapelure plus tard.",
  "Remplace la viande par des lentilles ou des pois chiches une fois par semaine : c'est moins cher et protéiné !"
];

type SortOption = 'ratings_count_desc' | 'average_rating_desc' | 'created_at_desc' | 'created_at_asc';

type TrendingRecipeItem = RecipeMinimal & {
  ratings_count?: number | null;
  reviews_count?: number | null;
  comments_count?: number | null;
  average_rating?: number | null;
  avg_rating?: number | null;
  rating_average?: number | null;
  created_at?: string | null;
  ratings?: {
    stats?: {
      average?: number | null;
      count?: number | null;
    } | null;
  } | null;
  timestamps?: {
    created_at?: string | null;
  } | null;
};

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'ratings_count_desc', label: 'Plus de ratings' },
  { value: 'average_rating_desc', label: 'Meilleure moyenne' },
  { value: 'created_at_desc', label: 'Plus récent' },
  { value: 'created_at_asc', label: 'Plus ancien' },
];

export default function DashboardScreen() {
  const { checking } = useRequireAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const numColumns = isDesktop ? 4 : isTablet ? 2 : 1;

  const [todaysTip, setTodaysTip] = useState(TIPS[0]);
  const [trendingRecipes, setTrendingRecipes] = useState<TrendingRecipeItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('ratings_count_desc');
  const [showSortOptions, setShowSortOptions] = useState(false);
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * TIPS.length);
    setTodaysTip(TIPS[randomIndex]);
  }, []);

  useEffect(() => {
    if (checking) return;

   const loadTrending = async () => {
  setTrendingLoading(true);
  setTrendingError(null);

  try {
    const result = await getTrendingRecipes();
    const recipes = (result.recipes ?? []) as TrendingRecipeItem[];
    recipes.forEach((recipe, index) => {
    });

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
};

    loadTrending();
  }, [checking]);

  const getColumnWrapperStyle = () => {
    if (numColumns === 1) return undefined;
    if (isDesktop) return styles.columnWrapperDesktop;
    return styles.columnWrapperTablet;
  };

  const getDifficultyColors = (difficulty: string | null) => {
    const normalizedDifficulty = (difficulty || 'Moyen').toLowerCase().trim();
    if (normalizedDifficulty.includes('débutant')) return { backgroundColor: '#1B5E20', textColor: '#FFFFFF' };
    if (normalizedDifficulty.includes('moyen')) return { backgroundColor: '#F9A825', textColor: '#1F1F1F' };
    if (normalizedDifficulty.includes('difficile')) return { backgroundColor: '#C62828', textColor: '#FFFFFF' };
    return { backgroundColor: '#E8F5E9', textColor: '#2E7D32' };
  };

  const getRatingsCount = (recipe: TrendingRecipeItem): number => {
    if (typeof recipe.ratings?.stats?.count === 'number') return recipe.ratings.stats.count;
    if (typeof recipe.ratings_count === 'number') return recipe.ratings_count;
    if (typeof recipe.reviews_count === 'number') return recipe.reviews_count;
    if (typeof recipe.comments_count === 'number') return recipe.comments_count;
    return 0;
  };

 const getAverageRating = (recipe: TrendingRecipeItem): number => {

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
};

  const formatAverageRating = (average: number): string => {
    if (!Number.isFinite(average) || average <= 0) return '0.0';
    return average.toFixed(1);
  };

  const getCreatedAtTimestamp = (recipe: TrendingRecipeItem): number => {
    const createdAt = recipe.created_at ?? recipe.timestamps?.created_at;
    if (!createdAt) return 0;

    const timestamp = new Date(createdAt).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const sortedTrendingRecipes = useMemo(() => {
    const items = [...trendingRecipes];

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
  }, [trendingRecipes, sortBy]);

  const selectedSortLabel = SORT_OPTIONS.find(option => option.value === sortBy)?.label ?? 'Trier';

  const renderTrendingRecipe = ({ item }: { item: RecipeMinimal }) => {
    const difficultyColors = getDifficultyColors(item.difficulty);
    const totalTime = (item.timing?.prep_time ?? 0) + (item.timing?.duration ?? 0);
    const reviewCount = getRatingsCount(item as TrendingRecipeItem);
    const averageRating = getAverageRating(item as TrendingRecipeItem);
    
console.log("Recipe:", item.name);
console.log("Average Rating:", averageRating);
console.log("Formatted:", formatAverageRating(averageRating));
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
              <Text style={styles.recipePrice}>{item.difficulty || 'Moyen'}</Text>
            </View>
            <View style={styles.recipeTagRow}>
              <View style={[styles.recipeTag, { backgroundColor: difficultyColors.backgroundColor }]}>
                <Text style={[styles.recipeTagText, { color: difficultyColors.textColor }]}>{item.difficulty || 'Moyen'}</Text>
              </View>
              <View style={styles.recipeStatsRow}>
                <View style={styles.recipeStatPill}>
                  <Ionicons name="heart" size={12} color="#FF1744" />
                  <Text style={styles.recipeStatText}>{item.favorites_count} favoris</Text>
                </View>
                <View style={styles.recipeStatPill}>
                  <Ionicons name="chatbubble-outline" size={12} color="#666" />
                    <Text style={styles.recipeStatText}>{reviewCount} avis</Text>
                </View>
                  <View style={styles.recipeStatPill}>
                    <Ionicons name="star" size={12} color="#FFC107" />
                    <Text style={styles.recipeStatText}>{formatAverageRating(averageRating)}/5</Text>
                  </View>
              </View>
            </View>
            <View style={styles.recipeFooter}>
              <Text style={styles.recipeLinkText}>Voir ➔</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF9F1C" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF9F1C" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        
        {/* HEADER ORANGE */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
<View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
   <Text style={styles.brandName}>Ymeal</Text>
</View>
          </View>
          <Text style={styles.greetingTitle}>Bonjour ! 👋</Text>
          <Text style={styles.greetingSub}>Prêt à cuisiner quelque chose de délicieux ?</Text>
        </View>

        {/* ACTIONS RAPIDES */}
        <View style={styles.actionsContainer}>
          {/* Lien vers Frigo */}
          <Link href="/(tabs)/fridge" asChild>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.cardHeaderRow}>
                 <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                   <Ionicons name="cube-outline" size={24} color="#2196F3" />
                 </View>
                 <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
              </View>
              <Text style={styles.actionTitle}>Mon Frigo</Text>
              <Text style={styles.actionDesc}>Gère ton inventaire et génère des recettes</Text>
            </TouchableOpacity>
          </Link>

          {/* Lien vers Recettes */}
          <Link href="/(tabs)/recipes" asChild>
            <TouchableOpacity style={styles.actionCard}>
               <View style={styles.cardHeaderRow}>
                 <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                   <Ionicons name="book-outline" size={24} color="#4CAF50" />
                 </View>
               </View>
              <Text style={styles.actionTitle}>Recettes</Text>
              <Text style={styles.actionDesc}>Découvre des recettes adaptées à ton budget</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* RECETTES TENDANCES */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={24} color="#FF9F1C" style={{marginRight: 8}} />
            <Text style={styles.sectionTitle}>Recettes tendances</Text>
          </View>

          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={styles.sortSelect}
              onPress={() => setShowSortOptions(prev => !prev)}
            >
              <Text style={styles.sortSelectText}>Tri: {selectedSortLabel}</Text>
              <Ionicons name={showSortOptions ? 'chevron-up' : 'chevron-down'} size={18} color="#555" />
            </TouchableOpacity>

            {showSortOptions && (
              <View style={styles.sortDropdown}>
                {SORT_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.sortOption, sortBy === option.value && styles.sortOptionActive]}
                    onPress={() => {
                      setSortBy(option.value);
                      setShowSortOptions(false);
                    }}
                  >
                    <Text style={[styles.sortOptionText, sortBy === option.value && styles.sortOptionTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {trendingLoading ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#FF9F1C" />
            </View>
          ) : trendingError ? (
            <View style={{ paddingVertical: 20 }}>
              <Text style={{ color: '#DC2626' }}>{trendingError}</Text>
            </View>
          ) : (
            <FlatList
              data={sortedTrendingRecipes}
              keyExtractor={(item) => item.id.toString()}
              key={numColumns}
              numColumns={numColumns}
              columnWrapperStyle={numColumns > 1 ? getColumnWrapperStyle() : undefined}
              contentContainerStyle={[
                styles.listContent,
                !isMobile && styles.listContentDesktop,
              ]}
              scrollEnabled={false}
              renderItem={renderTrendingRecipe}
            />
          )}
        </View>

        {/* ASTUCE DU JOUR */}
        <LinearGradient
          colors={['#D500F9', '#FF4081']} 
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.tipContainer}
        >
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={24} color="#FFF" style={{marginRight: 8}} />
            <Text style={styles.tipTitle}>Astuce du jour</Text>
          </View>
          <Text style={styles.tipText}>{todaysTip}</Text>
        </LinearGradient>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F2' },
  headerContainer: { backgroundColor: '#FF9F1C', paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  brandName: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  greetingTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
  greetingSub: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  actionsContainer: { paddingHorizontal: 20, marginTop: -20, gap: 15 , marginHorizontal: "3.60%"},
  actionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  badge: { backgroundColor: '#FF6B6B', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'absolute', right: 0, top: 0 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  actionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 5 },
  actionDesc: { fontSize: 14, color: '#888', lineHeight: 20 },
  sectionContainer: { paddingHorizontal: 20, marginTop: 25, marginHorizontal: "3.60%" },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A2E' },
  sortContainer: { marginBottom: 14 },
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
  },
  sortSelectText: { color: '#333', fontWeight: '600' },
  sortDropdown: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
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
  listContent: { paddingBottom: 0 },
  listContentDesktop: { paddingHorizontal: 0 },
  columnWrapperDesktop: { justifyContent: 'space-between' },
  columnWrapperTablet: { justifyContent: 'space-between' },
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
  recipeCardDesktop: {  width: "23.3%",
    marginRight: "2.2%",
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
  recipeBadge: {
    flexDirection: 'row',
    backgroundColor: '#FFC107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    alignItems: 'center',
  },
  recipeBadgeText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4, color: '#333' },
  recipeMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 },
  recipeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recipeTime: { color: '#666', fontSize: 13 },
  recipePrice: { color: '#FF9F1C', fontWeight: 'bold', fontSize: 16 },
  recipeTagRow: { marginTop: 2 },
  recipeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
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
  recipeFooter: { marginTop: 'auto', paddingTop: 12, alignSelf: 'flex-end'},
  recipeLinkText: { color: '#FF9F1C', fontWeight: 'bold', fontSize: 14, alignSelf: 'center' },
  tipContainer: {
    marginHorizontal: "3.80%", marginTop: 10, marginBottom: 30, borderRadius: 20, padding: 20,
    shadowColor: '#D500F9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tipTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  tipText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
});