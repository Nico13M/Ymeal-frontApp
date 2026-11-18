import InputField from "@/components/ui/InputField";
import { COLORS } from "@/constants/profileConfig";
import { STORAGE_KEYS } from "@/constants/storage";
import { ApiError, getHumanErrorMessage } from "@/src/lib/api";
import { validateRegistration } from "@/src/lib/registration";
import { loginRequest, registerRequest, resolveUserId, saveSession } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, useWindowDimensions, View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

function getRegisterErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Cette adresse email est déjà utilisée.";
    if (error.status === 422) return "Certains champs sont invalides. Vérifie tes informations.";
    if (error.status === 429) return "Trop de tentatives. Réessaie dans quelques minutes.";
  }
  const fallback = getHumanErrorMessage(error, "Inscription impossible pour le moment.");
  const normalized = fallback.toLowerCase();
  if (["already", "existe", "utilise", "email"].some((value) => normalized.includes(value))) {
    return "Cette adresse email est déjà utilisée.";
  }
  return fallback;
}

export default function InscriptionScreen() {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === "web" && width > 900;
  const stackNames = width < 420;
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

  const validation = validateRegistration({ firstName, lastName, nickname, email, password, confirmation: confirm });
  const canSubmit = !loading && validation.isValid;
  const rules = [
    { label: "Au moins 6 caractères", valid: validation.passwordRules.minLength },
    { label: "Une majuscule", valid: validation.passwordRules.hasUpperCase },
    { label: "Un chiffre", valid: validation.passwordRules.hasNumber },
    { label: "Un caractère spécial", valid: validation.passwordRules.hasSpecialChar },
  ];

  const change = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setter(value);
    if (formError) setFormError(null);
  };

  const onContinue = async () => {
    if (loading) return;
    setFormError(null);
    if (!validation.isValid) {
      setFormError(validation.errors.join("\n"));
      return;
    }
    const trimmedFirstname = firstName.trim();
    const trimmedLastname = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();
    try {
      setLoading(true);
      const maybeSession = await registerRequest({
        firstname: trimmedFirstname,
        lastname: trimmedLastname,
        ...(trimmedNickname ? { nickname: trimmedNickname } : {}),
        email: trimmedEmail,
        password,
      });
      const session = maybeSession ?? await loginRequest({ email: trimmedEmail, password });
      await saveSession(session).catch(() => undefined);
      await AsyncStorage.setItem(STORAGE_KEYS.accountProfile, JSON.stringify({
        id: resolveUserId(session.user),
        firstName: trimmedFirstname,
        lastName: trimmedLastname,
        nickname: trimmedNickname || undefined,
        email: trimmedEmail.toLowerCase(),
      })).catch(() => undefined);
      router.replace("/config-profil");
    } catch (error) {
      setFormError(getRegisterErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.orange} />
        <Text style={styles.loadingText}>Préparation…</Text>
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
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={[styles.header, isWebDesktop && styles.headerDesktop]}>
            <Image source={require("@/assets/images/logo_ymeal.png")} style={[styles.logo, isWebDesktop && styles.logoDesktop]} resizeMode="contain" />
            <Text style={styles.tagline}>Des recettes adaptées à ton budget étudiant</Text>
          </View>
          <View style={[styles.card, isWebDesktop && styles.cardDesktop]}>
            <Text style={styles.cardTitle}>Créer un compte</Text>
            <View style={[styles.nameRow, stackNames && styles.nameRowStacked]}>
              <View style={[styles.nameField, stackNames && styles.nameFieldStacked]}>
                <Text style={styles.label}>Prénom</Text>
                <InputField icon="person-outline" value={firstName} onChangeText={change(setFirstName)} placeholder="Prénom" accessibilityLabel="Prénom" autoCapitalize="words" autoComplete="given-name" textContentType="givenName" />
              </View>
              <View style={[styles.nameField, stackNames && styles.nameFieldStacked]}>
                <Text style={styles.label}>Nom</Text>
                <InputField icon="person-outline" value={lastName} onChangeText={change(setLastName)} placeholder="Nom" accessibilityLabel="Nom" autoCapitalize="words" autoComplete="family-name" textContentType="familyName" />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Pseudo</Text>
              <InputField icon="person-outline" value={nickname} onChangeText={change(setNickname)} placeholder="pseudo" accessibilityLabel="Pseudo" autoCapitalize="none" autoCorrect={false} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Adresse email</Text>
              <InputField icon="mail-outline" value={email} onChangeText={change(setEmail)} placeholder="tonemail@etudiant.fr" accessibilityLabel="Adresse email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" importantForAutofill="yes" />
              {email.length > 0 && !validation.isValidEmail && <Text style={styles.fieldError}>Format d’email invalide</Text>}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <InputField
                icon="lock-closed-outline" value={password} onChangeText={change(setPassword)} placeholder="********" accessibilityLabel="Mot de passe"
                secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" autoComplete="password-new" importantForAutofill="yes"
                trailing={(
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((value) => !value)} accessibilityRole="button" accessibilityLabel={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.sub} />
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <InputField
                icon="lock-closed-outline" value={confirm} onChangeText={change(setConfirm)} placeholder="********" accessibilityLabel="Confirmer le mot de passe"
                secureTextEntry={!showConfirmPassword} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" autoComplete="password-new" importantForAutofill="yes"
                trailing={(
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword((value) => !value)} accessibilityRole="button" accessibilityLabel={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.sub} />
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={styles.passwordRules}>
              {rules.map(({ label, valid }) => (
                <Text key={label} style={[styles.rule, !password ? styles.ruleNeutral : valid && styles.ruleOk]}>
                  {!password ? "○" : valid ? "✓" : "✗"} {label}
                </Text>
              ))}
              <Text accessibilityLiveRegion="polite" style={[
                styles.rule,
                validation.passwordMatch === "neutral" && styles.ruleNeutral,
                validation.passwordMatch === "valid" && styles.ruleOk,
              ]}>
                {validation.passwordMatch === "neutral" ? "○" : validation.passwordMatch === "valid" ? "✓" : "✗"}{" "}
                {validation.passwordMatch === "invalid" ? "Les mots de passe ne correspondent pas" : "Les mots de passe correspondent"}
              </Text>
            </View>
            <TouchableOpacity style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={onContinue} activeOpacity={0.85} disabled={!canSubmit} accessibilityRole="button" accessibilityState={{ disabled: !canSubmit }}>
              <Text style={styles.buttonText}>S’inscrire</Text>
            </TouchableOpacity>
            {formError && <Text style={styles.errorText} accessibilityRole="alert">{formError}</Text>}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Déjà un compte ? </Text>
              <Link href="/connexion" style={styles.loginLink}>Se connecter</Link>
            </View>
            <Text style={styles.legal}>En continuant, tu acceptes nos conditions d’utilisation</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: "center", width: "100%" },
  header: { alignItems: "center", marginBottom: 22 },
  headerDesktop: { marginBottom: 40 },
  logo: { width: 120, height: 120, marginBottom: 10 },
  logoDesktop: { width: 180, height: 180 },
  tagline: { marginTop: 6, fontSize: 13, color: COLORS.sub, textAlign: "center" },
  card: {
    width: "100%", maxWidth: 620, minWidth: 0, alignSelf: "center", backgroundColor: COLORS.card, borderRadius: 16, padding: 18,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 6 },
      web: { boxShadow: "0px 8px 24px rgba(0,0,0,0.08)", boxSizing: "border-box" },
    }),
  },
  cardDesktop: { borderRadius: 24, padding: 32 },
  cardTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 20 },
  nameRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  nameRowStacked: { flexDirection: "column" },
  nameField: { flex: 1, minWidth: 0, gap: 8 },
  nameFieldStacked: { flexGrow: 0, flexShrink: 0, flexBasis: "auto", width: "100%" },
  field: { minWidth: 0, gap: 8, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: "#334155" },
  eyeButton: { flexShrink: 0, width: 36, height: 44, alignItems: "center", justifyContent: "center" },
  passwordRules: { gap: 4, paddingHorizontal: 4, marginBottom: 14 },
  rule: { fontSize: 12, lineHeight: 18, color: "#DC2626", fontWeight: "600" },
  ruleNeutral: { color: COLORS.sub },
  ruleOk: { color: "#16A34A" },
  button: { backgroundColor: COLORS.orange, minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  fieldError: { color: "#DC2626", fontSize: 12 },
  errorText: { marginTop: 10, fontSize: 12, color: "#DC2626", textAlign: "center", fontWeight: "600" },
  legal: { marginTop: 12, fontSize: 11, textAlign: "center", color: "#64748B", lineHeight: 16 },
  loginRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 14 },
  loginText: { fontSize: 13, color: COLORS.sub },
  loginLink: { fontSize: 13, fontWeight: "700", color: COLORS.orange },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
  loadingText: { marginTop: 12, color: COLORS.sub, fontWeight: "600" },
});
