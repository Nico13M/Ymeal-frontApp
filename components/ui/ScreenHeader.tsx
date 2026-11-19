import { brandGradient, MAX_CONTENT_WIDTH, radius, spacing } from "@/constants/design";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

/** Distance de défilement (px) sur laquelle l'en-tête se réduit. */
export const HEADER_COLLAPSE_DISTANCE = 90;

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Élément à droite (bouton, icône…) */
  right?: React.ReactNode;
  /** Contenu toujours visible sous le titre (onglets…) */
  children?: React.ReactNode;
  /** Contenu qui se replie quand on fait défiler (recherche, statistiques…) */
  collapsible?: React.ReactNode;
  /** Position de défilement de la page : l'en-tête se réduit progressivement */
  scrollY?: Animated.Value;
};

/**
 * En-tête commun : dégradé orange, coins arrondis, léger halo décoratif.
 * Avec `scrollY`, il se réduit au fur et à mesure du défilement :
 * le titre rapetisse, le sous-titre et la partie `collapsible` se replient.
 */
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  children,
  collapsible,
  scrollY,
}: Props) {
  const topPad =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 14 : Platform.OS === "web" ? 40 : 54;

  // Hauteur naturelle de la partie repliable (mesurée à chaque changement de contenu)
  const [foldHeight, setFoldHeight] = useState<number | null>(null);

  const progress = scrollY
    ? scrollY.interpolate({
        inputRange: [0, HEADER_COLLAPSE_DISTANCE],
        outputRange: [0, 1],
        extrapolate: "clamp",
      })
    : null;

  const titleSize = progress ? progress.interpolate({ inputRange: [0, 1], outputRange: [28, 21] }) : 28;
  const paddingBottom = progress
    ? progress.interpolate({ inputRange: [0, 1], outputRange: [spacing.xl, spacing.md + 2] })
    : spacing.xl;
  const paddingTop = progress
    ? progress.interpolate({ inputRange: [0, 1], outputRange: [topPad, topPad - 10] })
    : topPad;
  const fadeOut = progress ? progress.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: "clamp" }) : 1;
  const foldAnimatedHeight =
    progress && foldHeight !== null
      ? progress.interpolate({ inputRange: [0, 1], outputRange: [foldHeight, 0] })
      : undefined;

  const hasFold = Boolean(subtitle || collapsible);

  return (
    <Animated.View style={[styles.shell, { paddingTop, paddingBottom }]}>
      <LinearGradient
        colors={brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.halo} pointerEvents="none" />
      <View style={styles.inner}>
        <View style={styles.row}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Retour">
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
          ) : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Animated.Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={1}>
              {title}
            </Animated.Text>
          </View>
          {right}
        </View>

        {hasFold && (
          <Animated.View
            style={[
              styles.fold,
              foldAnimatedHeight !== undefined && { height: foldAnimatedHeight },
              { opacity: fadeOut },
            ]}
            pointerEvents="box-none"
          >
            <View onLayout={(e) => setFoldHeight(e.nativeEvent.layout.height)}>
              {subtitle ? <Animated.Text style={styles.subtitle}>{subtitle}</Animated.Text> : null}
              {collapsible ? <View style={styles.extra}>{collapsible}</View> : null}
            </View>
          </Animated.View>
        )}

        {children ? <View style={styles.extra}>{children}</View> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: "hidden",
    zIndex: 10,
  },
  halo: {
    position: "absolute",
    right: -60,
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  inner: { width: "100%", maxWidth: MAX_CONTENT_WIDTH - 12, alignSelf: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  fold: { overflow: "hidden" },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.92)",
    marginTop: 2,
  },
  extra: { marginTop: spacing.md + 2 },
});
