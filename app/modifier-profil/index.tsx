// import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { STORAGE_KEYS } from "@/constants/storage";
import { getHumanErrorMessage } from "@/src/lib/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

type AccountData = {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  email?: string;
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  password: string;
  passwordConfirm: string;
};

export default function ModifierProfilScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight?.() ?? 0;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    password: "",
    passwordConfirm: "",
  });

  // ── Chargement des données existantes ────────────────────
  useFocusEffect(
    useCallback(() => {
      const loadExistingData = async () => {
        try {
          const [accountRaw, configRaw] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.accountProfile),
            AsyncStorage.getItem(STORAGE_KEYS.profileConfig),
          ]);

          const account: AccountData = accountRaw
            ? JSON.parse(accountRaw)
            : {};
          const config = configRaw ? JSON.parse(configRaw) : {};

          setForm((prev) => ({
            ...prev,
            firstName: account.firstName?.trim() || "",
            lastName: account.lastName?.trim() || "",
            email: account.email?.trim() || "",
            location: config.location?.trim() || "",
          }));
        } catch {
          setError("Impossible de charger les données du profil.");
        } finally {
          setLoading(false);
        }
      };

      loadExistingData();
    }, [])
  );

  const handleInputChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // ── Validation ──────────────────────────────────────────────
  const validateForm = (): boolean => {
    const { firstName, lastName, email, location, password, passwordConfirm } =
      form;

    if (!firstName.trim()) {
      setError("Le prénom est requis.");
      return false;
    }

    if (!lastName.trim()) {
      setError("Le nom est requis.");
      return false;
    }

    if (!email.trim()) {
      setError("L'email est requis.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer une adresse email valide.");
      return false;
    }

    if (!location.trim()) {
      setError("La localisation est requise.");
      return false;
    }

    // Si l'utilisateur entre un mot de passe
    if (password.trim() || passwordConfirm.trim()) {
      if (password !== passwordConfirm) {
        setError("Les mots de passe ne correspondent pas.");
        return false;
      }

      if (password.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères.");
        return false;
      }
    }

    return true;
  };

  // ── Sauvegarde ──────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving) return;

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const { firstName, lastName, email, location } = form;

      // Sauvegarder les infos de compte dans AsyncStorage
      const accountData: AccountData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.accountProfile,
        JSON.stringify(accountData)
      );

      // Sauvegarder la localisation dans la config profil
      const existingConfigRaw = await AsyncStorage.getItem(
        STORAGE_KEYS.profileConfig
      );
      const existingConfig = existingConfigRaw
        ? JSON.parse(existingConfigRaw)
        : {};

      await AsyncStorage.setItem(
        STORAGE_KEYS.profileConfig,
        JSON.stringify({
          ...existingConfig,
          location: location.trim(),
        })
      );

      // Note: La gestion du mot de passe nécessiterait un appel API
      // qui n'est pas implémenté pour le moment.
      // À ajouter ultérieurement : appel à une route /profile/password

      setError(null);
      router.back();
    } catch (err) {
      setError(
        getHumanErrorMessage(
          err,
          "Impossible d'enregistrer les modifications."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        {/* ── Header gradient ── */}
        <LinearGradient
          colors={["#FFA245", "#FF7A00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Modifier mon profil</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        {/* ── Formulaire ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                (insets.bottom || 0) + tabBarHeight + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* ── Section infos personnelles ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations personnelles</Text>

              {/* Prénom */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Prénom *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color="#FF7A00"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Votre prénom"
                    placeholderTextColor="#CBD5E1"
                    value={form.firstName}
                    onChangeText={(v) =>
                      handleInputChange("firstName", v)
                    }
                    editable={!isSaving}
                  />
                </View>
              </View>

              {/* Nom */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nom *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color="#FF7A00"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom"
                    placeholderTextColor="#CBD5E1"
                    value={form.lastName}
                    onChangeText={(v) =>
                      handleInputChange("lastName", v)
                    }
                    editable={!isSaving}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Adresse email *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#FF7A00"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    placeholderTextColor="#CBD5E1"
                    value={form.email}
                    onChangeText={(v) => handleInputChange("email", v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isSaving}
                  />
                </View>
              </View>
            </View>

            {/* ── Section localisation ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Localisation</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Localisation (code postal + ville) *
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color="#FF7A00"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="75001 Paris"
                    placeholderTextColor="#CBD5E1"
                    value={form.location}
                    onChangeText={(v) => handleInputChange("location", v)}
                    editable={!isSaving}
                  />
                </View>
              </View>
            </View>

            {/* ── Section mot de passe (optionnel) ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sécurité (optionnel)</Text>
              <Text style={styles.sectionNote}>
                Laissez vide si vous ne souhaitez pas changer votre mot de passe
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#FF7A00"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#CBD5E1"
                    value={form.password}
                    onChangeText={(v) => handleInputChange("password", v)}
                    secureTextEntry
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Confirmer le mot de passe
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#FF7A00"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#CBD5E1"
                    value={form.passwordConfirm}
                    onChangeText={(v) =>
                      handleInputChange("passwordConfirm", v)
                    }
                    secureTextEntry
                    editable={!isSaving}
                  />
                </View>
              </View>
            </View>

            {/* ── Message d'erreur ── */}
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Boutons ── */}
            <View style={styles.actions}>
              {/* <PrimaryButton
                onPress={handleSave}
                loading={isSaving}
                disabled={isSaving}
              >
                Enregistrer
              </PrimaryButton> */}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7EC" },
  keyboardAvoid: { flex: 1 },
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

  // ── Header ──
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    flex: 1,
  },

  // ── Contenu ──
  scroll: { flex: 1, backgroundColor: "#FFF7EC" },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  form: { gap: 24 },

  // ── Sections ──
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  sectionNote: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
    marginBottom: 8,
  },

  // ── Champs de formulaire ──
  formGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2D5C6",
    borderRadius: 12,
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  inputIcon: { marginTop: 2 },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },

  // ── Message d'erreur ──
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#DC2626",
  },

  // ── Actions ──
  actions: {
    gap: 12,
    marginTop: 12,
  },
});
