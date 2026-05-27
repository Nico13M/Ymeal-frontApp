import React from "react";

import {
  Pressable,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/constants/profileConfig";

import { BudgetChoice } from "@/types/profil";

type Props = {
  budget: BudgetChoice | null;

  setBudget: (
    value: BudgetChoice
  ) => void;

  styles: any;
  isWebDesktop?: boolean;
};

export default function BudgetStep({
  budget,
  setBudget,
  styles,
  isWebDesktop,
}: Props) {
  return (
    <>
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons
          name="wallet-outline"
          size={18}
          color={COLORS.orange}
        />

        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          Quel est ton budget mensuel ?
        </Text>
      </View>

      <View style={[{ marginTop: 8 }, isWebDesktop && { maxWidth: 600, alignSelf: "center", width: "100%" }]}>
        <Pressable
          onPress={() =>
            setBudget("PETIT")
          }
          style={[
            styles.choiceRow,

            budget === "PETIT" &&
              styles.choiceRowSelected,
          ]}
        >
          <Text style={styles.choiceIcon}>
            💰
          </Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.choiceTitle}>
              Petit budget
            </Text>

            <Text style={styles.choiceSub}>
              &lt; 100€/mois
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() =>
            setBudget("MOYEN")
          }
          style={[
            styles.choiceRow,

            budget === "MOYEN" &&
              styles.choiceRowSelected,
          ]}
        >
          <Text style={styles.choiceIcon}>
            💵
          </Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.choiceTitle}>
              Budget moyen
            </Text>

            <Text style={styles.choiceSub}>
              100-200€/mois
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() =>
            setBudget("LARGE")
          }
          style={[
            styles.choiceRow,

            budget === "LARGE" &&
              styles.choiceRowSelected,
          ]}
        >
          <Text style={styles.choiceIcon}>
            💸
          </Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.choiceTitle}>
              Budget large
            </Text>

            <Text style={styles.choiceSub}>
              &gt; 200€/mois
            </Text>
          </View>
        </Pressable>
      </View>
    </>
  );
}