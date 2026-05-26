import { STORAGE_KEYS } from "@/constants/storage";
import { ApiError, getHumanErrorMessage } from "@/src/lib/api";
import { loginRequest, registerRequest, resolveUserId, saveSession } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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

import { ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";


function getRegisterErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "Cette adresse email est déjà utilisée.";
    }
    if (error.status === 422) {
      return "Certains champs sont invalides. Vérifie tes informations.";
    }
    if (error.status === 429) {
      return "Trop de tentatives. éessaie dans quelques minutes.";
    }
  }

  const fallback = getHumanErrorMessage(error, "Inscription impossible pour le moment.");
  const normalized = fallback.toLowerCase();
  if (
    normalized.includes("already") ||
    normalized.includes("existe") ||
    normalized.includes("utilise") ||
    normalized.includes("email")
  ) {
    return "Cette adresse email est déjà utilisée.";
  }

  return fallback;
}

export default function InscriptionScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email.trim());


const passwordRules = {
  minLength: password.length >= 6,
  hasUpperCase: /[A-Z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-./]/.test(password),
};

  const canSubmit = useMemo(() => {
    return (
      !loading &&
      firstName.trim().length > 1 &&
      lastName.trim().length > 1 &&
      isValidEmail &&
passwordRules.minLength &&
passwordRules.hasUpperCase &&
passwordRules.hasNumber &&
passwordRules.hasSpecialChar &&
      password === confirm
    );
  }, [confirm, email, firstName, lastName, loading, password]);

  const onContinue = async () => {
    const trimmedFirstname = firstName.trim();
    const trimmedLastname = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();
    setFormError(null);

const errors: string[] = [];

if (!trimmedFirstname) errors.push("Prénom manquant");
if (!trimmedLastname) errors.push("Nom manquant");

if (trimmedNickname.length > 0 && trimmedNickname.length < 2) {
  errors.push("Le pseudo doit faire au moins 2 caractères");
}

if (!trimmedEmail) errors.push("Email manquant");
if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
  errors.push("Email invalide");
}

if (!passwordRules.minLength) {
  errors.push("Mot de passe trop court (min 6 caractères)");
}
if (!passwordRules.hasUpperCase) {
  errors.push("Ajoute au moins une majuscule");
}
if (!passwordRules.hasNumber) {
  errors.push("Ajoute au moins un chiffre");
}
if (!passwordRules.hasSpecialChar) {
  errors.push("Ajoute un caractère spécial (!@#$%...)");
}

if (password !== confirm) {
  errors.push("Les mots de passe ne correspondent pas");
}

if (errors.length > 0) {
  setFormError(errors.join("\n"));
  return;
}

    try {
      setLoading(true);

const maybeSession = await registerRequest({
  firstname: trimmedFirstname,
  lastname: trimmedLastname,
  ...(trimmedNickname ? { nickname: trimmedNickname } : {}),
  email: trimmedEmail,
  password,
});

      const session =
        maybeSession ??
        (await loginRequest({
          email: trimmedEmail,
          password,
        }));

      await saveSession(session).catch(() => undefined);

      const accountPayload = {
        id: resolveUserId(session.user),
        firstName: trimmedFirstname,
        lastName: trimmedLastname,
        nickname: trimmedNickname || undefined,
        email: trimmedEmail.toLowerCase(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.accountProfile, JSON.stringify(accountPayload)).catch(
        () => undefined
      );

      router.replace("/config-profil");
    } catch (error) {
      setFormError(getRegisterErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFF7EC",
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: "#475569", fontWeight: "600" }}>Preparation...</Text>
      </SafeAreaView>
    );
  }

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
    source={require("@/assets/images/logo_ymeal.png")}
    style={styles.logo}
    resizeMode="contain"
  />

  <Text style={styles.tagline}>
    Des recettes adaptées à ton budget étudiant
  </Text>
</View>
<View style={styles.card}>
  <Text style={styles.cardTitle}>Créer un compte</Text>

  {/* Labels */}
  <View style={styles.row}>
    <Text style={[styles.label, styles.halfInput]}>Prénom</Text>
    <Text style={[styles.label, styles.halfInput]}>Nom</Text>
  </View>

  {/* Inputs */}
  <View style={styles.row}>
    <View style={styles.halfInput}>
      <View style={styles.inputWrap}>
        <Ionicons name="person-outline" size={18} color="#9AA3AF" />
        <TextInput
          value={firstName}
          onChangeText={(value) => {
            setFirstName(value);
            if (formError) setFormError(null);
          }}
          placeholder="Prénom"
          autoCapitalize="words"
          style={styles.input}
        />
      </View>
    </View>

    <View style={styles.halfInput}>
      <View style={styles.inputWrap}>
        <Ionicons name="person-outline" size={18} color="#9AA3AF" />
        <TextInput
          value={lastName}
          onChangeText={(value) => {
            setLastName(value);
            if (formError) setFormError(null);
          }}
          placeholder="Nom"
          autoCapitalize="words"
          style={styles.input}
        />
      </View>
    </View>
  </View>
            <Text style={styles.label}>Pseudo</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#9AA3AF" />
              <TextInput
                value={nickname}
                onChangeText={(value) => {
                  setNickname(value);
                  if (formError) setFormError(null);
                }}
                placeholder="pseudo"
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
            <Text style={styles.label}>Adresse email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#9AA3AF" />


<TextInput
    value={email}
    onChangeText={(value) => {
      setEmail(value);
      if (formError) setFormError(null);
    }}
    placeholder="tonemail@etudiant.fr"
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}

    textContentType="emailAddress"
    autoComplete="email"
    importantForAutofill="yes"

    style={styles.input}
  />
</View>

  {email.length > 0 && !isValidEmail && (
    <Text style={styles.errorText}>
  Format d'email invalide
</Text>
  )}


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

    textContentType="newPassword"
    autoComplete="password-new"
    importantForAutofill="yes"

    style={styles.input}
  />
<TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
  <Ionicons
    name={showPassword ? "eye-off-outline" : "eye-outline"}
    size={20}
    color="#64748B"
  />
</TouchableOpacity>

            </View>
            {password.length > 0 && (
  <View style={styles.passwordRules}>
    <Text style={[styles.rule, passwordRules.minLength && styles.ruleOk]}>
      {passwordRules.minLength ? "✓" : "✗"} Au moins 6 caractères
    </Text>
    <Text style={[styles.rule, passwordRules.hasUpperCase && styles.ruleOk]}>
      {passwordRules.hasUpperCase ? "✓" : "✗"} Une majuscule
    </Text>
    <Text style={[styles.rule, passwordRules.hasNumber && styles.ruleOk]}>
      {passwordRules.hasNumber ? "✓" : "✗"} Un chiffre
    </Text>
    <Text style={[styles.rule, passwordRules.hasSpecialChar && styles.ruleOk]}>
      {passwordRules.hasSpecialChar ? "✓" : "✗"} Un caractère spécial
    </Text>
  </View>
)}
            <Text style={styles.label}>Confirmation du mot de passe</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#9AA3AF" />
              
<TextInput
  value={confirm}
  onChangeText={(value) => {
    setConfirm(value);
    if (formError) setFormError(null);
  }}
  placeholder="********"
  secureTextEntry={!showConfirmPassword}
  autoCapitalize="none"
  textContentType="newPassword"
  autoComplete="password-new"
  importantForAutofill="yes"
  style={styles.input}
/>

<TouchableOpacity
  onPress={() =>
    setShowConfirmPassword(!showConfirmPassword)
  }
>
  <Ionicons
    name={
      showConfirmPassword
        ? "eye-off-outline"
        : "eye-outline"
    }
    size={20}
    color="#64748B"
  />
</TouchableOpacity>
            </View>
            <TouchableOpacity
             style={[styles.button,
              !canSubmit && styles.buttonDisabled
            ]}
              onPress={onContinue}
              activeOpacity={0.85}
              // disabled={!canSubmit}
              disabled={!canSubmit || loading}
            >
              <Text style={styles.buttonText}>Continuer</Text>
            </TouchableOpacity>

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Déjà un compte ? </Text>
              <Link href="/connexion" style={styles.loginLink}>
                Se connecter
              </Link>
            </View>
            <Text style={styles.legal}>En continuant, tu acceptes nos conditions d&apos;utilisation</Text>
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
  // logoCircle: {
  //   width: 56,
  //   height: 56,
  //   borderRadius: 28,
  //   backgroundColor: "#FF7A00",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   marginBottom: 12,
  // },
  // brand: {
  //   fontSize: 34,
  //   fontWeight: "800",
  //   color: "#0F172A",
  //   letterSpacing: 0.2,
  // },
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
  // buttonDisabled: {
  //   opacity: 0.5,
  // },
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

  legal: {
    marginTop: 12,
    fontSize: 11,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 16,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  loginText: {
    fontSize: 13,
    color: "#475569",
  },
  loginLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF7A00",
  },

  row: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },

buttonDisabled: {
  opacity: 0.5,
},

logo: {
  width: 180,
  height: 120,
  marginBottom: 10,
},

passwordRules: {
  marginBottom: 10,
  gap: 4,
  paddingHorizontal: 4,
},
rule: {
  fontSize: 12,
  color: "#DC2626",
  fontWeight: "600",
},
ruleOk: {
  color: "#16A34A",
},

});
