import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

import useRequireAuth from '../../src/hooks/useRequireAuth';
import { ApiError, apiRequest } from '../../src/lib/api';
import { getRecipe, type RecipeFull } from '../../src/services/recipes';

interface RatingPayload {
  rating: number;
  comment: string | null;
}

interface RatingResponse {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

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
  const [comment, setComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isLoadingRating, setIsLoadingRating] = useState(false);
  const [randomTip, setRandomTip] = useState(RANDOM_TIPS[0]);

  const contentContainerStyle = isDesktop
    ? { paddingBottom: 40, paddingHorizontal: 48, alignItems: 'center' }
    : { paddingBottom: 20 };

  const sectionStyle = isDesktop
    ? { width: '100%', maxWidth: 960 }
    : {};

  useEffect(() => {
    if (checking || !id) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getRecipe(Number(id));
        setRecipe(data);
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
    setCheckedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleRating = (score: number) => {
    setUserRating(score);
    setShowCommentForm(true);
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

  const submitRating = async () => {
    if (!recipe || userRating === 0) return;

    setIsLoadingRating(true);
    try {
      const payload: RatingPayload = {
        rating: userRating,
        comment: comment || null
      };

      await apiRequest(`/recipes/${recipe.id}/ratings`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      Alert.alert('Succès', 'Votre notation a été enregistrée');
      setUserRating(0);
      setComment('');
      setShowCommentForm(false);
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
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
              <Text style={styles.cardValue}>{recipe.author.name}</Text>
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
                  {ing.quantity} {typeof ing.unit === 'string' ? ing.unit : ing.unit?.symbol}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* STEPS */}
        <View style={[styles.section, sectionStyle]}>
          <Text style={styles.sectionTitle}>Préparation</Text>

          {recipe.steps?.length > 0 ? (
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
                  placeholder="Commentaire"
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
                    <Text style={styles.submitBtnText}>Valider</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

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
});