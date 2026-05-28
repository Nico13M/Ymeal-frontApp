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

/* ===================== CONFIGURATION PAR DÉFAUT & EXTRACTEURS ===================== */
const DEFAULT_CONFIG = { emoji: "🥗", unit: "g", step: 1, defaultQty: 20 };

function getConfig() {
  return DEFAULT_CONFIG;
}

// Sécurité pour extraire la catégorie textuelle, même si le backend renvoie un objet (ex: { name: 'Légumes' })
function extractCategory(ing: any): string {
  if (!ing) return "Autres";
  if (ing.category && typeof ing.category === "object") {
    return ing.category.name || ing.category.title || "Autres";
  }
  return ing.category || "Autres";
}

// Sécurité pour l'émoji (gère les propriétés 'image' ou 'emoji' du backend)
function extractEmoji(ing: any): string {
  if (!ing) return DEFAULT_CONFIG.emoji;
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
  const [editingExistingId, setEditingExistingId] = useState<number | string | null>(null);

  // Extraction unique des catégories disponibles issues de la base de données
  const dynamicCategories = Array.from(
      new Set(allSuggestions.map((s) => s.category).filter(Boolean))
  );
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
          name: ing.name, // Priorité au nom du serveur
          category: extractCategory(ing), // Priorité absolue au serveur pour éviter de bloquer sur "Autres"
          emoji: extractEmoji(ing), // Priorité absolue au serveur pour l'émoji frais
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
            emoji: "🛒",
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
        if (!isActive) {
          return;
        }
        setSearchResults(results.map(toSuggested));
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
    const existing = ingredients.find((i) => i.name.toLowerCase() === item.name.toLowerCase());
    if (existing) {
      setError("Ce produit est déjà dans votre frigo");
      return;
    }
    setEditingExistingId(null);
    setEditingIngredient(item);
    setEditName(item.name);
    setEditCategory(item.category); // Applique directement la catégorie trouvée dans la base
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

    // RECHERCHE INTELLIGENTE : Si l'utilisateur a tapé à la main un nom existant dans le backend
    const matchingSuggestion = allSuggestions.find(
        (s) => s.name.toLowerCase() === finalName.toLowerCase()
    );

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
        let newId: string | number = `local_${Date.now()}`;

        if (targetIngredientId) {
          await addIngredientToFrigo(Number(targetIngredientId), qty, editUnitId ?? undefined);
          newId = targetIngredientId;
        // } else {
        //   try {
        //     const created = await createIngredient({
        //       name: finalName,
        //       category: finalCategory,
        //       image: finalEmoji,
        //     });
        //     // Puis on l'ajoute au frigo
        //     await addIngredientToFrigo(created.id, qty, editUnitId ?? undefined);
        //     newId = created.id;
        //     finalEmoji = extractEmoji(created);
        //     finalCategory = extractCategory(created);

        //     // Mettre à jour les suggestions locales pour éviter les doublons futurs
        //     setAllSuggestions((prev) => [...prev, toSuggested(created)]);
        //   } catch (err) {
        //     // Fallback local si la création backend échoue
        //     console.warn("[FRIGO] Création backend échouée, stockage local uniquement", err);
        //   }
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

  const quickSuggestions = allSuggestions
      .filter((s) => !ingredients.find((i) => i.name.toLowerCase() === s.name.toLowerCase()))
      .slice(0, 6);

    const filteredResults = searchResults.filter(
      (s) => !ingredients.find((i) => i.name.toLowerCase() === s.name.toLowerCase())
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
              <Ionicons name="add" size={20} color="#FFF" />
              {screenWidth > 350 && <Text style={styles.btnAddProductText}>Ajouter un produit</Text>}
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

          {/* SUGGESTIONS */}
          {!isSearching && quickSuggestions.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.sectionLabel}>Suggestions rapides</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {quickSuggestions.map((s) => (
                      <TouchableOpacity
                          key={s.id}
                          style={styles.quickChip}
                          onPress={() => handleAddIngredient(s)}
                          disabled={syncing}
                      >
                        <Text>{s.emoji} {s.name}</Text>
                      </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
          )}

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
                  {editingIngredient?.emoji || "🛒"} {editingExistingId !== null ? "Modifier" : "Ajouter un produit"}
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
      </SafeAreaView>
  );
}

// Le reste des styles reste inchangé...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { backgroundColor: "#FFF", padding: 20, borderBottomWidth: 1, borderBottomColor: "#EEE", zIndex: 10 },
  selectionStateBg: { backgroundColor: "#FFF8F2", borderBottomColor: "#FFEAD9" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: "#1F2937" },
  headerSubtitle: { fontSize: 13, color: "#4B5563", marginTop: 4 },
  btnAddProduct: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFB347", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, gap: 6, shadowColor: "#FFB347", shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  btnAddProductText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  errorBanner: { backgroundColor: "#FEE2E2", borderRadius: 8, padding: 10, marginBottom: 10 },
  errorText: { color: "#DC2626", fontSize: 13 },
  searchBox: { flexDirection: "row", backgroundColor: "#F1F3F5", borderRadius: 12, padding: 12, alignItems: "center" },
  input: { flex: 1, marginLeft: 8, fontSize: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: "#ADB5BD", marginBottom: 10, textTransform: "uppercase" },
  quickChip: { backgroundColor: "#FFF", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, marginRight: 10, borderWidth: 1, borderColor: "#E9ECEF" },
  searchResults: { marginTop: 10, backgroundColor: "#FFF", borderRadius: 12, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: "#FFEAD9" },
  searchItem: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "#F1F3F5", gap: 10 },
  frigoGridContainer: { padding: 20, paddingBottom: 40, flexDirection: "row", flexWrap: "wrap", rowGap: 12, columnGap: 12 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 14, borderRadius: 16, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  controls: { flexDirection: "row", alignItems: "center", gap: 12 },
  btnEdit: { backgroundColor: "#FFF3E0", width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#FFD580" },
  btnDelete: { backgroundColor: "#FEE2E2", width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", color: "#ADB5BD", marginTop: 50, fontSize: 16 },
  modalOverlayCentered: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContentCentered: { backgroundColor: "#FFF8F2", borderRadius: 24, paddingBottom: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, elevation: 10, overflow: 'hidden', alignSelf: 'center' },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#FFEAD9" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  modalBody: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 10 },
  nameInput: { borderWidth: 1, borderColor: "#E0E0E0", backgroundColor: "#FFF", borderRadius: 10, padding: 12, fontSize: 15, color: "#333" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E9ECEF", justifyContent: "center", alignItems: "center" },
  qtyInput: { flex: 1, borderWidth: 1, borderColor: "#E0E0E0", backgroundColor: "#FFF", borderRadius: 10, padding: 10, fontSize: 16, textAlign: "center" },
  unitScroll: { marginBottom: 5 },
  unitChip: { backgroundColor: "#FFF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#E9ECEF" },
  unitChipActive: { backgroundColor: "#FF9F1C", borderColor: "#FF9F1C" },
  unitChipText: { fontSize: 13, color: "#333", fontWeight: "600" },
  unitChipTextActive: { color: "#FFF" },
  modalFooter: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 10 },
  btnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E0E0E0", backgroundColor: "#FFF", justifyContent: "center", alignItems: "center" },
  btnCancelText: { fontSize: 14, fontWeight: "600", color: "#666" },
  btnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#FFB347", justifyContent: "center", alignItems: "center" },
  btnConfirmText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  newProductWarning: {fontSize: 11,color: "#9CA3AF",textAlign: "center",paddingHorizontal: 20,paddingVertical: 8,fontStyle: "italic",borderBottomWidth: 1,borderBottomColor: "#FFEAD9",backgroundColor: "#FFF8F2",
},
});
