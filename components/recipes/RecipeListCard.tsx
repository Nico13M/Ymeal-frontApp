import { palette, radius, shadow } from "@/constants/design";
import { RECIPE_IMAGE_FALLBACK, translateDifficulty } from "@/constants/recipePresentation";
import { formatEuro, type RecipePrice } from "@/src/lib/recipePrice";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type RecipeListItem = {
  id: number;
  name: string;
  image: string | null;
  author: string;
  dishType: string | null;
  difficulty: string | null;
  totalTime: number;
  diets: string[];
  favoritesCount: number;
  ratingsCount: number;
  averageRating: number;
  price: RecipePrice | null;
  /** texte normalisé pour la recherche (nom, description, ingrédients) */
  searchText?: string;
  authorId?: number | null;
  isPublic?: boolean;
};

const DIFFICULTY_STYLE: Record<string, { bg: string; fg: string }> = {
  Débutant: { bg: "#E8F5E9", fg: "#1B7F3B" },
  Moyen: { bg: "#FFF4D6", fg: "#9A6B00" },
  Difficile: { bg: "#FEE2E2", fg: "#B91C1C" },
};

const DISH_EMOJI: Record<string, string> = {
  entree: "🥗",
  plat: "🍝",
  dessert: "🍰",
};

function dishEmoji(dish: string | null): string {
  const n = (dish ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const key = Object.keys(DISH_EMOJI).find((k) => n.includes(k));
  return key ? DISH_EMOJI[key] : "🍽️";
}

type Props = {
  recipe: RecipeListItem;
  isFavorite: boolean;
  onPress: () => void;
  onFavorite: () => void;
};

export default function RecipeListCard({ recipe, isFavorite, onPress, onFavorite }: Props) {
  const difficulty = translateDifficulty(recipe.difficulty);
  const diffStyle = DIFFICULTY_STYLE[difficulty] ?? { bg: palette.primarySoft, fg: palette.primaryDark };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir la recette ${recipe.name}`}
    >
      <View>
        <Image
          source={{ uri: recipe.image || RECIPE_IMAGE_FALLBACK }}
          style={styles.cover}
          resizeMode="cover"
        />
        {recipe.dishType ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {dishEmoji(recipe.dishType)} {recipe.dishType}
            </Text>
          </View>
        ) : null}
        <TouchableOpacity
          onPress={onFavorite}
          style={styles.favBtn}
          hitSlop={8}
          accessibilityLabel={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? palette.heart : palette.ink}
          />
        </TouchableOpacity>
        {recipe.price ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>
              {recipe.price.estimated ? "≈ " : ""}
              {formatEuro(recipe.price.perServing)}
              <Text style={styles.priceBadgeUnit}> / pers.</Text>
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.name}
        </Text>

        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{recipe.author.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.author} numberOfLines={1}>
            {recipe.author}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={14} color={palette.textMuted} />
            <Text style={styles.metaText}>{recipe.totalTime} min</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: diffStyle.bg, borderColor: diffStyle.bg }]}>
            <Ionicons name="flame-outline" size={14} color={diffStyle.fg} />
            <Text style={[styles.metaText, { color: diffStyle.fg }]}>{difficulty}</Text>
          </View>
        </View>

        {recipe.diets.length > 0 && (
          <View style={styles.dietRow}>
            {recipe.diets.slice(0, 3).map((d) => (
              <View key={d} style={styles.dietPill}>
                <Text style={styles.dietText}>{d}</Text>
              </View>
            ))}
            {recipe.diets.length > 3 && (
              <Text style={styles.moreDiets}>+{recipe.diets.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <View style={styles.action}>
            <Ionicons
              name={recipe.ratingsCount > 0 ? "star" : "star-outline"}
              size={18}
              color={recipe.ratingsCount > 0 ? palette.gold : palette.textFaint}
            />
            <Text style={styles.actionText}>
              {recipe.ratingsCount > 0 ? recipe.averageRating.toFixed(1) : "–"}
              <Text style={styles.actionSub}> ({recipe.ratingsCount} avis)</Text>
            </Text>
          </View>
          <View style={styles.action}>
            <Ionicons name="heart-outline" size={17} color={palette.textMuted} />
            <Text style={styles.actionText}>{recipe.favoritesCount}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={styles.link}>Voir</Text>
          <Ionicons name="arrow-forward" size={16} color={palette.primaryDark} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 18,
    width: "100%",
    ...shadow.soft,
  },
  cover: { width: "100%", height: 190 },
  categoryBadge: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: "800", color: palette.ink },
  favBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  priceBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: palette.primaryDark,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  priceBadgeText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
  priceBadgeUnit: { fontWeight: "600", fontSize: 11.5 },
  body: { padding: 16 },
  title: { fontSize: 19, fontWeight: "800", color: palette.ink, letterSpacing: -0.2 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "800", color: palette.primaryDark },
  author: { fontSize: 13.5, fontWeight: "700", color: palette.text, flexShrink: 1 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
  },
  metaText: { fontSize: 12.5, fontWeight: "700", color: palette.textMuted },
  dietRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" },
  dietPill: {
    backgroundColor: palette.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dietText: { fontSize: 12, fontWeight: "700", color: "#1B7F3B" },
  moreDiets: { fontSize: 12, fontWeight: "700", color: palette.textMuted },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { fontSize: 14, fontWeight: "700", color: palette.text },
  actionSub: { fontSize: 12.5, fontWeight: "600", color: palette.textMuted },
  link: { color: palette.primaryDark, fontWeight: "800", fontSize: 14, marginRight: -10 },
});
