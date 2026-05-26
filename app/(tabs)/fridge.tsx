
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
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
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight ? useBottomTabBarHeight() : 0;

  // 1. AJOUTER UN INGRÉDIENT
  const handleAddIngredient = (item: any) => {
    const config = CATEGORY_CONFIG[item.category] || { emoji: "❓", unit: "x", step: 1, defaultQty: 1 };

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
          {search.length === 0 && (
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

          {/* RESULTATS RECHERCHE */}
          {search.length > 0 && (
              <View style={styles.searchResults}>
                {filteredResults.map((s) => (
                    <TouchableOpacity key={s.id} style={styles.searchItem} onPress={() => handleAddIngredient(s)}>
                      <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                      <Text style={{ flex: 1, fontWeight: '500' }}>{s.name}</Text>
                      <Ionicons name="add-circle" size={24} color="#FF9F1C" />
                    </TouchableOpacity>
                ))}
              </View>
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

                {grouped[cat].map((i) => (
                    <View key={i.id} style={styles.item}>
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
});