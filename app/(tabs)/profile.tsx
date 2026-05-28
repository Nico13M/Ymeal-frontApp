import { DIETS } from "@/constants/profileConfig";
import { STORAGE_KEYS } from "@/constants/storage";
import useRequireAuth from "@/src/hooks/useRequireAuth";
import { clearSession, getSession, resolveUserId, updateUserRequest } from "@/src/services/auth";
import {
  BudgetOption,
  fetchAllAllergies,
  fetchAllBudgets,
  fetchAllCuisines,
  fetchAllDiets,
  getProfileRequest,
  ReferenceItem,
  saveUserAllergies,
  saveUserBlacklist,
  saveUserBudget,
  saveUserCuisines,
  saveUserDiets,
  saveUserPersonCount,
  searchIngredients,
  UserProfile
} from "@/src/services/profile";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
type BudgetChoice = "PETIT" | "MOYEN" | "LARGE";
type PeopleChoice = "1" | "2" | "3-4" | "5+";
type IconName = React.ComponentProps<typeof Ionicons>["name"];

type StoredAccount = {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  pseudo?: string;
  email?: string;
};
type EditModalKey = "diet" | "budget" | "people" | "cuisines" | "blacklist" | "allergies";
type AccountDraft = {
  firstName: string;
  lastName: string;
  pseudo: string;
  email: string;
};

type StoredProfileConfig = {
  diets?: string[];
  location?: string;
  budget?: BudgetChoice | null;
  cuisines?: string[];
  avoidVeg?: string[];
  avoid_ingredients?: string[];
  allergies?: string[];
  people?: PeopleChoice | null;
  people_count?: PeopleChoice | null;
};

const BUDGET_LABELS: Record<BudgetChoice, string> = {
  PETIT: "Petit budget (< 100EUR/mois)",
  MOYEN: "Budget moyen (100-200EUR/mois)",
  LARGE: "Budget large (> 200EUR/mois)",
};

const PEOPLE_LABELS: Record<PeopleChoice, string> = {
  "1": "1 personne",
  "2": "2 personnes",
  "3-4": "3-4 personnes",
  "5+": "5+ personnes",
};

const DIET_LABELS = DIETS.reduce<Record<string, string>>((acc, diet) => {
  acc[diet.key] = diet.label;
  return acc;
}, {});

const CONFIG_STEPS = {
  diet: 1,
  budget: 3,
  people: 7,
  cuisines: 4,
  avoidIngredients: 5,
  allergies: 6,
} as const;

function goToConfigurationStep(step: number): void {
  router.push({
    pathname: "/config-profil",
    params: {
      step: String(step),
      editMode: "true",
    },
  });
}

function toDisplayArray(values?: string[]): string[] {
  if (!values || values.length === 0) return [];
  return values;
}

function MultiLineValue({ values, fallback = "Non renseigné" }: { values: string[]; fallback?: string }) {
  if (values.length === 0) {
    return <Text style={styles.infoValue}>{fallback}</Text>;
  }
  return (
    <View style={{ gap: 2 }}>
      {values.map((item, index) => (
        <View key={index} style={styles.infoValueRow}>
          <View style={styles.infoValueDot} />
          <Text style={styles.infoValue}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function resolveAvoidedIngredients(config: StoredProfileConfig | null): string[] | undefined {
  if (!config) return undefined;
  return config.avoidVeg ?? config.avoid_ingredients;
}

function resolvePeople(config: StoredProfileConfig | null): PeopleChoice | null {
  if (!config) return null;
  return config.people ?? config.people_count ?? null;
}

function InfoRow({
  icon,
  label,
  children,
  onPress,
}: {
  icon: IconName;
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color="#FF7A00" />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        {children}
      </View>
      {onPress && (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.75}
          style={styles.editButton}
          accessibilityLabel={`Modifier ${label}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={15} color="#FF7A00" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { checking } = useRequireAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<StoredAccount | null>(null);
  const [config, setConfig] = useState<StoredProfileConfig | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserSaving, setEditUserSaving] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [editUserDebug, setEditUserDebug] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AccountDraft>({
    firstName: "",
    lastName: "",
    pseudo: "",
    email: "",
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editModal, setEditModal] = useState<EditModalKey | null>(null);
  const [saving, setSaving] = useState(false);

  // Référentiels
  const [allDiets, setAllDiets] = useState<ReferenceItem[]>([]);
  const [allAllergies, setAllAllergies] = useState<ReferenceItem[]>([]);
  const [allCuisines, setAllCuisines] = useState<ReferenceItem[]>([]);
  const [ingredientResults, setIngredientResults] = useState<ReferenceItem[]>([]);

  // Valeurs temporaires d'édition
  const [tmpDietIds, setTmpDietIds] = useState<number[]>([]);
  const [tmpAllergyIds, setTmpAllergyIds] = useState<number[]>([]);
  const [tmpCuisineIds, setTmpCuisineIds] = useState<number[]>([]);
  const [tmpBlacklist, setTmpBlacklist] = useState<ReferenceItem[]>([]);
  const [tmpBudget, setTmpBudget] = useState<string>("");
  const [allBudgets, setAllBudgets] = useState<BudgetOption[]>([]);
  const [tmpBudgetId, setTmpBudgetId] = useState<number | null>(null);
  const [tmpPersonCount, setTmpPersonCount] = useState<number>(2);

  // Recherche ingrédients
  const [ingredientQuery, setIngredientQuery] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [accountRaw, configRaw, session, fetchedProfile] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.accountProfile),
        AsyncStorage.getItem(STORAGE_KEYS.profileConfig),
        getSession(),
        getProfileRequest(),
      ]);
      const parsedAccount = accountRaw ? (JSON.parse(accountRaw) as StoredAccount) : null;
      const sessionUserId = resolveUserId(session?.user);
      setAccount(parsedAccount ? { ...parsedAccount, id: parsedAccount.id ?? sessionUserId ?? undefined } : null);
      setConfig(configRaw ? (JSON.parse(configRaw) as StoredProfileConfig) : null);
      setProfile(fetchedProfile);
    } catch {
      setAccount(null);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const fullName = useMemo(() => {
    return [account?.firstName?.trim(), account?.lastName?.trim()].filter(Boolean).join(" ");
  }, [account]);

  const email = useMemo(() => {
    return account?.email?.trim() || "Email non renseigné";
  }, [account]);

  const topName = useMemo(() => {
    const pseudo = account?.pseudo?.trim();
    if (pseudo) return pseudo;
    if (fullName) return fullName;
    return "Etudiant Ymeal";
  }, [account, fullName]);

  const subLine = useMemo(() => {
    const pseudo = account?.pseudo?.trim();
    if (pseudo) return fullName || email;
    return email;
  }, [account, fullName, email]);

  const location = config?.location?.trim() || "Localisation non renseignée";

  const diets = useMemo(() => {
    if (!config?.diets || config.diets.length === 0) return "Non renseigné";
    return config.diets.map((dietKey) => DIET_LABELS[dietKey] || dietKey).join(", ");
  }, [config]);

  const budget = config?.budget ? BUDGET_LABELS[config.budget] : "Non renseigné";
  const peopleKey = resolvePeople(config);
  const people = peopleKey ? PEOPLE_LABELS[peopleKey] : "Non renseigné";

  const onOpenSettings = () => setSettingsOpen(true);
  const onCloseSettings = () => {
    if (!isLoggingOut) setSettingsOpen(false);
  };

  const onEditConfiguration = () => {
    setSettingsOpen(false);
    router.push("/modifier-profil");
  };

  const onOpenEditUser = () => {
    setEditDraft({
      firstName: account?.firstName?.trim() || "",
      lastName: account?.lastName?.trim() || "",
      pseudo: account?.pseudo?.trim() || "",
      email: account?.email?.trim() || "",
    });
    setEditUserError(null);
    setEditUserDebug(null);
    setSettingsOpen(false);
    setEditUserOpen(true);
  };

  const onCloseEditUser = () => {
    if (!editUserSaving) {
      setEditUserOpen(false);
      setEditUserError(null);
      setEditUserDebug(null);
    }
  };

  const onSaveUser = async () => {
    if (editUserSaving) return;

    const session = await getSession();
    const nextAccount: StoredAccount = {
      firstName: editDraft.firstName.trim(),
      lastName: editDraft.lastName.trim(),
      pseudo: editDraft.pseudo.trim(),
      email: editDraft.email.trim().toLowerCase(),
    };

    if (!nextAccount.firstName || !nextAccount.lastName || !nextAccount.email) {
      setEditUserError("Le prenom, le nom et l'email sont obligatoires.");
      return;
    }

    const userId = account?.id ?? resolveUserId(session?.user);
    setEditUserDebug(
      `userId: ${userId ?? "null"} | account.id: ${account?.id ?? "null"} | session.user: ${JSON.stringify(session?.user)}`
    );

    if (!userId) {
      setEditUserError(
        "Identifiant utilisateur introuvable. Deconnecte-toi puis reconnecte-toi pour regenerer ton profil."
      );
      return;
    }

    try {
      setEditUserSaving(true);
      setEditUserError(null);
      await updateUserRequest(
        userId,
        {
          firstname: nextAccount.firstName,
          lastname: nextAccount.lastName,
          pseudo: nextAccount.pseudo,
          email: nextAccount.email,
        },
        { onDebug: (message) => setEditUserDebug(message) }
      );
      await AsyncStorage.setItem(STORAGE_KEYS.accountProfile, JSON.stringify(nextAccount));
      setAccount(nextAccount);
      setEditUserOpen(false);
      setSettingsOpen(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setEditUserError(errorMsg);
    } finally {
      setEditUserSaving(false);
    }
  };

  const onLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await clearSession();
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.accountProfile,
        STORAGE_KEYS.profileConfig,
      ]);
      setSettingsOpen(false);
      router.replace("/connexion");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const openModal = async (key: EditModalKey) => {
    setEditModal(key);
    try {
      if (key === "diet") {
        if (!allDiets.length) {
          const diets = await fetchAllDiets();
          setAllDiets(Array.isArray(diets) ? diets : []);
        }
        setTmpDietIds(profile?.diets.map((d) => d.id) ?? []);
      }
      if (key === "allergies") {
        if (!allAllergies.length) {
          const allergies = await fetchAllAllergies();
          setAllAllergies(Array.isArray(allergies) ? allergies : []);
        }
        setTmpAllergyIds(profile?.allergies.map((a) => a.id) ?? []);
      }
      if (key === "cuisines") {
        if (!allCuisines.length) {
          const cuisines = await fetchAllCuisines();
          setAllCuisines(Array.isArray(cuisines) ? cuisines : []);
        }
        setTmpCuisineIds(profile?.cuisines.map((c) => c.id) ?? []);
      }
      if (key === "blacklist") setTmpBlacklist(profile?.blacklist ?? []);
      if (key === "budget") {
          if (!allBudgets.length) {
            const budgets = await fetchAllBudgets();
            setAllBudgets(budgets);
          }
        setTmpBudgetId(profile?.budget?.id ?? null);
    }
      if (key === "people") setTmpPersonCount(profile?.personCount ?? 2);
    } catch (error) {
      console.error("Error opening modal:", error);
    }
  };

  const closeModal = () => {
    setEditModal(null);
    setIngredientQuery("");
    setIngredientResults([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editModal === "diet")      await saveUserDiets(tmpDietIds);
      if (editModal === "allergies") await saveUserAllergies(tmpAllergyIds);
      if (editModal === "cuisines")  await saveUserCuisines(tmpCuisineIds);
      if (editModal === "blacklist") await saveUserBlacklist(tmpBlacklist.map((b) => b.id));
      if (editModal === "budget" && tmpBudgetId !== null) {
        await saveUserBudget(tmpBudgetId);
      }
      if (editModal === "people")    await saveUserPersonCount(tmpPersonCount);
      await loadProfile();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id: number, list: number[], setter: (v: number[]) => void) => {
    setter(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  };

  const handleIngredientSearch = (q: string) => {
    setIngredientQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.trim().length < 3) { setIngredientResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      const results = await searchIngredients(q);
      setIngredientResults(results.filter((r) => !tmpBlacklist.some((b) => b.id === r.id)));
    }, 300);
  };

  const addToBlacklist = (item: ReferenceItem) => {
    setTmpBlacklist((prev) => [...prev, item]);
    setIngredientResults((prev) => prev.filter((r) => r.id !== item.id));
    setIngredientQuery("");
  };

  // ✅ NOW the conditional early returns are safe
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </SafeAreaView>
    );
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Vérification de la session...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (styles.content?.paddingBottom || 0) + insets.bottom + 16 },
        ]}
      >
        <LinearGradient
          colors={["#FFA245", "#FF7A00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.identityRow}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={46} color="#FF7A00" />
              </View>
            </View>
            <View style={styles.identityTextWrap}>
              <Text style={styles.name}>{topName}</Text>
              <Text style={styles.subText}>{subLine}</Text>
            </View>
            <TouchableOpacity
              onPress={onOpenSettings}
              activeOpacity={0.85}
              style={styles.settingsIconButton}
              accessibilityLabel="Ouvrir les paramètres"
            >
              <Ionicons name="settings-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color="#FFF" />
            <Text style={styles.locationText}>
              {location}
            </Text>
          </View>
        </LinearGradient>

        <View
          style={[
            styles.sheet,
            Platform.OS === "web" && styles.webSheet,
          ]}
        >
          <Text style={styles.sheetTitle}>{"Informations d'inscription"}</Text>

          <InfoRow icon="leaf-outline" label="Regime alimentaire" onPress={() => openModal("diet")}>
            <MultiLineValue values={profile?.diets.map((d) => d.name) ?? config?.diets?.map((k) => DIET_LABELS[k] || k) ?? []} />
          </InfoRow>

          <InfoRow icon="wallet-outline" label="Budget mensuel" onPress={() => openModal("budget")}>
            <Text style={styles.infoValue}>
              {profile?.budget?.label ?? "Non renseigné"}
            </Text>
          </InfoRow>

          <InfoRow icon="people-outline" label="Nombre de personnes" onPress={() => openModal("people")}>
            <Text style={styles.infoValue}>
              {profile?.personCount != null ? `${profile.personCount} personne(s)` : peopleKey ? PEOPLE_LABELS[peopleKey] : "Non renseigné"}
            </Text>
          </InfoRow>

          <InfoRow icon="restaurant-outline" label="Cuisines favorites" onPress={() => openModal("cuisines")}>
            <MultiLineValue values={profile?.cuisines.map((c) => c.name) ?? config?.cuisines ?? []} />
          </InfoRow>

          <InfoRow icon="ban-outline" label="Ingredients à éviter" onPress={() => openModal("blacklist")}>
            <MultiLineValue values={profile?.blacklist.map((b) => b.name) ?? resolveAvoidedIngredients(config) ?? []} />
          </InfoRow>

          <InfoRow icon="medkit-outline" label="Allergies" onPress={() => openModal("allergies")}>
            <MultiLineValue values={profile?.allergies.map((a) => a.name) ?? config?.allergies ?? []} />
          </InfoRow>
        </View>
      </ScrollView>

      {/* Modal paramètres */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="fade"
        onRequestClose={onCloseSettings}
      >
        <Pressable style={styles.settingsBackdrop} onPress={onCloseSettings}>
          <Pressable style={styles.settingsSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.settingsTitle}>Paramètres du profil</Text>

            <TouchableOpacity
              style={styles.settingsAction}
              onPress={onOpenEditUser}
              activeOpacity={0.85}
            >
              <View style={styles.settingsActionIcon}>
                <Ionicons name="person-circle-outline" size={18} color="#FF7A00" />
              </View>
              <View style={styles.settingsActionTextWrap}>
                <Text style={styles.settingsActionTitle}>Modifier mes informations</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsAction, styles.settingsDangerAction]}
              onPress={onLogout}
              activeOpacity={0.85}
              disabled={isLoggingOut}
            >
              <View style={[styles.settingsActionIcon, styles.settingsDangerIcon]}>
                <Ionicons name="log-out-outline" size={18} color="#DC2626" />
              </View>
              <View style={styles.settingsActionTextWrap}>
                <Text style={styles.settingsDangerTitle}>
                  {isLoggingOut ? "Deconnexion..." : "Se deconnecter"}
                </Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal modifier infos */}
      <Modal
        visible={editUserOpen}
        transparent
        animationType="fade"
        onRequestClose={onCloseEditUser}
      >
        <Pressable style={styles.settingsBackdrop} onPress={onCloseEditUser}>
          <Pressable style={styles.settingsSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.settingsTitle}>Modifier mes infos</Text>
            <Text style={styles.settingsSubtitle}>
              Mets à jour ton prénom, ton nom et ton email.
            </Text>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Prénom</Text>
              <TextInput
                value={editDraft.firstName}
                onChangeText={(value) => setEditDraft((prev) => ({ ...prev, firstName: value }))}
                placeholder="Prénom"
                style={styles.editInput}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Nom</Text>
              <TextInput
                value={editDraft.lastName}
                onChangeText={(value) => setEditDraft((prev) => ({ ...prev, lastName: value }))}
                placeholder="Nom"
                style={styles.editInput}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Pseudo</Text>
              <TextInput
                value={editDraft.pseudo}
                onChangeText={(value) => setEditDraft((prev) => ({ ...prev, pseudo: value }))}
                placeholder="Pseudo"
                style={styles.editInput}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Email</Text>
              <TextInput
                value={editDraft.email}
                onChangeText={(value) => setEditDraft((prev) => ({ ...prev, email: value }))}
                placeholder="email@exemple.fr"
                style={styles.editInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {editUserDebug ? <Text style={styles.editDebug}>{editUserDebug}</Text> : null}
            {editUserError ? <Text style={styles.editError}>{editUserError}</Text> : null}

            <View style={styles.editActionsRow}>
              <TouchableOpacity
                style={[styles.editAction, styles.editCancelAction]}
                onPress={onCloseEditUser}
                activeOpacity={0.85}
                disabled={editUserSaving}
              >
                <Text style={styles.editCancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editAction, styles.editSaveAction]}
                onPress={onSaveUser}
                activeOpacity={0.85}
                disabled={editUserSaving}
              >
                <Text style={styles.editSaveText}>
                  {editUserSaving ? "Enregistrement..." : "Enregistrer"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL RÉGIMES */}
      <Modal visible={editModal === "diet"} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.settingsBackdrop} onPress={closeModal}>
          <Pressable style={styles.settingsSheet} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.settingsTitle}>Régimes alimentaires</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color="#334155" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 4 }}>
                {allDiets.map((item) => {
                  const active = tmpDietIds.includes(item.id);
                  return (
                    <TouchableOpacity key={item.id} onPress={() => toggle(item.id, tmpDietIds, setTmpDietIds)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: active ? "#FF7A00" : "#FFF", borderColor: active ? "#FF7A00" : "#DDD" }}>
                      <Text style={{ color: active ? "#FFF" : "#555", fontWeight: "600" }}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity style={[styles.editSaveAction, { minHeight: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", opacity: saving ? 0.6 : 1 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.editSaveText}>Sauvegarder</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL ALLERGIES */}
      <Modal visible={editModal === "allergies"} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.settingsBackdrop} onPress={closeModal}>
          <Pressable style={styles.settingsSheet} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.settingsTitle}>Allergies</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color="#334155" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 4 }}>
                {allAllergies.map((item) => {
                  const active = tmpAllergyIds.includes(item.id);
                  return (
                    <TouchableOpacity key={item.id} onPress={() => toggle(item.id, tmpAllergyIds, setTmpAllergyIds)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: active ? "#FF7A00" : "#FFF", borderColor: active ? "#FF7A00" : "#DDD" }}>
                      <Text style={{ color: active ? "#FFF" : "#555", fontWeight: "600" }}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity style={[styles.editSaveAction, { minHeight: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", opacity: saving ? 0.6 : 1 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.editSaveText}>Sauvegarder</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL CUISINES */}
      <Modal visible={editModal === "cuisines"} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.settingsBackdrop} onPress={closeModal}>
          <Pressable style={styles.settingsSheet} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.settingsTitle}>Cuisines favorites</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color="#334155" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 4 }}>
                {allCuisines.map((item) => {
                  const active = tmpCuisineIds.includes(item.id);
                  return (
                    <TouchableOpacity key={item.id} onPress={() => toggle(item.id, tmpCuisineIds, setTmpCuisineIds)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: active ? "#FF7A00" : "#FFF", borderColor: active ? "#FF7A00" : "#DDD" }}>
                      <Text style={{ color: active ? "#FFF" : "#555", fontWeight: "600" }}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity style={[styles.editSaveAction, { minHeight: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", opacity: saving ? 0.6 : 1 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.editSaveText}>Sauvegarder</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL BLACKLIST */}
      <Modal visible={editModal === "blacklist"} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.settingsBackdrop} onPress={closeModal}>
          <Pressable style={styles.settingsSheet} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.settingsTitle}>Ingrédients à éviter</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color="#334155" /></TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#E2E8F0", marginVertical: 8 }}>
              <Ionicons name="search" size={18} color="#888" />
              <TextInput style={{ flex: 1, marginLeft: 8, fontSize: 14, color: "#333" }} placeholder="Rechercher (3 car. min)..." placeholderTextColor="#AAA" value={ingredientQuery} onChangeText={handleIngredientSearch} />
              {ingredientQuery.length > 0 && <TouchableOpacity onPress={() => { setIngredientQuery(""); setIngredientResults([]); }}><Ionicons name="close-circle" size={18} color="#888" /></TouchableOpacity>}
            </View>
            {ingredientResults.length > 0 && (
              <View style={{ backgroundColor: "#FFF", borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 8, overflow: "hidden" }}>
                {ingredientResults.map((item) => (
                  <TouchableOpacity key={item.id} onPress={() => addToBlacklist(item)}
                    style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
                    <Text style={{ fontSize: 14, color: "#333" }}>{item.name}</Text>
                    <Ionicons name="add-circle" size={20} color="#FF7A00" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <ScrollView style={{ maxHeight: 200 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {tmpBlacklist.map((item) => (
                  <View key={item.id} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#FFCDD2", backgroundColor: "#FFF5F5" }}>
                    <Text style={{ color: "#C62828", fontWeight: "600" }}>{item.name}</Text>
                    <TouchableOpacity onPress={() => setTmpBlacklist((p) => p.filter((b) => b.id !== item.id))} style={{ marginLeft: 6 }}>
                      <Ionicons name="close-circle" size={16} color="#C62828" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={[styles.editSaveAction, { minHeight: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8, opacity: saving ? 0.6 : 1 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.editSaveText}>Sauvegarder</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL BUDGET */}
     <Modal visible={editModal === "budget"} transparent animationType="slide" onRequestClose={closeModal}>
  <Pressable style={styles.settingsBackdrop} onPress={closeModal}>
    <Pressable style={styles.settingsSheet} onPress={(e) => e.stopPropagation()}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.settingsTitle}>Budget mensuel</Text>
        <TouchableOpacity onPress={closeModal}>
          <Ionicons name="close" size={22} color="#334155" />
        </TouchableOpacity>
      </View>

      <View style={{ gap: 10, paddingVertical: 8 }}>
        {allBudgets.map((budget) => {
          const active = tmpBudgetId === budget.id;
          return (
            <TouchableOpacity
              key={budget.id}
              onPress={() => setTmpBudgetId(budget.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: active ? "#FF7A00" : "#E2E8F0",
                backgroundColor: active ? "#FFF5EB" : "#FAFAFA",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800", color: active ? "#FF7A00" : "#334155", fontSize: 15 }}>
                  {budget.label}
                </Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={22} color="#FF7A00" />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.editSaveAction, { minHeight: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", opacity: saving ? 0.6 : 1 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator size="small" color="#FFF" />
          : <Text style={styles.editSaveText}>Sauvegarder</Text>
        }
      </TouchableOpacity>
    </Pressable>
  </Pressable>
</Modal>

      {/* MODAL NOMBRE DE PERSONNES */}
      <Modal visible={editModal === "people"} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.settingsBackdrop} onPress={closeModal}>
          <Pressable style={styles.settingsSheet} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.settingsTitle}>Nombre de personnes</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={22} color="#334155" /></TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, paddingVertical: 16 }}>
              <TouchableOpacity onPress={() => setTmpPersonCount(Math.max(1, tmpPersonCount - 1))}>
                <Ionicons name="remove-circle-outline" size={42} color="#FF7A00" />
              </TouchableOpacity>
              <Text style={{ fontSize: 36, fontWeight: "900", color: "#FF7A00", minWidth: 50, textAlign: "center" }}>{tmpPersonCount}</Text>
              <TouchableOpacity onPress={() => setTmpPersonCount(tmpPersonCount + 1)}>
                <Ionicons name="add-circle-outline" size={42} color="#FF7A00" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.editSaveAction, { minHeight: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", opacity: saving ? 0.6 : 1 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.editSaveText}>Sauvegarder</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7EC" },
  scroll: { flex: 1, backgroundColor: "#FFF7EC" },
  content: { flexGrow: 1, paddingBottom: 24 },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFF7EC",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: { color: "#475569", fontSize: 14, fontWeight: "600" },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 70,
    paddingBottom: 82,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },

  webSheet: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },

  locationText: {
  color: "#FFF",
  fontSize: 12,
  fontWeight: "700",

  // évite le débordement
  maxWidth: 220,
},

  settingsIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center" },
  identityTextWrap: { flex: 1, gap: 2 },
  name: { fontSize: 26, fontWeight: "900", color: "#FFF" },
  subText: { fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "600" },
  locationRow: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: "100%",
  },
sheet: {
  marginTop: -48,
  marginHorizontal: 14,
  borderRadius: 20,

  // plus compact sur PC
  paddingVertical: Platform.OS === "web" ? 6 : 10,
  paddingHorizontal: Platform.OS === "web" ? 18 : 12,

  backgroundColor: "#FFF",
  borderWidth: 1,
  borderColor: "#F1E5D5",
  },
  sheetTitle: { fontSize: 19, fontWeight: "900", color: "#0F172A", paddingHorizontal: 6, paddingVertical: 10 },
 infoRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,

  paddingHorizontal: Platform.OS === "web" ? 4 : 6,
  paddingVertical: Platform.OS === "web" ? 8 : 12,

  borderTopWidth: 1,
  borderTopColor: "#F6ECDC",
},
  infoIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,122,0,0.14)", alignItems: "center", justifyContent: "center" },
  infoTextWrap: { flex: 1, gap: 2 },
  infoLabel: { color: "#FF7A00", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.35 },
  infoValue: { color: "#334155", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  editButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,122,0,0.12)", alignItems: "center", justifyContent: "center" },
 
  settingsBackdrop: {
  flex: 1,
  backgroundColor: "rgba(15,23,42,0.45)",
  justifyContent: Platform.OS === "web" ? "center" : "flex-end",
},


 settingsSheet: {
  backgroundColor: "#FFFFFF",

  // mêmes arrondis partout
  borderRadius: 24,

  width: Platform.OS === "web" ? "82%" : "100%",
  maxWidth: 900,

  alignSelf: "center",

  paddingHorizontal: Platform.OS === "web" ? 24 : 16,
  paddingTop: Platform.OS === "web" ? 20 : 16,
  paddingBottom: Platform.OS === "web" ? 24 : 28,

  gap: 12,

  marginBottom: Platform.OS === "web" ? 120 : 0,

  // ombre desktop
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 10,
},


  settingsTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  settingsSubtitle: { fontSize: 13, color: "#475569", lineHeight: 18 },
  settingsAction: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,

  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#EAE4DA",
  backgroundColor: "#FFFDF8",

  paddingHorizontal: Platform.OS === "web" ? 14 : 12,
  paddingVertical: Platform.OS === "web" ? 10 : 12,
},
  settingsDangerAction: { borderColor: "#F4D2D2", backgroundColor: "#FFF9F9" },
  settingsActionIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,122,0,0.14)" },
  settingsDangerIcon: { backgroundColor: "rgba(220,38,38,0.12)" },
  settingsActionTextWrap: { flex: 1, gap: 2 },
  settingsActionTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  settingsDangerTitle: { fontSize: 14, fontWeight: "800", color: "#B91C1C" },
  settingsActionSub: { fontSize: 12, color: "#64748B" },
  infoValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoValueDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#FF7A00", opacity: 0.5, marginTop: 1 },
  editField: { gap: 6 },
  editLabel: { fontSize: 12, fontWeight: "800", color: "#334155" },
  editInput: {
  borderWidth: 1,
  borderColor: "#E2E8F0",
  borderRadius: 12,

  paddingHorizontal: 12,
  paddingVertical: Platform.OS === "web" ? 10 : 12,

  fontSize: 14,
  color: "#0F172A",
  backgroundColor: "#FFF",
},
  editError: { color: "#B91C1C", fontSize: 13, fontWeight: "700" },
  editDebug: { color: "#0F172A", fontSize: 12, fontWeight: "600", lineHeight: 18, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  editActionsRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  editAction: { flex: 1, minHeight: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  editCancelAction: { backgroundColor: "#E2E8F0" },
  editSaveAction: { backgroundColor: "#FF7A00" },
  editCancelText: { color: "#334155", fontSize: 14, fontWeight: "800" },
  editSaveText: { color: "#FFF", fontSize: 14, fontWeight: "800" },

});