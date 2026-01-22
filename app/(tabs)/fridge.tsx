import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Ingredient = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  quantity: number;     // stockage normalisé (g / ml / unités)
  format: string;       // "Nombre" | "Grammes" | "Kilogrammes" | "Millilitres" | "Centilitres"
};

const CATEGORIES = [
  { key: "Légumes", emoji: "🥬", defaultFormat: "Nombre" },
  { key: "Fruits", emoji: "🍎", defaultFormat: "Nombre" },
  { key: "Produits laitiers", emoji: "🥛", defaultFormat: "Grammes" },
  { key: "Viandes", emoji: "🥩", defaultFormat: "Grammes" },
  { key: "Féculents", emoji: "🍞", defaultFormat: "Grammes" },
  { key: "Autres", emoji: "📦", defaultFormat: "Nombre" },
];

const suggestedIngredients = [
  { id: "1", name: "Tomates", category: "Légumes", emoji: "🍅" },
  { id: "2", name: "Oignons", category: "Légumes", emoji: "🧅" },
  { id: "3", name: "Pâtes", category: "Féculents", emoji: "🍝" },
  { id: "4", name: "Riz", category: "Féculents", emoji: "🍚" },
  { id: "5", name: "Œufs", category: "Produits laitiers", emoji: "🥚" },
  { id: "6", name: "Fromage", category: "Produits laitiers", emoji: "🧀" },
  { id: "7", name: "Poulet", category: "Viandes", emoji: "🍗" },
  { id: "8", name: "Carottes", category: "Légumes", emoji: "🥕" },
];

const FORMATS = [
  "Nombre",
  "Grammes",
  "Kilogrammes",
  "Millilitres",
  "Centilitres",
];

function convertToBase(quantity: number, format: string) {
  if (format === "Kilogrammes") return quantity * 1000;
  if (format === "Centilitres") return quantity * 10;
  return quantity; // Nombre / Grammes / Millilitres
}

function formatDisplay(quantity: number, format: string) {
  if (format === "Kilogrammes") return `${(quantity / 1000).toFixed(2)} kg`;
  if (format === "Centilitres") return `${(quantity / 10).toFixed(0)} cl`;
  if (format === "Grammes") return `${quantity} g`;
  if (format === "Millilitres") return `${quantity} ml`;
  return `${quantity} x`;
}

export default function FridgeScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newCategory, setNewCategory] = useState("Autres");
  const [newFormat, setNewFormat] = useState("Nombre");

  const getCategory = (category: string) =>
    CATEGORIES.find((c) => c.key === category);

  const getEmojiFromName = (name: string, category: string) => {
    const found = suggestedIngredients.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (found) return found.emoji;

    const cat = getCategory(category);
    return cat ? cat.emoji : "🥘";
  };

  const addIngredient = (ingredient: Ingredient) => {
    const existing = ingredients.find(
      (i) => i.name.toLowerCase() === ingredient.name.toLowerCase()
    );

    if (existing) {
      existing.quantity += ingredient.quantity;
      setIngredients([...ingredients]);
    } else {
      setIngredients([...ingredients, ingredient]);
    }
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  const groupedIngredients = ingredients.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) acc[ingredient.category] = [];
    acc[ingredient.category].push(ingredient);
    return acc;
  }, {} as Record<string, Ingredient[]>);

  const addCustomIngredient = () => {
    if (!newIngredient.trim()) return;

    const cat = getCategory(newCategory);

    const q = parseFloat(newQuantity);
    const quantityNumber = isNaN(q) ? 1 : q;

    const baseQuantity = convertToBase(quantityNumber, newFormat);

    addIngredient({
      id: Date.now().toString(),
      name: newIngredient,
      category: newCategory,
      emoji: getEmojiFromName(newIngredient, newCategory),
      quantity: baseQuantity,
      format: newFormat,
    });

    setNewIngredient("");
    setNewQuantity("");
    setNewCategory("Autres");
    setNewFormat("Nombre");
    setShowModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Frigo 🧊</Text>
        <Text style={styles.subText}>
          {ingredients.length} ingrédient{ingredients.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {ingredients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🤷</Text>
            <Text style={styles.emptyText}>Votre frigo est vide !</Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowModal(true)}
            >
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.btnText}>Ajouter un ingrédient</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {Object.keys(groupedIngredients).map((category) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  {category} {getCategory(category)?.emoji}
                </Text>

                <View style={styles.grid}>
                  {groupedIngredients[category].map((ingredient) => (
                    <View key={ingredient.id} style={styles.card}>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeIngredient(ingredient.id)}
                      >
                        <Ionicons name="close" size={14} color="#DC2626" />
                      </TouchableOpacity>

                      <Text style={styles.emoji}>{ingredient.emoji}</Text>
                      <Text style={styles.quantity}>
                        {formatDisplay(ingredient.quantity, ingredient.format)}
                      </Text>
                      <Text style={styles.name}>{ingredient.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowModal(true)}
            >
              <Ionicons name="add" size={20} color="#FF9F1C" />
              <Text style={styles.secondaryText}>Ajouter des ingrédients</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Ajouter un ingrédient</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Ionicons name="close" size={22} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    value={newIngredient}
                    onChangeText={setNewIngredient}
                    placeholder="Nom de l'ingrédient"
                    style={[styles.input, { flex: 2 }]}
                    returnKeyType="done"
                    onSubmitEditing={addCustomIngredient}
                  />

                  <TextInput
                    value={newQuantity}
                    onChangeText={setNewQuantity}
                    placeholder="Quantité"
                    style={[styles.input, { flex: 1, marginLeft: 10 }]}
                    keyboardType="numeric"
                  />
                </View>

                <Text style={styles.suggestionsTitle}>Format</Text>
                <View style={styles.categoryRow}>
                  {FORMATS.map((f) => {
                    const active = f === newFormat;
                    return (
                      <TouchableOpacity
                        key={f}
                        style={[
                          styles.categoryBtn,
                          active && styles.categoryBtnActive,
                        ]}
                        onPress={() => setNewFormat(f)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            active && styles.categoryTextActive,
                          ]}
                        >
                          {f}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.suggestionsTitle}>Catégorie</Text>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => {
                    const active = cat.key === newCategory;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[
                          styles.categoryBtn,
                          active && styles.categoryBtnActive,
                        ]}
                        onPress={() => {
                          setNewCategory(cat.key);
                          setNewFormat(cat.defaultFormat); // <--- format par défaut
                        }}
                      >
                        <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                        <Text
                          style={[
                            styles.categoryText,
                            active && styles.categoryTextActive,
                          ]}
                        >
                          {cat.key}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.addModalButton}
                  onPress={addCustomIngredient}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={styles.addModalText}>Ajouter</Text>
                </TouchableOpacity>

                <Text style={styles.suggestionsTitle}>Suggestions</Text>

                <View style={styles.grid}>
                  {suggestedIngredients
                    .filter(
                      (i) =>
                        !ingredients.find(
                          (ing) =>
                            ing.name.toLowerCase() === i.name.toLowerCase()
                        )
                    )
                    .map((ingredient) => (
                      <TouchableOpacity
                        key={ingredient.id}
                        style={styles.suggestionCard}
                        onPress={() => {
                          const cat = getCategory(ingredient.category);
                          addIngredient({
                            id: ingredient.id,
                            name: ingredient.name,
                            category: ingredient.category,
                            emoji: ingredient.emoji,
                            quantity: convertToBase(
                              parseFloat(cat?.defaultFormat === "Grammes" ? "200" : "1"),
                              cat?.defaultFormat ?? "Nombre"
                            ),
                            format: cat?.defaultFormat ?? "Nombre",
                          });
                          setShowModal(false);
                        }}
                      >
                        <Text style={styles.emoji}>{ingredient.emoji}</Text>
                        <Text style={styles.name}>{ingredient.name}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },

  header: {
    padding: 20,
    backgroundColor: "#FFF",
    elevation: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FF9F1C",
  },
  subText: { color: "#666", marginTop: 4 },

  content: { padding: 20 },

  emptyState: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 10 },
  emptyText: { color: "#666", marginBottom: 20 },

  quantity: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF9F1C",
  },

  addButton: {
    flexDirection: "row",
    backgroundColor: "#FF9F1C",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    alignItems: "center",
    gap: 10,
  },
  btnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    position: "relative",
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FEE2E2",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 28, marginBottom: 6 },
  name: { fontWeight: "600" },

  secondaryButton: {
    marginTop: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#FF9F1C",
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  secondaryText: { color: "#FF9F1C", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },

  inputRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  addModalButton: {
    marginBottom: 12,
    backgroundColor: "#FF9F1C",
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addModalText: {
    color: "#FFF",
    fontWeight: "700",
  },

  suggestionsTitle: {
    fontWeight: "600",
    marginBottom: 10,
  },
  suggestionCard: {
    width: "48%",
    backgroundColor: "#F3F3F3",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },

  categorySection: {
    marginBottom: 20,
  },

  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#374151",
  },

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  categoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  categoryBtnActive: {
    backgroundColor: "#FF9F1C",
    borderColor: "#FF9F1C",
  },

  categoryEmoji: {
    fontSize: 14,
  },

  categoryText: {
    fontSize: 12,
    color: "#555",
  },

  categoryTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
});
