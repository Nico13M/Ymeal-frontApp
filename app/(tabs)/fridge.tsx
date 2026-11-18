import { STORAGE_KEYS } from "@/constants/storage";
import { isForbidden } from "@/src/lib/api";
import { ingredientMatches, normalizeIngredientName, sameIngredient } from "@/src/lib/ingredientName";
import useRequireAuth from "@/src/hooks/useRequireAuth";
import {
  addIngredientToFrigo,
  BackendUnit,
  getAvailableIngredients,
  getFrigoIngredients,
  getUnits,
  removeIngredientFromFrigo,
  createIngredient,
  searchAvailableIngredients,
  updateIngredientQuantity,
  type BackendIngredient
} from "@/src/services/fridge";
import { Ionicons } from "@expo/vector-icons";
import { brandGradient, MAX_CONTENT_WIDTH, palette, radius, shadow } from "@/constants/design";
import { LinearGradient } from "expo-linear-gradient";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

/* ===================== TYPES ===================== */
type Ingredient = {
  id: number | string;
  name: string;
  category: string;
  emoji: string;
  quantity: number;
  unit: BackendUnit | null;
  step: number;
};

type SuggestedIngredient = {
  id: number | null;
  name: string;
  category: string;
  emoji: string;
};

/* ===================== CONFIGURATION PAR DÉFAUT & EXTRACTEURS ===================== */
const DEFAULT_CONFIG = { emoji: "🥗", unit: "g", step: 1, defaultQty: 20 };

// Ingrédients de base utilisables même s'ils ne sont pas encore référencés par l'API.
// Leur identifiant null indique qu'ils seront stockés localement.
// La comparaison avec la saisie et avec l'API ignore la casse, les accents et
// le singulier / pluriel (voir src/lib/ingredientName.ts) : "tomates", "TOMATE",
// "oeufs" ou "Œuf" retrouvent bien l'entrée correspondante.
const LOCAL_STAPLES: SuggestedIngredient[] = [
  // Légumes
  { id: null, name: "Tomate", category: "Légumes", emoji: "🍅" },
  { id: null, name: "Tomate cerise", category: "Légumes", emoji: "🍅" },
  { id: null, name: "Oignon", category: "Légumes", emoji: "🧅" },
  { id: null, name: "Oignon rouge", category: "Légumes", emoji: "🧅" },
  { id: null, name: "Échalote", category: "Légumes", emoji: "🧅" },
  { id: null, name: "Ail", category: "Légumes", emoji: "🧄" },
  { id: null, name: "Carotte", category: "Légumes", emoji: "🥕" },
  { id: null, name: "Pomme de terre", category: "Légumes", emoji: "🥔" },
  { id: null, name: "Patate douce", category: "Légumes", emoji: "🍠" },
  { id: null, name: "Courgette", category: "Légumes", emoji: "🥒" },
  { id: null, name: "Concombre", category: "Légumes", emoji: "🥒" },
  { id: null, name: "Aubergine", category: "Légumes", emoji: "🍆" },
  { id: null, name: "Poivron", category: "Légumes", emoji: "🫑" },
  { id: null, name: "Piment", category: "Légumes", emoji: "🌶️" },
  { id: null, name: "Brocoli", category: "Légumes", emoji: "🥦" },
  { id: null, name: "Chou-fleur", category: "Légumes", emoji: "🥦" },
  { id: null, name: "Chou", category: "Légumes", emoji: "🥬" },
  { id: null, name: "Salade", category: "Légumes", emoji: "🥬" },
  { id: null, name: "Épinards", category: "Légumes", emoji: "🥬" },
  { id: null, name: "Poireau", category: "Légumes", emoji: "🥬" },
  { id: null, name: "Céleri", category: "Légumes", emoji: "🥬" },
  { id: null, name: "Champignon", category: "Légumes", emoji: "🍄" },
  { id: null, name: "Maïs", category: "Légumes", emoji: "🌽" },
  { id: null, name: "Haricots verts", category: "Légumes", emoji: "🌱" },
  { id: null, name: "Petits pois", category: "Légumes", emoji: "🌱" },
  { id: null, name: "Avocat", category: "Légumes", emoji: "🥑" },
  { id: null, name: "Potiron", category: "Légumes", emoji: "🎃" },
  { id: null, name: "Courge butternut", category: "Légumes", emoji: "🎃" },
  { id: null, name: "Radis", category: "Légumes", emoji: "🥕" },
  { id: null, name: "Betterave", category: "Légumes", emoji: "🍠" },
  { id: null, name: "Navet", category: "Légumes", emoji: "🥔" },
  { id: null, name: "Gingembre", category: "Légumes", emoji: "🌿" },
  // Fruits
  { id: null, name: "Pomme", category: "Fruits", emoji: "🍎" },
  { id: null, name: "Poire", category: "Fruits", emoji: "🍐" },
  { id: null, name: "Banane", category: "Fruits", emoji: "🍌" },
  { id: null, name: "Orange", category: "Fruits", emoji: "🍊" },
  { id: null, name: "Clémentine", category: "Fruits", emoji: "🍊" },
  { id: null, name: "Citron", category: "Fruits", emoji: "🍋" },
  { id: null, name: "Citron vert", category: "Fruits", emoji: "🍋" },
  { id: null, name: "Fraise", category: "Fruits", emoji: "🍓" },
  { id: null, name: "Framboise", category: "Fruits", emoji: "🫐" },
  { id: null, name: "Myrtille", category: "Fruits", emoji: "🫐" },
  { id: null, name: "Raisin", category: "Fruits", emoji: "🍇" },
  { id: null, name: "Kiwi", category: "Fruits", emoji: "🥝" },
  { id: null, name: "Ananas", category: "Fruits", emoji: "🍍" },
  { id: null, name: "Mangue", category: "Fruits", emoji: "🥭" },
  { id: null, name: "Pêche", category: "Fruits", emoji: "🍑" },
  { id: null, name: "Abricot", category: "Fruits", emoji: "🍑" },
  { id: null, name: "Cerise", category: "Fruits", emoji: "🍒" },
  { id: null, name: "Melon", category: "Fruits", emoji: "🍈" },
  { id: null, name: "Pastèque", category: "Fruits", emoji: "🍉" },
  { id: null, name: "Noix de coco", category: "Fruits", emoji: "🥥" },
  // Féculents
  { id: null, name: "Pâtes", category: "Féculents", emoji: "🍝" },
  { id: null, name: "Spaghetti", category: "Féculents", emoji: "🍝" },
  { id: null, name: "Riz", category: "Féculents", emoji: "🍚" },
  { id: null, name: "Semoule", category: "Féculents", emoji: "🥣" },
  { id: null, name: "Boulgour", category: "Féculents", emoji: "🥣" },
  { id: null, name: "Quinoa", category: "Féculents", emoji: "🥣" },
  { id: null, name: "Nouilles", category: "Féculents", emoji: "🍜" },
  { id: null, name: "Farine", category: "Féculents", emoji: "🌾" },
  { id: null, name: "Flocons d'avoine", category: "Féculents", emoji: "🥣" },
  { id: null, name: "Pain", category: "Féculents", emoji: "🍞" },
  { id: null, name: "Pain de mie", category: "Féculents", emoji: "🍞" },
  { id: null, name: "Baguette", category: "Féculents", emoji: "🥖" },
  { id: null, name: "Tortilla", category: "Féculents", emoji: "🫓" },
  { id: null, name: "Pâte feuilletée", category: "Féculents", emoji: "🥐" },
  { id: null, name: "Pâte à pizza", category: "Féculents", emoji: "🍕" },
  { id: null, name: "Chapelure", category: "Féculents", emoji: "🍞" },
  // Légumineuses
  { id: null, name: "Lentilles", category: "Légumineuses", emoji: "🫘" },
  { id: null, name: "Pois chiches", category: "Légumineuses", emoji: "🫘" },
  { id: null, name: "Haricots rouges", category: "Légumineuses", emoji: "🫘" },
  { id: null, name: "Haricots blancs", category: "Légumineuses", emoji: "🫘" },
  { id: null, name: "Tofu", category: "Légumineuses", emoji: "🧈" },
  { id: null, name: "Fèves", category: "Légumineuses", emoji: "🌱" },
  // Produits frais
  { id: null, name: "Œufs", category: "Produits frais", emoji: "🥚" },
  { id: null, name: "Lait", category: "Produits frais", emoji: "🥛" },
  { id: null, name: "Beurre", category: "Produits frais", emoji: "🧈" },
  { id: null, name: "Crème fraîche", category: "Produits frais", emoji: "🥛" },
  { id: null, name: "Crème liquide", category: "Produits frais", emoji: "🥛" },
  { id: null, name: "Yaourt", category: "Produits frais", emoji: "🥛" },
  { id: null, name: "Fromage râpé", category: "Produits frais", emoji: "🧀" },
  { id: null, name: "Emmental", category: "Produits frais", emoji: "🧀" },
  { id: null, name: "Mozzarella", category: "Produits frais", emoji: "🧀" },
  { id: null, name: "Parmesan", category: "Produits frais", emoji: "🧀" },
  { id: null, name: "Feta", category: "Produits frais", emoji: "🧀" },
  { id: null, name: "Chèvre", category: "Produits frais", emoji: "🧀" },
  { id: null, name: "Fromage blanc", category: "Produits frais", emoji: "🥛" },
  { id: null, name: "Lait de coco", category: "Produits frais", emoji: "🥥" },
  // Viandes
  { id: null, name: "Poulet", category: "Viandes", emoji: "🍗" },
  { id: null, name: "Blanc de poulet", category: "Viandes", emoji: "🍗" },
  { id: null, name: "Dinde", category: "Viandes", emoji: "🍗" },
  { id: null, name: "Bœuf haché", category: "Viandes", emoji: "🥩" },
  { id: null, name: "Steak", category: "Viandes", emoji: "🥩" },
  { id: null, name: "Porc", category: "Viandes", emoji: "🥓" },
  { id: null, name: "Lardons", category: "Viandes", emoji: "🥓" },
  { id: null, name: "Jambon", category: "Viandes", emoji: "🍖" },
  { id: null, name: "Saucisse", category: "Viandes", emoji: "🌭" },
  { id: null, name: "Chorizo", category: "Viandes", emoji: "🌭" },
  { id: null, name: "Merguez", category: "Viandes", emoji: "🌭" },
  { id: null, name: "Agneau", category: "Viandes", emoji: "🍖" },
  // Poissons
  { id: null, name: "Saumon", category: "Poissons", emoji: "🐟" },
  { id: null, name: "Thon", category: "Poissons", emoji: "🐟" },
  { id: null, name: "Cabillaud", category: "Poissons", emoji: "🐟" },
  { id: null, name: "Colin", category: "Poissons", emoji: "🐟" },
  { id: null, name: "Sardine", category: "Poissons", emoji: "🐟" },
  { id: null, name: "Crevettes", category: "Poissons", emoji: "🦐" },
  { id: null, name: "Surimi", category: "Poissons", emoji: "🦀" },
  { id: null, name: "Moules", category: "Poissons", emoji: "🦪" },
  // Épicerie
  { id: null, name: "Sucre", category: "Épicerie", emoji: "🍬" },
  { id: null, name: "Sucre vanillé", category: "Épicerie", emoji: "🍬" },
  { id: null, name: "Sel", category: "Épicerie", emoji: "🧂" },
  { id: null, name: "Poivre", category: "Épicerie", emoji: "🧂" },
  { id: null, name: "Huile d'olive", category: "Épicerie", emoji: "🫒" },
  { id: null, name: "Huile de tournesol", category: "Épicerie", emoji: "🌻" },
  { id: null, name: "Vinaigre", category: "Épicerie", emoji: "🍶" },
  { id: null, name: "Moutarde", category: "Épicerie", emoji: "🟡" },
  { id: null, name: "Mayonnaise", category: "Épicerie", emoji: "🥚" },
  { id: null, name: "Ketchup", category: "Épicerie", emoji: "🍅" },
  { id: null, name: "Sauce soja", category: "Épicerie", emoji: "🥢" },
  { id: null, name: "Concentré de tomate", category: "Épicerie", emoji: "🥫" },
  { id: null, name: "Coulis de tomate", category: "Épicerie", emoji: "🥫" },
  { id: null, name: "Bouillon cube", category: "Épicerie", emoji: "🧊" },
  { id: null, name: "Levure chimique", category: "Épicerie", emoji: "🧁" },
  { id: null, name: "Chocolat", category: "Épicerie", emoji: "🍫" },
  { id: null, name: "Cacao", category: "Épicerie", emoji: "🍫" },
  { id: null, name: "Miel", category: "Épicerie", emoji: "🍯" },
  { id: null, name: "Confiture", category: "Épicerie", emoji: "🍓" },
  { id: null, name: "Olives", category: "Épicerie", emoji: "🫒" },
  { id: null, name: "Noix", category: "Épicerie", emoji: "🌰" },
  { id: null, name: "Amandes", category: "Épicerie", emoji: "🌰" },
  { id: null, name: "Cacahuètes", category: "Épicerie", emoji: "🥜" },
  { id: null, name: "Maïs en conserve", category: "Épicerie", emoji: "🌽" },
  { id: null, name: "Thon en boîte", category: "Épicerie", emoji: "🥫" },
  // Épices & herbes
  { id: null, name: "Paprika", category: "Épices & herbes", emoji: "🌶️" },
  { id: null, name: "Cumin", category: "Épices & herbes", emoji: "🌿" },
  { id: null, name: "Curry", category: "Épices & herbes", emoji: "🍛" },
  { id: null, name: "Cannelle", category: "Épices & herbes", emoji: "🌿" },
  { id: null, name: "Curcuma", category: "Épices & herbes", emoji: "🌿" },
  { id: null, name: "Muscade", category: "Épices & herbes", emoji: "🌰" },
  { id: null, name: "Herbes de Provence", category: "Épices & herbes", emoji: "🌿" },
  { id: null, name: "Basilic", category: "Épices & herbes", emoji: "🌿" },
  { id: null, name: "Persil", category: "Épices & herbes", emoji: "🌿" },
  { id: null, name: "Coriandre", category: "Épices & herbes", emoji: "🌿" },
  { id: null, name: "Ciboulette", category: "Épices & herbes", emoji: "🌿" },
  { id: null, name: "Menthe", category: "Épices & herbes", emoji: "🌿" },
  { id: null, name: "Thym", category: "Épices & herbes", emoji: "🌿" },
  { id: null, name: "Laurier", category: "Épices & herbes", emoji: "🍃" },
  { id: null, name: "Origan", category: "Épices & herbes", emoji: "🌿" },
];

/* ─── Ancien fonctionnement (désactivé) ─────────────────────────────────────
 * Les ingrédients de base étaient ajoutés aux suggestions et stockés en local.
 * Désormais tout vient de la base de données (API) ; LOCAL_STAPLES ne sert plus
 * que de référence pour deviner la catégorie et l'émoji (voir matchStaple).
 *
 * function mergeWithLocalStaples(items: SuggestedIngredient[]): SuggestedIngredient[] {
 *   const names = new Set(items.map((item) => normalizeIngredientName(item.name)));
 *   return [
 *     ...items,
 *     ...LOCAL_STAPLES.filter((item) => !names.has(normalizeIngredientName(item.name))),
 *   ];
 * }
 */

/**
 * Ingrédient de référence correspondant à un nom de la BDD.
 * Ex. « Lait entier Lactel » contient « Lait » → Produits frais, 🥛.
 * On garde la correspondance la plus longue (« Lait de coco » plutôt que « Lait »).
 */
function matchStaple(name: string): SuggestedIngredient | undefined {
  const words = ` ${normalizeIngredientName(name)} `;
  let best: SuggestedIngredient | undefined;
  let bestLen = 0;
  for (const st of LOCAL_STAPLES) {
    const key = normalizeIngredientName(st.name);
    if (key && words.includes(` ${key} `) && key.length > bestLen) {
      best = st;
      bestLen = key.length;
    }
  }
  return best;
}

/** Suggestion (API ou locale) correspondant à un nom saisi librement. */
function findSuggestion(list: SuggestedIngredient[], name: string): SuggestedIngredient | undefined {
  // Priorité aux ingrédients de l'API (ils ont un identifiant serveur)
  return (
    list.find((s) => s.id !== null && sameIngredient(s.name, name)) ??
    list.find((s) => sameIngredient(s.name, name))
  );
}

function getConfig() {
  return DEFAULT_CONFIG;
}

// Sécurité pour extraire la catégorie textuelle, même si le backend renvoie un objet (ex: { name: 'Légumes' })
function extractCategory(ing: any): string {
  if (!ing) return "Autres";
  // Catégorie déduite du nom (ex. « Lait entier Lactel » → Produits frais)
  const staple = ing.name ? matchStaple(String(ing.name)) : undefined;
  if (staple) return staple.category;
  if (ing.category && typeof ing.category === "object") {
    return ing.category.name || ing.category.title || "Autres";
  }
  return ing.category || "Autres";
}

// Sécurité pour l'émoji (gère les propriétés 'image' ou 'emoji' du backend)
function extractEmoji(ing: any): string {
  if (!ing) return DEFAULT_CONFIG.emoji;
  // Émoji déduit du nom (ex. « Lait entier Lactel » → 🥛)
  const staple = ing.name ? matchStaple(String(ing.name)) : undefined;
  if (staple) return staple.emoji;
  return ing.image || ing.emoji || DEFAULT_CONFIG.emoji;
}

function toSuggested(ing: BackendIngredient): SuggestedIngredient {
  return {
    id: ing.id,
    name: ing.name,
    category: extractCategory(ing),
    emoji: extractEmoji(ing),
  };
}

/* ===================== SCREEN ===================== */

export default function FridgeScreen() {
  const { checking } = useRequireAuth();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<SuggestedIngredient[]>([]);
  const [searchResults, setSearchResults] = useState<SuggestedIngredient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const [units, setUnits] = useState<BackendUnit[]>([]);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<SuggestedIngredient | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Autres");
  const [editQuantity, setEditQuantity] = useState("1");
  const [editUnitId, setEditUnitId] = useState<number | null>(null);
  const [modalValidationError, setModalValidationError] = useState<string | null>(null);
  const [editingExistingId, setEditingExistingId] = useState<number | string | null>(null);

  // Extraction unique des catégories disponibles issues de la base de données
  const dynamicCategories = Array.from(
      new Set(allSuggestions.map((s) => s.category).filter(Boolean))
  );
  const normalizedSearch = search.replace(/\s+/g, "");
  const canSearch = normalizedSearch.length >= 3;

  // Configuration de la grille adaptative (tuiles verticales)
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  // Fenêtre « Voir plus » : tous les ingrédients de la base
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const onScroll = React.useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false }),
    [scrollY],
  );
  const [allQuery, setAllQuery] = useState("");
  const [allCategory, setAllCategory] = useState<string | null>(null);
  const contentWidth = Math.min(screenWidth, MAX_CONTENT_WIDTH);
  const containerPadding = 32;
  const columnGap = 12;
  const numColumns = screenWidth >= 1024 ? 5 : screenWidth >= 768 ? 4 : screenWidth >= 340 ? 2 : 1;
  const itemWidth = Math.floor(
    (contentWidth - containerPadding - columnGap * (numColumns - 1)) / numColumns,
  );

  const persistQuantities = useCallback(async (ings: Ingredient[]) => {
    const qtys: Record<string, { quantity: number; unitId: number | null; step: number; name: string; category: string; emoji: string }> = {};
    ings.forEach((ing) => {
      qtys[String(ing.id)] = {
        quantity: ing.quantity,
        unitId: ing.unit?.id ?? null,
        step: ing.step,
        name: ing.name,
        category: ing.category,
        emoji: ing.emoji,
      };
    });
    await AsyncStorage.setItem(STORAGE_KEYS.frigoIngredients, JSON.stringify(qtys));
  }, []);

  const loadFrigo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [backendIngredients, available, allUnits] = await Promise.all([
        getFrigoIngredients(),
        getAvailableIngredients(),
        getUnits(),
      ]);

      setUnits(allUnits);
      // Uniquement les ingrédients de la BDD (plus de fusion avec les ingrédients locaux)
      setAllSuggestions(available.map(toSuggested));

      const storedQtyRaw = await AsyncStorage.getItem(STORAGE_KEYS.frigoIngredients);
      const storedQty: Record<string, { quantity: number; unitId: number | null; step: number; name?: string; category?: string; emoji?: string }> =
          storedQtyRaw ? JSON.parse(storedQtyRaw) : {};

      const mapped: Ingredient[] = backendIngredients.map((ing) => {
        const config = getConfig();
        const stored = storedQty[String(ing.id)];
        const unit = allUnits.find((u) => u.id === (stored?.unitId ?? ing.unit?.id)) || ing.unit || null;

        return {
          id: ing.id,
          name: ing.name, // Priorité au nom du serveur
          category: extractCategory(ing), // Priorité absolue au serveur pour éviter de bloquer sur "Autres"
          emoji: extractEmoji(ing), // Priorité absolue au serveur pour l'émoji frais
          quantity: stored?.quantity ?? ing.quantity ?? config.defaultQty,
          unit,
          step: stored?.step ?? config.step,
        };
      });

      // Ancien : produits ajoutés uniquement en local (ids « local_… »). Désactivé :
      // le frigo affiche désormais seulement ce qui est enregistré en base.
      // const localItems: Ingredient[] = [];
      // Object.keys(storedQty).forEach((key) => {
      //   if (!backendIngredients.find(b => String(b.id) === key) && key.startsWith("local_")) {
      //     const stored = storedQty[key];
      //     const unit = allUnits.find((u) => u.id === stored.unitId) || null;
      //     localItems.push({
      //       id: key,
      //       name: stored.name || "Produit",
      //       category: stored.category || "Autres",
      //       emoji:
      //         stored.emoji ||
      //         LOCAL_STAPLES.find((st) => sameIngredient(st.name, stored.name || ""))?.emoji ||
      //         "🛒",
      //       quantity: stored.quantity,
      //       unit,
      //       step: stored.step || 1,
      //     });
      //   }
      // });

      setIngredients(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement de l'inventaire du frigo");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
      useCallback(() => { loadFrigo(); }, [loadFrigo])
  );

  useEffect(() => {
    let isActive = true;

    if (!canSearch) {
      setSearchResults([]);
      return () => {
        isActive = false;
      };
    }

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchAvailableIngredients(search);
        if (!isActive) {
          return;
        }
        const backendResults = results.map(toSuggested);
        // const combined = mergeWithLocalStaples(backendResults); // ancien : ajout des ingrédients locaux
        const combined = backendResults;
        setSearchResults(combined.filter((item) => ingredientMatches(item.name, search)));
      } catch (err) {
        if (!isActive) {
          return;
        }
        setSearchResults([]);
        setError(err instanceof Error ? err.message : "Erreur lors de la recherche des ingrédients");
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [canSearch, search]);

  if (checking) {
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#FF9F1C" />
        </SafeAreaView>
    );
  }

  const handleOpenAddModal = () => {
    setEditingExistingId(null);
    setEditingIngredient(null);
    setEditName("");
    setEditCategory("Autres");
    setEditQuantity("1");
    setEditUnitId(null);
    setModalValidationError(null);
    setModalVisible(true);
  };

  const handleEditIngredient = (ing: Ingredient) => {
    setEditingExistingId(ing.id);
    setEditingIngredient(typeof ing.id === 'number' ? { id: ing.id, name: ing.name, category: ing.category, emoji: ing.emoji } : null);
    setEditName(ing.name);
    setEditCategory(ing.category);
    setEditQuantity(ing.quantity.toString());
    setEditUnitId(ing.unit?.id ?? null);
    setModalVisible(true);
  };

  const handleAddIngredient = (item: SuggestedIngredient) => {
    const existing = ingredients.find((i) => sameIngredient(i.name, item.name));
    if (existing) {
      setError("Ce produit est déjà dans votre frigo");
      return;
    }
    setEditingExistingId(null);
    setEditingIngredient(item);
    setModalValidationError(null);
    setEditName(item.name);
    setEditCategory(item.category); // Applique directement la catégorie trouvée dans la base
    setEditQuantity("1");
    setEditUnitId(null);
    setModalVisible(true);
  };

  const handleConfirmAdd = async () => {
    const qty = parseFloat(editQuantity) || 1;
    if (qty <= 0) {
      setModalValidationError("La quantité doit être positive.");
      return;
    }

    let finalName = editName.trim();
    if (!finalName) {
      setModalValidationError("Le nom du produit est obligatoire.");
      return;
    }

    // RECHERCHE INTELLIGENTE : nom saisi à la main → ingrédient de l'API ou de base
    // (insensible à la casse, aux accents et au pluriel : "tomates" → "Tomate")
    const matchingSuggestion = findSuggestion(allSuggestions, finalName);
    if (matchingSuggestion && editingExistingId === null) {
      finalName = matchingSuggestion.name;
    }

    // Doublon : le produit est déjà dans le frigo (hors produit en cours d'édition)
    const duplicate = ingredients.find(
      (i) => i.id !== editingExistingId && sameIngredient(i.name, finalName),
    );
    if (duplicate) {
      setModalValidationError(`« ${duplicate.name} » est déjà dans ton frigo.`);
      return;
    }
    setModalValidationError(null);

    try {
      setSyncing(true);
      setError(null);
      const selectedUnit = editUnitId ? units.find((u) => u.id === editUnitId) || null : null;

      // Détermination des valeurs finales (Priorité à la suggestion backend trouvée)
      let finalCategory = editCategory;
      let finalEmoji = editingIngredient?.emoji || "🛒";
      let targetIngredientId = editingIngredient?.id || null;

      if (matchingSuggestion && !editingIngredient) {
        finalCategory = matchingSuggestion.category;
        finalEmoji = matchingSuggestion.emoji;
        targetIngredientId = matchingSuggestion.id;
      }

      if (editingExistingId !== null) {
        if (typeof editingExistingId === 'number') {
          await updateIngredientQuantity(editingExistingId, qty, editUnitId ?? undefined);
        }

        setIngredients((prev) => {
          const updated = prev.map((i) =>
              i.id === editingExistingId
                  ? { ...i, name: finalName, category: finalCategory, quantity: qty, unit: selectedUnit }
                  : i
          );
          persistQuantities(updated);
          return updated;
        });
      } else {
        // Ancien : let newId = `local_${Date.now()}` → stockage local si absent de la BDD (désactivé)
        let newId: number;

        if (targetIngredientId) {
          await addIngredientToFrigo(Number(targetIngredientId), qty, editUnitId ?? undefined);
          newId = Number(targetIngredientId);
        } else {
          // Ingrédient perso (absent de la liste) : création dans la BDD, puis ajout au frigo
          try {
            const created = await createIngredient({
              name: finalName,
              category: finalCategory,
              image: finalEmoji,
            });
            await addIngredientToFrigo(created.id, qty, editUnitId ?? undefined);
            newId = created.id;
            finalEmoji = extractEmoji(created);
            finalCategory = extractCategory(created);
            setAllSuggestions((prev) => [...prev, toSuggested(created)]);
          } catch (err) {
            if (isForbidden(err)) {
              // 403 : la création d'ingrédients est réservée aux administrateurs
              setModalValidationError(
                "Cet ingrédient n'existe pas encore dans la base, et seuls les administrateurs peuvent en ajouter. Choisis un ingrédient proche dans la liste ou demande à l'équipe YMeal de l'ajouter.",
              );
              return;
            }
            throw err;
          }
        }

        const newIng: Ingredient = {
          id: newId,
          name: finalName,
          category: finalCategory,
          emoji: finalEmoji,
          quantity: qty,
          unit: selectedUnit,
          step: 1,
        };

        const updated = [...ingredients, newIng];
        setIngredients(updated);
        persistQuantities(updated);
      }
      setModalVisible(false);
      setSearch("");
      setEditingExistingId(null);
      setEditingIngredient(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSyncing(false);
    }
  };

  const handleRemoveIngredient = async (id: number | string) => {
    setUpdatingId(id);
    try {
      setError(null);
      if (typeof id === 'number') {
        await removeIngredientFromFrigo(id);
      }
      const updated = ingredients.filter((i) => i.id !== id);
      setIngredients(updated);
      persistQuantities(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setUpdatingId(null);
    }
  };

  // Ingrédients de la base (API + ingrédients de base) pas encore dans le frigo
  const availableToAdd = allSuggestions.filter(
    (s) => !ingredients.find((i) => sameIngredient(i.name, s.name)),
  );
  const QUICK_COUNT = 5;
  const quickSuggestions = availableToAdd.slice(0, QUICK_COUNT);

  const allCategories = Array.from(new Set(availableToAdd.map((s) => s.category || "Autres"))).sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  const allFiltered = availableToAdd.filter(
    (s) =>
      (!allCategory || (s.category || "Autres") === allCategory) &&
      (!allQuery.trim() || ingredientMatches(s.name, allQuery)),
  );
  const allGrouped = allFiltered.reduce<Record<string, SuggestedIngredient[]>>((acc, s) => {
    const cat = s.category || "Autres";
    (acc[cat] = acc[cat] || []).push(s);
    return acc;
  }, {});

  const openAllIngredients = () => {
    setAllQuery("");
    setAllCategory(null);
    setShowAllIngredients(true);
  };

  /** Ingrédient perso (absent de la liste) : ouvre le formulaire d'ajout pré-rempli */
  const addCustomIngredient = (name: string) => {
    setShowAllIngredients(false);
    setTimeout(() => {
      handleOpenAddModal();
      if (name.trim()) setEditName(name.trim().charAt(0).toUpperCase() + name.trim().slice(1));
    }, Platform.OS === "ios" ? 350 : 0);
  };

  const pickFromAll = (item: SuggestedIngredient) => {
    // On ferme d'abord la liste pour éviter deux fenêtres empilées
    setShowAllIngredients(false);
    setTimeout(() => handleAddIngredient(item), Platform.OS === "ios" ? 350 : 0);
  };

    const filteredResults = searchResults.filter(
      (s) => !ingredients.find((i) => sameIngredient(i.name, s.name))
    );

    const isSearching = canSearch;

    const fridgeCategories = Array.from(
      new Set(ingredients.map((i) => i.category || "Autres")),
    ).sort((a, b) => a.localeCompare(b, "fr"));

    const visibleIngredients = categoryFilter && fridgeCategories.includes(categoryFilter)
      ? ingredients.filter((i) => (i.category || "Autres") === categoryFilter)
      : ingredients;

  return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={palette.primary} />
        {/* HEADER (se réduit au défilement : la recherche se replie) */}
        <ScreenHeader
          title="Mon Frigo"
          subtitle="Gère tes produits et évite le gaspillage"
          scrollY={scrollY}
          right={
            <TouchableOpacity
              style={styles.btnAddProduct}
              onPress={openAllIngredients}
              accessibilityLabel="Ajouter un produit"
            >
              <Ionicons name="add" size={34} color={palette.primaryDark} />
            </TouchableOpacity>
          }
          collapsible={
            <View>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Ionicons name="cube-outline" size={15} color="#FFF" />
                <Text style={styles.statText}>
                  {ingredients.length} produit{ingredients.length > 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.statPill}>
                <Ionicons name="pricetags-outline" size={15} color="#FFF" />
                <Text style={styles.statText}>
                  {fridgeCategories.length} catégorie{fridgeCategories.length > 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={19} color={palette.primaryDark} />
              <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Ajouter un produit depuis la base…"
                  placeholderTextColor={palette.textFaint}
                  style={styles.input}
                  editable={!syncing}
              />
              {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={19} color={palette.textFaint} />
                  </TouchableOpacity>
              )}
            </View>

            {/* RÉSULTATS DE LA RECHERCHE */}
            {isSearching && (
                <View style={[styles.searchResults, { maxHeight: screenHeight * 0.4 }]}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {filteredResults.length === 0 ? (
                    <Text style={{ padding: 15, color: palette.textFaint }}>Aucun résultat dans la base</Text>
                    ) : (
                        filteredResults.map((s) => (
                            <TouchableOpacity
                                key={s.id ?? s.name}
                                style={styles.searchItem}
                                onPress={() => handleAddIngredient(s)}
                                disabled={syncing}
                            >
                              <View style={styles.searchEmoji}>
                                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: "700", color: palette.ink }}>{s.name}</Text>
                                {s.category ? (
                                  <Text style={{ fontSize: 12, color: palette.textMuted }}>{s.category}</Text>
                                ) : null}
                              </View>
                              <Ionicons name="add-circle" size={26} color={palette.primary} />
                            </TouchableOpacity>
                        ))
                    )}
                  </ScrollView>
                </View>
            )}
            {!isSearching && search.length > 0 && (
                <Text style={styles.searchHint}>
                  Tape au moins 3 caractères pour lancer la recherche.
                </Text>
            )}
            </View>
          }
        />

        {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={palette.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
        )}

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.bodyInner}>
            {/* SUGGESTIONS */}
            {!isSearching && quickSuggestions.length > 0 && (
                <View style={styles.block}>
                  <Text style={styles.sectionLabel}>Ajout rapide</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 6, paddingHorizontal: 2 }}>
                    {quickSuggestions.map((s) => (
                        <TouchableOpacity
                            key={s.id ?? s.name}
                            style={styles.quickChip}
                            onPress={() => handleAddIngredient(s)}
                            disabled={syncing}
                        >
                          <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
                          <Text style={styles.quickChipText}>{s.name}</Text>
                          <Ionicons name="add" size={16} color={palette.primaryDark} />
                        </TouchableOpacity>
                    ))}
                    {availableToAdd.length > QUICK_COUNT && (
                      <TouchableOpacity
                        style={[styles.quickChip, styles.moreChip]}
                        onPress={openAllIngredients}
                      >
                        <Text style={styles.moreChipText}>Voir plus</Text>
                        <View style={styles.moreCount}>
                          <Text style={styles.moreCountText}>+{availableToAdd.length - QUICK_COUNT}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
            )}

            {/* CTA GÉNÉRATEUR */}
            {!loading && ingredients.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.generateCard}
                onPress={() => router.push({ pathname: "/(tabs)/recipes", params: { generator: "frigo", t: String(Date.now()) } })}
              >
                <View style={styles.generateIcon}>
                  <Ionicons name="sparkles" size={22} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.generateTitle}>Que cuisiner avec ça ?</Text>
                  <Text style={styles.generateSub}>Génère une recette avec les produits de ton frigo</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={palette.primaryDark} />
              </TouchableOpacity>
            )}

            {/* FILTRE CATÉGORIES */}
            {!loading && fridgeCategories.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {[null, ...fridgeCategories].map((c) => {
                  const active = categoryFilter && fridgeCategories.includes(categoryFilter) ? categoryFilter : null;
                  const on = active === c;
                  return (
                    <TouchableOpacity
                      key={c ?? "__all"}
                      style={[styles.catChip, on && styles.catChipOn]}
                      onPress={() => setCategoryFilter(c)}
                    >
                      <Text style={[styles.catChipText, on && styles.catChipTextOn]}>
                        {c ?? "Tout"}
                        {"  "}
                        <Text style={on ? styles.catCountOn : styles.catCount}>
                          {c ? ingredients.filter((i) => (i.category || "Autres") === c).length : ingredients.length}
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {loading && (
                <View style={{ justifyContent: "center", alignItems: "center", width: "100%", marginTop: 40 }}>
                  <ActivityIndicator size="large" color={palette.primary} />
                  <Text style={{ marginTop: 10, color: palette.textMuted }}>Chargement du frigo...</Text>
                </View>
            )}

            {!loading && ingredients.length === 0 && (
                <View style={styles.emptyBox}>
                  <View style={styles.emptyIcon}>
                    <Text style={{ fontSize: 40 }}>🧊</Text>
                  </View>
                  <Text style={styles.emptyTitle}>Ton frigo est vide</Text>
                  <Text style={styles.emptyText}>
                    Ajoute tes produits pour obtenir des recettes adaptées et éviter le gaspillage.
                  </Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={openAllIngredients}>
                    <Ionicons name="add" size={18} color="#FFF" />
                    <Text style={styles.emptyBtnText}>Ajouter un produit</Text>
                  </TouchableOpacity>
                </View>
            )}

            {/* GRILLE DU FRIGO */}
            {!loading && (
              <View style={styles.frigoGridContainer}>
                {visibleIngredients.map((i) => (
                    <View key={i.id} style={[styles.item, { width: itemWidth }]}>
                      <View style={styles.itemTop}>
                        <View style={styles.itemEmoji}>
                          <Text style={{ fontSize: 28 }}>{i.emoji || "🛒"}</Text>
                        </View>
                        <View style={styles.controls}>
                          <TouchableOpacity
                              style={styles.btnEdit}
                              onPress={() => handleEditIngredient(i)}
                              disabled={updatingId !== null}
                              accessibilityLabel={`Modifier ${i.name}`}
                          >
                            <Ionicons name="pencil" size={14} color={palette.primaryDark} />
                          </TouchableOpacity>
                          <TouchableOpacity
                              style={styles.btnDelete}
                              onPress={() => handleRemoveIngredient(i.id)}
                              disabled={updatingId !== null}
                              accessibilityLabel={`Retirer ${i.name}`}
                          >
                            {updatingId === i.id ? (
                                <ActivityIndicator size="small" color={palette.danger} />
                            ) : (
                                <Ionicons name="trash-outline" size={14} color={palette.danger} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={styles.itemName} numberOfLines={1}>{i.name}</Text>
                      <Text style={styles.itemCategory} numberOfLines={1}>{i.category}</Text>
                      <View style={styles.qtyPill}>
                        <Text style={styles.qtyPillText}>
                          {i.quantity} {i.unit?.symbol || i.unit?.name || "unités"}
                        </Text>
                      </View>
                    </View>
                ))}

                {/* Après le 1er ingrédient : tuile « Ajouter un autre ingrédient » */}
                {ingredients.length > 0 && (
                  <TouchableOpacity
                    style={[styles.item, styles.addTile, { width: itemWidth }]}
                    onPress={openAllIngredients}
                    activeOpacity={0.85}
                    accessibilityLabel="Ajouter un autre ingrédient"
                  >
                    <View style={styles.addTileIcon}>
                      <Ionicons name="add" size={30} color="#FFF" />
                    </View>
                    <Text style={styles.addTileText}>Ajouter un autre ingrédient</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* MODAL « VOIR PLUS » : TOUS LES INGRÉDIENTS DE LA BASE */}
        <Modal
            visible={showAllIngredients}
            animationType="slide"
            transparent
            onRequestClose={() => setShowAllIngredients(false)}
        >
          <View style={styles.sheetOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowAllIngredients(false)} />
            <View style={[styles.sheet, { maxHeight: screenHeight * 0.88 }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>Ajouter au frigo</Text>
                  <Text style={styles.sheetSub}>
                    {availableToAdd.length} ingrédient{availableToAdd.length > 1 ? "s" : ""} disponible
                    {availableToAdd.length > 1 ? "s" : ""}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowAllIngredients(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color={palette.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.sheetSearch}>
                <Ionicons name="search" size={18} color={palette.primaryDark} />
                <TextInput
                  value={allQuery}
                  onChangeText={setAllQuery}
                  placeholder="Filtrer (ex : tomates)"
                  placeholderTextColor={palette.textFaint}
                  style={styles.input}
                />
                {allQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setAllQuery("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={palette.textFaint} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.customBtn}
                onPress={() => addCustomIngredient(allFiltered.length === 0 ? allQuery : "")}
              >
                <View style={styles.customIcon}>
                  <Ionicons name="create-outline" size={18} color={palette.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customTitle}>
                    {allQuery.trim() && allFiltered.length === 0
                      ? `Ajouter « ${allQuery.trim()} »`
                      : "Ajouter un ingrédient perso"}
                  </Text>
                  <Text style={styles.customSub}>S'il n'est pas dans la liste</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
              </TouchableOpacity>

              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sheetCats}>
                  {[null, ...allCategories].map((c) => {
                    const on = allCategory === c;
                    return (
                      <TouchableOpacity
                        key={c ?? "__all"}
                        style={[styles.catChip, on && styles.catChipOn]}
                        onPress={() => setAllCategory(c)}
                      >
                        <Text style={[styles.catChipText, on && styles.catChipTextOn]}>{c ?? "Tout"}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
                {Object.keys(allGrouped).length === 0 ? (
                  <Text style={styles.sheetEmpty}>
                    Aucun ingrédient ne correspond. Ajoute-le comme ingrédient perso ci-dessus.
                  </Text>
                ) : (
                  Object.keys(allGrouped)
                    .sort((a, b) => a.localeCompare(b, "fr"))
                    .map((cat) => (
                      <View key={cat} style={{ marginBottom: 14 }}>
                        <Text style={styles.sectionLabel}>{cat}</Text>
                        <View style={styles.sheetGrid}>
                          {allGrouped[cat].map((item) => (
                            <TouchableOpacity
                              key={`${item.id ?? "local"}-${item.name}`}
                              style={styles.quickChip}
                              onPress={() => pickFromAll(item)}
                              disabled={syncing}
                            >
                              <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                              <Text style={styles.quickChipText}>{item.name}</Text>
                              <Ionicons name="add" size={16} color={palette.primaryDark} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MODAL CONFIGURATION PRODUIT */}
        <Modal
            visible={modalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlayCentered}>
            <View style={[styles.modalContentCentered, { maxHeight: screenHeight * 0.85, width: screenWidth > 600 ? 500 : "90%" }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingIngredient?.emoji || "🛒"} {editingExistingId !== null ? "Modifier" : "Ajouter un produit"}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
                  {editingExistingId === null && editName.trim().length > 0 && !findSuggestion(allSuggestions, editName) && (
                    <Text style={styles.newProductWarning}>
                      Ingrédient perso : il sera ajouté à la base de données avant d'aller dans ton frigo.
                    </Text> )}
              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                {modalValidationError ? <Text style={styles.modalValidationError}>{modalValidationError}</Text> : null}
                {/* NOM DU PRODUIT */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nom du produit</Text>
                  <TextInput
                      style={styles.nameInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Ex: Lait, Tomates..."
                      placeholderTextColor="#ADB5BD"
                  />
                </View>

                {/* CATÉGORIE DYNAMIQUE */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Catégorie</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                    {(dynamicCategories.length > 0 ? dynamicCategories : ['Autres']).map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.unitChip, editCategory === cat && styles.unitChipActive]}
                            onPress={() => setEditCategory(cat)}
                        >
                          <Text style={[styles.unitChipText, editCategory === cat && styles.unitChipTextActive]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* QUANTITÉ */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Quantité</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => {
                          const q = parseFloat(editQuantity) || 0;
                          setEditQuantity(Math.max(0, q - 1).toString());
                        }}
                    >
                      <Ionicons name="remove" size={20} color="#666" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.qtyInput}
                        value={editQuantity}
                        onChangeText={setEditQuantity}
                        placeholder="0"
                        keyboardType="decimal-pad"
                    />

                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => {
                          const q = parseFloat(editQuantity) || 0;
                          setEditQuantity((q + 1).toString());
                        }}
                    >
                      <Ionicons name="add" size={20} color="#FF9F1C" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* UNITÉ */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Unité</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                    {units.map((u) => (
                        <TouchableOpacity
                            key={u.id}
                            style={[styles.unitChip, editUnitId === u.id && styles.unitChipActive]}
                            onPress={() => setEditUnitId(u.id)}
                        >
                          <Text style={[styles.unitChipText, editUnitId === u.id && styles.unitChipTextActive]}>
                            {u.symbol || u.name}
                          </Text>
                        </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnConfirm} onPress={handleConfirmAdd} disabled={syncing}>
                  {syncing ? (
                      <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                      <Text style={styles.btnConfirmText}>
                        {editingExistingId !== null ? "Modifier" : "Ajouter"}
                      </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
  );
}

// Le reste des styles reste inchangé...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    zIndex: 10,
  },
  headerHalo: {
    position: "absolute",
    right: -60,
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  headerInner: { width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, color: "#FFF" },
  headerSubtitle: { fontSize: 15, color: "rgba(255,255,255,0.92)", marginTop: 2 },
  // Gros bouton + bien visible (ouvre la liste de tous les ingrédients)
  btnAddProduct: { alignItems: "center", justifyContent: "center", backgroundColor: "#FFF", width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: "rgba(255,255,255,0.55)", ...shadow.lifted },
  btnAddProductText: { color: palette.primaryDark, fontWeight: "800", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 8 },
  statPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: palette.dangerSoft, borderRadius: radius.md, padding: 12, marginHorizontal: 16, marginTop: 12 },
  errorText: { color: palette.danger, fontSize: 13, flex: 1, fontWeight: "600" },
  searchBox: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: 999, paddingHorizontal: 14, height: 42, alignItems: "center", marginTop: 12, gap: 8, ...shadow.soft },
  input: { flex: 1, minWidth: 0, fontSize: 14.5, color: palette.ink, height: "100%" },
  searchHint: { marginTop: 10, color: "rgba(255,255,255,0.95)", fontSize: 13, fontWeight: "600" },
  searchResults: { marginTop: 10, backgroundColor: "#FFF", borderRadius: radius.lg, overflow: "hidden", ...shadow.lifted },
  searchItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: palette.border, gap: 12 },
  searchEmoji: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.surfaceMuted, alignItems: "center", justifyContent: "center" },
  body: { paddingBottom: 40 },
  bodyInner: { width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center", paddingHorizontal: 16, paddingTop: 16 },
  block: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: "800", color: palette.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 },
  quickChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: palette.border, ...shadow.soft },
  customBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    backgroundColor: "#FFF",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  customIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" },
  customTitle: { fontWeight: "800", color: palette.ink, fontSize: 14.5 },
  customSub: { color: palette.textMuted, fontSize: 12.5 },
  quickChipText: { fontWeight: "700", color: palette.ink, fontSize: 14 },
  moreChip: { backgroundColor: palette.primary, borderColor: palette.primary },
  moreChipText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  moreCount: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999 },
  moreCountText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(26,26,46,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 8,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: "#E5D5BF", alignSelf: "center", marginBottom: 10 },
  sheetHead: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: palette.ink },
  sheetSub: { fontSize: 13, color: palette.textMuted, marginTop: 1 },
  sheetSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    height: 46,
  },
  sheetCats: { gap: 8, paddingVertical: 12 },
  sheetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sheetEmpty: { textAlign: "center", color: palette.textMuted, marginTop: 30 },
  generateCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.primarySoft, borderWidth: 1, borderColor: palette.primaryTint, borderRadius: radius.lg, padding: 14, marginBottom: 16 },
  generateIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  generateTitle: { fontSize: 16, fontWeight: "800", color: palette.ink },
  generateSub: { fontSize: 13, color: palette.textMuted, marginTop: 1 },
  catRow: { gap: 8, paddingBottom: 14 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#FFF", borderWidth: 1, borderColor: palette.border },
  catChipOn: { backgroundColor: palette.ink, borderColor: palette.ink },
  catChipText: { fontWeight: "700", color: palette.text, fontSize: 13.5 },
  catChipTextOn: { color: "#FFF" },
  catCount: { color: palette.textFaint, fontWeight: "800" },
  catCountOn: { color: palette.primary, fontWeight: "800" },
  frigoGridContainer: { flexDirection: "row", flexWrap: "wrap", rowGap: 12, columnGap: 12 },
  item: { backgroundColor: "#FFF", padding: 14, borderRadius: radius.lg, ...shadow.soft },
  addTile: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 150,
    backgroundColor: palette.primarySoft,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: palette.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  addTileIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  addTileText: { color: palette.primaryDark, fontWeight: "800", fontSize: 14, textAlign: "center" },
  itemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  itemEmoji: { width: 52, height: 52, borderRadius: 18, backgroundColor: palette.surfaceMuted, alignItems: "center", justifyContent: "center" },
  itemName: { fontWeight: "800", fontSize: 15.5, color: palette.ink },
  itemCategory: { color: palette.textMuted, fontSize: 12.5, marginTop: 1 },
  qtyPill: { alignSelf: "flex-start", marginTop: 10, backgroundColor: palette.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  qtyPillText: { color: palette.primaryDark, fontWeight: "800", fontSize: 13 },
  controls: { flexDirection: "column", gap: 6 },
  btnEdit: { backgroundColor: palette.primarySoft, width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  btnDelete: { backgroundColor: palette.dangerSoft, width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 30, paddingHorizontal: 20 },
  emptyIcon: { width: 86, height: 86, borderRadius: 43, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle: { fontSize: 19, fontWeight: "800", color: palette.ink },
  emptyText: { textAlign: "center", color: palette.textMuted, marginTop: 6, fontSize: 14.5, lineHeight: 21, maxWidth: 340 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, backgroundColor: palette.primary, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 999 },
  emptyBtnText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  modalOverlayCentered: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContentCentered: { backgroundColor: "#FFF8F2", borderRadius: 28, paddingBottom: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, elevation: 10, overflow: 'hidden', alignSelf: 'center' },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#FFEAD9" },
  modalTitle: { fontSize: 19, fontWeight: "800", color: "#1A1A2E" },
  modalBody: { padding: 20 },
  modalValidationError: { color: "#B91C1C", backgroundColor: "#FEE2E2", borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 13, fontWeight: "600" },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 10 },
  nameInput: { borderWidth: 1, borderColor: "#F1E5D5", backgroundColor: "#FFF", borderRadius: 14, padding: 12, fontSize: 15, color: "#333" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E9ECEF", justifyContent: "center", alignItems: "center" },
  qtyInput: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: "#F1E5D5", backgroundColor: "#FFF", borderRadius: 14, padding: 10, fontSize: 16, textAlign: "center" },
  unitScroll: { marginBottom: 5 },
  unitChip: { backgroundColor: "#FFF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#E9ECEF" },
  unitChipActive: { backgroundColor: "#FF9F1C", borderColor: "#FF9F1C" },
  unitChipText: { fontSize: 13, color: "#333", fontWeight: "600" },
  unitChipTextActive: { color: "#FFF" },
  modalFooter: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 10 },
  btnCancel: { flex: 1, paddingVertical: 13, borderRadius: 999, borderWidth: 1, borderColor: "#E0E0E0", backgroundColor: "#FFF", justifyContent: "center", alignItems: "center" },
  btnCancelText: { fontSize: 14, fontWeight: "600", color: "#666" },
  btnConfirm: { flex: 1, paddingVertical: 13, borderRadius: 999, backgroundColor: "#FF9F1C", justifyContent: "center", alignItems: "center" },
  btnConfirmText: { fontSize: 14, fontWeight: "800", color: "#FFF" },
  newProductWarning: {fontSize: 11,color: "#9CA3AF",textAlign: "center",paddingHorizontal: 20,paddingVertical: 8,fontStyle: "italic",borderBottomWidth: 1,borderBottomColor: "#FFEAD9",backgroundColor: "#FFF8F2",
},
});
