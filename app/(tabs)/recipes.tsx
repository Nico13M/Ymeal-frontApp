import MyRecipesView from "@/components/recipes/MyRecipesView";
import RecipeListCard, { type RecipeListItem } from "@/components/recipes/RecipeListCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { MAX_CONTENT_WIDTH, palette, radius, shadow } from "@/constants/design";
import { translateDifficulty } from "@/constants/recipePresentation";
import useRequireAuth from "@/src/hooks/useRequireAuth";
import { applyFavoriteOverrides, subscribeFavorites } from "@/src/lib/favoritesStore";
import { sameIngredient } from "@/src/lib/ingredientName";
import { notify } from "@/src/lib/notify";
import { getRecipePrice, PRICE_BANDS, type PriceBand } from "@/src/lib/recipePrice";
import { getSession, resolveUserId } from "@/src/services/auth";
import { getFullFridgeInventory } from "@/src/services/fridgeInventory";
import {
  addToFavorites,
  generateAiRecipe,
  getFavoriteIds,
  getRecipes,
  removeFromFavorites,
  saveAiRecipe
} from "@/src/services/recipes";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
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

type TimeFilter = "15" | "30" | "60" | "60+";
type RatingFilter = "3" | "4" | "4.5";
type SortKey = "default" | "rating" | "fast" | "cheap" | "popular";

const TIME_FILTERS: { key: TimeFilter; label: string; test: (min: number) => boolean }[] = [
  { key: "15", label: "≤ 15 min", test: (m) => m <= 15 },
  { key: "30", label: "≤ 30 min", test: (m) => m <= 30 },
  { key: "60", label: "≤ 1 h", test: (m) => m <= 60 },
  { key: "60+", label: "> 1 h", test: (m) => m > 60 },
];
const DIFFICULTY_FILTERS = ["Débutant", "Moyen", "Difficile"] as const;
const RATING_FILTERS: { key: RatingFilter; label: string; min: number }[] = [
  { key: "3", label: "3★ et +", min: 3 },
  { key: "4", label: "4★ et +", min: 4 },
  { key: "4.5", label: "4,5★ et +", min: 4.5 },
];
const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Pertinence" },
  { key: "rating", label: "Mieux notées" },
  { key: "popular", label: "Populaires" },
  { key: "fast", label: "Plus rapides" },
  { key: "cheap", label: "Moins chères" },
];

function normalizeText(v: string): string {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function RecipesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; generator?: string; mode?: string; t?: string }>();

  const { checking } = useRequireAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setModeState] = useState<"all" | "ai" | "mine">("all");
  // Défilement : l'en-tête orange se réduit progressivement
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false }),
    [scrollY],
  );
  const setMode = (m: "all" | "ai" | "mine") => {
    scrollY.setValue(0);
    setModeState(m);
  };
  const showGenerator = mode === "ai";
  const setShowGenerator = (v: boolean) => setMode(v ? "ai" : "all");
  const [reloadKey, setReloadKey] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
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

  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [dietFilter, setDietFilter] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<PriceBand | null>(null);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("default");
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

  const numColumns = width >= 1024 ? 3 : width >= 700 ? 2 : 1;

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
        const [data, favIds] = await Promise.all([getRecipes(), getFavoriteIds()]);
        // Source de vérité : la liste des favoris ; à défaut, le champ is_favorited de chaque recette
        data.forEach((r) => {
          if (r.is_favorited) favIds.add(r.id);
        });
        setFavoriteIds(applyFavoriteOverrides(favIds));
        setRecipes(
          data.map((r) => ({
            id: r.id,
            name: r.name ?? "",
            image: r.image,
            author: r.author?.name || "YMeal",
            dishType: r.dish_type,
            difficulty: r.difficulty,
            totalTime: (r.timing?.prep_time ?? 0) + (r.timing?.duration ?? 0),
            diets: (r.nutrition?.diets ?? []).map((d) => d.name).filter(Boolean),
            favoritesCount: r.engagement?.favorites_count ?? r.favorites_count ?? 0,
            authorId: r.author?.id ?? null,
            isPublic: r.is_public !== false,
            ratingsCount: getRatingsCount(r),
            averageRating: getAverageRating(r),
            price: getRecipePrice(r),
            searchText: normalizeText(
              [
                r.name,
                r.description,
                r.dish_type,
                ...(r.nutrition?.ingredients ?? []).map((i) => i.name),
              ]
                .filter(Boolean)
                .join(" "),
            ),
          })),
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
    getSession()
      .then((session) => {
        const id = resolveUserId(session?.user);
        setMyUserId(id !== null ? String(id) : null);
      })
      .catch(() => setMyUserId(null));
  }, [checking, getRatingsCount, getAverageRating, reloadKey]);

  const myRecipes = useMemo(
    () => (myUserId ? recipes.filter((r) => r.authorId != null && String(r.authorId) === myUserId) : []),
    [recipes, myUserId],
  );

  // Recherche transmise depuis l'accueil (/recipes?q=...)
  useEffect(() => {
    if (typeof params.q === "string" && params.q.trim()) {
      setShowGenerator(false);
      setSearchQuery(params.q);
    }
  }, [params.q]);

  // Ouverture directe de « Mes recettes » (/recipes?mode=mine)
  useEffect(() => {
    if (params.mode === "mine") setMode("mine");
    else if (params.t && !params.generator) setMode("all"); // raccourci « Explorer »
  }, [params.mode, params.t]);

  // Ouverture directe du générateur depuis le frigo (/recipes?generator=frigo)
  useEffect(() => {
    if (params.generator === "open") {
      setShowGenerator(true);
      return;
    }
    if (params.generator === "frigo") {
      setShowGenerator(true);
      setUseFrigo(true);
      // Recharge même si le mode Frigo était déjà actif (nouveaux produits)
      setFridgeReloadKey((k) => k + 1);
    }
  }, [params.generator, params.t]);

  const availableDiets = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.diets.forEach((d) => set.add(d)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [recipes]);

  const activeFilterCount = [dietFilter, timeFilter, difficultyFilter, priceFilter, ratingFilter].filter(
    Boolean,
  ).length + (sortKey !== "default" ? 1 : 0);

  const resetFilters = () => {
    setDietFilter(null);
    setTimeFilter(null);
    setDifficultyFilter(null);
    setPriceFilter(null);
    setRatingFilter(null);
    setSortKey("default");
  };

  const filteredRecipes = useMemo(() => {
    const words = normalizeText(searchQuery).split(/\s+/).filter(Boolean);
    const time = TIME_FILTERS.find((t) => t.key === timeFilter);
    const band = PRICE_BANDS.find((b) => b.key === priceFilter);
    const rating = RATING_FILTERS.find((r) => r.key === ratingFilter);

    const list = recipes.filter((r) => {
      const text = r.searchText ?? normalizeText(r.name);
      if (words.length && !words.every((w) => text.includes(w))) return false;
      if (dietFilter && !r.diets.includes(dietFilter)) return false;
      if (time && !time.test(r.totalTime)) return false;
      if (difficultyFilter && translateDifficulty(r.difficulty) !== difficultyFilter) return false;
      if (band && !(r.price && band.test(r.price.perServing))) return false;
      if (rating && !(r.ratingsCount > 0 && r.averageRating >= rating.min)) return false;
      return true;
    });

    const sorted = [...list];
    if (sortKey === "rating") sorted.sort((a, b) => b.averageRating - a.averageRating || b.ratingsCount - a.ratingsCount);
    if (sortKey === "popular") sorted.sort((a, b) => b.favoritesCount - a.favoritesCount);
    if (sortKey === "fast") sorted.sort((a, b) => a.totalTime - b.totalTime);
    if (sortKey === "cheap")
      sorted.sort((a, b) => (a.price?.perServing ?? Infinity) - (b.price?.perServing ?? Infinity));
    return sorted;
  }, [recipes, searchQuery, dietFilter, timeFilter, difficultyFilter, priceFilter, ratingFilter, sortKey]);

  // Resynchronise les cœurs au retour sur l'onglet (ex. favori retiré depuis le détail ou Favoris)
  useFocusEffect(
    useCallback(() => {
      if (checking) return;
      let active = true;
      getFavoriteIds().then((ids) => {
        if (active && ids.size > 0) setFavoriteIds(ids);
      });
      return () => {
        active = false;
      };
    }, [checking]),
  );

  const [pendingFav, setPendingFav] = useState<Set<number>>(new Set());

  // ♥ changé ailleurs (détail d'une recette, Favoris) : on met à jour la carte tout de suite
  useEffect(
    () =>
      subscribeFavorites((id, fav) =>
        setFavoriteIds((prev) => {
          if (prev.has(id) === fav) return prev;
          const next = new Set(prev);
          if (fav) next.add(id);
          else next.delete(id);
          return next;
        }),
      ),
    [],
  );

  const toggleFavorite = async (id: number) => {
    if (pendingFav.has(id)) return; // évite les doubles clics
    setPendingFav((p) => new Set(p).add(id));
    const wasFav = favoriteIds.has(id);
    const update = (fav: boolean) =>
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (fav) next.add(id);
        else next.delete(id);
        return next;
      });
    update(!wasFav);
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, favoritesCount: Math.max(0, r.favoritesCount + (wasFav ? -1 : 1)) } : r,
      ),
    );
    try {
      if (wasFav) await removeFromFavorites(id);
      else await addToFavorites(id);
    } catch (e) {
      update(wasFav);
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, favoritesCount: Math.max(0, r.favoritesCount + (wasFav ? 1 : -1)) } : r,
        ),
      );
      notify("Favoris", e instanceof Error && e.message ? e.message : "Impossible de mettre à jour tes favoris.");
    } finally {
      setPendingFav((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
    }
  };

  const recipesPerPage = isDesktop ? 24 : isTablet ? 16 : 10;
  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
  const startIndex = (currentPage - 1) * recipesPerPage;
  const paginatedRecipes = filteredRecipes.slice(startIndex, startIndex + recipesPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dietFilter, timeFilter, difficultyFilter, priceFilter, ratingFilter, sortKey]);

  const handleAddIngredient = () => {
    if (ingredientInput.trim() === "") return;
    const name = ingredientInput.toLowerCase().trim();
    const emoji = EMOJI_MAP[name] || "🍲";
    if (!addedIngredients.some((a) => sameIngredient(a.name, ingredientInput))) {
      setAddedIngredients([...addedIngredients, { name: ingredientInput.trim(), emoji }]);
    }
    setIngredientInput("");
  };

  const removeIngredient = (index: number) => {
    setAddedIngredients(addedIngredients.filter((_, i) => i !== index));
  };

  // Mode Frigo : on charge TOUT le frigo (produits de l'API + produits locaux)
  // et on pré-sélectionne chaque produit.
  const [fridgeLoading, setFridgeLoading] = useState(false);
  const [fridgeReloadKey, setFridgeReloadKey] = useState(0);
  useEffect(() => {
    if (!useFrigo) {
      setFridgeItems([]);
      return;
    }
    let active = true;
    (async () => {
      setFridgeLoading(true);
      try {
        const inventory = await getFullFridgeInventory();
        if (!active) return;
        const items = inventory.map((ing) => ({
          name: ing.name,
          emoji: ing.emoji || EMOJI_MAP[ing.name.toLowerCase()] || "🍽️",
          selected: true,
        }));
        setFridgeItems(items);
        setAddedIngredients(items.map(({ name, emoji }) => ({ name, emoji })));
      } catch (err) {
        console.error("Erreur lors de la récupération du frigo :", err);
      } finally {
        if (active) setFridgeLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [useFrigo, fridgeReloadKey]);

  if (checking || (loading && recipes.length === 0)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF9F1C" />
        <Text style={{ marginTop: 10, color: "#666" }}>Chargement...</Text>
      </View>
    );
  }

  const toggleFridgeSelection = (index: number) => {
    const target = fridgeItems[index];
    if (!target) return;
    const nowSelected = !target.selected;
    setFridgeItems((prev) => prev.map((fi, i) => (i === index ? { ...fi, selected: nowSelected } : fi)));
    setAddedIngredients((prev) =>
      nowSelected
        ? prev.some((a) => sameIngredient(a.name, target.name))
          ? prev
          : [...prev, { name: target.name, emoji: target.emoji }]
        : prev.filter((a) => !sameIngredient(a.name, target.name)),
    );
  };

  const setAllFridgeSelection = (selected: boolean) => {
    setFridgeItems((prev) => prev.map((fi) => ({ ...fi, selected })));
    setAddedIngredients(selected ? fridgeItems.map(({ name, emoji }) => ({ name, emoji })) : []);
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
      setReloadKey((k) => k + 1);
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

  const renderRecipeItem = ({ item }: { item: RecipeListItem }) => (
    <View
      style={[
        styles.cell,
        { flex: 1, maxWidth: `${100 / numColumns}%` as `${number}%` },
        numColumns === 1 && styles.cellSingle,
      ]}
    >
      <RecipeListCard
        recipe={item}
        isFavorite={favoriteIds.has(item.id)}
        onPress={() => router.push(`/recipe/${item.id}`)}
        onFavorite={() => toggleFavorite(item.id)}
      />
    </View>
  );

  const FilterGroup = ({
    label,
    icon,
    options,
    value,
    onChange,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    options: { key: string; label: string }[];
    value: string | null;
    onChange: (v: string | null) => void;
  }) => (
    <View style={styles.filterGroup}>
      <View style={styles.filterLabelRow}>
        <Ionicons name={icon} size={15} color={palette.primaryDark} />
        <Text style={styles.filterLabel}>{label}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChips}
      >
        {options.map((o) => {
          const on = value === o.key;
          return (
            <TouchableOpacity
              key={o.key}
              style={[styles.fChip, on && styles.fChipOn]}
              onPress={() => onChange(on ? null : o.key)}
            >
              <Text style={[styles.fChipText, on && styles.fChipTextOn]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={palette.primary} barStyle="light-content" />

      {/* HEADER */}
      <ScreenHeader
        title={mode === "ai" ? "Générateur IA" : mode === "mine" ? "Mes recettes" : "Recettes"}
        subtitle={
          mode === "ai"
            ? "Une recette sur mesure en quelques secondes"
            : mode === "mine"
              ? "Ajoute, modifie et supprime tes recettes"
              : "Trouve la recette parfaite pour ton budget"
        }
        scrollY={scrollY}
        collapsible={
          mode === "all" ? (
          <View style={styles.searchRow}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color={palette.primaryDark} style={{ marginRight: 10 }} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Rechercher une recette, un ingrédient…"
                placeholderTextColor={palette.textFaint}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={palette.textFaint} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.filterBtn, (showFilters || activeFilterCount > 0) && styles.filterBtnOn]}
              onPress={() => setShowFilters((v) => !v)}
              accessibilityLabel="Filtres"
            >
              <Ionicons
                name="options-outline"
                size={22}
                color={showFilters || activeFilterCount > 0 ? "#FFF" : palette.primaryDark}
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterCount}>
                  <Text style={styles.filterCountText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          ) : undefined
        }
      >
        <View style={styles.modeTabs}>
          {(
            [
              ["all", "Explorer", "compass-outline"],
              ["ai", width >= 430 ? "Générateur IA" : "Générateur", "sparkles"],
              ["mine", "Mes recettes", "person-outline"],
            ] as const
          ).map(([key, label, icon]) => {
            const on = mode === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.modeTab, on && styles.modeTabOn, key === "ai" && !on && styles.modeTabAi]}
                onPress={() => setMode(key)}
              >
                {width >= 430 && <Ionicons name={icon} size={15} color={on ? palette.primaryDark : "#FFF"} />}
                <Text style={[styles.modeTabText, on && styles.modeTabTextOn]} numberOfLines={1}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScreenHeader>

      {showGenerator ? (
        <ScrollView contentContainerStyle={styles.scrollForm} onScroll={onScroll} scrollEventThrottle={16}>
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

          {/* Bandeau générateur */}
          <LinearGradient
            colors={["#FFB02E", "#FF7A00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiHero}
          >
            <View style={styles.aiHeroIcon}>
              <Ionicons name="sparkles" size={22} color="#FF7A00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiHeroTitle}>Ta recette sur mesure</Text>
              <Text style={styles.aiHeroText}>
                Choisis tes ingrédients (ou ton frigo), tes envies, et l'IA s'occupe du reste.
              </Text>
            </View>
          </LinearGradient>

          {/* Ingrédients */}
          <View style={styles.genCard}>
            <View style={styles.genCardHead}>
              <Text style={styles.genCardTitle}>Ingrédients</Text>
              <TouchableOpacity
                onPress={() => setUseFrigo(!useFrigo)}
                style={[styles.frigoBtn, useFrigo && styles.frigoBtnActive]}
              >
                <Ionicons name="nutrition" size={18} color={useFrigo ? "#4F5612" : "#FFF"} />
                <Text style={[styles.frigoBtnText, useFrigo && styles.frigoBtnTextActive]}>
                  {useFrigo ? "Mode Frigo activé" : "Utiliser mon frigo"}
                </Text>
              </TouchableOpacity>
            </View>

            {useFrigo && (
              <View style={styles.fridgeBox}>
                <View style={styles.fridgeBoxHead}>
                  <Text style={styles.fridgeBoxTitle}>
                    Mon frigo · {fridgeItems.filter((f) => f.selected).length}/{fridgeItems.length} sélectionné
                    {fridgeItems.filter((f) => f.selected).length > 1 ? "s" : ""}
                  </Text>
                  {fridgeItems.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setAllFridgeSelection(!fridgeItems.every((f) => f.selected))}
                    >
                      <Text style={styles.fridgeBoxLink}>
                        {fridgeItems.every((f) => f.selected) ? "Tout désélectionner" : "Tout sélectionner"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {fridgeLoading ? (
                  <ActivityIndicator color="#FF9F1C" style={{ marginVertical: 10 }} />
                ) : fridgeItems.length === 0 ? (
                  <Text style={styles.fridgeEmpty}>
                    Ton frigo est vide. Ajoute des produits dans l'onglet Frigo.
                  </Text>
                ) : (
                  // Zone limitée en hauteur : on fait défiler pour voir la suite
                  <ScrollView
                    style={styles.chipScroll}
                    contentContainerStyle={styles.chipWrap}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {fridgeItems.map((fi, i) => (
                      <TouchableOpacity
                        key={fi.name + i}
                        onPress={() => toggleFridgeSelection(i)}
                        style={[styles.ingChip, fi.selected && styles.ingChipOn]}
                        accessibilityLabel={fi.name}
                      >
                        <Text>{fi.emoji}</Text>
                        {/* Nom long : sur 2 lignes max, puis « … » selon la largeur de l'écran */}
                        <Text
                          style={[styles.ingChipText, fi.selected && styles.ingChipTextOn]}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {fi.name}
                        </Text>
                        <Ionicons
                          name={fi.selected ? "checkmark-circle" : "ellipse-outline"}
                          size={16}
                          color={fi.selected ? "#FF7A00" : "#9AA3AF"}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            <View style={[styles.searchBarContainer, styles.genInput]}>
              <Ionicons name="add" size={20} color="#FF9F1C" style={{ marginRight: 6 }} />
              <TextInput
                placeholder={useFrigo ? "Ajouter un ingrédient en plus…" : "Ajouter un ingrédient…"}
                placeholderTextColor="#9AA3AF"
                style={styles.searchInput}
                value={ingredientInput}
                onChangeText={setIngredientInput}
                onSubmitEditing={handleAddIngredient}
              />
              <TouchableOpacity onPress={handleAddIngredient} disabled={!ingredientInput.trim()}>
                <Ionicons
                  name="add-circle"
                  size={26}
                  color={ingredientInput.trim() ? "#FF9F1C" : "#E5D5BF"}
                />
              </TouchableOpacity>
            </View>

            {addedIngredients.filter((a) => !fridgeItems.some((f) => sameIngredient(f.name, a.name))).length > 0 && (
              <ScrollView
                style={[styles.chipScroll, { marginTop: 10 }]}
                contentContainerStyle={styles.chipWrap}
                nestedScrollEnabled
              >
                {addedIngredients.map((ing, index) =>
                  fridgeItems.some((f) => sameIngredient(f.name, ing.name)) ? null : (
                    <View key={ing.name + index} style={[styles.ingChip, styles.ingChipOn]} accessibilityLabel={ing.name}>
                      <Text>{ing.emoji}</Text>
                      <Text style={[styles.ingChipText, styles.ingChipTextOn]} numberOfLines={2} ellipsizeMode="tail">
                        {ing.name}
                      </Text>
                      <TouchableOpacity onPress={() => removeIngredient(index)} hitSlop={6}>
                        <Ionicons name="close-circle" size={16} color="#FF7A00" />
                      </TouchableOpacity>
                    </View>
                  ),
                )}
              </ScrollView>
            )}
          </View>

          {/* Nombre de personnes */}
          <View style={styles.counterGroup}>
            <Text style={styles.selectorLabel}>Nombre de personnes</Text>
            <View style={styles.counter}>
              <TouchableOpacity onPress={() => setNbPers(Math.max(1, nbPers - 1))}>
                <Ionicons name="remove-circle-outline" size={32} color="#FF9F1C" />
              </TouchableOpacity>
              <Text style={styles.counterText}>{nbPers}</Text>
              <TouchableOpacity onPress={() => setNbPers(nbPers + 1)}>
                <Ionicons name="add-circle-outline" size={32} color="#FF9F1C" />
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
      ) : mode === "mine" ? (
        <MyRecipesView
          onScroll={onScroll}
          recipes={myRecipes}
          loading={loading}
          onOpen={(id) => router.push(`/recipe/${id}`)}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      ) : (
        <>
          {loading && recipes.length === 0 && (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color="#FF9F1C" />
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

          {!(loading && recipes.length === 0) && !error && (
            <View style={{ flex: 1 }}>
              <FlatList
                onScroll={onScroll}
                scrollEventThrottle={16}
                data={paginatedRecipes}
                keyExtractor={(item) => item.id.toString()}
                key={numColumns}
                numColumns={numColumns}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={renderRecipeItem}
                ListHeaderComponent={
                  <View style={styles.listHeader}>
                    {!searchQuery && activeFilterCount === 0 && (
                      <TouchableOpacity activeOpacity={0.92} onPress={() => setMode("ai")} style={styles.aiPromoWrap}>
                        <LinearGradient
                          colors={["transparent", "transparent"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.aiPromo}
                        >
                          <View style={styles.aiPromoIcon}>
                            <Ionicons name="sparkles" size={18} color="#FF9C1A" />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.aiPromoTitle} numberOfLines={1}>
                              Pas d'idée ? Essaie l'IA
                            </Text>
                            <TouchableOpacity
                              onPress={() => {
                                setMode("ai");
                                setUseFrigo(true);
                                setFridgeReloadKey((k) => k + 1);
                              }}
                              hitSlop={6}
                            >
                              <Text style={styles.aiPromoLink}>ou avec mon frigo →</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.aiPromoCta}>
                            <Text style={styles.aiPromoCtaText}>Générer</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    {showFilters && (
                      <View style={styles.filterPanel}>
                        {availableDiets.length > 0 && (
                          <FilterGroup
                            label="Régime"
                            icon="leaf-outline"
                            options={availableDiets.map((d) => ({ key: d, label: d }))}
                            value={dietFilter}
                            onChange={setDietFilter}
                          />
                        )}
                        <FilterGroup
                          label="Temps"
                          icon="time-outline"
                          options={TIME_FILTERS}
                          value={timeFilter}
                          onChange={(v) => setTimeFilter(v as TimeFilter | null)}
                        />
                        <FilterGroup
                          label="Difficulté"
                          icon="flame-outline"
                          options={DIFFICULTY_FILTERS.map((d) => ({ key: d, label: d }))}
                          value={difficultyFilter}
                          onChange={setDifficultyFilter}
                        />
                        <FilterGroup
                          label="Prix moyen"
                          icon="wallet-outline"
                          options={PRICE_BANDS}
                          value={priceFilter}
                          onChange={(v) => setPriceFilter(v as PriceBand | null)}
                        />
                        <FilterGroup
                          label="Avis"
                          icon="star-outline"
                          options={RATING_FILTERS}
                          value={ratingFilter}
                          onChange={(v) => setRatingFilter(v as RatingFilter | null)}
                        />
                        <FilterGroup
                          label="Trier par"
                          icon="swap-vertical-outline"
                          options={SORTS}
                          value={sortKey}
                          onChange={(v) => setSortKey((v as SortKey | null) ?? "default")}
                        />
                      </View>
                    )}
                    <View style={styles.resultRow}>
                      <Text style={styles.resultCount}>
                        {filteredRecipes.length} recette{filteredRecipes.length > 1 ? "s" : ""}
                      </Text>
                      {activeFilterCount > 0 && (
                        <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
                          <Ionicons name="refresh" size={14} color={palette.primaryDark} />
                          <Text style={styles.resetText}>Réinitialiser</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Ionicons name="search-outline" size={56} color="#E5D5BF" />
                    <Text style={styles.emptyTitle}>Aucune recette trouvée</Text>
                    <Text style={styles.emptyText}>
                      Essaie un autre mot-clé ou retire quelques filtres.
                    </Text>
                    {(activeFilterCount > 0 || searchQuery) && (
                      <TouchableOpacity
                        onPress={() => {
                          resetFilters();
                          setSearchQuery("");
                        }}
                        style={styles.emptyBtn}
                      >
                        <Text style={styles.emptyBtnText}>Tout réinitialiser</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
                      color={currentPage === 1 ? "#CCC" : "#FF9F1C"}
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
                      color={currentPage === totalPages ? "#CCC" : "#FF9F1C"}
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
  container: { flex: 1, backgroundColor: "#FFF9F2" },
  header: {
    backgroundColor: "#FF9F1C",
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#FF7A00",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  headerDesktop: { paddingTop: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.4, color: "#FFF", flex: 1, marginRight: 10 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: { padding: 4 },
  generatorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    gap: 6,
  },
  generatorBtnText: { color: palette.primaryDark, fontSize: 13, fontWeight: "800" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modeTabs: { flexDirection: "row", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, padding: 4 },
  modeTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 999 },
  modeTabOn: { backgroundColor: "#FFF" },
  modeTabAi: { backgroundColor: "rgba(26,26,46,0.28)" },
  modeTabText: { color: "#FFF", fontWeight: "800", fontSize: 12.5, letterSpacing: -0.2 },
  modeTabTextOn: { color: palette.primaryDark },
  aiPromoWrap: { borderRadius: 18, marginBottom: 12 },
  aiPromo: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: "#F1E5D5" },
  aiPromoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFF3E6", alignItems: "center", justifyContent: "center" },
  aiPromoTitle: { color: "#1A1A2E", fontSize: 14.5, fontWeight: "800" },
  aiPromoLink: { color: "#FF7A00", fontSize: 12.5, fontWeight: "700", marginTop: 2 },
  aiPromoCta: { backgroundColor: "#FF9C1A", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  aiPromoCtaText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
  aiHero: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 22, padding: 18, marginBottom: 16 },
  aiHeroIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  aiHeroTitle: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  aiHeroText: { color: "rgba(255,255,255,0.95)", fontSize: 13.5, marginTop: 2, lineHeight: 19 },
  genCard: { backgroundColor: "#FFF", borderRadius: 22, padding: 16, marginBottom: 20, ...shadow.soft },
  genCardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  genCardTitle: { fontSize: 17, fontWeight: "800", color: "#1A1A2E" },
  genInput: { flexGrow: 0, flexShrink: 0, flexBasis: "auto", marginTop: 4, backgroundColor: "#FFF7EC", borderWidth: 1, borderColor: "#F1E5D5", shadowOpacity: 0, elevation: 0 },
  fridgeBox: { backgroundColor: "#FFF7EC", borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#F1E5D5" },
  fridgeBoxHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" },
  fridgeBoxTitle: { fontSize: 13.5, fontWeight: "800", color: "#334155" },
  fridgeBoxLink: { fontSize: 13, fontWeight: "800", color: "#FF7A00" },
  fridgeEmpty: { color: "#64748B", fontSize: 13.5 },
  // Puces d'ingrédients : jamais plus larges que la zone (texte sur 2 lignes puis « … »)
  chipScroll: { maxHeight: 220 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", columnGap: 8, rowGap: 8, paddingBottom: 2 },
  ingChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#F1E5D5", maxWidth: "100%" },
  ingChipOn: { backgroundColor: "#FFF3E6", borderColor: "#FF9F1C" },
  ingChipText: { fontSize: 13.5, fontWeight: "600", color: "#64748B", flexShrink: 1, minWidth: 0 },
  ingChipTextOn: { color: "#1A1A2E", fontWeight: "700" },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: "center",
    height: 50,
    ...shadow.soft,
  },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  filterBtnOn: { backgroundColor: palette.ink },
  filterCount: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: palette.primaryDark,
    borderWidth: 2,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  listHeader: { paddingHorizontal: 6, paddingTop: 4 },
  filterPanel: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginBottom: 8,
    gap: 14,
    ...shadow.soft,
  },
  filterGroup: { gap: 8 },
  filterLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16 },
  filterLabel: { fontSize: 13, fontWeight: "800", color: palette.ink },
  filterChips: { gap: 8, paddingHorizontal: 16 },
  fChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
  },
  fChipOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  fChipText: { fontSize: 13, fontWeight: "700", color: palette.textMuted },
  fChipTextOn: { color: "#FFF" },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  resultCount: { fontSize: 13.5, fontWeight: "700", color: palette.textMuted },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.primarySoft,
  },
  resetText: { fontSize: 12.5, fontWeight: "800", color: palette.primaryDark },
  cell: { paddingHorizontal: 6 },
  cellSingle: { maxWidth: 640, alignSelf: "center", width: "100%" },
  emptyBox: { alignItems: "center", paddingTop: 40, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: palette.ink, marginTop: 12 },
  emptyText: { fontSize: 14.5, color: palette.textMuted, textAlign: "center", marginTop: 4 },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: palette.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyBtnText: { color: "#FFF", fontWeight: "800" },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15.5, color: "#1A1A2E" },
  scrollForm: { padding: 20, paddingBottom: 50 },
  selectorContainer: { marginBottom: 20 },
  selectorLabel: { fontSize: 14, fontWeight: "800", color: "#1A1A2E", marginBottom: 10, marginLeft: 5 },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: { backgroundColor: "#FFF", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: "#F1E5D5" },
  chipActive: { backgroundColor: "#FF9F1C", borderColor: "#FF9F1C" },
  chipText: { color: "#666", fontWeight: "600" },
  chipTextActive: { color: "#FFF" },
  row: { flexDirection: "row", alignItems: "center" },
  frigoBtn: {
    flexDirection: "row",
    alignItems: "center",
    // Mode Frigo désactivé : #FF9C1A
    backgroundColor: "#FF9C1A",
    paddingHorizontal: 14,
    height: 38,
    gap: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#FF9C1A",
  },
  // Mode Frigo activé : #E5EA98
  frigoBtnActive: { backgroundColor: "#E5EA98", borderColor: "#C9CF6E" },
  frigoBtnText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
  frigoBtnTextActive: { color: "#4F5612" },
  counterGroup: { marginBottom: 20, alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  counter: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 999, padding: 5, borderWidth: 1, borderColor: "#F1E5D5" },
  counterText: { fontSize: 20, fontWeight: "bold", marginHorizontal: 20, color: "#333" },
  textArea: { backgroundColor: "#FFF", borderRadius: 16, padding: 15, height: 90, textAlignVertical: "top", borderWidth: 1, borderColor: "#F1E5D5" },
  inputGroup: { marginBottom: 20 },
  generateBtn: { marginTop: 10, borderRadius: 999, overflow: "hidden", elevation: 6, shadowColor: "#FF7A00", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 14 },
  gradientBtn: { paddingVertical: 18, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  generateBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  listContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 100, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  listContentDesktop: { paddingHorizontal: 24 },
  columnWrapperDesktop: { marginHorizontal: "3.60%" },
  columnWrapperTablet: { marginHorizontal: "1%" },
  promoCardDesktop: { borderRadius: 20, padding: 20, marginBottom: 20, marginTop: 15, marginHorizontal: "3.60%" },
  promoCard: { borderRadius: 20, padding: 20, marginBottom: 20, marginTop: 15, marginHorizontal: 0 },
  promoTitle: { color: "#FFF", fontWeight: "bold", fontSize: 16, marginLeft: 10 },
  promoDesc: { color: "#FFF", marginTop: 5, lineHeight: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 20, overflow: "hidden", elevation: 3, shadowColor: "#7A4800", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, marginVertical: 8 },
  cardMobile: { width: "100%", marginRight: 0 },
  cardTablet: { width: "48%", marginRight: "2%" },
  cardDesktop: { width: "23.3%", flexGrow: 0, flexShrink: 0, marginRight: "2.2%" },
  cardImage: { width: "100%", height: 190 },
  cardContent: { flex: 1, padding: 16, justifyContent: "space-between" },
  cardFooter: { marginTop: 12, alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.2, color: "#1A1A2E", width: "100%", marginBottom: 4 },
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
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 12, fontWeight: "bold" },
  linkText: { color: "#FF7A00", fontWeight: "800", fontSize: 14 },
  paginationContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#F1E5D5", gap: 10 },
  paginationBtn: { padding: 10, borderRadius: 999, backgroundColor: "#FFF7EC" },
  paginationBtnDisabled: { opacity: 0.5 },
  paginationInfo: { flexDirection: "row", gap: 8, justifyContent: "center", flex: 1 },
  pageBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF7EC", borderWidth: 1, borderColor: "#F1E5D5" },
  pageBtnActive: { backgroundColor: "#FF9F1C", borderColor: "#FF9F1C" },
  pageText: { fontSize: 14, fontWeight: "600", color: "#666" },
  pageTextActive: { color: "#FFF" },
  saveBtn: {
    marginTop: 15,
    backgroundColor: "#FF9F1C",
    paddingVertical: 15,
    borderRadius: 999,
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
  viewRecipeBtn: { backgroundColor: "#FF9F1C", paddingVertical: 13, borderRadius: 999, alignItems: "center" },
  viewRecipeBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  saveErrorText: { color: "#DC2626", marginTop: 8, fontSize: 13, textAlign: "center" },
  closeRecipeBtn: { marginTop: 15, alignSelf: "center", padding: 10, backgroundColor: "#F5F5F5", borderRadius: 8 },
  closeRecipeBtnText: { color: "#666", fontWeight: "bold" },
});