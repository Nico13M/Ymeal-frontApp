import useRequireAuth from "@/src/hooks/useRequireAuth";
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
import { RECIPES } from "../../constants/recipesData";

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
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showGenerator, setShowGenerator] = useState(false);
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const inputRef = useRef<any>(null);

  const filteredRecipes = RECIPES.filter(
      (recipe) =>
          recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.ingredients.some((ing) =>
              ing.toLowerCase().includes(searchQuery.toLowerCase())
          )
  );

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
    // Mock fetching fridge items when fridge mode is enabled
    if (!useFrigo) return;

    const loadMockFridge = async () => {
      // Simulate network delay
      await new Promise((res) => setTimeout(res, 200));
      const mockNames = [
        "tomate",
        "oeuf",
        "lait",
        "fromage",
        "pates",
        "riz",
        "carotte",
      ];
      const items = mockNames.map((n) => ({ name: n, emoji: EMOJI_MAP[n] || "🍽️", selected: false }));
      setFridgeItems(items);
    };

    loadMockFridge();
  }, [useFrigo]);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  const toggleFridgeSelection = (index: number) => {
    setFridgeItems((prev) => {
      const copy = [...prev];
      copy[index].selected = !copy[index].selected;

      // reflect in addedIngredients
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

  const handleGenerate = () => {
    let candidates = RECIPES.slice();

    if (addedIngredients.length > 0) {
      const names = addedIngredients.map((i) => i.name.toLowerCase());
      const filtered = candidates.filter((r) =>
        r.ingredients.some((ing: string) =>
          names.some((n) => ing.toLowerCase().includes(n))
        )
      );
      if (filtered.length > 0) candidates = filtered;
    }

    if (difficulty) {
      const diff = difficulty.toLowerCase();
      const diffFiltered = candidates.filter((r) =>
        r.difficulty && r.difficulty.toLowerCase().includes(diff)
      );
      if (diffFiltered.length > 0) candidates = diffFiltered;
    }

    if (candidates.length === 0) candidates = RECIPES.slice();

    const scored = candidates.map((r) => {
      let score = 0;
      score += addedIngredients.reduce((s, ing) => {
        return s + (r.ingredients.some((ri: string) => ri.toLowerCase().includes(ing.name.toLowerCase())) ? 2 : 0);
      }, 0);
      if (r.difficulty && r.difficulty.toLowerCase().includes(difficulty.toLowerCase())) score += 1;
      score += Math.random();
      return { recipe: r, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const chosen = scored[0]?.recipe || RECIPES[Math.floor(Math.random() * RECIPES.length)];

    setSelectedRecipe(chosen);
    setShowGenerator(false);
  };

  const getDifficultyColors = (difficulty: string) => {
    const normalizedDifficulty = difficulty.toLowerCase().trim();
    if (
      normalizedDifficulty.includes("débutant")
    ) {
      return { backgroundColor: "#1B5E20", textColor: "#FFFFFF" };
    }

    if (normalizedDifficulty.includes("moyen")) {
      return { backgroundColor: "#F9A825", textColor: "#1F1F1F" };
    }

    if (normalizedDifficulty.includes("difficile")) {
      return { backgroundColor: "#C62828", textColor: "#FFFFFF" };
    }

    return { backgroundColor: "#E8F5E9", textColor: "#2E7D32" };
  };

  const renderRecipeItem = ({ item }: any) => {
    const difficultyColors = getDifficultyColors(item.difficulty);

    return (
      <TouchableOpacity
        style={[styles.card, isDesktop && styles.cardDesktop]}
        onPress={() => router.push(`/recipe/${item.id}`)}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFF" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.time}</Text>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <View
              style={[
                styles.tag,
                { backgroundColor: difficultyColors.backgroundColor },
              ]}
            >
              <Text style={[styles.tagText, { color: difficultyColors.textColor }]}> 
                {item.difficulty}
              </Text>
            </View>
            <Text style={styles.linkText}>Voir la recette ➔</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#00C853" barStyle="light-content" />

        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          {!showGenerator && isSearchActive ? (
              <View style={styles.searchBarContainer}>
                <Ionicons
                    name="search"
                    size={20}
                    color="#00C853"
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
                    onSubmitEditing={() => toggleSearch()}
                />
                <TouchableOpacity onPress={toggleSearch}>
                  <Ionicons name="close-circle" size={24} color="#888" />
                </TouchableOpacity>
              </View>
          ) : !showGenerator ? (
              <View style={styles.headerTop}>
                <View style={{ width: 24 }} />
                <Text style={styles.headerTitle}>Recettes pour vous</Text>
                <TouchableOpacity onPress={toggleSearch}>
                  <Ionicons name="search" size={28} color="#FFF" />
                </TouchableOpacity>
              </View>
          ) : (
              <View style={styles.headerTop}>
                <Text style={styles.headerTitle}>Recettes</Text>
                <TouchableOpacity
                    onPress={() => setShowGenerator(!showGenerator)}
                    style={styles.navButton}
                >
                    <Ionicons
                        name={showGenerator ? "list" : "sparkles"}
                        size={18}
                        color="#00C853"
                    />
                    <Text style={styles.navButtonText}>
                        {showGenerator ? "Toutes les recettes" : "Générateur de recettes"}
                    </Text>
                </TouchableOpacity>
              </View>
          )}

          {!isSearchActive && !showGenerator && (
              <Text style={styles.headerSub}>
                Basées sur tes ingrédients disponibles
              </Text>
          )}

          {showGenerator && (
              <Text style={styles.headerSub}>
                Crée ta recette sur mesure
              </Text>
          )}

          {/* ====== BOUTON GÉNÉRATEUR ====== */}
          {!isSearchActive && !showGenerator && (
              <View style={[styles.btnRow, isDesktop && styles.btnRowDesktop]}>
                <TouchableOpacity
                    style={[styles.actionBtn, isDesktop && styles.actionBtnDesktop]}
                    onPress={() => setShowGenerator(true)}
                >
                  <Ionicons name="sparkles" size={18} color="#00C853" />
                  <Text style={styles.actionText}>Générateur de recettes</Text>
                </TouchableOpacity>
              </View>
          )}
        </View>

        {showGenerator ? (
            <ScrollView contentContainerStyle={styles.scrollForm}>
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
                            <Text style={[styles.frigoBtnText, useFrigo && {color: '#FFF'}]}>Frigo</Text>
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

                <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
                    <LinearGradient colors={['#FF9F1C', '#FF7E05']} style={styles.gradientBtn}>
                        <Text style={styles.generateBtnText}>Générer la recette</Text>
                        <Ionicons name="color-wand" size={20} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        ) : (
            <FlatList
                data={filteredRecipes}
                keyExtractor={(item) => item.id}
                numColumns={isDesktop ? 3 : 1}
                columnWrapperStyle={isDesktop ? styles.columnWrapperDesktop : undefined}
                contentContainerStyle={[
                  styles.listContent,
                  isDesktop && styles.listContentDesktop,
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
                            style={styles.promoCard}
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
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  header: {
    backgroundColor: "#00C853",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: "flex-end",
    minHeight: 170,
  },
  headerDesktop: {
    paddingTop: 20,
    minHeight: 60,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  headerSub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },

  navButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    maxWidth: "70%",
  },
  navButtonText: {
    color: "#00C853",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
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

  listContent: { padding: 20, paddingBottom: 100 },
  listContentDesktop: {
    paddingHorizontal: 48,
    alignItems: "stretch",
  },
  columnWrapperDesktop: {
    justifyContent: "space-between",
  },

  promoCard: { borderRadius: 15, padding: 20, marginBottom: 20, marginTop: 15 },
  promoTitle: { color: "#FFF", fontWeight: "bold", fontSize: 16, marginLeft: 10 },
  promoDesc: { color: "#FFF", marginTop: 5, lineHeight: 20 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardDesktopWrapper: {
    width: "100%",
    alignItems: "center",
  },
  cardDesktop: {
    width: "31%",
    flexGrow: 0,
    flexShrink: 0,
    marginHorizontal: 0,
    marginTop: 15,
  },

  cardImage: { width: "100%", height: 180 },
  cardContent: { padding: 15 },

  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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

  metaContainer: { flexDirection: "row", gap: 15, marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "#666", fontSize: 13 },

  tag: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  tagText: { color: "#2E7D32", fontSize: 12, fontWeight: "bold" },

  linkText: { color: "#FF9F1C", fontWeight: "bold", fontSize: 14 },

  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    gap: 10,
  },
  btnRowDesktop: {
    justifyContent: "center",
    alignSelf: "center",
  },

  actionBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnDesktop: {
    flex: 0,
    width: 240,
    minWidth: 220,
  },

  actionText: {
    fontWeight: "700",
    color: "#00C853",
    margin: "auto",
    textAlign: "center",
  },
});
