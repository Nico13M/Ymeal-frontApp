import useRequireAuth from "@/src/hooks/useRequireAuth";
import { getFavorites, RecipeMinimal } from "@/src/services/recipes";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function FavoritesTab() {
  const router = useRouter();
  const { checking } = useRequireAuth();
  const isFocused = useIsFocused(); // Pour recharger quand on clique sur l'onglet

  const [favorites, setFavorites] = useState<RecipeMinimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      setError("Impossible de charger tes favoris.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checking && isFocused) {
      fetchFavorites();
    }
  }, [checking, isFocused]);

  if (checking) return null;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FF9F1C" barStyle="light-content" />

      {/* HEADER ORANGE SANS FLÈCHE RETOUR */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
        <Text style={styles.headerSub}>Tes recettes enregistrées</Text>
      </View>

      {loading && favorites.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF9F1C" />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchFavorites}
          refreshing={loading}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/recipe/${item.id}`)}
            >
              <Image
                source={{
                  uri: item.image || "https://via.placeholder.com/300",
                }}
                style={styles.cardImage}
              />
              <View style={styles.cardContent}>
                <Text numberOfLines={2} style={styles.cardTitle}>
                  {item.name}
                </Text>
                <View style={styles.metaContainer}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>
                      {(item.timing?.prep_time ?? 0) +
                        (item.timing?.duration ?? 0)}{" "}
                      min
                    </Text>
                  </View>
                  <Ionicons name="heart" size={22} color="#E63946" />
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={80} color="#DDD" />
              <Text style={styles.emptyText}>Aucune recette enregistrée</Text>
              <TouchableOpacity
                style={styles.discoverBtn}
                onPress={() => router.push("/recipes")}
              >
                <Text style={styles.discoverBtnText}>
                  Parcourir les recettes
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  header: {
    backgroundColor: "#FF9F1C",
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#FFF" },
  headerSub: { fontSize: 16, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  listContent: { padding: 15, paddingBottom: 100 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 18,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: "hidden",
  },
  cardImage: { width: 100, height: 100 },
  cardContent: { flex: 1, padding: 12, justifyContent: "center" },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "#666", fontSize: 13, fontWeight: "600" },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#AAA", fontSize: 17, marginTop: 15, marginBottom: 25 },
  discoverBtn: {
    backgroundColor: "#FF9F1C",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  discoverBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
