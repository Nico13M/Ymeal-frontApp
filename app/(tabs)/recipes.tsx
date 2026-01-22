import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import React, { useRef, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RECIPES } from "../../constants/recipesData";

export default function RecipesScreen() {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  const inputRef = useRef<any>(null);

  const filteredRecipes = RECIPES.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.ingredients.some((ing) =>
        ing.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const toggleSearch = () => {
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchQuery("");
      Keyboard.dismiss();
    } else {
      setIsSearchActive(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const randomRecipe = () => {
    const random = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    setSelectedRecipe(random);
  };

  const generateFromFridge = () => {
    // 👉 À connecter plus tard avec le frigo (AsyncStorage)
    // Pour l'instant on prend une recette "top" par défaut
    const best = RECIPES[0];
    setSelectedRecipe(best);
  };

  const renderRecipeItem = ({ item }: any) => (
    <Link href={`/recipe/${item.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFF" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.time}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.reviews} avis</Text>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.difficulty}</Text>
            </View>
            <Text style={styles.linkText}>Voir la recette ➔</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#00C853" barStyle="light-content" />

      <View style={styles.header}>
        {isSearchActive ? (
          <View style={styles.searchBarContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#00C853"
              style={{ marginRight: 10 }}
            />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Chercher une recette..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={toggleSearch}
            />
            <TouchableOpacity onPress={toggleSearch}>
              <Ionicons name="close-circle" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerTop}>
            <View style={{ width: 24 }} />
            <Text style={styles.headerTitle}>Recettes pour vous</Text>
            <TouchableOpacity onPress={toggleSearch}>
              <Ionicons name="search" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {!isSearchActive && (
          <Text style={styles.headerSub}>
            Basées sur tes ingrédients disponibles
          </Text>
        )}

        {/* ====== BOUTONS ====== */}
        {!isSearchActive && (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={generateFromFridge}
            >
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <Text style={styles.actionText}>Générer depuis le frigo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={randomRecipe}>
              <Ionicons name="shuffle" size={20} color="#FFF" />
              <Text style={styles.actionText}>Recette aléatoire</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={selectedRecipe ? [selectedRecipe] : filteredRecipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderRecipeItem}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Text style={{ color: "#888" }}>
              Aucune recette trouvée pour "{searchQuery}" 😕
            </Text>
          </View>
        }
        ListHeaderComponent={() =>
          !isSearchActive && searchQuery === "" ? (
            <LinearGradient
              colors={["#FF9F1C", "#FFC107"]}
              style={styles.promoCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                <Ionicons name="trending-up" size={24} color="#FFF" />
                <Text style={styles.promoTitle}>
                  Recommandations personnalisées
                </Text>
              </View>
              <Text style={styles.promoDesc}>
                Ces recettes utilisent au maximum les ingrédients de ton frigo
                pour éviter le gaspillage !
              </Text>
            </LinearGradient>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  header: {
    backgroundColor: "#00C853",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: "flex-end",
    minHeight: 170,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  headerSub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },

  searchBarContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: "center",
    height: 45,
  },

  searchInput: { flex: 1, fontSize: 16, color: "#333" },

  listContent: { padding: 20, paddingBottom: 100 },

  promoCard: { borderRadius: 15, padding: 20, marginBottom: 20 },
  promoTitle: { color: "#FFF", fontWeight: "bold", fontSize: 16, marginLeft: 10 },
  promoDesc: { color: "#FFF", marginTop: 5, lineHeight: 20 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  cardImage: { width: "100%", height: 180 },
  cardContent: { padding: 15 },

  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  ratingBadge: {
    flexDirection: "row",
    backgroundColor: "#FFC107",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    alignItems: "center",
  },

  ratingText: { fontSize: 12, fontWeight: "bold", marginLeft: 4, color: "#333" },

  metaContainer: { flexDirection: "row", gap: 15, marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "#666", fontSize: 13 },

  tag: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  tagText: { color: "#2E7D32", fontSize: 12, fontWeight: "bold" },

  linkText: { color: "#FF9F1C", fontWeight: "bold", fontSize: 14 },

  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    gap: 10,
  },

  actionBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  actionText: {
    fontWeight: "700",
    color: "#00C853",
  },
});
