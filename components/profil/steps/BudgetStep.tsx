import { COLORS } from "@/constants/profileConfig";
import { BudgetOption } from "@/src/services/profile";
import { BudgetChoice } from "@/types/profil";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

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
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons name="wallet-outline" size={18} color={COLORS.orange} />
        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          Quel est ton budget mensuel ?
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 24 }} />
      ) : (
        <View
          style={[
            { marginTop: 8 },
            isWebDesktop && { maxWidth: 600, alignSelf: "center", width: "100%" },
          ]}
        >
          {availableBudgets.map((b) => {
            const key = b.key as BudgetChoice;
            const isValid = key === "PETIT" || key === "MOYEN" || key === "LARGE";
            if (!isValid) return null;

            return (
              <Pressable
                key={b.id}
                onPress={() => setBudget(key)}
                style={[
                  styles.choiceRow,
                  budget === key && styles.choiceRowSelected,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.choiceTitle}>{b.label}</Text>
                  {b.amount != null && (
                    <Text style={styles.choiceSub}>≤ {b.amount}€/mois</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );
}