/**
 * Design tokens YMeal — même code couleur (orange chaleureux + fond crème)
 * et même direction artistique que l'existant, avec une échelle plus cohérente
 * (rayons, ombres douces, typographie) pour un rendu plus moderne.
 */
import { Platform, ViewStyle } from "react-native";

export const palette = {
  // Orange de marque (inchangé)
  primary: "#FF9F1C",
  primaryDark: "#FF7A00",
  primarySoft: "#FFF3E6",
  primaryTint: "#FFEAD9",

  // Fonds
  background: "#FFF9F2",
  surface: "#FFFFFF",
  surfaceMuted: "#FFF7EC",

  // Texte
  ink: "#1A1A2E",
  text: "#334155",
  textMuted: "#64748B",
  textFaint: "#9AA3AF",

  // Bordures
  border: "#F1E5D5",
  borderNeutral: "#E5E7EB",

  // Sémantique
  success: "#00C853",
  successSoft: "#E8F5E9",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  heart: "#E63946",
  info: "#2196F3",
  infoSoft: "#E3F2FD",
  gold: "#FFC107",
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const type = {
  display: { fontSize: 30, fontWeight: "800" as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 12.5, fontWeight: "600" as const },
};

/** Ombres douces teintées d'orange, compatibles iOS / Android / web. */
export const shadow = {
  soft: Platform.select<ViewStyle>({
    web: { boxShadow: "0 6px 20px rgba(120, 72, 0, 0.08)" } as ViewStyle,
    default: {
      shadowColor: "#7A4800",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 3,
    },
  }) as ViewStyle,
  lifted: Platform.select<ViewStyle>({
    web: { boxShadow: "0 14px 34px rgba(120, 72, 0, 0.16)" } as ViewStyle,
    default: {
      shadowColor: "#7A4800",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 8,
    },
  }) as ViewStyle,
};

/** Dégradé de marque pour les en-têtes et boutons principaux. */
export const brandGradient = ["#FFB02E", "#FF9F1C", "#FF7A00"] as const;

/** Largeur max du contenu sur grand écran (web). */
export const MAX_CONTENT_WIDTH = 1100;
