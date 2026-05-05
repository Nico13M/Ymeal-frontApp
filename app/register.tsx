import { STORAGE_KEYS } from "@/constants/storage";
import { ApiError, getHumanErrorMessage } from "@/src/lib/api";
import { loginRequest, registerRequest, resolveUserId, saveSession } from "@/src/services/auth";
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
import { ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

function getRegisterErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "Cette adresse email est deja utilisee.";
    }
    if (error.status === 422) {
      return "Certains champs sont invalides. Verifie tes informations.";
    }
    if (error.status === 429) {
      return "Trop de tentatives. Reessaie dans quelques minutes.";
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
    return "Cette adresse email est deja utilisee.";
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

  const canSubmit = useMemo(() => {
    return (
      !loading &&
      firstName.trim().length > 1 &&
      lastName.trim().length > 1 &&
      email.trim().length > 3 &&
      password.length >= 6 &&
      confirm.length >= 6 &&
      password === confirm
    );
  }, [confirm, email, firstName, lastName, loading, password]);

  const onContinue = async () => {
    const trimmedFirstname = firstName.trim();
    const trimmedLastname = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();
    setFormError(null);

    if (!trimmedFirstname) {
      setFormError("Renseigne ton prenom.");
      return;
    }

    if (!trimmedLastname) {
      setFormError("Renseigne ton nom.");
      return;
    }

    if (trimmedNickname.length > 0 && trimmedNickname.length < 2) {
      setFormError("Le surnom doit faire au moins 2 caracteres.");
      return;
    }

    if (!trimmedEmail) {
      setFormError("Renseigne ton email.");
      return;
    }

    if (password.length < 6) {
      setFormError("Mot de passe trop court (min 6).");
      return;
    }

    if (password !== confirm) {
      setFormError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);

      const maybeSession = await registerRequest({
        firstname: trimmedFirstname,
        lastname: trimmedLastname,
        nickname: trimmedNickname || undefined,
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

      router.replace("/configuration-profil");
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
            <View style={styles.logoCircle}>
              <Ionicons name="restaurant" size={22} color="#fff" />
            </View>
            <Text style={styles.brand}>Ymeal</Text>
            <Text style={styles.tagline}>Des recettes adaptees a ton budget etudiant</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Creer un compte</Text>

        <Text style={styles.label}>Nom</Text>
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
                placeholder="Prenom"
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

        <Text style={styles.label}>Surnom</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={18} color="#9AA3AF" />
          <TextInput
            value={nickname}
            onChangeText={(value) => {
              setNickname(value);
              if (formError) setFormError(null);
            }}
            placeholder="surnom"
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
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

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
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={onContinue}
          activeOpacity={0.85}
          disabled={!canSubmit}
        >
          <Text style={styles.buttonText}>Continuer</Text>
        </TouchableOpacity>
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Deja un compte ? </Text>
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
});
