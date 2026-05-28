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
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ===================== TYPES ===================== */
type Ingredient = {
  id: string | number;
  name: string;
  category: string;
  emoji: string;
  quantity: number;
  unit: string;
  step: number;
};

/* ===================== CONFIGURATION DES CATÉGORIES ===================== */
const CATEGORY_CONFIG: Record<string, { emoji: string; unit: string; step: number; defaultQty: number }> = {
  "Légumes": { emoji: "🥬", unit: "pièce(s)", step: 1, defaultQty: 1 },
  "Fruits": { emoji: "🍎", unit: "pièce(s)", step: 1, defaultQty: 1 },
  "Produits laitiers": { emoji: "🧀", unit: "g", step: 50, defaultQty: 200 },
  "Viandes": { emoji: "🥩", unit: "g", step: 100, defaultQty: 250 },
  "Céréales & Féculents": { emoji: "🍞", unit: "g", step: 100, defaultQty: 500 },
  "Liquides": { emoji: "💧", unit: "cl", step: 10, defaultQty: 100 },
  "Matières grasses": { emoji: "🧴", unit: "ml", step: 5, defaultQty: 50 },
  "Produits sucrés": { emoji: "🍦", unit: "g", step: 50, defaultQty: 100 },
};

const suggestedIngredients = [
  { id: "s1", name: "Lait", category: "Liquides", emoji: "🥛" },
  { id: "s2", name: "Fromage", category: "Produits laitiers", emoji: "🧀" },
  { id: "s3", name: "Oeufs", category: "Produits laitiers", emoji: "🥚" },
  { id: "s4", name: "Riz", category: "Céréales & Féculents", emoji: "🍚" },
  { id: "s5", name: "Pates", category: "Céréales & Féculents", emoji: "🍝" },
  { id: "s6", name: "Poulet", category: "Viandes", emoji: "🍗" },
  { id: "s7", name: "Carottes", category: "Légumes", emoji: "🥕" },
  { id: "s8", name: "Tomates", category: "Légumes", emoji: "🍅" },
];

/* ===================== SCREEN ===================== */

export default function FridgeScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<SuggestedIngredient[]>([]);
  const [searchResults, setSearchResults] = useState<SuggestedIngredient[]>([]);
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight ? useBottomTabBarHeight() : 0;

  // 1. AJOUTER UN INGRÉDIENT
  const handleAddIngredient = (item: any) => {
    const config = CATEGORY_CONFIG[item.category] || { emoji: "❓", unit: "x", step: 1, defaultQty: 1 };
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
      updateQuantity(existing.id, config.step);
    } else {
      const newIng: Ingredient = {
        id: Date.now().toString(),
        name: item.name,
        category: item.category,
        emoji: item.emoji,
        quantity: config.defaultQty,
        unit: config.unit,
        step: config.step,
      };
      setIngredients([...ingredients, newIng]);
    }
    setSearch("");
  };

  // 2. AJUSTER LA QUANTITÉ (Plus ou Moins)
  const updateQuantity = (id: string | number, delta: number) => {
    setIngredients((prev) =>
        prev
            .map((i) =>
                i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
            )
            .filter((i) => i.quantity > 0) // Supprime si la quantité tombe à 0
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

  /* ===== FILTRES & GROUPEMENT ===== */
  const quickSuggestions = suggestedIngredients
      .filter((s) => !ingredients.find((i) => i.name.toLowerCase() === s.name.toLowerCase()))
      .slice(0, 6);

  const filteredResults = suggestedIngredients.filter(
      (s) => s.name.toLowerCase().includes(search.toLowerCase()) &&
          !ingredients.find((i) => i.name.toLowerCase() === s.name.toLowerCase())
  );

  const grouped = ingredients.reduce((acc, i) => {
    acc[i.category] = acc[i.category] || [];
    acc[i.category].push(i);
    return acc;
  }, {} as Record<string, Ingredient[]>);
    const filteredResults = searchResults.filter(
      (s) => !ingredients.find((i) => i.name.toLowerCase() === s.name.toLowerCase())
    );

    const isSearching = canSearch;

  return (
      <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Frigo 🧊</Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Chercher un ingrédient..."
                style={styles.input}
            />
          </View>

          {/* SUGGESTIONS */}
          {!isSearching && quickSuggestions.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.sectionLabel}>Suggestions rapides</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {quickSuggestions.map((s) => (
                      <TouchableOpacity key={s.id} style={styles.quickChip} onPress={() => handleAddIngredient(s)}>
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

        {/* LISTE DU FRIGO */}
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 32 + tabBarHeight + insets.bottom,
          }}
        >
          {Object.keys(grouped).length === 0 && (
              <Text style={styles.emptyText}>Votre frigo est vide.</Text>
          )}

          {Object.keys(grouped).map((cat) => (
              <View key={cat} style={{ marginBottom: 25 }}>
                <Text style={styles.categoryTitle}>
                  {CATEGORY_CONFIG[cat]?.emoji} {cat.toUpperCase()}
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

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "700", fontSize: 16 }}>{i.name}</Text>
                        <Text style={{ color: "#FF9F1C", fontWeight: "600" }}>
                          {i.quantity} {i.unit}
                        </Text>
                      </View>

                      {/* CONTROLES DE QUANTITÉ */}
                      <View style={styles.controls}>
                        <TouchableOpacity
                            style={styles.btnMinus}
                            onPress={() => updateQuantity(i.id, -i.step)}
                        >
                          <Ionicons name="remove" size={20} color="#666" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.btnPlus}
                            onPress={() => updateQuantity(i.id, i.step)}
                        >
                          <Ionicons name="add" size={20} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                ))}
              </View>
          ))}
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { backgroundColor: "#FFF", padding: 20, borderBottomWidth: 1, borderBottomColor: "#EEE", zIndex: 10 },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: "#FF9F1C", marginBottom: 15 },
  searchBox: { flexDirection: "row", backgroundColor: "#F1F3F5", borderRadius: 12, padding: 12, alignItems: "center" },
  input: { flex: 1, marginLeft: 8, fontSize: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: "#ADB5BD", marginBottom: 10, textTransform: "uppercase" },
  quickChip: { backgroundColor: "#FFF", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, marginRight: 10, borderWidth: 1, borderColor: "#E9ECEF" },
  searchResults: { marginTop: 10, backgroundColor: "#FFF", borderRadius: 12, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 },
  searchItem: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "#F1F3F5", gap: 10 },
  categoryTitle: { fontSize: 14, fontWeight: "800", marginBottom: 12, color: "#495057", letterSpacing: 1 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 18,
    marginBottom: 10,
    gap: 15,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnMinus: { backgroundColor: "#F1F3F5", width: 35, height: 35, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  btnPlus: { backgroundColor: "#FF9F1C", width: 35, height: 35, borderRadius: 10, justifyContent: "center", alignItems: "center" },
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
