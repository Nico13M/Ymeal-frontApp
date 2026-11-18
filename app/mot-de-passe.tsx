import { brandGradient, palette, radius, shadow } from "@/constants/design";
import { getHumanErrorMessage } from "@/src/lib/api";
import { PasswordResetUnavailableError, requestPasswordReset } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SUPPORT_EMAIL = "contact@ymeal.fr";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = "idle" | "sent" | "unavailable";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const valid = EMAIL_RE.test(email.trim());

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/connexion");
  };

  const onSend = async () => {
    if (!valid || sending) {
      setError("Entre une adresse e-mail valide.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setStatus("sent");
    } catch (e) {
      if (e instanceof PasswordResetUnavailableError) setStatus("unavailable");
      else setError(getHumanErrorMessage(e, "Impossible d'envoyer l'e-mail pour le moment."));
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={goBack} accessibilityLabel="Retour à la connexion">
          <Ionicons name="chevron-back" size={20} color={palette.ink} />
          <Text style={styles.backText}>Connexion</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <LinearGradient colors={brandGradient} style={styles.icon}>
            <Ionicons name={status === "sent" ? "mail-open" : "key"} size={28} color="#FFF" />
          </LinearGradient>

          {status === "sent" ? (
            <>
              <Text style={styles.title}>Vérifie ta boîte mail</Text>
              <Text style={styles.description}>
                Si un compte existe avec <Text style={styles.bold}>{email.trim()}</Text>, tu vas
                recevoir un lien pour choisir un nouveau mot de passe. Pense à regarder dans les
                spams.
              </Text>
              <TouchableOpacity style={styles.button} onPress={() => router.replace("/connexion")}>
                <Text style={styles.buttonText}>Retour à la connexion</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStatus("idle")} style={styles.secondary}>
                <Text style={styles.secondaryText}>Renvoyer un e-mail</Text>
              </TouchableOpacity>
            </>
          ) : status === "unavailable" ? (
            <>
              <Text style={styles.title}>Service bientôt disponible</Text>
              <Text style={styles.description}>
                La réinitialisation automatique n'est pas encore active. Écris-nous depuis l'adresse
                de ton compte et on t'aide à récupérer l'accès.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() =>
                  Linking.openURL(
                    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                      "Mot de passe oublié",
                    )}&body=${encodeURIComponent(`Bonjour, j'ai oublié le mot de passe du compte ${email.trim()}.`)}`,
                  )
                }
              >
                <Ionicons name="mail-outline" size={18} color="#FFF" />
                <Text style={styles.buttonText}>Contacter le support</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goBack} style={styles.secondary}>
                <Text style={styles.secondaryText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Mot de passe oublié ?</Text>
              <Text style={styles.description}>
                Entre l'adresse e-mail de ton compte : on t'envoie un lien de réinitialisation.
              </Text>

              <Text style={styles.label}>Adresse e-mail</Text>
              <View style={[styles.inputWrap, error && styles.inputError]}>
                <Ionicons name="mail-outline" size={18} color={palette.textFaint} />
                <TextInput
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (error) setError(null);
                  }}
                  placeholder="tonemail@ynov.com"
                  placeholderTextColor={palette.textFaint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={styles.input}
                  onSubmitEditing={onSend}
                  returnKeyType="send"
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, (!valid || sending) && styles.buttonDisabled]}
                onPress={onSend}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>Envoyer le lien</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surfaceMuted },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  back: {
    position: "absolute",
    top: Platform.OS === "web" ? 24 : 56,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    ...shadow.soft,
  },
  backText: { fontWeight: "700", color: palette.ink },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 28,
    padding: 24,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    marginTop: 60,
    ...shadow.lifted,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4, color: "#0F172A" },
  description: { fontSize: 14.5, color: "#475569", marginTop: 8, marginBottom: 18, lineHeight: 21 },
  bold: { fontWeight: "800", color: "#0F172A" },
  label: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F1E5D5",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: "#FFFDF9",
  },
  inputError: { borderColor: palette.danger },
  input: { flex: 1, minWidth: 0, fontSize: 15, color: "#0F172A", height: "100%" },
  error: { color: palette.danger, fontSize: 13, fontWeight: "600", marginTop: 6 },
  button: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FF7A00",
    height: 50,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  secondary: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  secondaryText: { color: "#FF7A00", fontWeight: "800" },
});
