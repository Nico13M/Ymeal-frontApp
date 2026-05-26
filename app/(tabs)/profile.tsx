import { DIETS } from "@/constants/profileConfig";
import { STORAGE_KEYS } from "@/constants/storage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  allergies?: string[];
  people?: PeopleChoice | null;
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

function toDisplayList(values?: string[]) {
  if (!values || values.length === 0) return "Non renseigne";
  return values.join(", ");
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color="#FF7A00" />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<StoredAccount | null>(null);
  const [config, setConfig] = useState<StoredProfileConfig | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [accountRaw, configRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.accountProfile),
        AsyncStorage.getItem(STORAGE_KEYS.profileConfig),
      ]);

      setAccount(accountRaw ? (JSON.parse(accountRaw) as StoredAccount) : null);
      setConfig(configRaw ? (JSON.parse(configRaw) as StoredProfileConfig) : null);
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

  const location = config?.location?.trim() || "Localisation non renseignee";

  const diets = useMemo(() => {
    if (!config?.diets || config.diets.length === 0) return "Non renseigne";
    return config.diets.map((dietKey) => DIET_LABELS[dietKey] || dietKey).join(", ");
  }, [config]);

  const budget = config?.budget ? BUDGET_LABELS[config.budget] : "Non renseigne";
  const people = config?.people ? PEOPLE_LABELS[config.people] : "Non renseigne";

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
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
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.subText}>{email}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color="#FFF" />
            <Text numberOfLines={1} style={styles.locationText}>
              {location}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{"Infos d'inscription"}</Text>
          <InfoRow icon="leaf-outline" label="Regime alimentaire" value={diets} />
          <InfoRow icon="wallet-outline" label="Budget mensuel" value={budget} />
          <InfoRow icon="people-outline" label="Nombre de personnes" value={people} />
          <InfoRow
            icon="restaurant-outline"
            label="Cuisines favorites"
            value={toDisplayList(config?.cuisines)}
          />
          <InfoRow
            icon="ban-outline"
            label="Ingredients a eviter"
            value={toDisplayList(config?.avoidVeg)}
          />
          <InfoRow
            icon="medkit-outline"
            label="Allergies"
            value={toDisplayList(config?.allergies)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7EC",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#FFF7EC",
  },
  content: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFF7EC",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 90,
    paddingBottom: 82,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
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
  identityTextWrap: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFF",
  },
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
  locationText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
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
      android: {
        elevation: 4,
      },
    }),
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
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
    marginTop: 2,
  },
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
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
});
