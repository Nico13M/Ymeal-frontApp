import { STORAGE_KEYS } from "@/constants/storage";
import { ApiError, getHumanErrorMessage, isTooManyAttempts } from "@/src/lib/api";
import useRateLimit from "@/src/hooks/useRateLimit";
import { loginRequest, resolveUserId, saveSession } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
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


const { width } = Dimensions.get("window");

const isWebDesktop =
  Platform.OS === "web" && width > 900;

const authCardWidth =
  isWebDesktop ? 520 : "100%";


type StoredAccount = {
  id?: string | number;
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
    if (error.status === 401) {
      return "Email ou mot de passe incorrect.";
    }
    if (error.status === 403) {
      // 403 = requête refusée (ex. jeton CSRF manquant ou expiré), pas un mauvais mot de passe
      return "Connexion refusée par le serveur. Actualise la page puis réessaie.";
    }
    if (error.status === 429) {
      return error.message; // « Trop de tentatives, réessayez dans N minutes »
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
  // 429 : bouton désactivé pendant le délai Retry-After (pas de nouvelle tentative automatique)
  const rateLimit = useRateLimit("login");

  const canSubmit = useMemo(() => {
    return !isSubmitting && !rateLimit.isBlocked && email.trim().length > 3 && password.length >= 6;
  }, [email, isSubmitting, password, rateLimit.isBlocked]);

  const onLogin = async () => {
    if (rateLimit.isBlocked) return;
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
      const sessionUserId = resolveUserId(session.user);

      const merged: StoredAccount = {
        id: sessionUserId ?? existing.id,
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

      const profileConfigRaw = await AsyncStorage.getItem(
  STORAGE_KEYS.profileConfig
);

      if (profileConfigRaw) {
        router.replace("/(tabs)");
      } else {
        const createdAt = session?.user?.createdAt;

        if (!createdAt) {
          router.replace("/(tabs)");
          return;
        }

        const createdDate = new Date((createdAt as string) || "").getTime();
        const now = Date.now();

        const ONE_HOUR = 60 * 60 * 1000;

        const isNewUser = now - createdDate < ONE_HOUR;

        if (isNewUser) {
          router.replace("/config-profil");
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (error) {
      if (isTooManyAttempts(error)) {
        rateLimit.block((error as ApiError).retryAfter);
        setFormError(null);
      } else {
        setFormError(getLoginErrorMessage(error));
      }
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
            <Image
  source={require('@/assets/images/logo_ymeal.png')}
  style={styles.authLogo}
  resizeMode="contain"
/>

            {/* <Text style={styles.brand}>Ymeal</Text> */}
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
          onPress={() =>
            router.push({ pathname: "/mot-de-passe", params: email.trim() ? { email: email.trim() } : {} })
          }
          style={styles.forgotWrap}
          hitSlop={8}
          accessibilityRole="link"
        >
          <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={onLogin}
          activeOpacity={0.85}
          disabled={!canSubmit}
        >
          <Text style={styles.buttonText}>
            {rateLimit.isBlocked
              ? `Réessayer dans ${rateLimit.countdown}`
              : isSubmitting
                ? "Connexion..."
                : "Continuer"}
          </Text>
        </TouchableOpacity>
        {rateLimit.message || formError ? (
          <Text style={styles.errorText}>{rateLimit.message ?? formError}</Text>
        ) : null}

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
  paddingVertical: 40,

  justifyContent: "center",

  width: "100%",
},

  header: {
    alignItems: "center",
    marginBottom: 22,
  },
  // logoCircle: {
  //   width: 56,
  //   height: 56,
  //   borderRadius: 28,
  //   backgroundColor: "#FF7A00",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   marginBottom: 12,
  // },
  brand: {
    fontSize: isWebDesktop ? 52 : 34,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
  },

card: {
  width: "100%",

  maxWidth: isWebDesktop ? 520 : "100%",

  alignSelf: "center",

  backgroundColor: "#FFFFFF",

  borderRadius: isWebDesktop ? 32 : 26,

  padding: isWebDesktop ? 32 : 18,

  ...Platform.select({
    ios: {
      shadowColor: "#7A4800",
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },

    android: {
      elevation: 6,
    },

    web: {
      boxShadow: "0px 16px 40px rgba(122,72,0,0.12)",
    },
  }),
},

  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: "#0F172A",
    marginBottom: 16,
  },

  authLogo: {
  width: isWebDesktop ? 180 : 120,
  height: isWebDesktop ? 180 : 120,
  marginBottom: 10,
},

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
    marginTop: 6,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1E5D5",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: "#FFFDF9",
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
    paddingVertical: 15,
    borderRadius: 999,
    shadowColor: "#FF7A00",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
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

forgotWrap: { alignSelf: "flex-end" },

forgotPassword: {
  alignSelf: "flex-end",
  marginTop: 2,
  marginBottom: 12,
  color: "#FF7A00",
  fontSize: 12,
  fontWeight: "600",
},

});
