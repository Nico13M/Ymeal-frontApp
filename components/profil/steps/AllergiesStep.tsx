import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/profileConfig";

interface AllergiesStepProps {
  step: number;
  allergyQuery: string;
  setAllergyQuery: (value: string) => void;
  allergySuggestions: string[];
  allergies: string[];
  addAllergy: (a: string) => void;
  removeAt: (list: string[], idx: number) => string[];
  setAllergies: React.Dispatch<React.SetStateAction<string[]>>;
  styles: any;
}

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
}: AllergiesStepProps) {
  return (
    <>
      <View style={styles.questionRow}>
        <Ionicons name="medkit-outline" size={18} color={COLORS.orange} />
        <Text style={styles.question}>As-tu des allergies ?</Text>
      </View>
      <Text style={styles.helper}>Même système: recherche + multi-sélection.</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={COLORS.muted} />
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
      {allergySuggestions.length > 0 && (
        <View style={styles.suggestions}>
          {allergySuggestions.map((a) => (
            <Pressable key={a} onPress={() => addAllergy(a)} style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>{a}</Text>
              <Ionicons name="add" size={18} color={COLORS.orange} />
            </Pressable>
          ))}
        </View>
      )}
      {allergies.length > 0 && (
        <View style={styles.selectedWrap}>
          {allergies.map((a, idx) => (
            <Pressable
              key={`${a}-${idx}`}
              onPress={() => setAllergies((prev) => removeAt(prev, idx))}
              style={styles.selectedChip}
            >
              <Text style={styles.selectedChipText}>{a}</Text>
              <Ionicons name="close" size={14} color={COLORS.orange} />
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}
