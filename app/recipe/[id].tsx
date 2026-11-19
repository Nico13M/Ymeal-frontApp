import { Ionicons } from '@expo/vector-icons';
import { RECIPE_IMAGE_FALLBACK, translateDifficulty } from '@/constants/recipePresentation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewStyle
} from 'react-native';

import useRequireAuth from '../../src/hooks/useRequireAuth';
import { ApiError, apiRequest, FORBIDDEN_MESSAGE, RECIPE_NOT_FOUND_MESSAGE } from '../../src/lib/api';
import { getSession } from '../../src/services/auth';
import { getFavoriteOverride } from '../../src/lib/favoritesStore';
import { addToFavorites, getFavoriteIds, getRecipe, removeFromFavorites, type RecipeFull } from '../../src/services/recipes';
import { estimateIngredientCost, formatEuro, getRecipePrice } from '../../src/lib/recipePrice';

interface RatingPayload {
  rating: number;
  comment: string | null;
}

interface RatingResponse {
  id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  /** L'auteur d'une note est identifié par son pseudo (plus par son e-mail) */
  user?: {
    id: number;
    pseudo?: string | null;
    name?: string | null;
  };
}

/** Nom affiché pour l'auteur d'une note : pseudo, sinon nom, sinon « Anonyme ». */
function ratingAuthorName(rating: RatingResponse): string {
  const r = rating as RatingResponse & { pseudo?: unknown; author?: { pseudo?: unknown; name?: unknown } };
  const candidates = [rating.user?.pseudo, r.pseudo, r.author?.pseudo, rating.user?.name, r.author?.name];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && !c.includes('@')) return c.trim();
  }
  return 'Anonyme';
}

type RatingsListApiResponse = {
  data?: { ratings?: RatingResponse[] } | RatingResponse[] | null;
  ratings?: RatingResponse[] | null;
};

type MyRatingApiResponse = {
  data?: unknown;
  rating?: unknown;
  comment?: unknown;
  created_at?: unknown;
  user?: unknown;
  id?: unknown;
} & Record<string, unknown>;

const RANDOM_TIPS = [
  "Économise jusqu'à 200€ par mois en cuisinant maison.",
  "Parfait pour des lunchbox sur 3 jours.",
  "Remplace la crème par du yaourt pour alléger.",
  "Ajoute du citron pour relever les saveurs.",
  "Une tasse ≈ 120g farine / 200g sucre."
];

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { checking } = useRequireAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [recipe, setRecipe] = useState<RecipeFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [userRating, setUserRating] = useState<number>(0);
  const [hasUserRated, setHasUserRated] = useState<boolean>(false);
  const [comment, setComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isLoadingRating, setIsLoadingRating] = useState(false);
  const [allRatings, setAllRatings] = useState<RatingResponse[]>([]);
  const [randomTip, setRandomTip] = useState(RANDOM_TIPS[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  // Nombre de personnes choisi : les quantités, le prix et les valeurs nutritionnelles s'adaptent
  const [servingsCount, setServingsCount] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // État pour la notification
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'success', visible: false });

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, visible: true });
    // Auto-close après 3 secondes
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const contentContainerStyle: ViewStyle = isDesktop
    ? { paddingBottom: 40, paddingHorizontal: 48, alignItems: 'center' }
    : { paddingBottom: 20 };

  const sectionStyle: ViewStyle | undefined = isDesktop
    ? { width: '100%', maxWidth: 960 }
    : undefined;

  useEffect(() => {
    if (checking || !id) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [data, favIds] = await Promise.all([getRecipe(Number(id)), getFavoriteIds()]);
        setRecipe(data);
        setServingsCount(Math.max(1, Number(data.servings) || 1));
        // is_favorited peut être absent selon le backend : on croise avec la liste des favoris
        // Priorité au dernier changement fait dans l'app (ex. ♥ d'une carte de la liste)
        const override = getFavoriteOverride(data.id);
        setIsFavorite(override ?? (Boolean(data.is_favorited) || favIds.has(data.id)));
        
        // Charger mon rating
        await loadMyRating(Number(id));
        // Charger tous les ratings
        await loadAllRatings(Number(id));
      } catch (e) {
        // Recette privée d'un autre utilisateur : le serveur répond 403 ou 404.
        // Même message neutre dans les deux cas.
        if (e instanceof ApiError && (e.status === 403 || e.status === 404)) {
          setError(RECIPE_NOT_FOUND_MESSAGE);
        } else {
          setError(e instanceof Error ? e.message : 'Erreur');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [checking, id]);

  useEffect(() => {
    const index = Math.floor(Math.random() * RANDOM_TIPS.length);
    setRandomTip(RANDOM_TIPS[index]);
  }, []);

  const toggleStep = (index: number) => {
    setCheckedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    const init = async () => {
      const session = await getSession();
      setCurrentUserId((session?.user as any)?.id ?? null);
    };

    init();
  }, []);

  const handleRating = (score: number) => {
    setUserRating(score);
    setShowCommentForm(true);
  };

  const extractRatings = (response: RatingsListApiResponse): RatingResponse[] => {
    const nestedData = response.data;

    if (Array.isArray(nestedData)) {
      return nestedData;
    }

    if (nestedData && Array.isArray((nestedData as { ratings?: RatingResponse[] }).ratings)) {
      return (nestedData as { ratings: RatingResponse[] }).ratings;
    }

    if (Array.isArray(response.ratings)) {
      return response.ratings;
    }

    return [];
  };

const extractMyRating = (response: MyRatingApiResponse): RatingResponse | null => {
  if (response.rating && typeof response.rating === 'object') {
    const record = response.rating as Record<string, unknown>;

    if (
      typeof record.id === 'number' &&
      typeof record.rating === 'number' &&
      typeof record.created_at === 'string'
    ) {
      const result = {
        id: record.id,
        rating: record.rating,
        comment: typeof record.comment === 'string' ? record.comment : null,
        created_at: record.created_at,
        user: record.user as RatingResponse['user']
      };
      return result;
    }
  }

  // Ensuite, essayer l'ancienne logique pour les autres formats
  const candidates = [response, response.data].filter(Boolean) as unknown[];
  for (let idx = 0; idx < candidates.length; idx++) {
    const candidate = candidates[idx];
    if (!candidate || typeof candidate !== 'object') continue;

    const record = candidate as Record<string, unknown>;
    const nestedData = record.data;

    if (nestedData && nestedData !== candidate) {
      const nestedRating = extractMyRating(nestedData as MyRatingApiResponse);
      if (nestedRating) return nestedRating;
    }

    if (
      typeof record.id === 'number' &&
      typeof record.rating === 'number' &&
      typeof record.created_at === 'string'
    ) {
      return {
        id: record.id,
        rating: record.rating,
        comment: typeof record.comment === 'string' ? record.comment : null,
        created_at: record.created_at,
        user: record.user as RatingResponse['user']
      };
    }
  }

  return null;
};
  const formatIngredientUnit = (unit: RecipeFull['nutrition']['ingredients'][number]['unit']): string => {
    if (!unit) return '';
    if (typeof unit === 'string') return unit;
    return unit.symbol || unit.name || '';
  };

  const loadMyRating = async (recipeId: number) => {
    try {
      const session = await getSession();
      const COOKIE_SESSION_TOKEN = "__cookie_session__";
      const isCookie = session?.token === COOKIE_SESSION_TOKEN;
      const token = isCookie ? undefined : session?.token;

      const response = await apiRequest<MyRatingApiResponse>(`/admin/ratings/recipes/${recipeId}/me`, {
        token,
        credentials: 'include'
      });

      const rating = extractMyRating(response);

      if (rating) {
        setUserRating(rating.rating || 0);
        setComment(rating.comment || '');
        setHasUserRated(true);
      }
    } catch (err) {
      setHasUserRated(false);
    }
  };
  useEffect(() => {
    if (userRating > 0 && hasUserRated) {
      setShowCommentForm(true);
    }
  }, [userRating, hasUserRated]);

  const loadAllRatings = async (recipeId: number) => {
  try {
    const response = await apiRequest<RatingsListApiResponse>(`/admin/ratings/recipes/${recipeId}`, {
      credentials: 'include'
    });

    setAllRatings(extractRatings(response));
  } catch (err) {
    setAllRatings([]);
  }
};

  const deleteMyRating = async () => {
    if (!recipe) return;

    setIsLoadingRating(true);
    try {
      const session = await getSession();
      const COOKIE_SESSION_TOKEN = "__cookie_session__";
      const isCookie = session?.token === COOKIE_SESSION_TOKEN;
      const token = isCookie ? undefined : session?.token;

      await apiRequest(`/admin/ratings/delete/${recipe.id}`, {
        method: 'DELETE',
        token,
        credentials: 'include'
      });

      setUserRating(0);
      setComment('');
      setShowCommentForm(false);
      setHasUserRated(false);
      showNotification('Votre notation a été supprimée', 'success');

      // Recharger les ratings
      await loadAllRatings(recipe.id);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setIsLoadingRating(false);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
      const msg = error.message.replace(/<[^>]*>/g, ' ').trim();
      if (error.status === 401) return 'Connexion requise';
      if (error.status === 403) return FORBIDDEN_MESSAGE;
      if (error.status === 500) return 'Erreur serveur';
      return msg;
    }
    return 'Erreur inconnue';
  };

  const toggleFavorite = async () => {
    if (!recipe || isLoadingFavorite) return;

    setIsLoadingFavorite(true);
    const wasFavorite = isFavorite;
    try {
      if (wasFavorite) {
        await removeFromFavorites(recipe.id);
        showNotification('Recette supprimée des favoris', 'success');
      } else {
        await addToFavorites(recipe.id);
        showNotification('Recette sauvegardée dans les favoris', 'success');
      }
      setIsFavorite(!wasFavorite);
      setRecipe({
        ...recipe,
        engagement: {
          ...recipe.engagement,
          favorites_count: Math.max(0, (recipe.engagement?.favorites_count ?? 0) + (wasFavorite ? -1 : 1)),
        },
      });
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setIsLoadingFavorite(false);
    }
  };


  const submitRating = async () => {
    if (!recipe || userRating === 0) return;

    setIsLoadingRating(true);
    try {
      const session = await getSession();
      const COOKIE_SESSION_TOKEN = "__cookie_session__";
      const isCookie = session?.token === COOKIE_SESSION_TOKEN;
      const token = isCookie ? undefined : session?.token;

      const payload: RatingPayload = {
        rating: userRating,
        comment: comment || null
      };

      await apiRequest(`/admin/ratings/create-or-update/${recipe.id}`, {
        method: 'POST',
        body: payload,
        token,
        credentials: 'include'
      });

      showNotification('Votre notation a été enregistrée', 'success');
      setShowCommentForm(false);
      setHasUserRated(true);

      // Recharger les ratings
      await loadAllRatings(recipe.id);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setIsLoadingRating(false);
    }
  };

  const MacroCard = ({ label, value, unit, color }: {
    label: string; value: number; unit: string; color: string;
  }) => (
    <View style={[styles.macroCard, { borderTopColor: color }]}>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
      <Text style={styles.macroUnit}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );

  if (checking || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF9F1C" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || "Recette introuvable"}
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/recipes'))}
        >
          <Text style={styles.primaryBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const isSmallGrid = width < 330;
  const price = getRecipePrice(recipe);

  // ── Adaptation au nombre de personnes ──
  const baseServings = Math.max(1, Number(recipe.servings) || 1);
  const people = servingsCount ?? baseServings;
  const factor = people / baseServings;
  const formatQty = (qty: number, unit: string): string => {
    const value = (Number(qty) || 0) * factor;
    if (value === 0) return '0';
    const u = unit.toLowerCase();
    const countable = !u || ['pièce', 'piece', 'pc', 'unité', 'unite', 'gousse', 'tranche', 'boîte', 'boite', 'sachet', 'pincée', 'pincee', 'c.', 'cuill', 'cas', 'cac'].some((k) => u.includes(k));
    let rounded: number;
    if (countable) rounded = Math.max(0.5, Math.round(value * 2) / 2); // demi-unités
    else if (value >= 100) rounded = Math.round(value / 5) * 5;
    else if (value >= 10) rounded = Math.round(value);
    else rounded = Math.round(value * 10) / 10;
    return String(rounded).replace('.', ',');
  };
  const scaledTotal = price ? price.perServing * people : 0;
  const titleSize = width < 380 ? 23 : width < 600 ? 26 : 30;
  const topOffset = Platform.OS === 'web' ? 20 : Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 55;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* IMAGE HEADER */}
      <View style={[styles.imageContainer, { paddingTop: topOffset + 60 }]}>
        <Image
          source={{ uri: recipe.image || RECIPE_IMAGE_FALLBACK }}
          style={styles.image}
        />

        <View style={styles.overlay} />

        <View style={styles.headerInfo}>
          <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.18 }]} numberOfLines={3}>
            {recipe.name}
          </Text>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={styles.badgeText}>
                {(recipe.timing?.prep_time ?? 0) + (recipe.timing?.duration ?? 0)} min
              </Text>
            </View>

            <View style={styles.badge}>
              <Ionicons name="flame-outline" size={14} color="#fff" />
              <Text style={styles.badgeText}>{translateDifficulty(recipe.difficulty)}</Text>
            </View>

            <View style={styles.badge}>
              <Ionicons name="person-outline" size={14} color="#fff" />
              <Text style={styles.badgeText}>{people} pers.</Text>
            </View>

            {price && (
              <View style={styles.badge}>
                <Ionicons name="wallet-outline" size={14} color="#fff" />
                <Text style={styles.badgeText}>
                  {price.estimated ? '≈ ' : ''}{formatEuro(price.perServing)} / pers.
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* Boutons rendus en dernier : ils restent cliquables au-dessus du titre */}
        <TouchableOpacity
          style={[styles.backBtn, { top: topOffset }]}
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/recipes'))}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.favoriteBtn, { top: topOffset }]}
          accessibilityLabel={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          onPress={toggleFavorite}
          disabled={isLoadingFavorite}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={28}
            color={isFavorite ? "#FF1744" : "#fff"}
          />
        </TouchableOpacity>

      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* INFOS GRID */}
        <View style={[styles.section, sectionStyle]}>
          <Text style={styles.sectionTitle}>Informations</Text>

          {price && (
            <View style={styles.priceCard}>
              <View style={styles.priceIcon}>
                <Ionicons name="wallet" size={22} color="#FF7A00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.priceLabel}>
                  Prix moyen{price.estimated ? ' estimé' : ''}
                </Text>
                <Text style={styles.priceValue}>
                  {formatEuro(price.perServing)}
                  <Text style={styles.priceUnit}> / personne</Text>
                </Text>
                <Text style={styles.priceSub}>
                  soit {formatEuro(scaledTotal)} pour {people} personne{people > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}

            <View style={[styles.grid, isSmallGrid && styles.gridSingle]}>

            <View style={[
              styles.infoCard,
              isSmallGrid && styles.infoCardFull
            ]}>
              <Ionicons name="restaurant-outline" size={22} color="#FF9F1C" />
              <Text style={styles.cardTitle}>Type</Text>
              <Text style={styles.cardValue}>{recipe.dish_type || '-'}</Text>
            </View>

            <View style={[
              styles.infoCard,
              isSmallGrid && styles.infoCardFull
            ]}>
              <Ionicons name="time-outline" size={22} color="#FF9F1C" />
              <Text style={styles.cardTitle}>Temps</Text>
              <Text style={styles.cardValue}>
                {(recipe.timing?.prep_time ?? 0) + (recipe.timing?.duration ?? 0)} min
              </Text>
            </View>

            <View style={[
              styles.infoCard,
              isSmallGrid && styles.infoCardFull
            ]}>
              <Ionicons name="person-outline" size={22} color="#FF9F1C" />
              <Text style={styles.cardTitle}>Portions</Text>
              <Text style={styles.cardValue}>{people}</Text>
            </View>

            <View style={[
              styles.infoCard,
              isSmallGrid && styles.infoCardFull
            ]}>
              <Ionicons name={recipe.is_public ? "globe-outline" : "lock-closed-outline"} size={22} color="#FF9F1C" />
              <Text style={styles.cardTitle}>Visibilité</Text>
              <Text style={styles.cardValue}>
                {recipe.is_public ? 'Publique' : 'Privée'}
              </Text>
            </View>

            <View style={[
              styles.infoCard,
              isSmallGrid && styles.infoCardFull
            ]}>
              <Ionicons name="heart-outline" size={22} color="#FF9F1C" />
              <Text style={styles.cardTitle}>Favoris</Text>
              <Text style={styles.cardValue}>
                {recipe.engagement?.favorites_count ?? 0}
              </Text>
            </View>

            <View style={[
              styles.infoCard,
              isSmallGrid && styles.infoCardFull
            ]}>
              <Ionicons name="person-circle-outline" size={22} color="#FF9F1C" />
              <Text style={styles.cardTitle}>Auteur</Text>
              <Text style={styles.cardValue}>{recipe.author?.name ?? 'Anonyme'}</Text>
            </View>

          </View>

          {/* DESCRIPTION */}
          {recipe.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>
                {recipe.description}
              </Text>
            </View>
          )}

          {/* DIETS */}
          {recipe.nutrition?.diets?.length > 0 && (
            <View style={{ marginTop: 25 }}>
              <Text style={styles.sectionTitle}>Régimes</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recipe.nutrition.diets.map((diet, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{diet.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* INGREDIENTS */}
        <View style={[styles.section, sectionStyle]}>
          <View style={styles.ingHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Ingrédients</Text>
            <View style={styles.servingsStepper}>
              <TouchableOpacity
                onPress={() => setServingsCount(Math.max(1, people - 1))}
                disabled={people <= 1}
                style={[styles.stepperBtn, people <= 1 && { opacity: 0.35 }]}
                accessibilityLabel="Une personne de moins"
                hitSlop={6}
              >
                <Ionicons name="remove" size={18} color="#FF7A00" />
              </TouchableOpacity>
              <View style={{ alignItems: 'center', minWidth: 64 }}>
                <Text style={styles.stepperValue}>{people}</Text>
                <Text style={styles.stepperLabel}>personne{people > 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setServingsCount(Math.min(30, people + 1))}
                disabled={people >= 30}
                style={[styles.stepperBtn, people >= 30 && { opacity: 0.35 }]}
                accessibilityLabel="Une personne de plus"
                hitSlop={6}
              >
                <Ionicons name="add" size={18} color="#FF7A00" />
              </TouchableOpacity>
            </View>
          </View>
          {people !== baseServings && (
            <TouchableOpacity onPress={() => setServingsCount(baseServings)} style={styles.resetServings}>
              <Ionicons name="refresh" size={13} color="#64748B" />
              <Text style={styles.resetServingsText}>
                Quantités adaptées · recette d'origine pour {baseServings}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.ingredientsContainer}>
            {recipe.nutrition?.ingredients?.map((ing, i) => (
              <View key={i} style={styles.ingredientCard}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.ingredientQty}>
                    {formatQty(ing.quantity, formatIngredientUnit(ing.unit))} {formatIngredientUnit(ing.unit)}
                  </Text>
                  {price?.estimated && estimateIngredientCost(ing) > 0 && (
                    <Text style={styles.ingredientCost}>≈ {formatEuro(estimateIngredientCost(ing) * factor)}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* STEPS */}
        <View style={[styles.section, sectionStyle]}>
          <Text style={styles.sectionTitle}>Préparation</Text>

          {Array.isArray(recipe.steps) && recipe.steps.length > 0 ? (
            recipe.steps.map((step: string, index: number) => {
              const checked = checkedSteps[index];

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleStep(index)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.stepCard,
                    checked && styles.stepCardChecked
                  ]}>
                    <View style={[
                      styles.checkbox,
                      checked && styles.checkboxChecked
                    ]}>
                      {checked ? (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      ) : (
                        <Text style={styles.stepNum}>{index + 1}</Text>
                      )}
                    </View>

                    <Text style={[
                      styles.stepText,
                      checked && styles.stepTextChecked
                    ]}>
                      {step}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={{ color: '#666' }}>
              Aucune étape disponible
            </Text>
          )}
        </View>

        {/* VALEURS NUTRITIONNELLES */}
        {recipe.nutrition?.totals && (
          <View style={[styles.section, sectionStyle]}>
            <Text style={styles.sectionTitle}>Valeurs nutritionnelles</Text>
            <Text style={styles.nutriSub}>Pour {people} personne{people > 1 ? 's' : ''}</Text>
            <View style={styles.macroGrid}>
              <MacroCard label="Calories"  value={Math.round((Number(recipe.nutrition.totals.energy_kcal) || 0) * factor)}     unit="kcal" color="#FF9F1C" />
              <MacroCard label="Protéines" value={Math.round((Number(recipe.nutrition.totals.proteins_g) || 0) * factor)}      unit="g"    color="#3B82F6" />
              <MacroCard label="Glucides"  value={Math.round((Number(recipe.nutrition.totals.carbohydrates_g) || 0) * factor)} unit="g"    color="#22C55E" />
              <MacroCard label="Lipides"   value={Math.round((Number(recipe.nutrition.totals.fat_g) || 0) * factor)}           unit="g"    color="#EF4444" />
            </View>
          </View>
        )}

        {/* RATING */}
        <View style={[styles.section, sectionStyle]}>
          <Text style={styles.sectionTitle}>Notation</Text>

          <View style={styles.ratingCard}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRating(star)}
                >
                  <Ionicons
                    name={star <= userRating ? "star" : "star-outline"}
                    size={34}
                    color={star <= userRating ? "#FFC107" : "#D1D5DB"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ marginTop: 10, color: '#666' }}>
              {userRating ? `${userRating}/5` : 'Noter cette recette'}
            </Text>

            {showCommentForm && (
              <View style={styles.commentForm}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Commentaire (optionnel)"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.submitBtn, styles.actionBtnFixed]}
                  onPress={submitRating}
                  disabled={isLoadingRating}
                >
                  {isLoadingRating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {hasUserRated ? 'Modifier mon commentaire' : 'Valider'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {hasUserRated && (
              <TouchableOpacity
                style={[styles.deleteBtn, styles.actionBtnFixed]}
                onPress={deleteMyRating}
                disabled={isLoadingRating}
              >
                <Text style={styles.deleteBtnText}>Supprimer mon avis</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* COMMENTAIRES */}
        {allRatings.length > 0 && (
          <View style={[styles.section, sectionStyle]}>
            <Text style={styles.sectionTitle}>Avis des utilisateurs ({allRatings.length})</Text>

            {allRatings.map((rating) => {
              const isMe = currentUserId !== null && rating.user?.id === currentUserId;

              return (
                <View key={rating.id} style={styles.commentItem}>
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.commentAuthor}>{ratingAuthorName(rating)}</Text>
                        {isMe && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>Vous</Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 3 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Ionicons
                            key={star}
                            name={star <= rating.rating ? "star" : "star-outline"}
                            size={16}
                            color="#FFC107"
                          />
                        ))}
                      </View>
                    </View>

                    <Text style={styles.commentRating}>{rating.rating}/5</Text>
                  </View>

                  {rating.comment && (
                    <Text style={styles.commentText}>{rating.comment}</Text>
                  )}

                  <Text style={styles.commentDate}>
                    {new Date(rating.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* TIP */}
        <View style={[styles.section, sectionStyle]}>
          <View style={styles.tipBox}>
            <Ionicons name="bulb" size={20} color="#0284C7" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.tipTitle}>Astuce</Text>
              <Text style={styles.tipText}>{randomTip}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* NOTIFICATION TOAST */}
      {notification.visible && (
        <View style={[
          styles.notification,
          notification.type === 'success' && styles.notificationSuccess,
          notification.type === 'error' && styles.notificationError,
          notification.type === 'info' && styles.notificationInfo
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons
              name={notification.type === 'success' ? 'checkmark-circle' : notification.type === 'error' ? 'close-circle' : 'information-circle'}
              size={20}
              color="#fff"
            />
            <Text style={styles.notificationText}>{notification.message}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F2' },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  loadingText: {
    marginTop: 10,
    color: '#666'
  },

  errorText: {
    color: '#DC2626',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },

  primaryBtn: {
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '700'
  },

  imageContainer: {
    minHeight: 300,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 44
  },

  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%'
  },

  ingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap'
  },

  servingsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F1E5D5',
    padding: 4
  },

  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF3E6',
    alignItems: 'center',
    justifyContent: 'center'
  },

  stepperValue: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', lineHeight: 19 },
  stepperLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  resetServings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginBottom: 10
  },

  resetServingsText: { fontSize: 12.5, color: '#64748B', fontWeight: '600' },

  nutriSub: { fontSize: 13, color: '#64748B', marginTop: -6, marginBottom: 12 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },

  backBtn: {
    zIndex: 10,
    elevation: 10,
    position: 'absolute',
    top: 55,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999
  },

  favoriteBtn: {
    zIndex: 10,
    elevation: 10,
    position: 'absolute',
    top: 55,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },

  backText: {
    marginLeft: 6,
    fontWeight: '600'
  },

  headerInfo: {
    // dans le flux : un titre long agrandit l'en-tête au lieu de recouvrir le bouton Retour
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff'
  },

  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12
  },

  badge: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999
  },

  badgeText: {
    color: '#fff',
    fontWeight: '700'
  },

  content: {
    flex: 1,
    marginTop: -20,
    backgroundColor: '#FFF9F2',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 16
  },

  section: {
    marginBottom: 28
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },

  infoCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 22
  },
infoCardFull: {
  width: '100%',
},
  cardTitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 8
  },

  cardValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4
  },

  descriptionCard: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 22
  },

  descriptionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10
  },

  descriptionText: {
    lineHeight: 22,
    color: '#444'
  },

  tag: {
    backgroundColor: '#FFF3E6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8
  },

  tagText: {
    color: '#FF9F1C',
    fontWeight: '700'
  },

  ingredientsContainer: {
    gap: 10
  },

  ingredientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14
  },

  ingredientName: {
    fontWeight: '600'
  },

  ingredientQty: {
    fontWeight: '800',
    color: '#FF9F1C'
  },

  ingredientCost: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2
  },

  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFF3E6',
    borderWidth: 1,
    borderColor: '#FFEAD9',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14
  },

  priceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },

  priceLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF7A00',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },

  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.4,
    marginTop: 2
  },

  priceUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B'
  },

  priceSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2
  },

  stepCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10
  },

  stepCardChecked: {
    backgroundColor: '#ECFDF5'
  },

  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },

  checkboxChecked: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E'
  },

  stepNum: {
    fontSize: 12,
    color: '#999'
  },

  stepText: {
    flex: 1,
    lineHeight: 20
  },

  stepTextChecked: {
    textDecorationLine: 'line-through',
    color: '#999'
  },

  ratingCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 22,
    alignItems: 'center'
  },

  commentForm: {
    marginTop: 16,
    width: '100%',
    alignItems: 'stretch'
  },

  commentInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    width: '100%',
  },

  submitBtn: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#FF9F1C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '25%',
    minHeight: 48,
  },

  submitBtnText: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center'
  },

  deleteBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '25%',
    minHeight: 48,
  },

  deleteBtnText: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center'
  },

  actionBtnFixed: {
    width: 231,
    height: 42,
    paddingVertical: 0,
    alignSelf: 'center',
  },

  ratingItem: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10
  },

  commentItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9F1C'
  },

  commentAuthor: {
    fontWeight: '700',
    fontSize: 15,
    color: '#111'
  },

  commentRating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9F1C'
  },

  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    marginBottom: 12
  },

  commentDate: {
    fontSize: 12,
    color: '#999'
  },

  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#E0F2FE',
    padding: 16,
    borderRadius: 16
  },

  tipTitle: {
    fontWeight: '800',
    marginBottom: 4
  },

  tipText: {
    color: '#075985'
  },

  gridSingle: {
    flexDirection: 'column',
  },

  notification: {
    position: 'absolute',
    top: 20,
    right: 16,
    maxWidth: 320,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },

  notificationSuccess: {
    backgroundColor: '#22C55E'
  },

  notificationError: {
    backgroundColor: '#EF4444'
  },

  notificationInfo: {
    backgroundColor: '#3B82F6'
  },

  notificationText: {
    color: '#fff',
    fontWeight: '600',
    flex: 1
  },
  youBadge: {
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999
  },

  youBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },

  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4
  },

  macroCard: {
    flex: 1,
    minWidth: '45%',
    borderTopWidth: 3,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 14,
    alignItems: 'center'
  },

  macroValue: {
    fontSize: 22,
    fontWeight: '800'
  },

  macroUnit: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2
  },

  macroLabel: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
    fontWeight: '600'
  },
});
