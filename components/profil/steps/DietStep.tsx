import React from "react";

import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  COLORS,
  DIETS,
} from "@/constants/profileConfig";

type Props = {
  diets: string[];

  toggleDiet: (
    key: string
  ) => void;

  styles: any;
  isWebDesktop?: boolean;
};

export default function DietStep({
  diets,
  toggleDiet,
  styles,
  isWebDesktop,
}: Props) {
  return (
    <>
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons
          name="leaf-outline"
          size={18}
          color={COLORS.orange}
        />

        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          Quel est ton régime alimentaire ?
        </Text>
      </View>

      <Text style={[styles.helper, isWebDesktop && styles.helperDesktop]}>
        Tu peux en sélectionner plusieurs.
      </Text>

      <View style={[styles.grid, isWebDesktop && styles.gridDesktop]}>
        {DIETS.map((d) => {
          const selected =
            diets.includes(d.key);

          return (
            <TouchableOpacity
              key={d.key}
              onPress={() =>
                toggleDiet(d.key)
              }
              activeOpacity={0.85}
              style={[
                styles.tile,

                selected &&
                  styles.tileSelected,
              ]}
            >
              <Text
                style={styles.tileEmoji}
              >
                {d.icon}
              </Text>

              <Text
                style={[
                  styles.tileText,

                  selected &&
                    styles.tileTextSelected,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}