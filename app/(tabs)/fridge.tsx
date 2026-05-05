import useRequireAuth from "@/src/hooks/useRequireAuth";
import {
  addIngredientToFrigo,
  BackendUnit,
  getAvailableIngredients,
  getFrigoIngredients,
  getUnits,
  removeIngredientFromFrigo,
  updateIngredientQuantity,
  type BackendIngredient,
} from "@/src/services/fridge";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* ===================== TYPES ===================== */
type Ingredient = {
  id: number;
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

/* ===================== CONFIGURATION DES CATÉGORIES ===================== */
const CATEGORY_CONFIG: Record<string, { emoji: string; unit: string; step: number; defaultQty: number }> = {
  "Légumes":            { emoji: "🥬", unit: "pièce(s)", step: 1,   defaultQty: 1   },
  "Fruits":             { emoji: "🍎", unit: "pièce(s)", step: 1,   defaultQty: 1   },
  "Produits laitiers":  { emoji: "🧀", unit: "g",        step: 1,  defaultQty: 200 },
  "Viandes":            { emoji: "🥩", unit: "g",        step: 1, defaultQty: 250 },
  "Céréales & Féculents": { emoji: "🍞", unit: "g",      step: 1, defaultQty: 500 },
  "Liquides":           { emoji: "💧", unit: "cl",       step: 1,  defaultQty: 100 },
  "Matières grasses":   { emoji: "🧴", unit: "ml",       step: 1,   defaultQty: 50  },
  "Produits sucrés":    { emoji: "🍦", unit: "g",        step: 1,  defaultQty: 100 },
};

const DEFAULT_CONFIG = { emoji: "🥗", unit: "g", step: 1, defaultQty: 20 };

function getConfig(name: string) {
  return CATEGORY_CONFIG[name] ?? DEFAULT_CONFIG;
}

function toSuggested(ing: BackendIngredient): SuggestedIngredient {
  return {
    id: ing.id,
    name: ing.name,
    category: ing.name,
    emoji: getConfig(ing.name).emoji,
  };
}

/* ===================== STORAGE ===================== */
const STORAGE_KEYS = { frigoIngredients: "@ymeal/frigo_ingredients" };

/* ===================== SCREEN ===================== */
export default function FridgeScreen() {
  const { checking } = useRequireAuth();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<SuggestedIngredient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [units, setUnits] = useState<BackendUnit[]>([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<SuggestedIngredient | null>(null);
  const [editQuantity, setEditQuantity] = useState("1");
  const [editUnitId, setEditUnitId] = useState<number | null>(null);
  // null = mode ajout, number = mode édition (id de l'ingrédient existant)
  const [editingExistingId, setEditingExistingId] = useState<number | null>(null);

  // 1.5 PERSISTER LES QUANTITÉS ET UNITÉS
  const persistQuantities = useCallback(async (ings: Ingredient[]) => {
    const qtys: Record<string, { quantity: number; unitId: number | null; step: number }> = {};
    ings.forEach((ing) => {
      qtys[String(ing.id)] = {
        quantity: ing.quantity,
        unitId: ing.unit?.id ?? null,
        step: ing.step,
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
      const storedQty: Record<string, { quantity: number; unitId: number | null; step: number }> =
        storedQtyRaw ? JSON.parse(storedQtyRaw) : {};

      const mapped: Ingredient[] = backendIngredients.map((ing) => {
        const config = getConfig(ing.name);
        const stored = storedQty[String(ing.id)];
        const unit = allUnits.find((u) => u.id === (stored?.unitId ?? ing.unit?.id)) || ing.unit || null;

        return {
          id: ing.id,
          name: ing.name,
          category: ing.name,
          emoji: config.emoji,
          quantity: stored?.quantity ?? ing.quantity ?? config.defaultQty,
          unit,
          step: stored?.step ?? config.step,
        };
      });

      setIngredients(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement du frigo");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { loadFrigo(); }, [loadFrigo])
  );

  // 2. AJUSTER LA QUANTITÉ (avec synchro BDD)
  const updateQuantity = useCallback(
    async (id: number, delta: number) => {
      setUpdatingId(id);
      try {
        setError(null);

        const ingredient = ingredients.find((i) => i.id === id);
        if (!ingredient) return;

        const newQuantity = ingredient.quantity + delta;
        if (newQuantity <= 0) {
          await removeIngredientFromFrigo(id);
          const updated = ingredients.filter((i) => i.id !== id);
          setIngredients(updated);
          persistQuantities(updated);
          return;
        }

        await updateIngredientQuantity(id, newQuantity, ingredient.unit?.id);

        setIngredients((prev) => {
          const updated = prev.map((i) =>
            i.id === id ? { ...i, quantity: newQuantity } : i
          );
          persistQuantities(updated);
          return updated;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
      } finally {
        setUpdatingId(null);
      }
    },
    [ingredients, persistQuantities]
  );

  // ✅ GUARD — après tous les hooks
  if (checking) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF9F1C" />
      </SafeAreaView>
    );
  }

  // OUVRIR LE MODAL EN MODE ÉDITION (ingrédient déjà dans le frigo)
  const handleEditIngredient = (ing: Ingredient) => {
    setEditingExistingId(ing.id);
    setEditingIngredient({ id: ing.id, name: ing.name, category: ing.category, emoji: ing.emoji });
    setEditQuantity(ing.quantity.toString());
    setEditUnitId(ing.unit?.id ?? null);
    setModalVisible(true);
  };

  // 1. OUVRIR LE MODAL POUR AJOUTER UN INGRÉDIENT
  const handleAddIngredient = (item: SuggestedIngredient) => {
    const existing = ingredients.find((i) => i.name.toLowerCase() === item.name.toLowerCase());
    if (existing) {
      setError("Cet ingrédient est déjà dans votre frigo");
      return;
    }
    setEditingExistingId(null);
    setEditingIngredient(item);
    setEditQuantity("1");
    setEditUnitId(null);
    setModalVisible(true);
  };

  // 1.1 CONFIRMER DEPUIS LE MODAL (ajout OU modification)
  const handleConfirmAdd = async () => {
    if (!editingIngredient) return;

    const qty = parseFloat(editQuantity) || 1;
    if (qty <= 0) {
      setError("La quantité doit être positive");
      return;
    }

    try {
      setSyncing(true);
      setError(null);

      if (editingExistingId !== null) {
        // MODE ÉDITION — mettre à jour la quantité et l'unité
        const selectedUnit = editUnitId ? units.find((u) => u.id === editUnitId) || null : null;
        await updateIngredientQuantity(editingExistingId, qty, editUnitId ?? undefined);

        setIngredients((prev) => {
          const updated = prev.map((i) =>
            i.id === editingExistingId
              ? { ...i, quantity: qty, unit: selectedUnit }
              : i
          );
          persistQuantities(updated);
          return updated;
        });
      } else {
        // MODE AJOUT
        await addIngredientToFrigo(editingIngredient.id, qty, editUnitId ?? undefined);

        const config = getConfig(editingIngredient.category);
        const selectedUnit = editUnitId ? units.find((u) => u.id === editUnitId) || null : null;

        const newIng: Ingredient = {
          id: editingIngredient.id,
          name: editingIngredient.name,
          category: editingIngredient.category,
          emoji: editingIngredient.emoji,
          quantity: qty,
          unit: selectedUnit,
          step: config.step,
        };

        const updated = [...ingredients, newIng];
        setIngredients(updated);
        persistQuantities(updated);
      }

      setModalVisible(false);
      setSearch("");
      setEditingExistingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    } finally {
      setSyncing(false);
    }
  };

  // 2.5 SUPPRIMER UN INGRÉDIENT
  const handleRemoveIngredient = async (id: number) => {
    setUpdatingId(id);
    try {
      setError(null);
      await removeIngredientFromFrigo(id);
      const updated = ingredients.filter((i) => i.id !== id);
      setIngredients(updated);
      persistQuantities(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setUpdatingId(null);
    }
  };

  /* ===== FILTRES & GROUPEMENT ===== */
  const quickSuggestions = allSuggestions
    .filter((s) => !ingredients.find((i) => i.name.toLowerCase() === s.name.toLowerCase()))
    .slice(0, 6);

  const filteredResults = allSuggestions.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      !ingredients.find((i) => i.name.toLowerCase() === s.name.toLowerCase())
  );

  const grouped = ingredients.reduce((acc, i) => {
    acc[i.category] = acc[i.category] || [];
    acc[i.category].push(i);
    return acc;
  }, {} as Record<string, Ingredient[]>);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Frigo 🧊</Text>

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
            placeholder="Chercher un ingrédient..."
            style={styles.input}
            editable={!syncing}
          />
        </View>

        {/* SUGGESTIONS */}
        {search.length === 0 && quickSuggestions.length > 0 && (
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

        {/* RESULTATS RECHERCHE */}
        {search.length > 0 && (
          <View style={styles.searchResults}>
            {filteredResults.length === 0 ? (
              <Text style={{ padding: 15, color: "#ADB5BD" }}>Aucun résultat</Text>
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
          </View>
        )}
      </View>

      {/* LISTE DU FRIGO */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading && (
          <View style={{ justifyContent: "center", alignItems: "center", marginTop: 40 }}>
            <ActivityIndicator size="large" color="#FF9F1C" />
            <Text style={{ marginTop: 10, color: "#666" }}>Chargement du frigo...</Text>
          </View>
        )}

        {!loading && Object.keys(grouped).length === 0 && (
          <Text style={styles.emptyText}>Votre frigo est vide.</Text>
        )}

        {!loading &&
          Object.keys(grouped).map((cat) => (
            <View key={cat} style={{ marginBottom: 25 }}>
              <Text style={styles.categoryTitle}>
                {getConfig(cat).emoji} {cat.toUpperCase()}
              </Text>

              {grouped[cat].map((i) => (
                <View key={i.id} style={styles.item}>
                  <Text style={{ fontSize: 26 }}>{i.emoji}</Text>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16 }}>{i.name}</Text>
                    <Text style={{ color: "#FF9F1C", fontWeight: "600" }}>
                      {i.quantity} {i.unit?.symbol || i.unit?.name || ""}
                    </Text>
                  </View>

                  <View style={styles.controls}>
                    <TouchableOpacity
                      style={styles.btnMinus}
                      onPress={() => updateQuantity(i.id, -i.step)}
                      disabled={updatingId !== null}
                    >
                      {updatingId === i.id ? (
                        <ActivityIndicator size="small" color="#666" />
                      ) : (
                        <Ionicons name="remove" size={20} color="#666" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnPlus}
                      onPress={() => updateQuantity(i.id, i.step)}
                      disabled={updatingId !== null}
                    >
                      {updatingId === i.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Ionicons name="add" size={20} color="#FFF" />
                      )}
                    </TouchableOpacity>

                    {/* ✏️ BOUTON MODIFIER */}
                    <TouchableOpacity
                      style={styles.btnEdit}
                      onPress={() => handleEditIngredient(i)}
                      disabled={updatingId !== null}
                    >
                      <Ionicons name="pencil-outline" size={18} color="#FF9F1C" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnDelete}
                      onPress={() => handleRemoveIngredient(i.id)}
                      disabled={updatingId !== null}
                    >
                      {updatingId === i.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>

      {/* MODAL ÉDITION QUANTITÉ & UNITÉ */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIngredient?.emoji} {editingIngredient?.name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.unitScroll}
                >
                  {units.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[
                        styles.unitChip,
                        editUnitId === u.id && styles.unitChipActive,
                      ]}
                      onPress={() => setEditUnitId(u.id)}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          editUnitId === u.id && styles.unitChipTextActive,
                        ]}
                      >
                        {u.symbol || u.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirm}
                onPress={handleConfirmAdd}
                disabled={syncing}
              >
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
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { backgroundColor: "#FFF", padding: 20, borderBottomWidth: 1, borderBottomColor: "#EEE", zIndex: 10 },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: "#FF9F1C", marginBottom: 15 },
  errorBanner: { backgroundColor: "#FEE2E2", borderRadius: 8, padding: 10, marginBottom: 10 },
  errorText: { color: "#DC2626", fontSize: 13 },
  searchBox: { flexDirection: "row", backgroundColor: "#F1F3F5", borderRadius: 12, padding: 12, alignItems: "center" },
  input: { flex: 1, marginLeft: 8, fontSize: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: "#ADB5BD", marginBottom: 10, textTransform: "uppercase" },
  quickChip: { backgroundColor: "#FFF", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, marginRight: 10, borderWidth: 1, borderColor: "#E9ECEF" },
  searchResults: { marginTop: 10, backgroundColor: "#FFF", borderRadius: 12, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 },
  searchItem: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "#F1F3F5", gap: 10 },
  categoryTitle: { fontSize: 14, fontWeight: "800", marginBottom: 12, color: "#495057", letterSpacing: 1 },
  item: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFF",
    padding: 15, borderRadius: 18, marginBottom: 10, gap: 15,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnMinus: { backgroundColor: "#F1F3F5", width: 35, height: 35, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  btnPlus: { backgroundColor: "#FF9F1C", width: 35, height: 35, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  btnEdit: { backgroundColor: "#FFF3E0", width: 35, height: 35, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#FFD580" },
  btnDelete: { width: 35, height: 35, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", color: "#ADB5BD", marginTop: 50, fontSize: 16 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  modalBody: { padding: 20, maxHeight: 300 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 10 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#F1F3F5", justifyContent: "center", alignItems: "center" },
  qtyInput: { flex: 1, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 10, padding: 10, fontSize: 16, textAlign: "center" },
  unitScroll: { marginBottom: 10 },
  unitChip: { backgroundColor: "#F1F3F5", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#E9ECEF" },
  unitChipActive: { backgroundColor: "#FF9F1C", borderColor: "#FF9F1C" },
  unitChipText: { fontSize: 13, color: "#333", fontWeight: "600" },
  unitChipTextActive: { color: "#FFF" },
  modalFooter: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 10 },
  btnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E0E0E0", justifyContent: "center", alignItems: "center" },
  btnCancelText: { fontSize: 14, fontWeight: "600", color: "#666" },
  btnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#FF9F1C", justifyContent: "center", alignItems: "center" },
  btnConfirmText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
});