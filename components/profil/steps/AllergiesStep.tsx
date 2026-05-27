import React from "react";

import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/constants/profileConfig";

type Props = {
  step: number;

  allergyQuery: string;

  setAllergyQuery: (
    value: string
  ) => void;

  allergySuggestions: string[];

  allergies: string[];

  addAllergy: (
    value: string
  ) => void;

  removeAt: (
    list: string[],
    idx: number
  ) => string[];

  setAllergies: React.Dispatch<
    React.SetStateAction<string[]>
  >;

  styles: any;
  isWebDesktop?: boolean;
};

export default function AllergiesStep({
  step,

  allergyQuery,
  setAllergyQuery,

  allergySuggestions,

  allergies,

  addAllergy,

  removeAt,

  setAllergies,

  styles,
  isWebDesktop,
}: Props) {
  return (
    <>
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons
          name="medkit-outline"
          size={18}
          color={COLORS.orange}
        />

        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          As-tu des allergies ?
        </Text>
      </View>

      <Text style={[styles.helper, isWebDesktop && styles.helperDesktop]}>
        Même système : recherche +
        multi-sélection.
      </Text>

      <View style={[styles.inputWrap, isWebDesktop && { maxWidth: 420, alignSelf: "center", width: "100%" }]}>
        <Ionicons
          name="search"
          size={18}
          color={COLORS.muted}
        />

        <TextInput
          key={`allergy-step-${step}`}
          value={allergyQuery}
          onChangeText={setAllergyQuery}
          placeholder="ex: gluten..."
          style={styles.input}
          returnKeyType="next"
          blurOnSubmit={false}
        />
      </View>

      {allergySuggestions.length >
        0 && (
        <View style={styles.suggestions}>
          {allergySuggestions.map(
            (a) => (
              <Pressable
                key={a}
                onPress={() =>
                  addAllergy(a)
                }
                style={
                  styles.suggestionItem
                }
              >
                <Text
                  style={
                    styles.suggestionText
                  }
                >
                  {a}
                </Text>

                <Ionicons
                  name="add"
                  size={18}
                  color={COLORS.orange}
                />
              </Pressable>
            )
          )}
        </View>
      )}

      {allergies.length > 0 && (
        <View style={styles.selectedWrap}>
          {allergies.map(
            (a, idx) => (
              <Pressable
                key={`${a}-${idx}`}
                onPress={() =>
                  setAllergies(
                    (prev) =>
                      removeAt(
                        prev,
                        idx
                      )
                  )
                }
                style={
                  styles.selectedChip
                }
              >
                <Text
                  style={
                    styles.selectedChipText
                  }
                >
                  {a}
                </Text>

                <Ionicons
                  name="close"
                  size={14}
                  color={COLORS.orange}
                />
              </Pressable>
            )
          )}
        </View>
      )}
    </>
  );
}