import StepIntro from "@/components/profil/StepIntro";
import { COLORS } from "@/constants/profileConfig";
import { BudgetOption } from "@/src/services/profile";
import { BudgetChoice } from "@/types/profil";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  budget: BudgetChoice | null;
  setBudget: (value: BudgetChoice) => void;
  availableBudgets: BudgetOption[];
  isLoading?: boolean;
  styles: any;
  isWebDesktop?: boolean;
};

export default function BudgetStep({
  budget,
  setBudget,
  availableBudgets,
  isLoading = false,
  styles,
  isWebDesktop,
}: Props) {
  return (
    <>
      <StepIntro
        icon="wallet-outline"
        title="Quel est ton budget mensuel ?"
        subtitle="Choisis le budget que tu souhaites consacrer à tes repas."
        isWebDesktop={isWebDesktop}
      />

      {isLoading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.stepControls}>
          {availableBudgets.map((b) => {
            const key = b.key as BudgetChoice;
            const isValid = key === "PETIT" || key === "MOYEN" || key === "LARGE";
            if (!isValid) return null;

            return (
              <Pressable
                key={b.id}
                onPress={() => setBudget(key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: budget === key }}
                style={[
                  styles.choiceRow,
                  budget === key && styles.choiceRowSelected,
                ]}
              >
                <View style={styles.choiceIconWrap}>
                  <Ionicons
                    name={key === "PETIT" ? "wallet-outline" : key === "MOYEN" ? "basket-outline" : "restaurant-outline"}
                    size={24}
                    color={COLORS.orange}
                  />
                </View>
                <View style={styles.choiceLabel}>
                  <Text style={[styles.choiceTitle, budgetStyles.title]}>{b.label}</Text>
                </View>
                <View style={budgetStyles.selection}>
                  <Ionicons
                    name={budget === key ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color={budget === key ? COLORS.orange : COLORS.muted}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );
}

const budgetStyles = StyleSheet.create({
  title: { textAlign: "center" },
  selection: { width: 44, alignItems: "center", justifyContent: "center" },
});
