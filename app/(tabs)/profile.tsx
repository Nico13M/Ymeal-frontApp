import { DIETS } from "@/constants/profileConfig";
import { STORAGE_KEYS } from "@/constants/storage";
import { clearSession } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  firstName?: string;
  lastName?: string;
  nickname?: string;
  email?: string;
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

// ─── Étapes de configuration (adapter selon votre /config-profil) ────────────
// Ajustez les numéros selon l'ordre réel des étapes dans votre config-profil
const CONFIG_STEPS = {
  diet: 1,
  budget: 3,
  people: 7,
  cuisines: 4,
  avoidIngredients: 5,
  allergies: 6,
} as const;

// ─── Helper de navigation vers une étape précise ─────────────────────────────
function goToConfigurationStep(step: number): void {
  router.push({
    pathname: "/config-profil",
    params: {
      step: String(step),
      editMode: "true",
    },
  });
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────
// function toDisplayList(values?: string[]) {
//   if (!values || values.length === 0) return "Non renseigne";
//   return values.join(", ");
// }

function toDisplayArray(values?: string[]): string[] {
  if (!values || values.length === 0) return [];
  return values;
}


function MultiLineValue({ values, fallback = "Non renseigne" }: { values: string[]; fallback?: string }) {
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

function resolveAvoidedIngredients(
  config: StoredProfileConfig | null
): string[] | undefined {
  if (!config) return undefined;
  return config.avoidVeg ?? config.avoid_ingredients;
}

function resolvePeople(
  config: StoredProfileConfig | null
): PeopleChoice | null {
  if (!config) return null;
  return config.people ?? config.people_count ?? null;
}

// ─── Composant InfoRow ────────────────────────────────────────────────────────
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

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<StoredAccount | null>(null);
  const [config, setConfig] = useState<StoredProfileConfig | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const insets = useSafeAreaInsets();
  // const tabBarHeight = useBottomTabBarHeight ? useBottomTabBarHeight() : 0;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [accountRaw, configRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.accountProfile),
        AsyncStorage.getItem(STORAGE_KEYS.profileConfig),
      ]);
      setAccount(
        accountRaw ? (JSON.parse(accountRaw) as StoredAccount) : null
      );
      setConfig(
        configRaw ? (JSON.parse(configRaw) as StoredProfileConfig) : null
      );
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

  const displayName = useMemo(() => {
    const nickname = account?.nickname?.trim();
    if (nickname) return nickname;
    const fullName = [account?.firstName?.trim(), account?.lastName?.trim()]
      .filter(Boolean)
      .join(" ");
    if (fullName) return fullName;
    return "Etudiant Ymeal";
  }, [account]);

  const email = useMemo(() => {
    return account?.email?.trim() || "Email non renseigne";
  }, [account]);

  const location =
    config?.location?.trim() || "Localisation non renseignee";

  const diets = useMemo(() => {
    if (!config?.diets || config.diets.length === 0) return "Non renseigne";
    return config.diets
      .map((dietKey) => DIET_LABELS[dietKey] || dietKey)
      .join(", ");
  }, [config]);

  const budget = config?.budget
    ? BUDGET_LABELS[config.budget]
    : "Non renseigne";
  const peopleKey = resolvePeople(config);
  const people = peopleKey ? PEOPLE_LABELS[peopleKey] : "Non renseigne";

  const onOpenSettings = () => setSettingsOpen(true);
  const onCloseSettings = () => {
    if (!isLoggingOut) setSettingsOpen(false);
  };

const onEditConfiguration = () => {
  setSettingsOpen(false);
  router.push("/modifier-profil");
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

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              (styles.content?.paddingBottom || 0) +
              // tabBarHeight +
              insets.bottom +
              16,
          },
        ]}
      >
        {/* ── Hero gradient ── */}
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
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.subText}>{email}</Text>
            </View>
            <TouchableOpacity
              onPress={onOpenSettings}
              activeOpacity={0.85}
              style={styles.settingsIconButton}
              accessibilityLabel="Ouvrir les parametres"
            >
              <Ionicons name="settings-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color="#FFF" />
            <Text numberOfLines={1} style={styles.locationText}>
              {location}
            </Text>
          </View>
        </LinearGradient>

        {/* ── Fiche info ── */}
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{"Infos d'inscription"}</Text>

<InfoRow
  icon="leaf-outline"
  label="Regime alimentaire"
  onPress={() => goToConfigurationStep(CONFIG_STEPS.diet)}
>
  <MultiLineValue
    values={config?.diets?.map((k) => DIET_LABELS[k] || k) ?? []}
  />
</InfoRow>

<InfoRow
  icon="wallet-outline"
  label="Budget mensuel"
  onPress={() => goToConfigurationStep(CONFIG_STEPS.budget)}
>
  <Text style={styles.infoValue}>
    {config?.budget ? BUDGET_LABELS[config.budget] : "Non renseigne"}
  </Text>
</InfoRow>

<InfoRow
  icon="people-outline"
  label="Nombre de personnes"
  onPress={() => goToConfigurationStep(CONFIG_STEPS.people)}
>
  <Text style={styles.infoValue}>
    {peopleKey ? PEOPLE_LABELS[peopleKey] : "Non renseigne"}
  </Text>
</InfoRow>

<InfoRow
  icon="restaurant-outline"
  label="Cuisines favorites"
  onPress={() => goToConfigurationStep(CONFIG_STEPS.cuisines)}
>
  <MultiLineValue values={config?.cuisines ?? []} />
</InfoRow>

<InfoRow
  icon="ban-outline"
  label="Ingredients a eviter"
  onPress={() => goToConfigurationStep(CONFIG_STEPS.avoidIngredients)}
>
  <MultiLineValue values={resolveAvoidedIngredients(config) ?? []} />
</InfoRow>

<InfoRow
  icon="medkit-outline"
  label="Allergies"
  onPress={() => goToConfigurationStep(CONFIG_STEPS.allergies)}
>
  <MultiLineValue values={config?.allergies ?? []} />
</InfoRow>
        </View>
      </ScrollView>

      {/* ── Modal paramètres ── */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="fade"
        onRequestClose={onCloseSettings}
      >
        <Pressable style={styles.settingsBackdrop} onPress={onCloseSettings}>
          <Pressable
            style={styles.settingsSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.settingsTitle}>Parametres du profil</Text>

            <TouchableOpacity
              style={styles.settingsAction}
              onPress={onEditConfiguration}
              activeOpacity={0.85}
            >
              <View style={styles.settingsActionIcon}>
                <Ionicons name="create-outline" size={18} color="#FF7A00" />
              </View>
              <View style={styles.settingsActionTextWrap}>
                <Text style={styles.settingsActionTitle}>
                  Modifier ma configuration
                </Text>
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
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  identityTextWrap: { flex: 1, gap: 2 },
  name: { fontSize: 26, fontWeight: "900", color: "#FFF" },
  subText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
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
  locationText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  sheet: {
    marginTop: -48,
    marginHorizontal: 14,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F1E5D5",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 4 },
    }),
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  // ── InfoRow ──
  infoRow: {
    flexDirection: "row",
    alignItems: "center",        // ← centrage vertical avec le bouton
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F6ECDC",
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,122,0,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrap: { flex: 1, gap: 2 },
  infoLabel: {
    color: "#FF7A00",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  infoValue: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  // ── Bouton d'édition discret ──
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,122,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Modal paramètres ──
  settingsBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  settingsSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 12,
  },
  settingsTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  settingsAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAE4DA",
    backgroundColor: "#FFFDF8",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  settingsDangerAction: {
    borderColor: "#F4D2D2",
    backgroundColor: "#FFF9F9",
  },
  settingsActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,122,0,0.14)",
  },

infoValueRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
},
infoValueDot: {
  width: 5,
  height: 5,
  borderRadius: 3,
  backgroundColor: "#FF7A00",
  opacity: 0.5,
  marginTop: 1,
},

  settingsDangerIcon: { backgroundColor: "rgba(220,38,38,0.12)" },
  settingsActionTextWrap: { flex: 1, gap: 2 },
  settingsActionTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  settingsDangerTitle: { fontSize: 14, fontWeight: "800", color: "#B91C1C" },
});