import useRequireAuth from "@/src/hooks/useRequireAuth";
import { addIngredientToFrigo, getFrigoIngredients, removeIngredientFromFrigo } from "@/src/services/fridge";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
const STORAGE_KEYS = {
  frigoIngredients: "@ymeal/frigo_ingredients",
};

export default function FridgeScreen() {
  const { checking } = useRequireAuth();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // 1.5 PERSISTER LES QUANTITÉS
  const persistQuantities = useCallback(async (ings: Ingredient[]) => {
    const qtys: Record<string, { quantity: number; unit: string; step: number }> = {};
    ings.forEach((ing) => {
      qtys[String(ing.id)] = { quantity: ing.quantity, unit: ing.unit, step: ing.step };
    });
    await AsyncStorage.setItem(STORAGE_KEYS.frigoIngredients, JSON.stringify(qtys));
  }, []);

  const loadFrigo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const backendIngredients = await getFrigoIngredients();

      const storedQtyRaw = await AsyncStorage.getItem(STORAGE_KEYS.frigoIngredients);
      const storedQty: Record<string, { quantity: number; unit: string; step: number }> =
        storedQtyRaw ? JSON.parse(storedQtyRaw) : {};

      const mapped: Ingredient[] = backendIngredients.map((ing) => {
        const config = CATEGORY_CONFIG[ing.name] || { emoji: "❓", unit: "x", step: 1, defaultQty: 1 };
        const stored = storedQty[String(ing.id)];

        return {
          id: ing.id,
          name: ing.name,
          category: ing.name,
          emoji: config.emoji,
          quantity: stored?.quantity ?? config.defaultQty,
          unit: stored?.unit ?? config.unit,
          step: stored?.step ?? config.step,
        };
      });

      setIngredients(mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors du chargement du frigo";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFrigo();
    }, [loadFrigo])
  );

  // 2. AJUSTER LA QUANTITÉ (Plus ou Moins)
  const updateQuantity = useCallback(
    (id: string | number, delta: number) => {
      setIngredients((prev) => {
        const updated = prev
          .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
          .filter((i) => i.quantity > 0);
        persistQuantities(updated);
        return updated;
      });
    },
    [persistQuantities]
  );

  // ✅ GUARD CHECKING — après tous les hooks
  if (checking) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF9F1C" />
      </SafeAreaView>
    );
  }

  // 1. AJOUTER UN INGRÉDIENT
  const handleAddIngredient = async (item: any) => {
    const config = CATEGORY_CONFIG[item.category] || { emoji: "❓", unit: "x", step: 1, defaultQty: 1 };
    const existing = ingredients.find((i) => i.name.toLowerCase() === item.name.toLowerCase());

    if (existing) {
      updateQuantity(existing.id, config.step);
    } else {
      try {
        setSyncing(true);
        await addIngredientToFrigo(item.id);

        const newIng: Ingredient = {
          id: item.id,
          name: item.name,
          category: item.category,
          emoji: item.emoji,
          quantity: config.defaultQty,
          unit: config.unit,
          step: config.step,
        };

        const updated = [...ingredients, newIng];
        setIngredients(updated);
        persistQuantities(updated);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur lors de l'ajout";
        setError(msg);
      } finally {
        setSyncing(false);
      }
    }
    setSearch("");
  };

  // 2.5 SUPPRIMER UN INGRÉDIENT
  const handleRemoveIngredient = async (id: string | number) => {
    try {
      setSyncing(true);
      await removeIngredientFromFrigo(id);

      const updated = ingredients.filter((i) => i.id !== id);
      setIngredients(updated);
      persistQuantities(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression";
      setError(msg);
    } finally {
      setSyncing(false);
    }
  };

  /* ===== FILTRES & GROUPEMENT ===== */
  const quickSuggestions = suggestedIngredients
    .filter((s) => !ingredients.find((i) => i.name.toLowerCase() === s.name.toLowerCase()))
    .slice(0, 6);

  const filteredResults = suggestedIngredients.filter(
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
        {search.length === 0 && (
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
            {filteredResults.map((s) => (
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
            ))}
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
                {CATEGORY_CONFIG[cat]?.emoji} {cat.toUpperCase()}
              </Text>

              {grouped[cat].map((i) => (
                <View key={String(i.id)} style={styles.item}>
                  <Text style={{ fontSize: 26 }}>{i.emoji}</Text>

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
                      disabled={syncing}
                    >
                      <Ionicons name="remove" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnPlus}
                      onPress={() => updateQuantity(i.id, i.step)}
                      disabled={syncing}
                    >
                      <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnDelete}
                      onPress={() => handleRemoveIngredient(i.id)}
                      disabled={syncing}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 18,
    marginBottom: 10,
    gap: 15,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnMinus: { backgroundColor: "#F1F3F5", width: 35, height: 35, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  btnPlus: { backgroundColor: "#FF9F1C", width: 35, height: 35, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  btnDelete: { width: 35, height: 35, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", color: "#ADB5BD", marginTop: 50, fontSize: 16 },
});