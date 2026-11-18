import AuthLayout from "@/components/auth/AuthLayout";
import { authFormStyles as formStyles } from "@/components/auth/formStyles";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InputField from "@/components/ui/InputField";
import { COLORS } from "@/constants/profileConfig";
import { STORAGE_KEYS } from "@/constants/storage";
import { ApiError, getHumanErrorMessage } from "@/src/lib/api";
import { MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH, validateRegistration } from "@/src/lib/registration";
import { loginRequest, registerRequest, resolveUserId, saveSession } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function getRegisterErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Cette adresse email est déjà utilisée.";
    if (error.status === 400 || error.status === 422) return "Certains champs sont invalides. Vérifie tes informations.";
    if (error.status === 429) return "Trop de tentatives. Réessaie dans quelques minutes.";
  }
  const fallback = getHumanErrorMessage(error, "Inscription impossible pour le moment.");
  const normalized = fallback.toLowerCase();
  if (["already", "existe", "utilise", "email"].some((value) => normalized.includes(value))) {
    return "Cette adresse email est déjà utilisée.";
  }
  return fallback;
}

function PasswordRule({ label, state }: { label: string; state: "neutral" | "valid" | "invalid" }) {
  const color = state === "valid" ? "#15803D" : state === "invalid" ? "#B91C1C" : COLORS.sub;
  const status = state === "valid" ? "validé" : state === "invalid" ? "non validé" : "à vérifier";
  return (
    <View style={styles.ruleItem} accessible accessibilityLabel={label + " : " + status}>
      <Ionicons name={state === "valid" ? "checkmark-circle" : state === "invalid" ? "close-circle" : "ellipse-outline"} size={16} color={color} accessible={false} />
      <Text style={[styles.ruleText, { color }]}>{label}</Text>
    </View>
  );
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

  const validation = validateRegistration({ firstName, lastName, nickname, email, password, confirmation: confirm });
  const canSubmit = !loading && validation.isValid;
  const rules = [
    { label: `Au moins ${MIN_PASSWORD_LENGTH} caractères`, valid: validation.passwordRules.minLength },
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

  return (
    <AuthLayout
      title="Bienvenue chez Ymeal !"
      subtitle="Un compte pour des repas qui te ressemblent."
      heroTitle={"Tes envies,\ntes recettes."}
      heroDescription="Rejoins Ymeal pour trouver des idées de repas adaptées à tes goûts, ton budget et ton frigo."
      icon="person-add-outline"
      wide
    >
      {({ isWebDesktop, isCompact }) => (
        <>
          <View style={[formStyles.form, styles.form]}>
            <View style={[styles.pairRow, !isCompact && styles.pairRowInline]}>
              <View style={[formStyles.field, styles.pairedField, !isCompact && styles.inlineField]}>
                <Text style={formStyles.label}>Prénom</Text>
                <InputField
                  icon="person-outline"
                  iconSize={20}
                  containerStyle={formStyles.inputWrap}
                  style={formStyles.input}
                  value={firstName}
                  onChangeText={change(setFirstName)}
                  placeholder="Prénom"
                  accessibilityLabel="Prénom"
                  maxLength={MAX_NAME_LENGTH}
                  autoCapitalize="words"
                  autoComplete="given-name"
                  textContentType="givenName"
                  editable={!loading}
                />
              </View>
              <View style={[formStyles.field, styles.pairedField, !isCompact && styles.inlineField]}>
                <Text style={formStyles.label}>Nom</Text>
                <InputField
                  icon="person-outline"
                  iconSize={20}
                  containerStyle={formStyles.inputWrap}
                  style={formStyles.input}
                  value={lastName}
                  onChangeText={change(setLastName)}
                  placeholder="Nom"
                  accessibilityLabel="Nom"
                  maxLength={MAX_NAME_LENGTH}
                  autoCapitalize="words"
                  autoComplete="family-name"
                  textContentType="familyName"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={[styles.pairRow, isWebDesktop && styles.pairRowInline]}>
              <View style={[formStyles.field, styles.pairedField, isWebDesktop && styles.inlineField]}>
                <View style={styles.optionalLabel}>
                  <Text style={formStyles.label}>Pseudo</Text>
                  <Text style={styles.optionalText}>facultatif</Text>
                </View>
                <InputField
                  icon="at-outline"
                  iconSize={20}
                  containerStyle={formStyles.inputWrap}
                  style={formStyles.input}
                  value={nickname}
                  onChangeText={change(setNickname)}
                  placeholder="Ton pseudo"
                  accessibilityLabel="Pseudo"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              <View style={[formStyles.field, styles.pairedField, isWebDesktop && styles.inlineField]}>
                <Text style={formStyles.label}>Adresse email</Text>
                <InputField
                  icon="mail-outline"
                  iconSize={20}
                  containerStyle={formStyles.inputWrap}
                  style={formStyles.input}
                  value={email}
                  onChangeText={change(setEmail)}
                  placeholder="ton@email.fr"
                  accessibilityLabel="Adresse email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  importantForAutofill="yes"
                  editable={!loading}
                />
                {email.length > 0 && !validation.isValidEmail && (
                  <Text style={styles.fieldError} accessibilityLiveRegion="polite">Format d’email invalide</Text>
                )}
              </View>
            </View>

            <View style={[styles.pairRow, isWebDesktop && styles.pairRowInline]}>
              <View style={[formStyles.field, styles.pairedField, isWebDesktop && styles.inlineField]}>
                <Text style={formStyles.label}>Mot de passe</Text>
                <InputField
                  icon="lock-closed-outline"
                  iconSize={20}
                  containerStyle={formStyles.inputWrap}
                  style={formStyles.input}
                  value={password}
                  onChangeText={change(setPassword)}
                  placeholder="••••••••"
                  accessibilityLabel="Mot de passe"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="password-new"
                  importantForAutofill="yes"
                  editable={!loading}
                  trailing={(
                    <TouchableOpacity
                      style={formStyles.eyeButton}
                      onPress={() => setShowPassword((value) => !value)}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={COLORS.sub} />
                    </TouchableOpacity>
                  )}
                />
              </View>
              <View style={[formStyles.field, styles.pairedField, isWebDesktop && styles.inlineField]}>
                <Text style={formStyles.label}>Confirmer le mot de passe</Text>
                <InputField
                  icon="lock-closed-outline"
                  iconSize={20}
                  containerStyle={formStyles.inputWrap}
                  style={formStyles.input}
                  value={confirm}
                  onChangeText={change(setConfirm)}
                  placeholder="••••••••"
                  accessibilityLabel="Confirmer le mot de passe"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="password-new"
                  importantForAutofill="yes"
                  returnKeyType="go"
                  onSubmitEditing={() => { if (canSubmit) void onContinue(); }}
                  editable={!loading}
                  trailing={(
                    <TouchableOpacity
                      style={formStyles.eyeButton}
                      onPress={() => setShowConfirmPassword((value) => !value)}
                      accessibilityRole="button"
                      accessibilityLabel={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                    >
                      <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color={COLORS.sub} />
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </View>

          <View style={styles.passwordRules}>
            <View style={styles.rulesGrid}>
              {rules.map(({ label, valid }) => (
                <View key={label} style={[styles.ruleSlot, isWebDesktop && styles.ruleSlotDesktop]}>
                  <PasswordRule label={label} state={!password ? "neutral" : valid ? "valid" : "invalid"} />
                </View>
              ))}
            </View>
            <View style={styles.passwordMatch} accessibilityLiveRegion="polite">
              <PasswordRule
                label={validation.passwordMatch === "invalid"
                  ? "Les mots de passe ne correspondent pas"
                  : "Les mots de passe correspondent"}
                state={validation.passwordMatch}
              />
            </View>
          </View>

          {formError ? (
            <View style={formStyles.errorPanel} accessibilityRole="alert">
              <Ionicons name="alert-circle-outline" size={20} color="#B91C1C" accessible={false} />
              <Text style={formStyles.errorText}>{formError}</Text>
            </View>
          ) : null}

          <PrimaryButton
            onPress={onContinue}
            loading={loading}
            disabled={!canSubmit}
            icon="arrow-forward"
            style={formStyles.submitButton}
          >
            S’inscrire
          </PrimaryButton>

          <View style={formStyles.signupRow}>
            <Text style={formStyles.signupText}>Déjà un compte ?</Text>
            <Link href="/connexion" asChild>
              <TouchableOpacity activeOpacity={0.7} hitSlop={6} style={formStyles.signupLink}>
                <Text style={formStyles.signupLinkText}>Se connecter</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <Text style={styles.legal}>En continuant, tu acceptes nos conditions d’utilisation</Text>
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 18 },
  pairRow: { width: "100%", gap: 18 },
  pairRowInline: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  pairedField: { width: "100%" },
  inlineField: { flex: 1, width: "auto" },
  optionalLabel: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 20 },
  optionalText: { color: COLORS.sub, fontSize: 11, lineHeight: 18 },
  fieldError: { color: "#B91C1C", fontSize: 12, lineHeight: 18 },
  passwordRules: {
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3EADF",
    backgroundColor: "#FFF8F0",
  },
  rulesGrid: { flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 6 },
  ruleSlot: { width: "100%" },
  ruleSlotDesktop: { width: "48%" },
  ruleItem: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  ruleText: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  passwordMatch: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F3EADF" },
  legal: { marginTop: 12, color: COLORS.sub, fontSize: 11, lineHeight: 16, textAlign: "center" },
});
