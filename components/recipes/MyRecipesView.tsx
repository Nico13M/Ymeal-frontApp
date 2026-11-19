import RecipeEditorModal from "@/components/recipes/RecipeEditorModal";
import StatusPopup, { type StatusKind } from "@/components/ui/StatusPopup";
import type { RecipeListItem } from "@/components/recipes/RecipeListCard";
import { brandGradient, MAX_CONTENT_WIDTH, palette, radius, shadow } from "@/constants/design";
import { RECIPE_IMAGE_FALLBACK, translateDifficulty } from "@/constants/recipePresentation";
import { notify } from "@/src/lib/notify";
import { formatEuro } from "@/src/lib/recipePrice";
import { deleteMyRecipe } from "@/src/services/recipes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  recipes: RecipeListItem[];
  loading: boolean;
  onOpen: (id: number) => void;
  /** recharge la liste après ajout / modification / suppression */
  onChanged: () => void;
  /** défilement (réduction de l'en-tête) */
  onScroll?: (...args: any[]) => void;
};

function confirm(title: string, message: string, onYes: () => void) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: "Annuler", style: "cancel" },
    { text: "Supprimer", style: "destructive", onPress: onYes },
  ]);
}

export default function MyRecipesView({ recipes, loading, onOpen, onChanged, onScroll }: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Pop-up de confirmation (création / modification / suppression)
  const [popup, setPopup] = useState<{ kind: StatusKind; title: string; message?: string } | null>(null);
  const closePopup = useCallback(() => setPopup(null), []);

  const openCreate = () => {
    setEditingId(null);
    setEditorOpen(true);
  };
  const openEdit = (id: number) => {
    setEditingId(id);
    setEditorOpen(true);
  };

  const remove = (item: RecipeListItem) =>
    confirm("Supprimer la recette", `« ${item.name} » sera définitivement supprimée.`, async () => {
      setDeletingId(item.id);
      try {
        await deleteMyRecipe(item.id);
        onChanged();
        setPopup({ kind: "deleted", title: "Recette supprimée", message: `« ${item.name} » a bien été supprimée.` });
      } catch (e) {
        setPopup({
          kind: "error",
          title: "Suppression impossible",
          message: e instanceof Error ? e.message : "Réessaie dans quelques instants.",
        });
      } finally {
        setDeletingId(null);
      }
    });

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={recipes}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={onChanged}
        ListHeaderComponent={
          <TouchableOpacity activeOpacity={0.9} onPress={openCreate} style={styles.createWrap}>
            <LinearGradient colors={["transparent", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.create}>
              <View style={styles.createIcon}>
                <Ionicons name="add" size={26} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.createTitle}>Ajouter une recette</Text>
                <Text style={styles.createSub}>
                  {recipes.length > 0
                    ? `${recipes.length} recette${recipes.length > 1 ? "s" : ""} liée${recipes.length > 1 ? "s" : ""} à ton compte`
                    : "Elle sera liée à ton compte"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.primaryDark} />
            </LinearGradient>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]} onPress={() => onOpen(item.id)}>
            <Image source={{ uri: item.image || RECIPE_IMAGE_FALLBACK }} style={styles.thumb} />
            <View style={styles.cardBody}>
              <View style={styles.badges}>
                <View style={[styles.badge, item.isPublic ? styles.badgePublic : styles.badgePrivate]}>
                  <Ionicons
                    name={item.isPublic ? "globe-outline" : "lock-closed-outline"}
                    size={11}
                    color={item.isPublic ? "#1B7F3B" : palette.textMuted}
                  />
                  <Text style={[styles.badgeText, { color: item.isPublic ? "#1B7F3B" : palette.textMuted }]}>
                    {item.isPublic ? "Publique" : "Privée"}
                  </Text>
                </View>
                {item.dishType ? <Text style={styles.dish}>{item.dishType}</Text> : null}
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.totalTime} min · {translateDifficulty(item.difficulty)}
                {item.price ? ` · ≈ ${formatEuro(item.price.perServing)}/pers.` : ""}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item.id)}>
                  <Ionicons name="create-outline" size={16} color={palette.primaryDark} />
                  <Text style={styles.editText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => remove(item)}
                  disabled={deletingId === item.id}
                  accessibilityLabel={`Supprimer ${item.name}`}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator size="small" color={palette.danger} />
                  ) : (
                    <Ionicons name="trash-outline" size={16} color={palette.danger} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Text style={{ fontSize: 44 }}>👩‍🍳</Text>
              <Text style={styles.emptyTitle}>Aucune recette pour l'instant</Text>
              <Text style={styles.emptyText}>
                Ajoute tes propres recettes ou enregistre celles du Générateur IA : elles apparaîtront ici.
              </Text>
            </View>
          )
        }
      />

      <RecipeEditorModal
        visible={editorOpen}
        recipeId={editingId}
        onClose={() => setEditorOpen(false)}
        onSaved={({ kind, name }) => {
          setEditorOpen(false);
          onChanged();
          // Petit délai : la fenêtre d'édition se ferme avant l'affichage de la pop-up (iOS)
          setTimeout(
            () =>
              setPopup(
                kind === "created"
                  ? { kind, title: "Recette créée !", message: `« ${name} » a été ajoutée à « Mes recettes ».` }
                  : { kind, title: "Recette modifiée", message: `Les modifications de « ${name} » sont enregistrées.` },
              ),
            Platform.OS === "ios" ? 400 : 0,
          );
        }}
      />

      <StatusPopup
        visible={popup !== null}
        kind={popup?.kind ?? "created"}
        title={popup?.title ?? ""}
        message={popup?.message}
        onClose={closePopup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, width: "100%", maxWidth: Math.min(760, MAX_CONTENT_WIDTH), alignSelf: "center" },
  createWrap: { borderRadius: radius.lg, marginBottom: 16 },
  create: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: "dashed", borderColor: palette.primary },
  createIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  createTitle: { color: palette.ink, fontSize: 17, fontWeight: "800" },
  createSub: { color: palette.textMuted, fontSize: 13, marginTop: 1 },
  card: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 12,
    ...shadow.soft,
  },
  thumb: { width: 112, minHeight: 132, backgroundColor: palette.primaryTint },
  cardBody: { flex: 1, padding: 12, gap: 4 },
  badges: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgePublic: { backgroundColor: palette.successSoft },
  badgePrivate: { backgroundColor: palette.surfaceMuted },
  badgeText: { fontSize: 11.5, fontWeight: "800" },
  dish: { fontSize: 12, fontWeight: "700", color: palette.textMuted },
  title: { fontSize: 16, fontWeight: "800", color: palette.ink },
  meta: { fontSize: 12.5, color: palette.textMuted },
  actions: { flexDirection: "row", gap: 8, marginTop: 6 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  editText: { color: palette.primaryDark, fontWeight: "800", fontSize: 13 },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", paddingTop: 30, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: palette.ink, marginTop: 10 },
  emptyText: { color: palette.textMuted, textAlign: "center", marginTop: 6, lineHeight: 20 },
});
