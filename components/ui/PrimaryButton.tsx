import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants/profileConfig";

interface PrimaryButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  children: React.ReactNode;
}

export default function PrimaryButton({
  onPress,
  loading = false,
  disabled = false,
  icon,
  children,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btn, styles.btnPrimary, isDisabled && styles.btnDisabled]}
      activeOpacity={0.85}
      disabled={isDisabled}
    >
      <Text style={styles.btnPrimaryText}>
        {children}
        {icon && !loading && (
          <>
            {" "}
            <Ionicons name={icon as any} size={16} color="#fff" />
          </>
        )}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: COLORS.orange,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
