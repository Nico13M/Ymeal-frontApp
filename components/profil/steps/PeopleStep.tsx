import StepIntro from "@/components/profil/StepIntro";
import React from "react";

import {
  Pressable,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/constants/profileConfig";

import { PeopleChoice } from "@/types/profil";

type Props = {
  people: PeopleChoice | null;

  setPeople: (
    value: PeopleChoice
  ) => void;

  styles: any;
  isWebDesktop?: boolean;
};

export default function PeopleStep({
  people,
  setPeople,
  styles,
  isWebDesktop,
}: Props) {
  return (
    <>
      <StepIntro
        icon="people-outline"
        title="Pour combien de personnes cuisines-tu ?"
        subtitle="Indique le nombre de personnes qui partageront tes repas."
        isWebDesktop={isWebDesktop}
      />

      <View style={styles.stepControls}>
        {[
          {
            key: "1",
            label: "1 personne",
            icon: "🧍",
          },

          {
            key: "2",
            label: "2 personnes",
            icon: "🧑‍🤝‍🧑",
          },

          {
            key: "3-4",
            label: "3-4 personnes",
            icon: "👨‍👩‍👧",
          },

          {
            key: "5+",
            label: "5+ personnes",
            icon: "👨‍👩‍👧‍👦",
          },
        ].map((p) => {
          const selected =
            people ===
            (p.key as PeopleChoice);

          return (
            <Pressable
              key={p.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() =>
                setPeople(
                  p.key as PeopleChoice
                )
              }
              style={[
                styles.choiceRow,

                selected &&
                  styles.choiceRowSelected,
              ]}
            >
              <View style={styles.choiceIconWrap}>
                <Text style={styles.choiceIcon}>{p.icon}</Text>
              </View>

              <Text
                style={[styles.choiceTitle, styles.choiceLabel]}
              >
                {p.label}
              </Text>
              <Ionicons
                name={selected ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={selected ? COLORS.orange : COLORS.muted}
              />
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
