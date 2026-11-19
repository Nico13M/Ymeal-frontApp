import ScreenHeader from "@/components/ui/ScreenHeader";
import { brandGradient, palette, radius, shadow } from "@/constants/design";
import { RECIPE_IMAGE_FALLBACK, translateDifficulty } from "@/constants/recipePresentation";
import useRequireAuth from "@/src/hooks/useRequireAuth";
import { notify } from "@/src/lib/notify";
import { getFavorites, removeFromFavorites, type RecipeMinimal } from "@/src/services/recipes";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FavoritesView({ showBack = false }: { showBack?: boolean }) {
  const router = useRouter();
  const { checking } = useRequireAuth();
  const isFocused = useIsFocused();

  const [favorites, setFavorites] = useState<RecipeMinimal[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false }),
    [scrollY],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFavorites(await getFavorites());
    } catch {
      setError("Impossible de charger tes favoris.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!checking && isFocused) void load();
  }, [checking, isFocused, load]);

  const removeFavorite = async (id: number) => {
    const previous = favorites;
    setFavorites((prev) => prev.filter((r) => r.id !== id));
    try {
      await removeFromFavorites(id);
    } catch (e) {
      setFavorites(previous);
      notify("Favoris", e instanceof Error ? e.message : "Impossible de retirer ce favori.");
    }
  };

  if (checking) return null;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={palette.primary} barStyle="light-content" />
      <ScreenHeader
        title="Mes Favoris"
        subtitle={
          favorites.length > 0
            ? `${favorites.length} recette${favorites.length > 1 ? "s" : ""} sauvegardée${favorites.length > 1 ? "s" : ""}`
            : "Toutes tes recettes sauvegardées"
        }
        onBack={showBack ? () => router.back() : undefined}
        scrollY={scrollY}
      />

      {loading && favorites.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onRefresh={load}
          refreshing={loading}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              onPress={() => router.push(`/recipe/${item.id}`)}
            >
              <Image source={{ uri: item.image || RECIPE_IMAGE_FALLBACK }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text numberOfLines={2} style={styles.cardTitle}>
                  {item.name}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={15} color={palette.textMuted} />
                  <Text style={styles.metaText}>
                    {(item.timing?.prep_time ?? 0) + (item.timing?.duration ?? 0)} min
                  </Text>
                  <Ionicons name="flame-outline" size={15} color={palette.textMuted} />
                  <Text style={styles.metaText}>{translateDifficulty(item.difficulty)}</Text>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    onPress={() => removeFavorite(item.id)}
                    hitSlop={10}
                    accessibilityLabel="Retirer des favoris"
                  >
                    <Ionicons name="heart" size={22} color={palette.heart} />
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={72} color="#E5D5BF" />
              <Text style={styles.emptyText}>Aucune recette enregistrée</Text>
              <TouchableOpacity
                onPress={() => router.push("/recipes")}
                activeOpacity={0.9}
                style={{ borderRadius: radius.pill, ...shadow.soft }}
              >
                <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                  <Text style={styles.ctaText}>Parcourir les recettes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, paddingBottom: 40, width: "100%", maxWidth: 720, alignSelf: "center" },
  error: { color: palette.danger, marginBottom: 10, fontWeight: "600" },
  card: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    marginBottom: 14,
    overflow: "hidden",
    ...shadow.soft,
  },
  cardImage: { width: 108, height: 108, backgroundColor: palette.primaryTint },
  cardContent: { flex: 1, padding: 12, justifyContent: "center", gap: 6 },
  cardTitle: { fontSize: 16.5, fontWeight: "800", color: palette.ink },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: palette.textMuted, fontSize: 13, fontWeight: "700", marginRight: 6 },
  empty: { alignItems: "center", marginTop: 70, paddingHorizontal: 24 },
  emptyText: { color: palette.textMuted, fontSize: 16.5, marginTop: 14, marginBottom: 22, textAlign: "center" },
  cta: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: radius.pill },
  ctaText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
});
