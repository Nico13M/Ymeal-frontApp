import { STORAGE_KEYS } from "@/constants/storage";
import { ApiError, getHumanErrorMessage } from "@/src/lib/api";
import { loginRequest, saveSession } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StoredAccount = {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  email?: string;
};

function toStringOrUndefined(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseStoredAccount(raw: string | null): StoredAccount {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as StoredAccount;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Email ou mot de passe incorrect.";
    }
    if (error.status === 429) {
      return "Trop de tentatives. Reessaie dans quelques minutes.";
    }
  }

  const fallback = getHumanErrorMessage(error, "Connexion impossible pour le moment.");
  const normalized = fallback.toLowerCase();
  if (
    normalized.includes("invalid") ||
    normalized.includes("credential") ||
    normalized.includes("mot de passe") ||
    normalized.includes("email")
  ) {
    return "Email ou mot de passe incorrect.";
  }

  return fallback;
}

export default function ConnexionScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return !isSubmitting && email.trim().length > 3 && password.length >= 6;
  }, [email, isSubmitting, password]);

  const onLogin = async () => {
    const trimmedEmail = email.trim();
    setFormError(null);

    if (!trimmedEmail) {
      setFormError("Renseigne ton email.");
      return;
    }

    if (password.length < 6) {
      setFormError("Mot de passe trop court (min 6).");
      return;
    }

    try {
      setIsSubmitting(true);

      const session = await loginRequest({
        email: trimmedEmail,
        password,
      });

      await saveSession(session).catch(() => undefined);

      const existing = parseStoredAccount(await AsyncStorage.getItem(STORAGE_KEYS.accountProfile));
      const sessionUser = (session.user ?? {}) as Record<string, unknown>;

      const merged: StoredAccount = {
        firstName:
          toStringOrUndefined(sessionUser.firstName) ??
          toStringOrUndefined(sessionUser.firstname) ??
          existing.firstName,
        lastName:
          toStringOrUndefined(sessionUser.lastName) ??
          toStringOrUndefined(sessionUser.lastname) ??
          existing.lastName,
        nickname:
          toStringOrUndefined(sessionUser.nickname) ??
          toStringOrUndefined(sessionUser.username) ??
          existing.nickname,
        email:
          toStringOrUndefined(sessionUser.email) ??
          trimmedEmail.toLowerCase() ??
          existing.email,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.accountProfile, JSON.stringify(merged)).catch(
        () => undefined
      );

      const profileConfigRaw = await AsyncStorage.getItem(STORAGE_KEYS.profileConfig);
      if (profileConfigRaw) {
        router.replace("/(tabs)");
      } else {
        router.replace("/config-profil");
      }
    } catch (error) {
      setFormError(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="restaurant" size={22} color="#fff" />
            </View>

            <Text style={styles.brand}>Ymeal</Text>
            <Text style={styles.tagline}>Des recettes adaptees a ton budget etudiant</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Se connecter</Text>

        <Text style={styles.label}>Adresse email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color="#9AA3AF" />
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (formError) setFormError(null);
            }}
            placeholder="ton.email@etudiant.fr"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color="#9AA3AF" />
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (formError) setFormError(null);
            }}
            placeholder="********"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#9AA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
  onPress={() => router.push("/mot-de-passe-oublie" as any)}
>
  <Text style={styles.forgotPassword}>
    Mot de passe oublié ?
  </Text>
</TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={onLogin}
          activeOpacity={0.85}
          disabled={!canSubmit}
        >
          <Text style={styles.buttonText}>{isSubmitting ? "Connexion..." : "Continuer"}</Text>
        </TouchableOpacity>
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <View style={styles.linksRow}>
              <Text style={styles.linkText}>Pas de compte ? </Text>
              <Link href="/register" style={styles.linkAccent}>
                Creer un compte
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7EC",
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 18,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 22,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF7A00",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brand: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 6,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
  },

  button: {
    backgroundColor: "#FF7A00",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
    fontWeight: "600",
  },

  linksRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  linkText: {
    fontSize: 13,
    color: "#475569",
  },
  linkAccent: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF7A00",
  },

forgotPassword: {
  alignSelf: "flex-end",
  marginTop: 2,
  marginBottom: 12,
  color: "#FF7A00",
  fontSize: 12,
  fontWeight: "600",
},

});
