import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ===================== TYPES ===================== */

type Ingredient = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  quantity: number; // stocké en base (g / ml / unités)
  format: string;
};

/* ===================== CONSTANTES ===================== */

const CATEGORIES = [
  { key: "Légumes", emoji: "🥬", defaultFormat: "Nombre" },
  { key: "Fruits", emoji: "🍎", defaultFormat: "Nombre" },
  { key: "Produits laitiers", emoji: "🧀", defaultFormat: "Grammes" },
  { key: "Viandes", emoji: "🥩", defaultFormat: "Grammes" },
  { key: "Céréales & Féculents", emoji: "🍞", defaultFormat: "Grammes" },
  { key: "Liquides", emoji: "💧", defaultFormat: "Millilitres" },
  { key: "Matières grasses", emoji: "🧴", defaultFormat: "Millilitres" },
  { key: "Produits sucrés ", emoji: "🍦", defaultFormat: "Grammes" },
];

const suggestedIngredients = [
  { id: "1", name: "Lait", category: "Liquides", emoji: "🥛" },
  { id: "2", name: "Fromage", category: "Produits laitiers", emoji: "🧀" },
  { id: "3", name: "Oeufs", category: "Produits laitiers", emoji: "🥚" },
  { id: "4", name: "Riz", category: "Céréales & Féculents", emoji: "🍚" },
  { id: "5", name: "Pates", category: "Céréales & Féculents", emoji: "🍝" },
  { id: "6", name: "Poulet", category: "Viandes", emoji: "🍗" },
  { id: "7", name: "Carottes", category: "Légumes", emoji: "🥕" },
  { id: "8", name: "Tomates", category: "Légumes", emoji: "🍅" },
  { id: "9", name: "Huile d'olive", category: "Matières grasses", emoji: "🫒" },
];

/* ===================== HELPERS ===================== */

const getCategory = (key: string) =>
  CATEGORIES.find((c) => c.key === key);

const convertToBase = (q: number, format: string) => {
  if (format === "Kilogrammes") return q * 1000;
  if (format === "Centilitres") return q * 10;
  return q;
};

const displayQuantity = (q: number, format: string) => {
  if (format === "Grammes") return `${q} g`;
  if (format === "Millilitres") return `${q} ml`;
  if (format === "Centilitres") return `${q / 10} cl`;
  if (format === "Kilogrammes") return `${(q / 1000).toFixed(2)} kg`;
  return `${q} x`;
};

const getStep = (format: string) => {
  if (format === "Nombre") return 1;
  if (format === "Centilitres") return 10;
  if (format === "Kilogrammes") return 100;
  return 100;
};

/* ===================== SCREEN ===================== */

export default function FridgeScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");

  /* ===== LOAD / SAVE ===== */

  useEffect(() => {
    AsyncStorage.getItem("fridgeIngredients").then((data) => {
      if (data) setIngredients(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      "fridgeIngredients",
      JSON.stringify(ingredients)
    );
  }, [ingredients]);

  /* ===== LOGIC ===== */

  const addIngredient = (sug: any) => {
    const cat = getCategory(sug.category);
    const baseQty = convertToBase(
      cat?.defaultFormat === "Nombre" ? 1 : 200,
      cat?.defaultFormat || "Nombre"
    );

    const existing = ingredients.find(
      (i) => i.name.toLowerCase() === sug.name.toLowerCase()
    );

    if (existing) {
      existing.quantity += baseQty;
      setIngredients([...ingredients]);
    } else {
      setIngredients([
        ...ingredients,
        {
          id: Date.now().toString(),
          name: sug.name,
          category: sug.category,
          emoji: sug.emoji,
          quantity: baseQty,
          format: cat?.defaultFormat || "Nombre",
        },
      ]);
    }

    setSearch("");
  };

  const updateQuantity = (id: string, delta: number) => {
    setIngredients((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? { ...i, quantity: i.quantity + delta }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const filteredSuggestions = suggestedIngredients.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      !ingredients.find(
        (i) => i.name.toLowerCase() === s.name.toLowerCase()
      )
  );

  const grouped = ingredients.reduce((acc, i) => {
    acc[i.category] = acc[i.category] || [];
    acc[i.category].push(i);
    return acc;
  }, {} as Record<string, Ingredient[]>);

  /* ===================== RENDER ===================== */

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Frigo 🧊</Text>
        <Text style={styles.subText}>
          {ingredients.length} ingrédient
          {ingredients.length > 1 ? "s" : ""}
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un ingrédient..."
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        {search.length > 0 && (
          <View style={styles.suggestions}>
            {filteredSuggestions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.suggestionItem}
                onPress={() => addIngredient(s)}
              >
                <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                <Text>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* LIST */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {Object.keys(grouped).map((cat) => (
          <View key={cat}>
            <Text style={styles.categoryTitle}>
              {cat} {getCategory(cat)?.emoji}
            </Text>

            {grouped[cat].map((i) => (
              <View key={i.id} style={styles.item}>
                <Text style={{ fontSize: 22 }}>{i.emoji}</Text>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600" }}>{i.name}</Text>
                  <Text style={{ color: "#FF9F1C" }}>
                    {displayQuantity(i.quantity, i.format)}
                  </Text>
                </View>

                <View style={styles.controls}>
                  <TouchableOpacity
                    onPress={() =>
                      updateQuantity(i.id, -getStep(i.format))
                    }
                  >
                    <Ionicons
                      name="remove-circle-outline"
                      size={22}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      updateQuantity(i.id, getStep(i.format))
                    }
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => removeIngredient(i.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#DC2626"
                    />
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

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },

  header: { backgroundColor: "#FFF", padding: 20 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FF9F1C",
  },
  subText: { color: "#666", marginBottom: 10 },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "#F3F3F3",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },

  suggestions: {
    marginTop: 8,
    backgroundColor: "#FFF",
    borderRadius: 10,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginVertical: 10,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
