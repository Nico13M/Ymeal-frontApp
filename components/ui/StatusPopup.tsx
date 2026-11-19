import { palette, radius } from "@/constants/design";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type StatusKind = "created" | "updated" | "deleted" | "error";

const CONFIG: Record<StatusKind, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  created: { icon: "checkmark-circle", color: "#1B7F3B", bg: "#E8F5E9" },
  updated: { icon: "create", color: "#FF7A00", bg: "#FFF3E6" },
  deleted: { icon: "trash", color: "#DC2626", bg: "#FEE2E2" },
  error: { icon: "alert-circle", color: "#DC2626", bg: "#FEE2E2" },
};

type Props = {
  visible: boolean;
  kind: StatusKind;
  title: string;
  message?: string;
  onClose: () => void;
  /** fermeture automatique (ms) ; 0 = jamais. Les erreurs restent affichées. */
  autoCloseMs?: number;
};

/**
 * Pop-up de confirmation (création, modification, suppression) adaptée au mobile :
 * carte centrée, grosse icône, fermeture par « OK », tap à l'extérieur ou
 * automatiquement après quelques secondes.
 */
export default function StatusPopup({ visible, kind, title, message, onClose, autoCloseMs = 2500 }: Props) {
  const cfg = CONFIG[kind];

  useEffect(() => {
    if (!visible || kind === "error" || !autoCloseMs) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [visible, kind, autoCloseMs, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={styles.card} accessibilityRole="alert">
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={38} color={cfg.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TouchableOpacity style={[styles.btn, { backgroundColor: cfg.color }]} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26,26,46,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 19, fontWeight: "800", color: palette.ink, textAlign: "center" },
  message: { fontSize: 14.5, color: palette.textMuted, textAlign: "center", marginTop: 6, lineHeight: 20 },
  btn: { marginTop: 18, alignSelf: "stretch", paddingVertical: 13, borderRadius: 999, alignItems: "center" },
  btnText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
});
