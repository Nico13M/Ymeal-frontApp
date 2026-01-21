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
  quantity: string;
};

const suggestedIngredients: Ingredient[] = [
  { id: "1", name: "Tomates", category: "Légumes", emoji: "🍅", quantity: "1" },
  { id: "2", name: "Oignons", category: "Légumes", emoji: "🧅", quantity: "1" },
  { id: "3", name: "Pâtes", category: "Féculents", emoji: "🍝", quantity: "250g" },
  { id: "4", name: "Riz", category: "Féculents", emoji: "🍚", quantity: "250g" },
  { id: "5", name: "Œufs", category: "Produits laitiers", emoji: "🥚", quantity: "6" },
  { id: "6", name: "Fromage", category: "Produits laitiers", emoji: "🧀", quantity: "200g" },
  { id: "7", name: "Poulet", category: "Viandes", emoji: "🍗", quantity: "500g" },
  { id: "8", name: "Carottes", category: "Légumes", emoji: "🥕", quantity: "1" },
];

export default function FridgeScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");

  const addIngredient = (ingredient: Ingredient) => {
    const existing = ingredients.find(
      (i) => i.name.toLowerCase() === ingredient.name.toLowerCase()
    );

    if (existing) {
      // si c'est un nombre, additionner
      const a = parseFloat(existing.quantity);
      const b = parseFloat(ingredient.quantity);

      if (!isNaN(a) && !isNaN(b)) {
        existing.quantity = String(a + b);
      } else {
        existing.quantity = `${existing.quantity} + ${ingredient.quantity}`;
      }

      setIngredients([...ingredients]);
    } else {
      setIngredients([...ingredients, ingredient]);
    }
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  const addCustomIngredient = () => {
    if (!newIngredient.trim()) return;

    addIngredient({
      id: Date.now().toString(),
      name: newIngredient,
      category: "Autres",
      emoji: "🥘",
      quantity: newQuantity || "1",
    });

    setNewIngredient("");
    setNewQuantity("1");
    setShowModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
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
            {/* GRID INGREDIENTS */}
            <View style={styles.grid}>
              {ingredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.card}>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeIngredient(ingredient.id)}
                  >
                    <Ionicons name="close" size={14} color="#DC2626" />
                  </TouchableOpacity>

                  <Text style={styles.emoji}>{ingredient.emoji}</Text>
                  <Text style={styles.quantity}>{ingredient.quantity} ×</Text>
                  <Text style={styles.name}>{ingredient.name}</Text>
                  <Text style={styles.category}>{ingredient.category}</Text>
                </View>
              ))}
            </View>

            {/* ADD BUTTON */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowModal(true)}
            >
              <Ionicons name="add" size={20} color="#FF9F1C" />
              <Text style={styles.secondaryText}>
                Ajouter des ingrédients
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter un ingrédient</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={22} />
                </TouchableOpacity>
              </View>

              {/* INPUTS */}
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
                  placeholder="Quantité (ex: 500g)"
                  style={[styles.input, { flex: 1, marginLeft: 10 }]}
                />
              </View>

              {/* BOUTON AJOUTER */}
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
                        addIngredient({
                          ...ingredient,
                          quantity: newQuantity || ingredient.quantity,
                        });
                        setShowModal(false);
                      }}
                    >
                      <Text style={styles.emoji}>{ingredient.emoji}</Text>
                      <Text style={styles.name}>{ingredient.name}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
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
  category: { fontSize: 12, color: "#777" },

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
});
