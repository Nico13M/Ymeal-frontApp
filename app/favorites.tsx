import useRequireAuth from "@/src/hooks/useRequireAuth";
import { getFavorites, RecipeMinimal } from "@/src/services/recipes";
import { Ionicons } from "@expo/vector-icons";
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

export default function FavoritesScreen() {
  const router = useRouter();
  const { checking } = useRequireAuth();

  const [favorites, setFavorites] = useState<RecipeMinimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checking) return;

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

    fetchFavorites();
  }, [checking]);

  if (checking) return null;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FF9F1C" barStyle="light-content" />

      {/* HEADER ORANGE */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes Favoris</Text>
        </View>
        <Text style={styles.headerSub}>Toutes tes recettes sauvegardées</Text>
      </View>

      {/* LISTE DES FAVORIS */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF9F1C" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
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
                  <Ionicons name="heart" size={20} color="#E63946" />
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>
                Aucun favori pour le moment !
              </Text>
              <TouchableOpacity
                style={styles.discoverBtn}
                onPress={() => router.push("/recipes")}
              >
                <Text style={styles.discoverBtnText}>
                  Découvrir des recettes
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
    paddingTop: 50, // FIX BARRE STATUT
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: "#FFF" },
  headerSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: 5,
    marginLeft: 43,
  },
  listContent: { padding: 15 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#DC2626", fontSize: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  cardImage: { width: 110, height: 110 },
  cardContent: { flex: 1, padding: 15, justifyContent: "center" },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "#666", fontSize: 14, fontWeight: "500" },
  emptyContainer: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#888", fontSize: 16, marginTop: 15, marginBottom: 20 },
  discoverBtn: {
    backgroundColor: "#FF9F1C",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  discoverBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
