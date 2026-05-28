import useRequireAuth from "@/src/hooks/useRequireAuth";
import { getFrigoIngredients } from "@/src/services/fridge";
import {
  generateAiRecipe,
  getRecipes,
  saveAiRecipe,
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

  // States Générateur
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

  // States Data
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [generatedRecipeText, setGeneratedRecipeText] = useState<string | null>(
    null,
  );
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
    if (typeof recipe.ratings?.stats?.count === "number")
      return recipe.ratings.stats.count;
    if (typeof recipe.ratings_count === "number") return recipe.ratings_count;
    if (typeof recipe.reviews_count === "number") return recipe.reviews_count;
    if (typeof recipe.comments_count === "number") return recipe.comments_count;
    return 0;
  }, []);

  const getAverageRating = useCallback((recipe: any): number => {
    if (typeof recipe.ratings?.stats?.average === "number")
      return recipe.ratings.stats.average;
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
            favorites_count:
              r.engagement?.favorites_count ?? r.favorites_count ?? 0,
            ratings: r.ratings,
            ratings_count: r.ratings_count,
            reviews_count: r.reviews_count,
            comments_count: r.comments_count,
            average_rating: r.average_rating,
            avg_rating: r.avg_rating,
            rating_average: r.rating_average,
          })),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des recettes",
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
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const recipesPerPage = isDesktop ? 32 : isTablet ? 16 : 8;
  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
  const startIndex = (currentPage - 1) * recipesPerPage;
  const paginatedRecipes = filteredRecipes.slice(
    startIndex,
    startIndex + recipesPerPage,
  );

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
    setAddedIngredients([
      ...addedIngredients,
      { name: ingredientInput, emoji },
    ]);
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
        console.error("Erreur frigo :", err);
      }
    };
    loadRealFridge();
  }, [useFrigo]);

  const toggleFridgeSelection = (index: number) => {
    setFridgeItems((prev) => {
      const copy = [...prev];
      copy[index].selected = !copy[index].selected;
      if (copy[index].selected) {
        const exists = addedIngredients.some(
          (a) => a.name.toLowerCase() === copy[index].name.toLowerCase(),
        );
        if (!exists)
          setAddedIngredients((s) => [
            ...s,
            { name: copy[index].name, emoji: copy[index].emoji },
          ]);
      } else {
        setAddedIngredients((s) =>
          s.filter(
            (a) => a.name.toLowerCase() !== copy[index].name.toLowerCase(),
          ),
        );
      }
      return copy;
    });
  };

  const handleSaveRecipe = async () => {
    if (!generatedRecipeText) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await saveAiRecipe(generatedRecipeText, { dishType: type });
      setSavedRecipeId(saved.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur de sauvegarde");
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

      let tempsMinutes = time === "Express" ? 15 : time === "Mijoté" ? 120 : 45;

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
      setError("Erreur lors de la génération.");
    } finally {
      setSearching(false);
    }
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
            <Text
              style={[
                styles.chipText,
                current === opt && styles.chipTextActive,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const getDifficultyColors = (diff: string) => {
    const d = diff.toLowerCase().trim();
    if (d.includes("débutant")) return { bg: "#1B5E20", text: "#FFFFFF" };
    if (d.includes("moyen")) return { bg: "#F9A825", text: "#1F1F1F" };
    if (d.includes("difficile")) return { bg: "#C62828", text: "#FFFFFF" };
    return { bg: "#E8F5E9", text: "#2E7D32" };
  };

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF9F1C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FF9F1C" barStyle="light-content" />

      {/* HEADER ORANGE ARRONDI */}
      <View style={[styles.header, !isMobile && styles.headerDesktop]}>
        {!showGenerator && isSearchActive ? (
          <View style={styles.searchBarContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#FF9F1C"
              style={{ marginRight: 10 }}
            />
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
              Toutes les recettes
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={toggleSearch}
                style={styles.headerIconBtn}
              >
                <Ionicons name="search" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowGenerator(true)}
                style={styles.generatorBtn}
              >
                <Ionicons name="sparkles" size={16} color="#FF9F1C" />
                <Text style={styles.generatorBtnText}>Générateur</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Générateur IA
            </Text>
            <TouchableOpacity
              onPress={() => setShowGenerator(false)}
              style={styles.generatorBtn}
            >
              <Ionicons name="list" size={16} color="#FF9F1C" />
              <Text style={styles.generatorBtnText}>Voir les recettes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* CONTENU PRINCIPAL */}
      {showGenerator ? (
        <ScrollView contentContainerStyle={styles.scrollForm}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={{ color: "#DC2626" }}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.selectorLabel}>Ingrédients spécifiques</Text>
            <View style={styles.row}>
              <View
                style={[
                  styles.searchBarContainer,
                  {
                    flex: 1,
                    marginRight: 10,
                    borderWidth: 1,
                    borderColor: "#EEE",
                  },
                  useFrigo && { backgroundColor: "#F0F0F0", opacity: 0.6 },
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
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={useFrigo ? "#CCC" : "#FF9F1C"}
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
                  color={useFrigo ? "#FFF" : "#FF9F1C"}
                />
                <Text
                  style={[styles.frigoBtnText, useFrigo && { color: "#FFF" }]}
                >
                  Frigo
                </Text>
              </TouchableOpacity>
            </View>

            {useFrigo ? (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.selectorLabel}>Ingrédients du frigo</Text>
                <View
                  style={[styles.chipRow, { flexWrap: "wrap", marginTop: 10 }]}
                >
                  {fridgeItems.map((fi, i) => (
                    <TouchableOpacity
                      key={fi.name + i}
                      onPress={() => toggleFridgeSelection(i)}
                      style={[
                        styles.chip,
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        },
                        fi.selected && styles.chipActive,
                      ]}
                    >
                      <Text style={{ marginRight: 8 }}>{fi.emoji}</Text>
                      <Text style={fi.selected ? { color: "#FFF" } : {}}>
                        {fi.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              addedIngredients.length > 0 && (
                <View
                  style={[styles.chipRow, { flexWrap: "wrap", marginTop: 10 }]}
                >
                  {addedIngredients.map((ing, index) => (
                    <View
                      key={index}
                      style={[
                        styles.chip,
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#FFF3E0",
                          borderColor: "#FF9F1C",
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
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#FF9F1C"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )
            )}
          </View>

          <View style={styles.counterGroup}>
            <Text style={styles.selectorLabel}>Nombre de personnes</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                onPress={() => setNbPers(Math.max(1, nbPers - 1))}
              >
                <Ionicons name="remove-circle" size={36} color="#FF9F1C" />
              </TouchableOpacity>
              <Text style={styles.counterText}>{nbPers}</Text>
              <TouchableOpacity onPress={() => setNbPers(nbPers + 1)}>
                <Ionicons name="add-circle" size={36} color="#FF9F1C" />
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
            <Text style={styles.selectorLabel}>
              Contexte / Régime (Optionnel)
            </Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Ex: Pas de lait, Sans gluten, Halal..."
              value={context}
              onChangeText={setContext}
            />
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, searching && { opacity: 0.7 }]}
            onPress={handleGenerate}
            disabled={searching}
          >
            <LinearGradient
              colors={["#FF9F1C", "#FFB703"]}
              style={styles.gradientBtn}
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
            <View style={styles.generatedBox}>
              <Text style={styles.generatedTitle}>
                ✨ Ta recette sur mesure :
              </Text>
              <Text style={styles.generatedText}>{generatedRecipeText}</Text>
              {savedRecipeId ? (
                <View style={styles.savedContainer}>
                  <View style={styles.savedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#22C55E"
                    />
                    <Text style={styles.savedText}>Recette sauvegardée !</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewRecipeBtn}
                    onPress={() => router.push(`/recipe/${savedRecipeId}`)}
                  >
                    <Text style={styles.viewRecipeBtnText}>
                      Voir la recette →
                    </Text>
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
                      <Text style={styles.saveBtnText}>
                        Sauvegarder et Favoris
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeRecipeBtn}
                onPress={() => setGeneratedRecipeText(null)}
              >
                <Text style={styles.closeRecipeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#FF9F1C" />
            </View>
          ) : (
            <FlatList
              data={paginatedRecipes}
              keyExtractor={(item) => item.id.toString()}
              key={numColumns}
              numColumns={numColumns}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const diff = getDifficultyColors(item.difficulty || "");
                return (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push(`/recipe/${item.id}`)}
                  >
                    <Image
                      source={{
                        uri: item.image || "https://via.placeholder.com/300",
                      }}
                      style={styles.cardImage}
                    />
                    <View style={styles.cardContent}>
                      <Text numberOfLines={2} style={styles.cardTitle}>
                        {item.name}
                      </Text>
                      <View style={styles.metaContainer}>
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#666"
                          />
                          <Text style={styles.metaText}>
                            {(item.timing?.prep_time ?? 0) +
                              (item.timing?.duration ?? 0)}{" "}
                            min
                          </Text>
                        </View>
                        <View
                          style={[styles.tag, { backgroundColor: diff.bg }]}
                        >
                          <Text style={[styles.tagText, { color: diff.text }]}>
                            {item.difficulty || "Moyen"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", marginTop: 50 }}>
                  <Text style={{ color: "#888" }}>
                    Aucune recette trouvée 😕
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  header: {
    backgroundColor: "#FF9F1C",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerDesktop: { paddingTop: 30 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: "#FFF", flex: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 15 },
  headerIconBtn: { padding: 4 },
  generatorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  generatorBtnText: { color: "#FF9F1C", fontSize: 13, fontWeight: "bold" },
  searchBarContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    alignItems: "center",
    height: 45,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  scrollForm: { padding: 20, paddingBottom: 50 },
  selectorContainer: { marginBottom: 20 },
  selectorLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 12,
    marginLeft: 2,
  },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chipActive: { backgroundColor: "#FF9F1C", borderColor: "#FF9F1C" },
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
    borderColor: "#FF9F1C",
  },
  frigoBtnActive: { backgroundColor: "#FF9F1C" },
  frigoBtnText: { marginLeft: 5, color: "#FF9F1C", fontWeight: "bold" },
  counterGroup: {
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 5,
    elevation: 2,
  },
  counterText: {
    fontSize: 22,
    fontWeight: "bold",
    marginHorizontal: 20,
    color: "#333",
  },
  textArea: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    height: 90,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputGroup: { marginBottom: 20 },
  generateBtn: {
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
  },
  gradientBtn: {
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  generateBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  errorBox: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  generatedBox: {
    marginTop: 25,
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FF9F1C",
  },
  generatedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF9F1C",
    marginBottom: 15,
  },
  generatedText: { fontSize: 15, lineHeight: 24, color: "#444" },
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
  saveBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  savedContainer: { marginTop: 15, gap: 10 },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  savedText: { color: "#22C55E", fontWeight: "700", fontSize: 15 },
  viewRecipeBtn: {
    backgroundColor: "#FF9F1C",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  viewRecipeBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  closeRecipeBtn: {
    marginTop: 15,
    alignSelf: "center",
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
  },
  closeRecipeBtnText: { color: "#666", fontWeight: "bold" },
  listContent: { padding: 15, paddingBottom: 30 },
  card: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    margin: 8,
  },
  cardImage: { width: "100%", height: 160 },
  cardContent: { padding: 15 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "#666", fontSize: 13, fontWeight: "500" },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: "bold" },
});
