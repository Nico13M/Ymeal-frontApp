import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { ApiError, apiRequest } from '../../src/lib/api';
import { getSession } from '../../src/services/auth';
import { getRecipe, type RecipeFull } from '../../src/services/recipes';

interface RatingPayload {
  rating: number;
  comment: string | null;
}

interface RatingResponse {
  id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
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

<<<<<<< HEAD
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [userRating, setUserRating] = useState(0);
  
  // État pour l'astuce aléatoire
=======
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
>>>>>>> origin/Dev
  const [randomTip, setRandomTip] = useState(RANDOM_TIPS[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
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
        const data = await getRecipe(Number(id));
        setRecipe(data);
        setIsFavorite(data.is_favorited);
        
        // Charger mon rating
        await loadMyRating(Number(id));
        // Charger tous les ratings
        await loadAllRatings(Number(id));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
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
<<<<<<< HEAD
    setCheckedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

=======
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

>>>>>>> origin/Dev
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

  // const extractMyRating = (response: MyRatingApiResponse): RatingResponse | null => {
  //   const candidates = [response, response.data].filter(Boolean) as unknown[];

  //   for (const candidate of candidates) {
  //     if (!candidate || typeof candidate !== 'object') continue;

  //     const record = candidate as Record<string, unknown>;
  //     const nestedData = record.data;

  //     if (nestedData && nestedData !== candidate) {
  //       const nestedRating = extractMyRating(nestedData as MyRatingApiResponse);
  //       if (nestedRating) return nestedRating;
  //     }

  //     if (
  //       typeof record.id === 'number' &&
  //       typeof record.rating === 'number' &&
  //       typeof record.created_at === 'string'
  //     ) {
  //       return {
  //         id: record.id,
  //         rating: record.rating,
  //         comment: typeof record.comment === 'string' ? record.comment : null,
  //         created_at: record.created_at,
  //         user: record.user as RatingResponse['user']
  //       };
  //     }
  //   }

  //   return null;
  // };
const extractMyRating = (response: MyRatingApiResponse): RatingResponse | null => {
  console.log("=== extractMyRating called ===");
  console.log("Input response:", JSON.stringify(response, null, 2));
  
  // ✅ NOUVELLE LOGIQUE : Vérifier d'abord si response.rating existe
  if (response.rating && typeof response.rating === 'object') {
    const record = response.rating as Record<string, unknown>;
    
    console.log("Found response.rating, checking it...");
    console.log("  record.id:", record.id);
    console.log("  record.rating:", record.rating);
    console.log("  record.created_at:", record.created_at);
    
    if (
      typeof record.id === 'number' &&
      typeof record.rating === 'number' &&
      typeof record.created_at === 'string'
    ) {
      console.log("✅ response.rating matches! Returning...");
      const result = {
        id: record.id,
        rating: record.rating,
        comment: typeof record.comment === 'string' ? record.comment : null,
        created_at: record.created_at,
        user: record.user as RatingResponse['user']
      };
      console.log("Result:", result);
      return result;
    }
  }
 
  // Ensuite, essayer l'ancienne logique pour les autres formats
  const candidates = [response, response.data].filter(Boolean) as unknown[];
  
  console.log("Fallback: Checking candidates:", candidates.length);
 
  for (let idx = 0; idx < candidates.length; idx++) {
    const candidate = candidates[idx];
    console.log(`Candidate ${idx}:`, JSON.stringify(candidate));
    
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
      console.log(`✅ Candidate ${idx} matches!`);
      return {
        id: record.id,
        rating: record.rating,
        comment: typeof record.comment === 'string' ? record.comment : null,
        created_at: record.created_at,
        user: record.user as RatingResponse['user']
      };
    }
  }
 
  console.log("❌ No valid rating found");
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
      const userId = (session?.user as any)?.id as number | undefined;
  
      const headers: Record<string, string> = {};
  
      if (userId !== undefined) {
        headers["X-User-Id"] = String(userId);
      }
  
      const response = await apiRequest<MyRatingApiResponse>(`/admin/ratings/recipes/${recipeId}/me`, {
        token,
        credentials: 'include',
        headers
      });
  
      const rating = extractMyRating(response);
  
      if (rating) {
        setUserRating(rating.rating || 0);
        setComment(rating.comment || '');
        setHasUserRated(true);
      }
    } catch (err) {
      console.log('Erreur lors du chargement du rating:', err);
      setHasUserRated(false);
    }
  };
  console.log(hasUserRated)
  console.log(userRating)
  useEffect(() => {
    if (userRating > 0 && hasUserRated) {
      setShowCommentForm(true);
      console.log("showing comment form because userRating:", userRating, "hasUserRated:", hasUserRated);
    }
  }, [userRating, hasUserRated]);
 
  const loadAllRatings = async (recipeId: number) => {
  try {
    const response = await apiRequest<RatingsListApiResponse>(`/admin/ratings/recipes/${recipeId}`, {
      credentials: 'include'
    });

    console.log('Ratings response:', response);

    setAllRatings(extractRatings(response));
  } catch (err) {
    console.log('Erreur lors du chargement des ratings:', err);
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
      const userId = (session?.user as any)?.id as number | undefined;

      const headers: Record<string, string> = {};

      if (userId !== undefined) {
        headers["X-User-Id"] = String(userId);
      }

      await apiRequest(`/admin/ratings/delete/${recipe.id}`, {
        method: 'DELETE',
        token,
        credentials: 'include',
        headers
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
      if (error.status === 403) return 'Accès refusé';
      if (error.status === 500) return 'Erreur serveur';
      return msg;
    }
    return 'Erreur inconnue';
  };

  const toggleFavorite = async () => {
    if (!recipe) return;

    setIsLoadingFavorite(true);
    try {
      const session = await getSession();
      const COOKIE_SESSION_TOKEN = "__cookie_session__";
      const isCookie = session?.token === COOKIE_SESSION_TOKEN;
      const token = isCookie ? undefined : session?.token;
      const userId = (session?.user as any)?.id as number | undefined;

      const headers: Record<string, string> = {};

      if (userId !== undefined) {
        headers["X-User-Id"] = String(userId);
      }

      if (isFavorite) {
        // Supprimer des favoris
        const response = await apiRequest(`/admin/recipes/${recipe.id}/favorite`, {
          method: 'DELETE',
          token,
          credentials: 'include',
          headers
        });
        console.log('Delete response:', response);
        setIsFavorite(false);
        // Décrémenter le compteur de favoris
        setRecipe({
          ...recipe,
          engagement: {
            ...recipe.engagement,
            favorites_count: Math.max(0, (recipe.engagement?.favorites_count ?? 0) - 1)
          }
        });
        showNotification('Recette supprimée des favoris', 'success');
      } else {
        // Ajouter aux favoris
        const response = await apiRequest(`/admin/recipes/${recipe.id}/favorite`, {
          method: 'POST',
          body: {},
          token,
          credentials: 'include',
          headers
        });
        console.log('Post response:', response);
        setIsFavorite(true);
        // Incrémenter le compteur de favoris
        setRecipe({
          ...recipe,
          engagement: {
            ...recipe.engagement,
            favorites_count: (recipe.engagement?.favorites_count ?? 0) + 1
          }
        });
        showNotification('Recette sauvegardée dans les favoris', 'success');
      }
    } catch (err) {
      console.log('Error:', err);
      if (err instanceof ApiError && err.status === 400) {
        // Déjà en favoris
        setIsFavorite(true);
        showNotification('Déjà dans vos favoris', 'info');
      } else {
        showNotification(getErrorMessage(err), 'error');
      }
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
      const userId = (session?.user as any)?.id as number | undefined;

      const headers: Record<string, string> = {};

      if (userId) {
        headers["X-User-Id"] = String(userId);
      }

      const payload: RatingPayload = {
        rating: userRating,
        comment: comment || null
      };

      await apiRequest(`/admin/ratings/create-or-update/${recipe.id}`, {
        method: 'POST',
        body: payload,
        token,
        credentials: 'include',
        headers
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
          onPress={() => router.back()}
        >
          <Text style={styles.primaryBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const isSmallGrid = width < 330;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* IMAGE HEADER */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.image || 'https://via.placeholder.com/300' }}
          style={styles.image}
        />

        <View style={styles.overlay} />

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={toggleFavorite}
          disabled={isLoadingFavorite}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={28}
            color={isFavorite ? "#FF1744" : "#fff"}
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>{recipe.name}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={styles.badgeText}>
                {(recipe.timing?.prep_time ?? 0) + (recipe.timing?.duration ?? 0)} min
              </Text>
            </View>

            <View style={styles.badge}>
              <Ionicons name="flame-outline" size={14} color="#fff" />
              <Text style={styles.badgeText}>{recipe.difficulty}</Text>
            </View>

            <View style={styles.badge}>
              <Ionicons name="person-outline" size={14} color="#fff" />
              <Text style={styles.badgeText}>{recipe.servings}</Text>
            </View>
          </View>
        </View>
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
              <Text style={styles.cardValue}>{recipe.servings}</Text>
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
          <Text style={styles.sectionTitle}>Ingrédients</Text>

          <View style={styles.ingredientsContainer}>
            {recipe.nutrition?.ingredients?.map((ing, i) => (
              <View key={i} style={styles.ingredientCard}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientQty}>
                  {ing.quantity} {formatIngredientUnit(ing.unit)}
                </Text>
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
                  style={styles.submitBtn}
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
                style={styles.deleteBtn}
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
                        <Text style={styles.commentAuthor}>{rating.user?.name || 'Anonyme'}</Text>
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
    borderRadius: 12
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '700'
  },

  imageContainer: {
    height: 320,
    position: 'relative'
  },

  image: {
    width: '100%',
    height: '100%'
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },

  backBtn: {
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
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20
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
    borderRadius: 18
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
    borderRadius: 18
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
    borderRadius: 18,
    alignItems: 'center'
  },

  commentForm: {
    marginTop: 16,
    width: '100%'
  },

  commentInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    minHeight: 80
  },

  submitBtn: {
    marginTop: 12,
    backgroundColor: '#FF9F1C',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center'
  },

  submitBtnText: {
    color: '#fff',
    fontWeight: '800'
  },

  deleteBtn: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center'
  },

  deleteBtnText: {
    color: '#fff',
    fontWeight: '800'
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
  }
});