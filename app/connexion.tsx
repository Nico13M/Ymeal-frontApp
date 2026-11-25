import AuthLayout from "@/components/auth/AuthLayout";
import { authFormStyles as styles } from "@/components/auth/formStyles";
import InputField from "@/components/ui/InputField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { COLORS } from "@/constants/profileConfig";
import { STORAGE_KEYS } from "@/constants/storage";
import useRateLimit from "@/src/hooks/useRateLimit";
import { ApiError, getHumanErrorMessage } from "@/src/lib/api";
import { loginRequest, resolveUserId, saveSession } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";


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

      const profileConfigRaw = await AsyncStorage.getItem(STORAGE_KEYS.profileConfig);

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
      if (error instanceof ApiError && error.status === 429) {
        rateLimit.block(error.retryAfter);
        setFormError(null);
      } else {
        setFormError(getLoginErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Content de te revoir !"
      subtitle="Retrouve tes recettes favorites et tes préférences en un instant."
      heroTitle={"Bien manger,\nà ta façon."}
      heroDescription="Des recettes qui suivent tes envies, ton budget et ce qu’il reste dans ton frigo."
      icon="log-in-outline"
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Adresse email</Text>
          <InputField
            icon="mail-outline"
            iconSize={20}
            containerStyle={styles.inputWrap}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (formError) setFormError(null);
            }}
            placeholder="ton.email@etudiant.fr"
            accessibilityLabel="Adresse email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            editable={!isSubmitting}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldHeading}>
            <Text style={styles.label}>Mot de passe</Text>
            <Link href="/mot-de-passe" asChild>
              <TouchableOpacity activeOpacity={0.7} hitSlop={8} style={styles.forgotLink}>
                <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <InputField
            icon="lock-closed-outline"
            iconSize={20}
            containerStyle={styles.inputWrap}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (formError) setFormError(null);
            }}
            placeholder="Ton mot de passe"
            accessibilityLabel="Mot de passe"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => { if (canSubmit) void onLogin(); }}
            editable={!isSubmitting}
            style={styles.input}
            trailing={(
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={COLORS.sub} />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {formError ? (
        <View style={styles.errorPanel} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={20} color="#B91C1C" accessible={false} />
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      ) : null}

      <PrimaryButton
        onPress={onLogin}
        loading={isSubmitting}
        disabled={!canSubmit}
        icon="arrow-forward"
        style={styles.submitButton}
      >
        Se connecter
      </PrimaryButton>

      <View style={styles.signupRow}>
        <Text style={styles.signupText}>Pas encore de compte ?</Text>
        <Link href="/register" asChild>
          <TouchableOpacity activeOpacity={0.7} hitSlop={6} style={styles.signupLink}>
            <Text style={styles.signupLinkText}>Créer un compte</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AuthLayout>
  );
}
