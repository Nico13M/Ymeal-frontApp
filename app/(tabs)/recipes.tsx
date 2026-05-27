import useRequireAuth from "@/src/hooks/useRequireAuth";
import { getFrigoIngredients } from "@/src/services/fridge";
import {
  generateAiRecipe,
  getRecipes,
  saveAiRecipe
} from "@/src/services/recipes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const EMOJI_MAP: Record<string, string> = {
  poulet: "🍗",
  boeuf: "🥩",
  poisson: "🐟",
  oeuf: "🥚",
  lait: "🥛",
  farine: "🌾",
  sucre: "🍬",
  sel: "🧂",
  poivre: "🧂",
  tomate: "🍅",
  carotte: "🥕",
  oignon: "🧅",
  ail: "🧄",
  "pomme de terre": "🥔",
  riz: "🍚",
  pates: "🍝",
  fromage: "🧀",
  beurre: "🧈",
  huile: "🍾",
};

export default function RecipesScreen() {
  const router = useRouter();

  const { checking } = useRequireAuth();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [nbPers, setNbPers] = useState(2);
  const [difficulty, setDifficulty] = useState("Débutant");
  const [type, setType] = useState("Plat");
  const [time, setTime] = useState("Moyen");
  const [price, setPrice] = useState("Équilibré");
  const [context, setContext] = useState("");
  const [useFrigo, setUseFrigo] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");
  const [addedIngredients, setAddedIngredients] = useState<
    { name: string; emoji: string }[]
  >([]);
  const [fridgeItems, setFridgeItems] = useState<
    { name: string; emoji: string; selected?: boolean }[]
  >([]);

  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const [generatedRecipeText, setGeneratedRecipeText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const numColumns = isDesktop ? 4 : isTablet ? 2 : 1;

  const inputRef = useRef<any>(null);

  const getRatingsCount = useCallback((recipe: any): number => {
    if (typeof recipe.ratings?.stats?.count === "number") return recipe.ratings.stats.count;
    if (typeof recipe.ratings_count === "number") return recipe.ratings_count;
    if (typeof recipe.reviews_count === "number") return recipe.reviews_count;
    if (typeof recipe.comments_count === "number") return recipe.comments_count;
    return 0;
  }, []);

  const getAverageRating = useCallback((recipe: any): number => {
    if (typeof recipe.ratings?.stats?.average === "number") return recipe.ratings.stats.average;
    if (typeof recipe.average_rating === "number") return recipe.average_rating;
    if (typeof recipe.avg_rating === "number") return recipe.avg_rating;
    if (typeof recipe.rating_average === "number") return recipe.rating_average;
    return 0;
  }, []);

  const formatAverageRating = useCallback((average: number): string => {
    if (!Number.isFinite(average) || average <= 0) return "0.0";
    return average.toFixed(1);
  }, []);

  useEffect(() => {
    if (checking) return;

    const loadRecipes = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRecipes();
        setRecipes(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            image: r.image,
            description: r.description,
            servings: r.servings,
            difficulty: r.difficulty,
            timing: r.timing,
            author: r.author?.name || "Inconnu",
            created_at: r.created_at,
            favorites_count: r.engagement?.favorites_count ?? r.favorites_count ?? 0,
            ratings: r.ratings,
            ratings_count: r.ratings_count,
            reviews_count: r.reviews_count,
            comments_count: r.comments_count,
            average_rating: r.average_rating,
            avg_rating: r.avg_rating,
            rating_average: r.rating_average,
          }))
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement des recettes"
        );
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [checking]);

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recipesPerPage = isDesktop ? 32 : isTablet ? 16 : 8;
  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
  const startIndex = (currentPage - 1) * recipesPerPage;
  const paginatedRecipes = filteredRecipes.slice(startIndex, startIndex + recipesPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const toggleSearch = () => {
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchQuery("");
      Keyboard.dismiss();
    } else {
      setIsSearchActive(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleAddIngredient = () => {
    if (ingredientInput.trim() === "" || useFrigo) return;
    const name = ingredientInput.toLowerCase().trim();
    const emoji = EMOJI_MAP[name] || "🍲";
    setAddedIngredients([...addedIngredients, { name: ingredientInput, emoji }]);
    setIngredientInput("");
  };

  const removeIngredient = (index: number) => {
    setAddedIngredients(addedIngredients.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!useFrigo) return;

    const loadRealFridge = async () => {
      try {
        const backendIngredients = await getFrigoIngredients();
        const items = backendIngredients.map((ing) => ({
          name: ing.name,
          emoji: ing.image || EMOJI_MAP[ing.name.toLowerCase()] || "🍽️",
          selected: false,
        }));
        setFridgeItems(items);
      } catch (err) {
        console.error("Erreur lors de la récupération du frigo :", err);
      }
    };

    loadRealFridge();
  }, [useFrigo]);

  if (checking || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={{ marginTop: 10, color: "#666" }}>Chargement...</Text>
      </View>
    );
  }

  const toggleFridgeSelection = (index: number) => {
    setFridgeItems((prev) => {
      const copy = [...prev];
      copy[index].selected = !copy[index].selected;

      if (copy[index].selected) {
        const exists = addedIngredients.some(
          (a) => a.name.toLowerCase() === copy[index].name.toLowerCase()
        );
        if (!exists)
          setAddedIngredients((s) => [
            ...s,
            { name: copy[index].name, emoji: copy[index].emoji },
          ]);
      } else {
        setAddedIngredients((s) =>
          s.filter((a) => a.name.toLowerCase() !== copy[index].name.toLowerCase())
        );
      }

      return copy;
    });
  };

  const Selector = ({ label, options, current, setter }: any) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setter(opt)}
            style={[styles.chip, current === opt && styles.chipActive]}
          >
            <Text style={[styles.chipText, current === opt && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleSaveRecipe = async () => {
    if (!generatedRecipeText) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await saveAiRecipe(generatedRecipeText, { dishType: type });
      setSavedRecipeId(saved.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setSearching(true);
      setError(null);
      setGeneratedRecipeText(null);
      setSavedRecipeId(null);
      setSaveError(null);

      let tempsMinutes = 45;
      if (time === "Express") tempsMinutes = 15;
      if (time === "Mijoté") tempsMinutes = 120;

      const result = await generateAiRecipe({
        ingredients_selected: addedIngredients.map((i) => i.name),
        frigo: useFrigo,
        nombre_personne: nbPers,
        difficulte: difficulty,
        type_plat: type,
        temps_minutes: tempsMinutes,
        contexte_personnel: `Budget: ${price}. ${context}`,
      });

      if (result && result.recipe) {
        setGeneratedRecipeText(result.recipe);
      } else {
        setError("L'IA n'a pas pu générer de recette.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la génération. As-tu bien lancé l'IA ?"
      );
    } finally {
      setSearching(false);
    }
  };

  const getDifficultyColors = (difficulty: string) => {
    const normalizedDifficulty = difficulty.toLowerCase().trim();
    if (normalizedDifficulty.includes("débutant"))
      return { backgroundColor: "#1B5E20", textColor: "#FFFFFF" };
    if (normalizedDifficulty.includes("moyen"))
      return { backgroundColor: "#F9A825", textColor: "#1F1F1F" };
    if (normalizedDifficulty.includes("difficile"))
      return { backgroundColor: "#C62828", textColor: "#FFFFFF" };
    return { backgroundColor: "#E8F5E9", textColor: "#2E7D32" };
  };

  const getCardStyle = () => {
    if (isDesktop) return [styles.card, styles.cardDesktop];
    if (isTablet) return [styles.card, styles.cardTablet];
    return [styles.card, styles.cardMobile];
  };

  const renderRecipeItem = ({ item }: { item: any }) => {
    const difficultyColors = getDifficultyColors(item.difficulty || "");

    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={() => router.push(`/recipe/${item.id}`)}
      >
        <Image
          source={{ uri: item.image || "https://via.placeholder.com/300" }}
          style={styles.cardImage}
        />
        <View style={styles.cardContent}>
          <View style={styles.rowBetween}>
            <Text numberOfLines={2} style={styles.cardTitle}>
              {item.name}
            </Text>
          </View>

          <View style={[styles.rowBetween, styles.metaContainer]}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metaText}>
                {(item.timing?.prep_time ?? 0) + (item.timing?.duration ?? 0)} min
              </Text>
            </View>
            <View
              style={[styles.tag, { backgroundColor: difficultyColors.backgroundColor }]}
            >
              <Text style={[styles.tagText, { color: difficultyColors.textColor }]}>
                {item.difficulty || "Moyen"}
              </Text>
            </View>
          </View>

          <View style={[styles.rowBetween, styles.cardFooter]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={styles.recipeStatPill}>
                <Ionicons name="heart" size={12} color="#E63946" />
                <Text style={styles.pillText}>{item.favorites_count} favoris</Text>
              </View>
              <View style={styles.recipeStatPill}>
                <Ionicons name="chatbubble-outline" size={12} color="#666" />
                <Text style={styles.pillText}>{getRatingsCount(item)} avis</Text>
              </View>
              <View style={styles.recipeStatPill}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.pillText}>{formatAverageRating(getAverageRating(item))}/5</Text>
              </View>
            </View>
            <Text style={styles.linkText}>Voir ➔</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getColumnWrapperStyle = () => {
    if (numColumns === 1) return undefined;
    if (isDesktop) return styles.columnWrapperDesktop;
    return styles.columnWrapperTablet;
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#00C853" barStyle="light-content" />

      {/* HEADER */}
      <View style={[styles.header, !isMobile && styles.headerDesktop]}>
        {!showGenerator && isSearchActive ? (
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#00C853" style={{ marginRight: 10 }} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Chercher une recette..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={toggleSearch}
            />
            <TouchableOpacity onPress={toggleSearch}>
              <Ionicons name="close-circle" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        ) : !showGenerator ? (
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Recettes pour vous
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={toggleSearch} style={styles.headerIconBtn}>
                <Ionicons name="search" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowGenerator(true)}
                style={styles.generatorBtn}
              >
                <Ionicons name="sparkles" size={16} color="#00C853" />
                <Text style={styles.generatorBtnText}>Générateur</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Générateur
            </Text>
            <TouchableOpacity
              onPress={() => setShowGenerator(false)}
              style={styles.generatorBtn}
            >
              <Ionicons name="list" size={16} color="#00C853" />
              <Text style={styles.generatorBtnText}>Toutes les recettes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showGenerator ? (
        <ScrollView contentContainerStyle={styles.scrollForm}>
          {error && (
            <View
              style={{
                backgroundColor: "#FFEBEE",
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
              }}
            >
              <Text style={{ color: "#DC2626" }}>{error}</Text>
            </View>
          )}

          {/* Ingrédients */}
          <View style={styles.inputGroup}>
            <Text style={styles.selectorLabel}>Ingrédients spécifiques</Text>
            <View style={styles.row}>
              <View
                style={[
                  styles.searchBarContainer,
                  { flex: 1, marginRight: 10 },
                  useFrigo && { backgroundColor: "#F0F0F0", opacity: 0.6 },
                ]}
              >
                <TextInput
                  placeholder={
                    useFrigo ? "Désactivé (Mode Frigo)" : "Ajouter un ingrédient..."
                  }
                  style={{ flex: 1 }}
                  value={ingredientInput}
                  onChangeText={setIngredientInput}
                  editable={!useFrigo}
                  onSubmitEditing={handleAddIngredient}
                />
                <TouchableOpacity onPress={handleAddIngredient} disabled={useFrigo}>
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={useFrigo ? "#CCC" : "#00C853"}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setUseFrigo(!useFrigo)}
                style={[styles.frigoBtn, useFrigo && styles.frigoBtnActive]}
              >
                <Ionicons
                  name="fast-food"
                  size={20}
                  color={useFrigo ? "#FFF" : "#00C853"}
                />
                <Text style={[styles.frigoBtnText, useFrigo && { color: "#FFF" }]}>
                  Frigo
                </Text>
              </TouchableOpacity>
            </View>

            {useFrigo ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.selectorLabel}>Ingrédients du frigo</Text>
                <View style={[styles.chipRow, { flexWrap: "wrap", marginTop: 10 }]}>
                  {fridgeItems.map((fi, i) => (
                    <TouchableOpacity
                      key={fi.name + i}
                      onPress={() => toggleFridgeSelection(i)}
                      style={[
                        styles.chip,
                        { flexDirection: "row", alignItems: "center", marginBottom: 8 },
                        fi.selected && { backgroundColor: "#C8E6C9" },
                      ]}

                  >
                    <TextInput
                        placeholder={
                          useFrigo
                              ? "Désactivé (Mode Frigo)"
                              : "Ajouter un ingrédient..."
                        }
                        style={{ flex: 1 }}
                        value={ingredientInput}
                        onChangeText={setIngredientInput}
                        editable={!useFrigo}
                        onSubmitEditing={handleAddIngredient}
                    />
                    <TouchableOpacity
                        onPress={handleAddIngredient}
                        disabled={useFrigo}

                    >
                      <Text>
                        {fi.emoji} {fi.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              addedIngredients.length > 0 && (
                <View style={[styles.chipRow, { flexWrap: "wrap", marginTop: 10 }]}>
                  {addedIngredients.map((ing, index) => (
                    <View
                      key={index}
                      style={[
                        styles.chip,
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#E8F5E9",
                        },
                      ]}
                    >
                      <Text>
                        {ing.emoji} {ing.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeIngredient(index)}
                        style={{ marginLeft: 8 }}
                      >
                        <Ionicons name="close-circle" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )
            )}
          </View>

          {/* Nombre de personnes */}
          <View style={styles.counterGroup}>
            <Text style={styles.selectorLabel}>Nombre de personnes</Text>
            <View style={styles.counter}>
              <TouchableOpacity onPress={() => setNbPers(Math.max(1, nbPers - 1))}>
                <Ionicons name="remove-circle-outline" size={32} color="#00C853" />
              </TouchableOpacity>
              <Text style={styles.counterText}>{nbPers}</Text>
              <TouchableOpacity onPress={() => setNbPers(nbPers + 1)}>
                <Ionicons name="add-circle-outline" size={32} color="#00C853" />
              </TouchableOpacity>
            </View>
          </View>


          <Selector
            label="Difficulté"
            options={["Débutant", "Moyen", "Difficile"]}
            current={difficulty}
            setter={setDifficulty}
          />
          <Selector
            label="Type de plat"
            options={["Entrée", "Plat", "Dessert"]}
            current={type}
            setter={setType}
          />
          <Selector
            label="Temps"
            options={["Express", "Moyen", "Mijoté"]}
            current={time}
            setter={setTime}
          />
          <Selector
            label="Budget"
            options={["Éco", "Équilibré", "Gourmet"]}
            current={price}
            setter={setPrice}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.selectorLabel}>Contexte / Régime (Optionnel)</Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Ex: Pas de lait, Sans gluten, Halal..."
              value={context}
              onChangeText={setContext}
            />
          </View>

          {/* Bouton Générer */}
          <TouchableOpacity
            style={[styles.generateBtn, searching && { opacity: 0.6 }]}
            onPress={handleGenerate}
            disabled={searching}
          >
            <LinearGradient
              colors={["#FF9F1C", "#FFC107"]}
              style={styles.gradientBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#FFF" />
                  <Text style={styles.generateBtnText}>Générer ma recette</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>


          {generatedRecipeText && (
            <View
              style={{
                marginTop: 25,
                backgroundColor: "#FFF",
                padding: 20,
                borderRadius: 15,
                borderWidth: 2,
                borderColor: "#FF9F1C",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#FF9F1C",
                  marginBottom: 15,
                }}
              >
                ✨ Ta recette sur mesure :
              </Text>
              <Text style={{ fontSize: 15, lineHeight: 24, color: "#333" }}>
                {generatedRecipeText}
              </Text>

              {savedRecipeId ? (
                <View style={styles.savedContainer}>
                  <View style={styles.savedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                    <Text style={styles.savedText}>Recette sauvegardée !</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewRecipeBtn}
                    onPress={() => router.push(`/recipe/${savedRecipeId}`)}
                  >
                    <Text style={styles.viewRecipeBtnText}>Voir la recette →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                  onPress={handleSaveRecipe}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="bookmark" size={18} color="#FFF" />
                      <Text style={styles.saveBtnText}>Sauvegarder cette recette</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {saveError && (
                <Text style={styles.saveErrorText}>{saveError}</Text>
              )}

              <TouchableOpacity
                style={styles.closeRecipeBtn}
                onPress={() => setGeneratedRecipeText(null)}
              >
                <Text style={styles.closeRecipeBtnText}>Fermer la recette</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <>
          {loading && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color="#00C853" />
              <Text style={{ marginTop: 10, color: "#666" }}>
                Chargement des recettes...
              </Text>
            </View>
          )}

          {error && (
            <View
              style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}
            >
              <Text style={{ color: "#DC2626", fontSize: 16, textAlign: "center" }}>
                {error}
              </Text>
            </View>
          )}

          {!loading && !error && (
            <View style={{ flex: 1 }}>
              <FlatList
                data={paginatedRecipes}
                keyExtractor={(item) => item.id.toString()}
                key={numColumns}
                numColumns={numColumns}
                columnWrapperStyle={
                  numColumns > 1 ? getColumnWrapperStyle() : undefined
                }
                contentContainerStyle={[
                  styles.listContent,
                  !isMobile && styles.listContentDesktop,
                ]}
                renderItem={renderRecipeItem}
                ListEmptyComponent={
                  <View style={{ alignItems: "center", marginTop: 50 }}>
                    <Text style={{ color: "#888" }}>
                      Aucune recette trouvée pour {searchQuery} 😕
                    </Text>
                  </View>
                }
                ListHeaderComponent={() =>
                  !isSearchActive && searchQuery === "" ? (
                    <LinearGradient
                      colors={["#FF9F1C", "#FFC107"]}
                      style={!isMobile ? styles.promoCardDesktop : styles.promoCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={{ flexDirection: "row", marginBottom: 10 }}>
                        <Ionicons name="trending-up" size={24} color="#FFF" />
                        <Text style={styles.promoTitle}>
                          Recommandations personnalisées
                        </Text>
                      </View>
                      <Text style={styles.promoDesc}>
                        Ces recettes utilisent au maximum les ingrédients de ton frigo
                        pour éviter le gaspillage !
                      </Text>
                    </LinearGradient>
                  ) : null
                }
              />
              {filteredRecipes.length > recipesPerPage && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paginationBtn,
                      currentPage === 1 && styles.paginationBtnDisabled,
                    ]}
                    onPress={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={currentPage === 1 ? "#CCC" : "#00C853"}
                    />
                  </TouchableOpacity>

                  <View style={styles.paginationInfo}>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <TouchableOpacity
                        key={i + 1}
                        onPress={() => setCurrentPage(i + 1)}
                        style={[
                          styles.pageBtn,
                          currentPage === i + 1 && styles.pageBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pageText,
                            currentPage === i + 1 && styles.pageTextActive,
                          ]}
                        >
                          {i + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.paginationBtn,
                      currentPage === totalPages && styles.paginationBtnDisabled,
                    ]}
                    onPress={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={currentPage === totalPages ? "#CCC" : "#00C853"}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    backgroundColor: "#00C853",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerDesktop: { paddingTop: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF", flex: 1, marginRight: 10 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: { padding: 4 },
  generatorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  generatorBtnText: { color: "#00C853", fontSize: 12, fontWeight: "bold" },
  searchBarContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: "center",
    height: 45,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  scrollForm: { padding: 20, paddingBottom: 50 },
  selectorContainer: { marginBottom: 20 },
  selectorLabel: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 10, marginLeft: 5 },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: { backgroundColor: "#FFF", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#DDD" },
  chipActive: { backgroundColor: "#00C853", borderColor: "#00C853" },
  chipText: { color: "#666", fontWeight: "600" },
  chipTextActive: { color: "#FFF" },
  row: { flexDirection: "row", alignItems: "center" },
  frigoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00C853",
  },
  frigoBtnActive: { backgroundColor: "#00C853" },
  frigoBtnText: { marginLeft: 5, color: "#00C853", fontWeight: "bold" },
  counterGroup: { marginBottom: 20, alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  counter: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 15, padding: 5 },
  counterText: { fontSize: 20, fontWeight: "bold", marginHorizontal: 20, color: "#333" },
  textArea: { backgroundColor: "#FFF", borderRadius: 12, padding: 15, height: 80, textAlignVertical: "top", borderWidth: 1, borderColor: "#DDD" },
  inputGroup: { marginBottom: 20 },
  generateBtn: { marginTop: 10, borderRadius: 15, overflow: "hidden", elevation: 4 },
  gradientBtn: { paddingVertical: 18, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  generateBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  listContent: { padding: 15, paddingBottom: 0 },
  listContentDesktop: { paddingHorizontal: 24 },
  columnWrapperDesktop: { marginHorizontal: "3.60%" },
  columnWrapperTablet: { marginHorizontal: "1%" },
  promoCardDesktop: { borderRadius: 15, padding: 20, marginBottom: 20, marginTop: 15, marginHorizontal: "3.60%" },
  promoCard: { borderRadius: 15, padding: 20, marginBottom: 20, marginTop: 15, marginHorizontal: 0 },
  promoTitle: { color: "#FFF", fontWeight: "bold", fontSize: 16, marginLeft: 10 },
  promoDesc: { color: "#FFF", marginTop: 5, lineHeight: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 15, overflow: "hidden", elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, marginVertical: 8 },
  cardMobile: { width: "100%", marginRight: 0 },
  cardTablet: { width: "48%", marginRight: "2%" },
  cardDesktop: { width: "23.3%", flexGrow: 0, flexShrink: 0, marginRight: "2.2%" },
  cardImage: { width: "100%", height: 180 },
  cardContent: { flex: 1, padding: 16, justifyContent: "space-between" },
  cardFooter: { marginTop: 12, alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333", width: "100%", marginBottom: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 12, fontWeight: "bold", color: "#F59E0B" },
  favBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  favText: { fontSize: 12, color: "#E63946" },
  commentBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  commentText: { fontSize: 12, color: "#666" },
  metaContainer: { width: "100%", marginTop: 4, marginBottom: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "#666", fontSize: 13 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
  tagText: { fontSize: 12, fontWeight: "bold" },
  linkText: { color: "#FF9F1C", fontWeight: "bold", fontSize: 14 },
  paginationContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#EEE", gap: 10 },
  paginationBtn: { padding: 10, borderRadius: 8, backgroundColor: "#F5F5F5" },
  paginationBtnDisabled: { opacity: 0.5 },
  paginationInfo: { flexDirection: "row", gap: 8, justifyContent: "center", flex: 1 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#DDD" },
  pageBtnActive: { backgroundColor: "#00C853", borderColor: "#00C853" },
  pageText: { fontSize: 14, fontWeight: "600", color: "#666" },
  pageTextActive: { color: "#FFF" },
  saveBtn: {
    marginTop: 15,
    backgroundColor: "#FF9F1C",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  recipeStatPill: {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
  backgroundColor: "#F8FAFC",
  borderWidth: 1,
  borderColor: "#E5E7EB",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 999,
},
pillText: {
  fontSize: 12,
  color: "#555",
  fontWeight: "500",
},
  saveBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  savedContainer: { marginTop: 15, gap: 10 },
  savedBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  savedText: { color: "#22C55E", fontWeight: "700", fontSize: 15 },
  viewRecipeBtn: { backgroundColor: "#00C853", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  viewRecipeBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  saveErrorText: { color: "#DC2626", marginTop: 8, fontSize: 13, textAlign: "center" },
  closeRecipeBtn: { marginTop: 15, alignSelf: "center", padding: 10, backgroundColor: "#F5F5F5", borderRadius: 8 },
  closeRecipeBtnText: { color: "#666", fontWeight: "bold" },
});