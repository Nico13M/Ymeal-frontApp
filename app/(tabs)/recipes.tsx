import useRequireAuth from "@/src/hooks/useRequireAuth";
import { getRecipes, searchRecipes, type RecipeMinimal } from "@/src/services/recipes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  'poulet': '🍗', 'boeuf': '🥩', 'poisson': '🐟', 'oeuf': '🥚', 'lait': '🥛',
  'farine': '🌾', 'sucre': '🍬', 'sel': '🧂', 'poivre': '🧂', 'tomate': '🍅',
  'carotte': '🥕', 'oignon': '🧅', 'ail': '🧄', 'pomme de terre': '🥔',
  'riz': '🍚', 'pates': '🍝', 'fromage': '🧀', 'beurre': '🧈', 'huile': '🍾'
};

export default function RecipesScreen() {
  const router = useRouter();

  const { checking } = useRequireAuth();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [nbPers, setNbPers] = useState(2);
  const [difficulty, setDifficulty] = useState('Débutant');
  const [type, setType] = useState('Plat');
  const [time, setTime] = useState('Moyen');
  const [price, setPrice] = useState('Équilibré');
  const [context, setContext] = useState('');
  const [useFrigo, setUseFrigo] = useState(false);
  const [ingredientInput, setIngredientInput] = useState('');
  const [addedIngredients, setAddedIngredients] = useState<{name: string, emoji: string}[]>([]);
  const [fridgeItems, setFridgeItems] = useState<{name: string, emoji: string, selected?: boolean}[]>([]);

  const [recipes, setRecipes] = useState<RecipeMinimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const numColumns = isDesktop ? 4 : isTablet ? 2 : 1;

  const inputRef = useRef<any>(null);

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
            favorites_count: r.engagement.favorites_count,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des recettes");
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [checking]);

  const filteredRecipes = recipes.filter((recipe) =>
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
    if (ingredientInput.trim() === '' || useFrigo) return;
    const name = ingredientInput.toLowerCase().trim();
    const emoji = EMOJI_MAP[name] || '🍲';
    setAddedIngredients([...addedIngredients, { name: ingredientInput, emoji }]);
    setIngredientInput('');
  };

  const removeIngredient = (index: number) => {
    setAddedIngredients(addedIngredients.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!useFrigo) return;

    const loadMockFridge = async () => {
      await new Promise((res) => setTimeout(res, 200));
      const mockNames = ["tomate", "oeuf", "lait", "fromage", "pates", "riz", "carotte"];
      const items = mockNames.map((n) => ({ name: n, emoji: EMOJI_MAP[n] || "🍽️", selected: false }));
      setFridgeItems(items);
    };

    loadMockFridge();
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
        const exists = addedIngredients.some((a) => a.name.toLowerCase() === copy[index].name.toLowerCase());
        if (!exists) setAddedIngredients((s) => [...s, { name: copy[index].name, emoji: copy[index].emoji }]);
      } else {
        setAddedIngredients((s) => s.filter((a) => a.name.toLowerCase() !== copy[index].name.toLowerCase()));
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
            <Text style={[styles.chipText, current === opt && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleGenerate = async () => {
    try {
      setSearching(true);
      setError(null);

      const result = await searchRecipes({
        difficulty: difficulty !== "Moyen" ? difficulty : undefined,
        servings: nbPers,
        frigo: useFrigo,
      });

      if (result.data.recipes.length > 0) {
        const chosen = result.data.recipes[Math.floor(Math.random() * result.data.recipes.length)];
        router.push(`/recipe/${chosen.id}`);
      } else {
        setError("Aucune recette ne correspond à vos critères");
      }

      setShowGenerator(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération");
    } finally {
      setSearching(false);
    }
  };

  const getDifficultyColors = (difficulty: string) => {
    const normalizedDifficulty = difficulty.toLowerCase().trim();
    if (normalizedDifficulty.includes("débutant")) return { backgroundColor: "#1B5E20", textColor: "#FFFFFF" };
    if (normalizedDifficulty.includes("moyen")) return { backgroundColor: "#F9A825", textColor: "#1F1F1F" };
    if (normalizedDifficulty.includes("difficile")) return { backgroundColor: "#C62828", textColor: "#FFFFFF" };
    return { backgroundColor: "#E8F5E9", textColor: "#2E7D32" };
  };

  const getCardStyle = () => {
    if (isDesktop) return [styles.card, styles.cardDesktop];
    if (isTablet) return [styles.card, styles.cardTablet];
    return [styles.card, styles.cardMobile];
  };

  const renderRecipeItem = ({ item }: { item: RecipeMinimal }) => {
    const difficultyColors = getDifficultyColors(item.difficulty || "");

    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={() => router.push(`/recipe/${item.id}`)}
      >
        <Image source={{ uri: item.image || "https://via.placeholder.com/300" }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View>
            <View style={styles.rowBetween}>
              <Text numberOfLines={2} style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFF" />
                <Text style={styles.ratingText}>{item.favorites_count}</Text>
              </View>
            </View>

            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.metaText}>
                  {(item.timing?.prep_time ?? 0) + (item.timing?.duration ?? 0)} min
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.rowBetween, styles.cardFooter]}>
            <View style={[styles.tag, { backgroundColor: difficultyColors.backgroundColor }]}>
              <Text style={[styles.tagText, { color: difficultyColors.textColor }]}>
                {item.difficulty || "Moyen"}
              </Text>
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

      {/* HEADER — toujours une seule ligne */}
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
            <Text style={styles.headerTitle} numberOfLines={1}>Recettes pour vous</Text>
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
            <Text style={styles.headerTitle} numberOfLines={1}>Générateur</Text>
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
            <View style={{ backgroundColor: "#FFEBEE", padding: 10, borderRadius: 8, marginBottom: 15 }}>
              <Text style={{ color: "#DC2626" }}>{error}</Text>
            </View>
          )}
          <View style={styles.inputGroup}>
            <Text style={styles.selectorLabel}>Ingrédients spécifiques</Text>
            <View style={styles.row}>
              <View style={[
                styles.searchBarContainer,
                { flex: 1, marginRight: 10 },
                useFrigo && { backgroundColor: '#F0F0F0', opacity: 0.6 }
              ]}>
                <TextInput
                  placeholder={useFrigo ? "Désactivé (Mode Frigo)" : "Ajouter un ingrédient..."}
                  style={{ flex: 1 }}
                  value={ingredientInput}
                  onChangeText={setIngredientInput}
                  editable={!useFrigo}
                  onSubmitEditing={handleAddIngredient}
                />
                <TouchableOpacity onPress={handleAddIngredient} disabled={useFrigo}>
                  <Ionicons name="add-circle" size={24} color={useFrigo ? "#CCC" : "#00C853"} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setUseFrigo(!useFrigo)}
                style={[styles.frigoBtn, useFrigo && styles.frigoBtnActive]}
              >
                <Ionicons name="fast-food" size={20} color={useFrigo ? "#FFF" : "#00C853"} />
                <Text style={[styles.frigoBtnText, useFrigo && { color: '#FFF' }]}>Frigo</Text>
              </TouchableOpacity>
            </View>

            {useFrigo ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.selectorLabel}>Ingrédients du frigo</Text>
                <View style={[styles.chipRow, { flexWrap: 'wrap', marginTop: 10 }]}>
                  {fridgeItems.map((fi, i) => (
                    <TouchableOpacity
                      key={fi.name + i}
                      onPress={() => toggleFridgeSelection(i)}
                      style={[
                        styles.chip,
                        { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
                        fi.selected && { backgroundColor: '#C8E6C9' },
                      ]}
                    >
                      <Text>{fi.emoji} {fi.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              addedIngredients.length > 0 && (
                <View style={[styles.chipRow, { flexWrap: 'wrap', marginTop: 10 }]}>
                  {addedIngredients.map((ing, index) => (
                    <View key={index} style={[styles.chip, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9' }]}>
                      <Text>{ing.emoji} {ing.name}</Text>
                      <TouchableOpacity onPress={() => removeIngredient(index)} style={{ marginLeft: 8 }}>
                        <Ionicons name="close-circle" size={16} color="#666" />
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
              <TouchableOpacity onPress={() => setNbPers(Math.max(1, nbPers - 1))}>
                <Ionicons name="remove-circle-outline" size={32} color="#00C853" />
              </TouchableOpacity>
              <Text style={styles.counterText}>{nbPers}</Text>
              <TouchableOpacity onPress={() => setNbPers(nbPers + 1)}>
                <Ionicons name="add-circle-outline" size={32} color="#00C853" />
              </TouchableOpacity>
            </View>
          </View>

          <Selector label="Difficulté" options={['Débutant', 'Moyen', 'Difficile']} current={difficulty} setter={setDifficulty} />
          <Selector label="Type de plat" options={['Entrée', 'Plat', 'Dessert']} current={type} setter={setType} />
          <Selector label="Temps" options={['Express', 'Moyen', 'Mijoté']} current={time} setter={setTime} />
          <Selector label="Budget" options={['Éco', 'Équilibré', 'Gourmet']} current={price} setter={setPrice} />

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

          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={searching}>
            <LinearGradient colors={['#FF9F1C', '#FF7E05']} style={styles.gradientBtn}>
              {searching ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={styles.generateBtnText}>Générer la recette</Text>
                  <Ionicons name="color-wand" size={20} color="#FFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          {loading && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color="#00C853" />
              <Text style={{ marginTop: 10, color: "#666" }}>Chargement des recettes...</Text>
            </View>
          )}

          {error && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
              <Text style={{ color: "#DC2626", fontSize: 16, textAlign: "center" }}>{error}</Text>
            </View>
          )}

          {!loading && !error && (
            <View style={{ flex: 1 }}>
              <FlatList
                data={paginatedRecipes}
                keyExtractor={(item) => item.id.toString()}
                key={numColumns} // force re-render when numColumns changes
                numColumns={numColumns}
                columnWrapperStyle={numColumns > 1 ? getColumnWrapperStyle() : undefined}
                contentContainerStyle={[
                  styles.listContent,
                  !isMobile && styles.listContentDesktop,
                ]}
                renderItem={renderRecipeItem}
                ListEmptyComponent={
                  <View style={{ alignItems: "center", marginTop: 50 }}>
                    <Text style={{ color: "#888" }}>
                      Aucune recette trouvée pour "{searchQuery}" 😕
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
                        <Text style={styles.promoTitle}>Recommandations personnalisées</Text>
                      </View>
                      <Text style={styles.promoDesc}>
                        Ces recettes utilisent au maximum les ingrédients de ton frigo pour éviter le gaspillage !
                      </Text>
                    </LinearGradient>
                  ) : null
                }
              />
              {filteredRecipes.length > recipesPerPage && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[styles.paginationBtn, currentPage === 1 && styles.paginationBtnDisabled]}
                    onPress={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? "#CCC" : "#00C853"} />
                  </TouchableOpacity>

                  <View style={styles.paginationInfo}>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <TouchableOpacity
                        key={i + 1}
                        onPress={() => setCurrentPage(i + 1)}
                        style={[styles.pageBtn, currentPage === i + 1 && styles.pageBtnActive]}
                      >
                        <Text style={[styles.pageText, currentPage === i + 1 && styles.pageTextActive]}>
                          {i + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.paginationBtn, currentPage === totalPages && styles.paginationBtnDisabled]}
                    onPress={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? "#CCC" : "#00C853"} />
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
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  header: {
    backgroundColor: "#00C853",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerDesktop: {
    paddingTop: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    flex: 1,
    marginRight: 10,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerIconBtn: {
    padding: 4,
  },

  generatorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },

  generatorBtnText: {
    color: "#00C853",
    fontSize: 12,
    fontWeight: "bold",
  },

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
  chip: {
    backgroundColor: "#FFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
  },
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
  textArea: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    height: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  inputGroup: { marginBottom: 20 },
  generateBtn: { marginTop: 10, borderRadius: 15, overflow: "hidden", elevation: 4 },
  gradientBtn: {
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  generateBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },

  listContent: { padding: 15, paddingBottom: 0 },
  listContentDesktop: { paddingHorizontal: 24 },

  columnWrapperDesktop: { marginHorizontal: "3.60%" },
  columnWrapperTablet: { marginHorizontal: "1%" },

  promoCardDesktop: { borderRadius: 15, padding: 20, marginBottom: 20, marginTop: 15, marginHorizontal: "3.60%" },
  promoCard: { borderRadius: 15, padding: 20, marginBottom: 20, marginTop: 15, marginHorizontal: 0 },
  promoTitle: { color: "#FFF", fontWeight: "bold", fontSize: 16, marginLeft: 10 },
  promoDesc: { color: "#FFF", marginTop: 5, lineHeight: 20 },

  // Base card style
  card: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginVertical: 8,
  },

  // Mobile: 1 column, full width
  cardMobile: {
    width: "100%",
    marginRight: 0,
  },

  // Tablet: 2 columns
  cardTablet: {
    width: "48%",
    marginRight: "2%",
  },

  // Desktop: 4 columns
  cardDesktop: {
    width: "23.3%",
    flexGrow: 0,
    flexShrink: 0,
    marginRight: "2.2%",
  },

  cardImage: { width: "100%", height: 180 },
  cardContent: { flex: 1, padding: 16 },
  cardFooter: { marginTop: "auto", paddingTop: 12 },

  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1, marginRight: 2 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  ratingBadge: {
    flexDirection: "row",
    backgroundColor: "#FFC107",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    alignItems: "center",
  },
  ratingText: { fontSize: 12, fontWeight: "bold", marginLeft: 4, color: "#333" },

  metaContainer: { flexDirection: "row", gap: 15, marginBottom: 16, marginTop: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "#666", fontSize: 13 },

  tag: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  tagText: { color: "#2E7D32", fontSize: 12, fontWeight: "bold" },

  linkText: { color: "#FF9F1C", fontWeight: "bold", fontSize: 14, alignSelf: "center" },

  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    gap: 10,
  },
  paginationBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  paginationBtnDisabled: { opacity: 0.5 },
  paginationInfo: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    flex: 1,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  pageBtnActive: {
    backgroundColor: "#00C853",
    borderColor: "#00C853",
  },
  pageText: { fontSize: 14, fontWeight: "600", color: "#666" },
  pageTextActive: { color: "#FFF" },
});