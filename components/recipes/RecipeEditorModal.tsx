import { DIET_OPTIONS, findCatalogItem, unitsForIngredient } from "@/constants/ingredientCatalog";
import { brandGradient, palette, radius, shadow } from "@/constants/design";
import { ingredientMatches, sameIngredient } from "@/src/lib/ingredientName";
import { notify } from "@/src/lib/notify";
import { estimateIngredientCost, formatEuro } from "@/src/lib/recipePrice";
import { getAvailableIngredients, getUnits, type BackendIngredient, type BackendUnit } from "@/src/services/fridge";
import { fetchAllDiets, type ReferenceItem } from "@/src/services/profile";
import {
  createMyRecipe,
  getRecipe,
  updateMyRecipe,
  type RecipeFormPayload,
} from "@/src/services/recipes";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Row = {
  key: string;
  ingredientId: number | null;
  name: string;
  quantity: string;
  unit: string;
};

let rowSeq = 0;
const newRow = (): Row => ({ key: `r${++rowSeq}`, ingredientId: null, name: "", quantity: "", unit: "g" });

const DISH_TYPES = [
  { key: "Entrée", emoji: "🥗" },
  { key: "Plat", emoji: "🍝" },
  { key: "Dessert", emoji: "🍰" },
];
const DIFFICULTIES: { key: "easy" | "medium" | "hard"; label: string }[] = [
  { key: "easy", label: "Débutant" },
  { key: "medium", label: "Moyen" },
  { key: "hard", label: "Difficile" },
];
const FALLBACK_UNITS = ["g", "kg", "ml", "cl", "L", "pièce", "c. à soupe", "c. à café", "pincée"];

function toDifficultyKey(value?: string | null): "easy" | "medium" | "hard" {
  const v = (value ?? "").toLowerCase();
  if (["hard", "difficile", "advanced"].some((x) => v.includes(x))) return "hard";
  if (["medium", "moyen", "intermediate"].some((x) => v.includes(x))) return "medium";
  return "easy";
}

type Props = {
  visible: boolean;
  /** id de la recette à modifier ; null = création */
  recipeId: number | null;
  onClose: () => void;
  /** appelé après l'enregistrement : le parent affiche la pop-up de confirmation */
  onSaved: (result: { kind: "created" | "updated"; name: string }) => void;
};

export default function RecipeEditorModal({ visible, recipeId, onClose, onSaved }: Props) {
  const isEdit = recipeId !== null;

  const [loadingRefs, setLoadingRefs] = useState(false);
  const [catalog, setCatalog] = useState<BackendIngredient[]>([]);
  const [units, setUnits] = useState<string[]>(FALLBACK_UNITS);
  const [diets, setDiets] = useState<ReferenceItem[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dishType, setDishType] = useState("Plat");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [servings, setServings] = useState(2);
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [dietIds, setDietIds] = useState<number[]>([]);
  // Régimes sans identifiant serveur (liste locale si l'API n'en renvoie pas) + champ libre « Autre »
  const [localDiets, setLocalDiets] = useState<string[]>([]);
  const [otherDiet, setOtherDiet] = useState("");
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [focusedRow, setFocusedRow] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([""]);
  const [image, setImage] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);

  // ── Chargement des référentiels + de la recette en édition ──
  useEffect(() => {
    if (!visible) return;
    let active = true;
    setTried(false);
    setSaving(false);
    setFocusedRow(null);
    (async () => {
      setLoadingRefs(true);
      try {
        const [ings, unitList, dietList, recipe] = await Promise.all([
          getAvailableIngredients().catch(() => [] as BackendIngredient[]),
          getUnits().catch(() => [] as BackendUnit[]),
          fetchAllDiets().catch(() => [] as ReferenceItem[]),
          recipeId !== null ? getRecipe(recipeId) : Promise.resolve(null),
        ]);
        if (!active) return;
        setCatalog(ings);
        if (unitList.length) setUnits(unitList.map((u) => u.symbol || u.name).filter(Boolean));
        setDiets(dietList);

        if (recipe) {
          setName(recipe.name ?? "");
          setDescription(
            (recipe.description ?? "")
              .replace(/\n*Régimes? : .+$/m, "")
              .replace(/\n*Autres ingrédients :[\s\S]*$/, "")
              .trim(),
          );
          setDishType(recipe.dish_type || "Plat");
          setDifficulty(toDifficultyKey(recipe.difficulty));
          setServings(Math.max(1, recipe.servings || 1));
          setPrepTime(recipe.timing?.prep_time ? String(recipe.timing.prep_time) : "");
          setCookTime(recipe.timing?.duration ? String(recipe.timing.duration) : "");
          setIsPublic(Boolean(recipe.is_public));
          setDietIds((recipe.nutrition?.diets ?? []).map((d) => d.id));
          const extra = (recipe.description ?? "").match(/Régimes? : (.+)$/m)?.[1] ?? "";
          const extraList = extra.split(",").map((x) => x.trim()).filter(Boolean);
          const known = extraList.filter((x) => (DIET_OPTIONS as readonly string[]).includes(x) && x !== "Autre");
          const others = extraList.filter((x) => !(DIET_OPTIONS as readonly string[]).includes(x));
          setLocalDiets(others.length ? [...known, "Autre"] : known);
          setOtherDiet(others.join(", "));
          const ingRows = (recipe.nutrition?.ingredients ?? []).map((ing) => ({
            key: `r${++rowSeq}`,
            ingredientId: ing.id,
            name: ing.name,
            quantity: String(ing.quantity ?? ""),
            unit: typeof ing.unit === "string" ? ing.unit : ing.unit?.symbol || ing.unit?.name || "g",
          }));
          setRows(ingRows.length ? ingRows : [newRow()]);
          setSteps(recipe.steps?.length ? recipe.steps : [""]);
          setImage(recipe.image ?? null);
        } else {
          setName("");
          setDescription("");
          setDishType("Plat");
          setDifficulty("easy");
          setServings(2);
          setPrepTime("");
          setCookTime("");
          setIsPublic(true);
          setDietIds([]);
          setLocalDiets([]);
          setOtherDiet("");
          setRows([newRow()]);
          setSteps([""]);
          setImage(null);
        }
      } catch (e) {
        notify("Erreur", e instanceof Error ? e.message : "Impossible de charger la recette.");
      } finally {
        if (active) setLoadingRefs(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [visible, recipeId]);

  // ── Ingrédients ──
  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const onNameChange = (key: string, value: string) => {
    const exact = catalog.find((c) => sameIngredient(c.name, value));
    const ref = findCatalogItem(value);
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        // Comme pour « Partager ma recette » : l'unité suit l'ingrédient choisi
        const allowed = ref ? unitsForIngredient(value) : null;
        const unit = allowed && !allowed.includes(r.unit) ? ref!.unit : r.unit;
        return { ...r, name: value, ingredientId: exact ? exact.id : null, unit };
      }),
    );
  };

  const unitsFor = (row: Row): string[] => {
    const list = findCatalogItem(row.name) ? unitsForIngredient(row.name) : units;
    return list.includes(row.unit) ? list : [row.unit, ...list];
  };

  const suggestionsFor = (row: Row) => {
    if (focusedRow !== row.key || row.name.trim().length < 2) return [];
    return catalog.filter((c) => ingredientMatches(c.name, row.name)).slice(0, 5);
  };

  // ── Photo ──
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify("Permission refusée", "Autorise l'accès à tes photos.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.35,
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setImage(a.base64 ? `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}` : a.uri);
  };

  // ── Validation ──
  const parsedRows = rows
    .filter((r) => r.name.trim())
    .map((r) => ({ ...r, qty: parseFloat(r.quantity.replace(",", ".")) }));
  const unknownRows = parsedRows.filter((r) => r.ingredientId === null);
  const errors = {
    name: name.trim().length < 3 ? "Donne un nom à ta recette (3 caractères min.)" : null,
    ingredients:
      parsedRows.length === 0
        ? "Ajoute au moins un ingrédient"
        : parsedRows.some((r) => !Number.isFinite(r.qty) || r.qty <= 0)
          ? "Indique une quantité valide pour chaque ingrédient"
          : null,
    steps: steps.every((st) => !st.trim()) ? "Ajoute au moins une étape" : null,
    other: localDiets.includes("Autre") && !otherDiet.trim() ? "Précise le régime « Autre »" : null,
  };
  // ── Critères obligatoires pour une recette PUBLIQUE ──
  // Tout doit être rempli, et les ingrédients doivent tous venir de la BDD
  // (déjà vérifiés par l'équipe). En privé, on garde les critères de base.
  const publicChecks: { label: string; ok: boolean }[] = [
    { label: "Photo du plat", ok: Boolean(image) },
    { label: "Nom (3 caractères min.)", ok: name.trim().length >= 3 },
    { label: "Description (20 caractères min.)", ok: description.trim().length >= 20 },
    { label: "Temps de préparation", ok: (parseInt(prepTime, 10) || 0) > 0 },
    { label: "Temps de cuisson (0 si sans cuisson)", ok: cookTime.trim() !== "" },
    {
      label: "Au moins un régime alimentaire",
      ok: dietIds.length > 0 || localDiets.filter((d) => d !== "Autre").length > 0 || (localDiets.includes("Autre") && otherDiet.trim().length > 0),
    },
    {
      label: "Ingrédients avec quantité",
      ok: parsedRows.length > 0 && parsedRows.every((r) => Number.isFinite(r.qty) && r.qty > 0),
    },
    { label: "Uniquement des ingrédients de la base", ok: parsedRows.length > 0 && unknownRows.length === 0 },
    { label: "Toutes les étapes remplies", ok: steps.length > 0 && steps.every((st) => st.trim().length > 0) },
  ];
  const publicMissing = isPublic ? publicChecks.filter((c) => !c.ok) : [];
  const hasErrors = Object.values(errors).some(Boolean) || publicMissing.length > 0;

  const estimate = useMemo(() => {
    const total = parsedRows.reduce(
      (sum, r) => sum + (Number.isFinite(r.qty) ? estimateIngredientCost({ name: r.name, quantity: r.qty, unit: r.unit }) : 0),
      0,
    );
    return total > 0 ? total / Math.max(1, servings) : null;
  }, [parsedRows, servings]);

  const submit = async () => {
    setTried(true);
    if (hasErrors || saving) return;
    setSaving(true);

    // Les ingrédients absents de la base n'ont pas d'identifiant serveur :
    // ils sont ajoutés en fin de description pour ne pas être perdus.
    const extra = unknownRows.map((r) => `- ${r.name} : ${r.quantity} ${r.unit}`).join("\n");
    const baseDescription = description
      .replace(/\n*Régimes? : .+$/m, "")
      .replace(/\n*Autres ingrédients :[\s\S]*$/, "")
      .trim();
    // Régimes sans identifiant serveur : conservés dans la description
    const freeDiets = localDiets
      .filter((d) => d !== "Autre")
      .concat(localDiets.includes("Autre") && otherDiet.trim() ? [otherDiet.trim()] : []);
    let finalDescription = baseDescription;
    if (freeDiets.length) finalDescription += `${finalDescription ? "\n\n" : ""}Régimes : ${freeDiets.join(", ")}`;
    if (extra) finalDescription += `${finalDescription ? "\n\n" : ""}Autres ingrédients :\n${extra}`;

    const payload: RecipeFormPayload = {
      name: name.trim(),
      description: finalDescription,
      servings,
      is_public: isPublic,
      time: parseInt(prepTime, 10) || undefined,
      prep_time: parseInt(prepTime, 10) || undefined,
      duration: parseInt(cookTime, 10) || undefined,
      difficulty,
      dish_type: dishType,
      image: image ?? undefined,
      diet_ids: dietIds,
      ingredients: parsedRows
        .filter((r) => r.ingredientId !== null)
        .map((r) => ({ ingredient_id: r.ingredientId as number, quantity: r.qty, unit: r.unit })),
      steps: steps.map((st) => st.trim()).filter(Boolean),
    };

    try {
      if (isEdit && recipeId !== null) await updateMyRecipe(recipeId, payload);
      else await createMyRecipe(payload);
      onSaved({ kind: isEdit ? "updated" : "created", name: name.trim() });
    } catch (e) {
      notify("Enregistrement impossible", e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const err = (m: string | null) => (tried && m ? <Text style={styles.error}>{m}</Text> : null);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: palette.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <LinearGradient colors={brandGradient} style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{isEdit ? "Modifier ma recette" : "Nouvelle recette"}</Text>
            <Text style={styles.headerSub}>Liée à ton compte YMeal</Text>
          </View>
        </LinearGradient>

        {loadingRefs ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.inner}>
              {/* Photo + nom sur une seule ligne (format compact mobile) */}
              <View style={styles.topRow}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.9} style={styles.photo} accessibilityLabel="Photo de la recette">
                  {image ? (
                    <>
                      <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      <View style={styles.photoEdit}>
                        <Ionicons name="camera" size={13} color="#FFF" />
                      </View>
                    </>
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={24} color={palette.primaryDark} />
                      <Text style={styles.photoText}>Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.label, { marginTop: 0 }]}>Nom de la recette</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex : Gratin de courgettes"
                    placeholderTextColor={palette.textFaint}
                    value={name}
                    onChangeText={setName}
                    maxLength={90}
                  />
                </View>
              </View>
              {err(errors.name)}

              <Text style={styles.label}>Description <Text style={styles.optional}>(facultatif)</Text></Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Quelques mots pour donner envie…"
                placeholderTextColor={palette.textFaint}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text style={styles.label}>Type de plat</Text>
              <View style={styles.segment}>
                {DISH_TYPES.map((d) => {
                  const on = dishType === d.key;
                  return (
                    <TouchableOpacity key={d.key} style={[styles.segItem, on && styles.segItemOn]} onPress={() => setDishType(d.key)}>
                      <Text style={{ fontSize: 15 }}>{d.emoji}</Text>
                      <Text style={[styles.segText, on && styles.segTextOn]}>{d.key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Difficulté</Text>
              <View style={styles.segment}>
                {DIFFICULTIES.map((d) => {
                  const on = difficulty === d.key;
                  return (
                    <TouchableOpacity key={d.key} style={[styles.segItem, on && styles.segItemOn]} onPress={() => setDifficulty(d.key)}>
                      <Text style={[styles.segText, on && styles.segTextOn]}>{d.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.row3}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Portions</Text>
                  <View style={styles.counter}>
                    <TouchableOpacity onPress={() => setServings(Math.max(1, servings - 1))} hitSlop={6}>
                      <Ionicons name="remove" size={20} color={palette.primaryDark} />
                    </TouchableOpacity>
                    <Text style={styles.counterText}>{servings}</Text>
                    <TouchableOpacity onPress={() => setServings(Math.min(20, servings + 1))} hitSlop={6}>
                      <Ionicons name="add" size={20} color={palette.primaryDark} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Préparation</Text>
                  <TextInput
                    style={[styles.input, { textAlign: "center" }]}
                    placeholder="min"
                    placeholderTextColor={palette.textFaint}
                    keyboardType="number-pad"
                    value={prepTime}
                    onChangeText={(t) => setPrepTime(t.replace(/\D/g, ""))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Cuisson</Text>
                  <TextInput
                    style={[styles.input, { textAlign: "center" }]}
                    placeholder="min"
                    placeholderTextColor={palette.textFaint}
                    keyboardType="number-pad"
                    value={cookTime}
                    onChangeText={(t) => setCookTime(t.replace(/\D/g, ""))}
                  />
                </View>
              </View>

              <Text style={styles.label}>Régime alimentaire</Text>
              <View style={styles.chipWrap}>
                {diets.map((d) => {
                  const on = dietIds.includes(d.id);
                  return (
                    <TouchableOpacity
                      key={`api-${d.id}`}
                      style={[styles.chip, on && styles.chipGreen]}
                      onPress={() => setDietIds((prev) => (on ? prev.filter((x) => x !== d.id) : [...prev, d.id]))}
                    >
                      {on && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{d.name}</Text>
                    </TouchableOpacity>
                  );
                })}
                {/* Mêmes critères que le partage : Végétarien, Halal… et « Autre » en texte libre.
                    Les options déjà fournies par l'API ne sont pas dupliquées. */}
                {DIET_OPTIONS.filter(
                  (opt) => opt === "Autre" || !diets.some((d) => sameIngredient(d.name, opt)),
                ).map((opt) => {
                  const on = localDiets.includes(opt);
                  return (
                    <TouchableOpacity
                      key={`local-${opt}`}
                      style={[styles.chip, on && styles.chipGreen]}
                      onPress={() => setLocalDiets((prev) => (on ? prev.filter((x) => x !== opt) : [...prev, opt]))}
                    >
                      {on && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {localDiets.includes("Autre") && (
                <TextInput
                  style={[styles.input, { marginTop: 10 }]}
                  placeholder="Précise le régime (ex : Pescétarien)"
                  placeholderTextColor={palette.textFaint}
                  value={otherDiet}
                  onChangeText={setOtherDiet}
                  maxLength={30}
                />
              )}
              {err(errors.other)}

              {/* Ingrédients */}
              <Text style={styles.label}>Ingrédients</Text>
              {rows.map((row) => {
                const sugg = suggestionsFor(row);
                return (
                  <View key={row.key} style={styles.ingCard}>
                    <View style={styles.ingTop}>
                      <TextInput
                        style={[styles.input, { flex: 1, minWidth: 0 }]}
                        placeholder="Ingrédient"
                        placeholderTextColor={palette.textFaint}
                        value={row.name}
                        onChangeText={(t) => onNameChange(row.key, t)}
                        onFocus={() => setFocusedRow(row.key)}
                        onBlur={() => setTimeout(() => setFocusedRow((f) => (f === row.key ? null : f)), 150)}
                      />
                      <TextInput
                        style={[styles.input, { width: 76, textAlign: "center" }]}
                        placeholder="Qté"
                        placeholderTextColor={palette.textFaint}
                        keyboardType="decimal-pad"
                        value={row.quantity}
                        onChangeText={(t) => updateRow(row.key, { quantity: t.replace(/[^0-9.,]/g, "") })}
                      />
                      <TouchableOpacity
                        onPress={() => setRows((p) => (p.length > 1 ? p.filter((r) => r.key !== row.key) : p))}
                        disabled={rows.length === 1}
                        style={{ opacity: rows.length === 1 ? 0.3 : 1 }}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={20} color={palette.danger} />
                      </TouchableOpacity>
                    </View>
                    {sugg.length > 0 && (
                      <View style={styles.sugg}>
                        {sugg.map((s) => (
                          <TouchableOpacity
                            key={s.id}
                            style={styles.suggItem}
                            onPress={() => {
                              const ref = findCatalogItem(s.name);
                              updateRow(row.key, { name: s.name, ingredientId: s.id, ...(ref ? { unit: ref.unit } : {}) });
                              setFocusedRow(null);
                            }}
                          >
                            <Text>{s.image || "🥄"}</Text>
                            <Text style={styles.suggText}>{s.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRow} keyboardShouldPersistTaps="handled">
                      {unitsFor(row).map((u) => {
                        const on = row.unit === u;
                        return (
                          <TouchableOpacity key={u} style={[styles.unit, on && styles.unitOn]} onPress={() => updateRow(row.key, { unit: u })}>
                            <Text style={[styles.unitText, on && { color: "#FFF" }]}>{u}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    {row.name.trim().length > 0 && row.ingredientId === null && (
                      <Text style={[styles.ingHint, isPublic && styles.ingHintError]}>
                        {isPublic
                          ? "Ingrédient absent de la base : choisis-en un dans la liste pour publier en public."
                          : "Ingrédient absent de la base : il sera ajouté à la description."}
                      </Text>
                    )}
                  </View>
                );
              })}
              {err(errors.ingredients)}
              <TouchableOpacity style={styles.addLink} onPress={() => setRows((p) => [...p, newRow()])}>
                <Ionicons name="add-circle" size={20} color={palette.primaryDark} />
                <Text style={styles.addLinkText}>Ajouter un ingrédient</Text>
              </TouchableOpacity>
              {estimate !== null && (
                <View style={styles.estimate}>
                  <Ionicons name="wallet-outline" size={16} color={palette.primaryDark} />
                  <Text style={styles.estimateText}>
                    Prix moyen estimé : <Text style={{ fontWeight: "800" }}>≈ {formatEuro(estimate)}</Text> / pers.
                  </Text>
                </View>
              )}

              {/* Étapes */}
              <Text style={styles.label}>Étapes</Text>
              {steps.map((st, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, { flex: 1, minHeight: 40 }]}
                    placeholder={`Étape ${i + 1}`}
                    placeholderTextColor={palette.textFaint}
                    value={st}
                    multiline
                    onChangeText={(t) => setSteps((prev) => prev.map((x, j) => (j === i ? t : x)))}
                  />
                  <TouchableOpacity
                    onPress={() => setSteps((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev))}
                    disabled={steps.length === 1}
                    style={{ opacity: steps.length === 1 ? 0.3 : 1 }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={palette.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
              {err(errors.steps)}
              <TouchableOpacity style={styles.addLink} onPress={() => setSteps((p) => [...p, ""])}>
                <Ionicons name="add-circle" size={20} color={palette.primaryDark} />
                <Text style={styles.addLinkText}>Ajouter une étape</Text>
              </TouchableOpacity>

              <View style={styles.publicRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.publicTitle}>Recette publique</Text>
                  <Text style={styles.publicSub}>
                    {isPublic ? "Visible par tous dans « Recettes »" : "Visible uniquement par toi"}
                  </Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ true: palette.primary, false: "#E5E7EB" }}
                  thumbColor="#FFF"
                />
              </View>

              {isPublic && (
                <View style={[styles.checklist, tried && publicMissing.length > 0 && styles.checklistError]}>
                  <Text style={styles.checklistTitle}>
                    {publicMissing.length === 0
                      ? "✓ Prête à être publiée"
                      : `Pour publier en public, il manque ${publicMissing.length} critère${publicMissing.length > 1 ? "s" : ""}`}
                  </Text>
                  {publicChecks.map((c) => (
                    <View key={c.label} style={styles.checkRow}>
                      <Ionicons
                        name={c.ok ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={c.ok ? palette.success : tried ? palette.danger : palette.textFaint}
                      />
                      <Text style={[styles.checkText, c.ok && styles.checkTextOk]}>{c.label}</Text>
                    </View>
                  ))}
                  {publicMissing.length > 0 && (
                    <TouchableOpacity onPress={() => setIsPublic(false)} style={styles.privateLink}>
                      <Ionicons name="lock-closed-outline" size={14} color={palette.primaryDark} />
                      <Text style={styles.privateLinkText}>Enregistrer en privé à la place</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <TouchableOpacity onPress={submit} disabled={saving} activeOpacity={0.9} style={[styles.save, saving && { opacity: 0.6 }]}>
                <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveInner}>
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name={isEdit ? "save-outline" : "checkmark-circle"} size={20} color="#FFF" />
                      <Text style={styles.saveText}>{isEdit ? "Enregistrer les modifications" : "Ajouter ma recette"}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: Platform.OS === "web" ? 18 : 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFF", letterSpacing: -0.3 },
  headerSub: { fontSize: 14, color: "rgba(255,255,255,0.92)" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 680, alignSelf: "center" },
  topRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  photo: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    overflow: "hidden",
  },
  photoText: { fontWeight: "800", color: palette.primaryDark, fontSize: 11.5 },
  photoEdit: {
    position: "absolute",
    right: 4,
    bottom: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
  },
  photoEditText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  label: { fontSize: 13, fontWeight: "800", color: palette.ink, marginTop: 14, marginBottom: 6 },
  optional: { fontWeight: "500", color: palette.textMuted },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14.5,
    color: palette.ink,
  },
  textarea: { minHeight: 56, textAlignVertical: "top" },
  error: { color: palette.danger, fontSize: 13, marginTop: 6, fontWeight: "600" },
  segment: { flexDirection: "row", gap: 6 },
  segItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  segItemOn: { borderColor: palette.primary, backgroundColor: palette.primarySoft },
  segText: { fontWeight: "700", color: palette.textMuted, fontSize: 13 },
  segTextOn: { color: palette.primaryDark },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  chipOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipGreen: { backgroundColor: palette.success, borderColor: palette.success },
  chipText: { fontWeight: "700", color: palette.textMuted, fontSize: 13 },
  chipTextOn: { color: "#FFF" },
  row3: { flexDirection: "row", gap: 8 },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    height: 40,
  },
  counterText: { fontSize: 16, fontWeight: "800", color: palette.ink },
  ingCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.soft,
  },
  ingTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  sugg: { marginTop: 8, backgroundColor: palette.surfaceMuted, borderRadius: radius.md, overflow: "hidden" },
  suggItem: { flexDirection: "row", gap: 8, alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 },
  suggText: { fontWeight: "600", color: palette.ink },
  unitRow: { gap: 6, paddingTop: 6 },
  unit: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
  },
  unitOn: { backgroundColor: palette.primary, borderColor: palette.primary },
  unitText: { fontSize: 12, fontWeight: "700", color: palette.textMuted },
  ingHintError: { color: palette.danger, fontStyle: "normal", fontWeight: "600" },
  checklist: {
    marginTop: 10,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: palette.border,
  },
  checklistError: { borderColor: palette.danger, backgroundColor: "#FFF7F7" },
  checklistTitle: { fontSize: 13.5, fontWeight: "800", color: palette.ink, marginBottom: 2 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkText: { fontSize: 13, color: palette.textMuted },
  checkTextOk: { color: palette.ink },
  privateLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, alignSelf: "flex-start" },
  privateLinkText: { color: palette.primaryDark, fontWeight: "800", fontSize: 13 },
  ingHint: { marginTop: 6, fontSize: 11.5, color: palette.textMuted, fontStyle: "italic" },
  addLink: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  addLinkText: { color: palette.primaryDark, fontWeight: "800" },
  estimate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.primarySoft,
    borderRadius: radius.md,
    padding: 10,
    marginTop: 4,
  },
  estimateText: { color: palette.ink, fontSize: 13.5 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 7,
  },
  stepNumText: { color: "#FFF", fontWeight: "800" },
  publicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  publicTitle: { fontWeight: "800", color: palette.ink, fontSize: 15 },
  publicSub: { color: palette.textMuted, fontSize: 13, marginTop: 2 },
  save: { marginTop: 16, borderRadius: 999, ...shadow.lifted },
  saveInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 999,
  },
  saveText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
