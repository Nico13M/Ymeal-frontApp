import React from "react";

import {
  Pressable,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  COLORS,
  CUISINES,
} from "@/constants/profileConfig";

type Props = {
  cuisines: string[];

  toggleCuisine: (
    cuisine: string
  ) => void;

  styles: any;
  isWebDesktop?: boolean;
};

export default function CuisineStep({
  cuisines,
  toggleCuisine,
  styles,
  isWebDesktop,
}: Props) {
  return (
    <>
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons
          name="restaurant-outline"
          size={18}
          color={COLORS.orange}
        />

        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          As-tu une alimentation favorite ?
        </Text>
      </View>

      <Text style={[styles.helper, isWebDesktop && styles.helperDesktop]}>
        Choisis jusqu&apos;à 6 styles de cuisine.
      </Text>

      <View style={[styles.chipsWrap, isWebDesktop && styles.chipsWrapDesktop]}>
        {CUISINES.map((c) => {
          const selected =
            cuisines.includes(c);

          const atLimit =
            !selected &&
            cuisines.length >= 6;

          return (
            <Pressable
              key={c}
              onPress={() =>
                toggleCuisine(c)
              }
              style={[
                styles.chip,

                selected &&
                  styles.chipSelected,

                atLimit &&
                  styles.chipDisabled,
              ]}
            >
              <Text
                style={[
                  styles.chipText,

                  selected &&
                    styles.chipTextSelected,

                  atLimit &&
                    styles.chipTextDisabled,
                ]}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.helper, isWebDesktop && styles.helperDesktop]}>
        Sélectionné: {cuisines.length}/6
      </Text>
    </>
  );
}