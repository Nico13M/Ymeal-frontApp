import { STORAGE_KEYS } from "@/constants/storage";
import useRequireAuth from "@/src/hooks/useRequireAuth";
import {
  addIngredientToFrigo,
  BackendUnit,
  getAvailableIngredients,
  getFrigoIngredients,
  getUnits,
  removeIngredientFromFrigo,
  searchAvailableIngredients,
  updateIngredientQuantity,
  type BackendIngredient
} from "@/src/services/fridge";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
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
  id: number;
  name: string;
  category: string;
  emoji: string;
};

/* ===================== DICTIONNAIRE DE SECOURS LOCAL ===================== */
// Permet de combler les manques du backend pour les catégories et émojis automatiquement
const LOCAL_FALLBACK_MAP: Record<string, { emoji: string; category: string }> = {
  poulet: { emoji: "🍗", category: "Viandes" },
  boeuf: { emoji: "🥩", category: "Viandes" },
  porc: { emoji: "🥩", category: "Viandes" },
  steak: { emoji: "🥩", category: "Viandes" },
  poisson: { emoji: "🐟", category: "Poissons & Crustacés" },
  saumon: { emoji: "🐟", category: "Poissons & Crustacés" },
  thon: { emoji: "🐟", category: "Poissons & Crustacés" },
  oeuf: { emoji: "🥚", category: "Œufs & Produits Laitiers" },
  oeufs: { emoji: "🥚", category: "Œufs & Produits Laitiers" },
  lait: { emoji: "🥛", category: "Œufs & Produits Laitiers" },
  fromage: { emoji: "🧀", category: "Œufs & Produits Laitiers" },
  beurre: { emoji: "🧈", category: "Œufs & Produits Laitiers" },
  yaourt: { emoji: "🥛", category: "Œufs & Produits Laitiers" },
  crème: { emoji: "🥛", category: "Œufs & Produits Laitiers" },
  creme: { emoji: "🥛", category: "Œufs & Produits Laitiers" },
  carotte: { emoji: "🥕", category: "Fruits & Légumes" },
  carottes: { emoji: "🥕", category: "Fruits & Légumes" },
  tomate: { emoji: "🍅", category: "Fruits & Légumes" },
  tomates: { emoji: "🍅", category: "Fruits & Légumes" },
  oignon: { emoji: "🧅", category: "Fruits & Légumes" },
  oignons: { emoji: "🧅", category: "Fruits & Légumes" },
  ail: { emoji: "🧄", category: "Fruits & Légumes" },
  pomme: { emoji: "🍎", category: "Fruits & Légumes" },
  pommes: { emoji: "🍎", category: "Fruits & Légumes" },
  banane: { emoji: "🍌", category: "Fruits & Légumes" },
  bananes: { emoji: "🍌", category: "Fruits & Légumes" },
  salade: { emoji: "🥬", category: "Fruits & Légumes" },
  courgette: { emoji: "🥒", category: "Fruits & Légumes" },
  courgettes: { emoji: "🥒", category: "Fruits & Légumes" },
  pates: { emoji: "🍝", category: "Épicerie" },
  pâtes: { emoji: "🍝", category: "Épicerie" },
  riz: { emoji: "🍚", category: "Épicerie" },
  farine: { emoji: "🌾", category: "Épicerie" },
  sucre: { emoji: "🍬", category: "Épicerie" },
  sel: { emoji: "🧂", category: "Épicerie" },
  poivre: { emoji: "🧂", category: "Épicerie" },
  huile: { emoji: "🍾", category: "Épicerie" },
};

/* ===================== CONFIGURATION PAR DÉFAUT & EXTRACTEURS ===================== */
const DEFAULT_CONFIG = { emoji: "🥗", unit: "g", step: 1, defaultQty: 20 };

function getConfig() {
  return DEFAULT_CONFIG;
}

// Sécurité pour extraire la catégorie textuelle avec fallback intelligent sur le dictionnaire local
function extractCategory(ing: any): string {
  if (!ing) return "Autres";

  let cat = "Autres";
  if (ing.category) {
    if (typeof ing.category === "object") {
      cat = ing.category.name || ing.category.title || "Autres";
    } else {
      cat = ing.category;
    }
  }

  // Si la catégorie renvoyée est "Autres" ou vide, on vérifie notre dictionnaire local
  if ((cat === "Autres" || !cat) && ing.name) {
    const key = ing.name.toLowerCase().trim();
    if (LOCAL_FALLBACK_MAP[key]) {
      cat = LOCAL_FALLBACK_MAP[key].category;
    }
  }
  return cat;
}

// Sécurité pour l'émoji avec fallback intelligent sur le dictionnaire local
function extractEmoji(ing: any): string {
  if (!ing) return DEFAULT_CONFIG.emoji;

  const backendEmoji = ing.image || ing.emoji;
  if (backendEmoji && backendEmoji !== DEFAULT_CONFIG.emoji) {
    return backendEmoji;
  }

  if (ing.name) {
    const key = ing.name.toLowerCase().trim();
    if (LOCAL_FALLBACK_MAP[key]) {
      return LOCAL_FALLBACK_MAP[key].emoji;
    }
  }
  return backendEmoji || DEFAULT_CONFIG.emoji;
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
  const [editingExistingId, setEditingExistingId] = useState<number | string | null>(null);

  // Extraction unique des catégories disponibles issues de la base de données
  const dynamicCategories = Array.from(
      new Set(allSuggestions.map((s) => s.category).filter(Boolean))
  );
  if (!dynamicCategories.includes("Autres")) {
    dynamicCategories.push("Autres");
  }

  const normalizedSearch = search.replace(/\s+/g, "");
  const canSearch = normalizedSearch.length >= 3;

  // Configuration de la grille adaptative
  const containerPadding = 40;
  const columnGap = 12;

  let numColumns = 1;
  if (screenWidth >= 1024) {
    numColumns = 4;
  } else if (screenWidth >= 768) {
    numColumns = 2;
  } else {
    numColumns = 1;
  }

  const itemWidth = (screenWidth - containerPadding - (columnGap * (numColumns - 1))) / numColumns;

  const persistQuantities = useCallback(async (ings: Ingredient[]) => {
    const qtys: Record<string, { quantity: number; unitId: number | null; step: number; name: string; category: string }> = {};
    ings.forEach((ing) => {
      qtys[String(ing.id)] = {
        quantity: ing.quantity,
        unitId: ing.unit?.id ?? null,
        step: ing.step,
        name: ing.name,
        category: ing.category,
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
      setAllSuggestions(available.map(toSuggested));

      const storedQtyRaw = await AsyncStorage.getItem(STORAGE_KEYS.frigoIngredients);
      const storedQty: Record<string, { quantity: number; unitId: number | null; step: number; name?: string; category?: string }> =
          storedQtyRaw ? JSON.parse(storedQtyRaw) : {};

      const mapped: Ingredient[] = backendIngredients.map((ing) => {
        const config = getConfig();
        const stored = storedQty[String(ing.id)];
        const unit = allUnits.find((u) => u.id === (stored?.unitId ?? ing.unit?.id)) || ing.unit || null;

        return {
          id: ing.id,
          name: ing.name,
          category: extractCategory(ing),
          emoji: extractEmoji(ing),
          quantity: stored?.quantity ?? ing.quantity ?? config.defaultQty,
          unit,
          step: stored?.step ?? config.step,
        };
      });

      const localItems: Ingredient[] = [];
      Object.keys(storedQty).forEach((key) => {
        if (!backendIngredients.find(b => String(b.id) === key) && key.startsWith("local_")) {
          const stored = storedQty[key];
          const unit = allUnits.find((u) => u.id === stored.unitId) || null;
          localItems.push({
            id: key,
            name: stored.name || "Produit",
            category: stored.category || "Autres",
            emoji: LOCAL_FALLBACK_MAP[stored.name?.toLowerCase().trim() || ""]?.emoji || "🛒",
            quantity: stored.quantity,
            unit,
            step: stored.step || 1,
          });
        }
      });

      setIngredients([...mapped, ...localItems]);
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
        if (!isActive) return;
        setSearchResults(results.map(toSuggested));
      } catch (err) {
        if (!isActive) return;
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
    setModalVisible(true);
  };

  const handleEditIngredient = (ing: Ingredient) => {
    setEditingExistingId(ing.id);
    setEditingIngredient(typeof ing.id === 'number' ? { id: ing.id, name: ing.name, category: ing.category, emoji: ing.emoji } : null);
    setEditName(ing.name);
    setEditQuantity(ing.quantity.toString());
    setEditUnitId(ing.unit?.id ?? null);
    // ✅ CORRECTION : Utilisation de 'ing' (le paramètre) et repli sur "Autres" si vide
    setEditCategory(ing.category || "Autres");
    setModalVisible(true);
  };

  const handleAddIngredient = (item: SuggestedIngredient) => {
    const existing = ingredients.find((i) => i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
    if (existing) {
      setError("Ce produit est déjà dans votre frigo");
      return;
    }
    setEditingExistingId(null);
    setEditingIngredient(item);
    setEditName(item.name);
    setEditCategory(item.category || "Autres");
    setEditQuantity("1");
    setEditUnitId(null);
    setModalVisible(true);
  };

  const handleConfirmAdd = async () => {
    const qty = parseFloat(editQuantity) || 1;
    if (qty <= 0) {
      setError("La quantité doit être positive");
      return;
    }

    const finalName = editName.trim();
    if (!finalName) {
      setError("Le nom du produit est obligatoire");
      return;
    }

    const matchingSuggestion = allSuggestions.find(
        (s) => s.name.toLowerCase().trim() === finalName.toLowerCase().trim()
    );

    try {
      setSyncing(true);
      setError(null);
      const selectedUnit = editUnitId ? units.find((u) => u.id === editUnitId) || null : null;

      let finalCategory = editCategory;
      let finalEmoji = editingIngredient?.emoji || LOCAL_FALLBACK_MAP[finalName.toLowerCase().trim()]?.emoji || "🛒";
      let targetIngredientId = editingIngredient?.id || null;

      if (matchingSuggestion && !editingIngredient) {
        finalCategory = matchingSuggestion.category;
        finalEmoji = matchingSuggestion.emoji;
        targetIngredientId = matchingSuggestion.id;
      }

      if (editingExistingId !== null) {
        if (typeof editingExistingId === 'number') {
          await updateIngredientQuantity(editingExistingId, qty, editUnitId ?? undefined, finalCategory);
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
        let newId: string | number = `local_${Date.now()}`;

        if (targetIngredientId) {
          await addIngredientToFrigo(Number(targetIngredientId), qty, editUnitId ?? undefined, finalCategory);
          newId = targetIngredientId;
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

  const filteredResults = searchResults.filter(
      (s) => !ingredients.find((i) => i.name.toLowerCase().trim() === s.name.toLowerCase().trim())
  );

  const isSearching = canSearch;

  return (
      <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <View style={[styles.header, isSearching && styles.selectionStateBg]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.headerTitle}>Mon Frigo</Text>
              <Text style={styles.headerSubtitle}>Gérez vos produits et évitez le gaspillage</Text>
            </View>
            <TouchableOpacity style={styles.btnAddProduct} onPress={handleOpenAddModal}>
              <Ionicons name="add" size={27} color="#FF9F1C" />
            </TouchableOpacity>
          </View>

          {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
          )}

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un produit dans la base..."
                style={styles.input}
                editable={!syncing}
            />
            {isSearching && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
            )}
          </View>

          {/* RÉSULTATS DE LA RECHERCHE */}
          {isSearching && (
              <View style={[styles.searchResults, { maxHeight: screenHeight * 0.4 }]}>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {filteredResults.length === 0 ? (
                      <Text style={{ padding: 15, color: "#ADB5BD" }}>Aucun résultat dans la base</Text>
                  ) : (
                      filteredResults.map((s) => (
                          <TouchableOpacity
                              key={s.id}
                              style={styles.searchItem}
                              onPress={() => handleAddIngredient(s)}
                              disabled={syncing}
                          >
                            <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                            <Text style={{ flex: 1, fontWeight: "500" }}>{s.name}</Text>
                            <Ionicons name="add-circle" size={24} color="#FF9F1C" />
                          </TouchableOpacity>
                      ))
                  )}
                </ScrollView>
              </View>
          )}
          {!isSearching && search.length > 0 && (
              <Text style={{ marginTop: 10, color: "#ADB5BD", fontSize: 13 }}>
                Tapez au moins 3 caractères sans compter les espaces pour lancer la recherche.
              </Text>
          )}
        </View>

        {/* GRILLE DU FRIGO */}
        <ScrollView contentContainerStyle={styles.frigoGridContainer}>
          {loading && (
              <View style={{ justifyContent: "center", alignItems: "center", width: "100%", marginTop: 40 }}>
                <ActivityIndicator size="large" color="#FF9F1C" />
                <Text style={{ marginTop: 10, color: "#666" }}>Chargement du frigo...</Text>
              </View>
          )}

          {!loading && ingredients.length === 0 && (
              <Text style={[styles.emptyText, { width: "100%" }]}>Votre frigo est vide.</Text>
          )}

          {!loading &&
              ingredients.map((i) => (
                  <View key={i.id} style={[styles.item, { width: itemWidth }]}>
                    <Text style={{ fontSize: 26, marginRight: 4 }}>{i.emoji || "🛒"}</Text>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", fontSize: 15, color: "#1F2937" }}>
                        {i.name}
                      </Text>
                      <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 1 }}>
                        {i.category}
                      </Text>
                      <Text style={{ color: "#FF9F1C", fontWeight: "600", fontSize: 13, marginTop: 2 }}>
                        {i.quantity} {i.unit?.symbol || i.unit?.name || "unités"}
                      </Text>
                    </View>

                    {/* ACTIONS */}
                    <View style={styles.controls}>
                      <TouchableOpacity
                          style={styles.btnEdit}
                          onPress={() => handleEditIngredient(i)}
                          disabled={updatingId !== null}
                      >
                        <Ionicons name="pencil-outline" size={16} color="#FF9F1C" />
                      </TouchableOpacity>

                      <TouchableOpacity
                          style={styles.btnDelete}
                          onPress={() => handleRemoveIngredient(i.id)}
                          disabled={updatingId !== null}
                      >
                        {updatingId === i.id ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                            <Ionicons name="trash-outline" size={16} color="#DC2626" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
              ))}
        </ScrollView>

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
                  {editingIngredient?.emoji || LOCAL_FALLBACK_MAP[editName.toLowerCase().trim()]?.emoji || "🛒"} {editingExistingId !== null ? "Modifier" : "Ajouter un produit"}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              {editingExistingId === null && (
                  <Text style={styles.newProductWarning}>
                    ⚠️ Ce produit ne sera pas utilisé dans la génération de recettes par IA.
                  </Text> )}
              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                {/* NOM DU PRODUIT */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nom du produit</Text>
                  <TextInput
                      style={styles.nameInput}
                      value={editName}
                      onChangeText={(txt) => {
                        setEditName(txt);
                        // Changement dynamique optionnel de la catégorie si correspondance trouvée en tapant
                        const key = txt.toLowerCase().trim();
                        if (LOCAL_FALLBACK_MAP[key] && editingExistingId === null) {
                          setEditCategory(LOCAL_FALLBACK_MAP[key].category);
                        }
                      }}
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
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F2",
  },
  header: {
    backgroundColor: "#FF9F1C",
    padding: 20,
    paddingTop: 80,
    marginTop: -60,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    zIndex: 10,
    shadowColor: "#D97706",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  selectionStateBg: {
    backgroundColor: "#F4A62D",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  btnAddProduct: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 35,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  btnAddProductText: {
    color: "#FF9F1C",
    fontWeight: "700",
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: "rgba(127,29,29,0.15)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(254,202,202,0.7)",
  },
  errorText: {
    color: "#FEE2E2",
    fontSize: 13,
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#1A1A2E",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.88)",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  quickChip: {
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#FCD9A8",
  },
  searchResults: {
    marginTop: 10,
    backgroundColor: "#FFF",
    borderRadius: 14,
    elevation: 6,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowColor: "#000",
    borderWidth: 1,
    borderColor: "#FFE4C4",
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
    gap: 10,
  },
  frigoGridContainer: {
    padding: 18,
    paddingTop: 20,
    paddingBottom: 40,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
    columnGap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FDE7CC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnEdit: {
    backgroundColor: "#FFF3E0",
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFD8A8",
  },
  btnDelete: {
    backgroundColor: "#FEE2E2",
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 50,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.38)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentCentered: {
    backgroundColor: "#FFF9F2",
    borderRadius: 24,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#FFE6C8",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE7CF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 10,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#EAD7C0",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#1F2937",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F0E1CE",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#EAD7C0",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
    textAlign: "center",
  },
  unitScroll: {
    marginBottom: 5,
  },
  unitChip: {
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#EFDCC3",
  },
  unitChipActive: {
    backgroundColor: "#FF9F1C",
    borderColor: "#FF9F1C",
  },
  unitChipText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
  },
  unitChipTextActive: {
    color: "#FFF",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAD7C0",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FF9F1C",
    justifyContent: "center",
    alignItems: "center",
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  newProductWarning: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    fontStyle: "italic",
    borderBottomWidth: 1,
    borderBottomColor: "#FFE7CF",
    backgroundColor: "#FFF4E5",
  },
});