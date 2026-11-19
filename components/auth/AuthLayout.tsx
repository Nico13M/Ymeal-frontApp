import { COLORS } from "@/constants/profileConfig";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthLayoutState = { isWebDesktop: boolean; isCompact: boolean };
type Props = {
  title: string;
  subtitle: string;
  heroTitle: string;
  heroDescription: string;
  icon: keyof typeof Ionicons.glyphMap;
  wide?: boolean;
  children: React.ReactNode | ((layout: AuthLayoutState) => React.ReactNode);
};

export default function AuthLayout({ title, subtitle, heroTitle, heroDescription, icon, wide = false, children }: Props) {
  const { width } = useWindowDimensions();
  const [layoutReady, setLayoutReady] = useState(false);
  const isWebDesktop = Platform.OS === "web" && width > 900 && layoutReady;
  useEffect(() => { setLayoutReady(true); }, []);

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
          contentContainerStyle={[styles.content, isWebDesktop && styles.contentDesktop]}
        >
          <View style={[styles.layout, wide && styles.layoutWide, isWebDesktop && styles.layoutDesktop]}>
            <View style={[styles.hero, isWebDesktop && styles.heroDesktop]}>
              <View style={[styles.mascotStage, isWebDesktop && styles.mascotStageDesktop]}>
                <View style={[styles.mascotHalo, isWebDesktop && styles.mascotHaloDesktop]} />
                <Image
                  source={require("@/assets/images/logo_ymeal.png")}
                  style={[styles.logo, isWebDesktop && styles.logoDesktop]}
                  resizeMode="contain"
                  accessibilityLabel="Ymeal"
                />
                {isWebDesktop && (
                  <>
                    <View style={[styles.floatingIcon, styles.floatingFork]} pointerEvents="none">
                      <Ionicons name="restaurant-outline" size={24} color={COLORS.orange} accessible={false} />
                    </View>
                    <View style={[styles.floatingIcon, styles.floatingSparkles]} pointerEvents="none">
                      <Ionicons name="sparkles-outline" size={24} color={COLORS.orange} accessible={false} />
                    </View>
                  </>
                )}
              </View>

              {isWebDesktop ? (
                <View style={styles.heroCopy}>
                  <Text style={styles.heroTitle}>{heroTitle}</Text>
                  <Text style={styles.heroDescription}>
                    {heroDescription}
                  </Text>
                  <View style={styles.highlights}>
                    {([
                      { icon: "restaurant-outline", label: "À tes goûts" },
                      { icon: "wallet-outline", label: "À ton budget" },
                      { icon: "cube-outline", label: "Avec ton frigo" },
                    ] as const).map(({ icon, label }) => (
                      <View key={label} style={styles.highlight}>
                        <Ionicons name={icon} size={18} color={COLORS.orangeDark} accessible={false} />
                        <Text style={styles.highlightText}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={styles.mobileTagline}>Tes envies. Ton budget. Tes recettes.</Text>
              )}
            </View>

            <View style={[styles.card, wide && styles.cardWide, isWebDesktop && styles.cardDesktop, wide && isWebDesktop && styles.cardWideDesktop]}>
              <View style={styles.cardHeading}>
                {isWebDesktop && (
                  <View style={styles.loginIcon}>
                    <Ionicons name={icon} size={26} color={COLORS.orange} accessible={false} />
                  </View>
                )}
                <Text accessibilityRole="header" style={[styles.cardTitle, isWebDesktop && styles.cardTitleDesktop]}>
                  {title}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {subtitle}
                </Text>
              </View>

              {typeof children === "function"
                ? children({ isWebDesktop, isCompact: !layoutReady || width < 420 })
                : children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  keyboard: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  contentDesktop: { paddingHorizontal: 40, paddingVertical: 40 },
  layout: { width: "100%", maxWidth: 1080, alignItems: "center", gap: 24 },
  layoutDesktop: { flexDirection: "row", alignItems: "center", gap: 56 },
  hero: { width: "100%", alignItems: "center" },
  heroDesktop: { flex: 1, width: "auto", alignItems: "flex-start", paddingVertical: 24 },
  mascotStage: { width: 112, height: 116, alignItems: "center", justifyContent: "center" },
  mascotStageDesktop: { width: 236, height: 240 },
  mascotHalo: { position: "absolute", width: 104, height: 104, borderRadius: 52, backgroundColor: "#FFEBD4" },
  mascotHaloDesktop: { width: 224, height: 224, borderRadius: 112 },
  logo: { width: 96, height: 110 },
  logoDesktop: { width: 188, height: 212 },
  floatingIcon: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#FFE0BD",
    ...Platform.select({ web: { boxShadow: "0px 6px 18px rgba(154,52,18,0.08)" } }),
  },
  floatingFork: { bottom: 16, left: -10, transform: [{ rotate: "-10deg" }] },
  floatingSparkles: { top: 16, right: -8, transform: [{ rotate: "8deg" }] },
  mobileTagline: { marginTop: 10, fontSize: 13, lineHeight: 20, color: COLORS.sub, textAlign: "center" },
  heroCopy: { width: "100%", marginTop: 24 },
  heroTitle: { color: COLORS.text, fontSize: 44, lineHeight: 52, fontWeight: "900", letterSpacing: -1.2 },
  heroDescription: { maxWidth: 360, marginTop: 16, color: COLORS.sub, fontSize: 16, lineHeight: 26 },
  highlights: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 28 },
  highlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF0DF",
    borderRadius: 14,
  },
  highlightText: { color: COLORS.orangeDark, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  card: {
    width: "100%",
    maxWidth: 480,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    backgroundColor: COLORS.card,
    ...Platform.select({
      web: { boxShadow: "0px 12px 40px rgba(95,61,25,0.06)" },
      ios: { shadowColor: "#5F3D19", shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 3 },
    }),
  },
  cardDesktop: { width: 480, flexShrink: 0, padding: 36, borderRadius: 32 },
  cardHeading: { alignItems: "center" },
  loginIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1DE",
    marginBottom: 20,
  },
  cardTitle: { color: COLORS.text, fontSize: 25, lineHeight: 34, fontWeight: "900", letterSpacing: -0.5, textAlign: "center" },
  cardTitleDesktop: { fontSize: 28, lineHeight: 36 },
  cardSubtitle: { maxWidth: 330, marginTop: 10, color: COLORS.sub, fontSize: 14, lineHeight: 22, textAlign: "center" },
  layoutWide: { maxWidth: 1180 },
  cardWide: { maxWidth: 560 },
  cardWideDesktop: { width: "56%", maxWidth: 560 },
});
