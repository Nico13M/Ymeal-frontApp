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
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons
          name="people-outline"
          size={18}
          color={COLORS.orange}
        />

        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          Pour combien de personnes cuisines-tu ?
        </Text>
      </View>

      <View style={[{ marginTop: 10 }, isWebDesktop && { maxWidth: 600, alignSelf: "center", width: "100%" }]}>
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
              <Text style={styles.choiceIcon}>
                {p.icon}
              </Text>

              <Text
                style={styles.choiceTitle}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}