import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/profileConfig";

interface AvoidIngredientsStepProps {
  step: number;
  vegQuery: string;
  setVegQuery: (value: string) => void;
  vegSuggestions: string[];
  avoidVeg: string[];
  addVeg: (v: string) => void;
  removeAt: (list: string[], idx: number) => string[];
  setAvoidVeg: React.Dispatch<React.SetStateAction<string[]>>;
  styles: any;
}

export default function AvoidIngredientsStep({
  step,
  vegQuery,
  setVegQuery,
  vegSuggestions,
  avoidVeg,
  addVeg,
  removeAt,
  setAvoidVeg,
  styles,
}: AvoidIngredientsStepProps) {
  return (
    <>
      <View style={styles.questionRow}>
        <Ionicons name="alert-circle-outline" size={18} color={COLORS.orange} />
        <Text style={styles.question}>Y a-t-il des ingrédients que tu veux éviter ?</Text>
      </View>
      <Text style={styles.helper}>Tape quelques lettres et sélectionne. Plusieurs possibles.</Text>
      <View style={styles.inputWrap}>
        <TextInput
          key={`veg-step-${step}`}
          value={vegQuery}
          onChangeText={setVegQuery}
          placeholder="ex: bro..."
          style={styles.input}
          returnKeyType="next"
          blurOnSubmit={false}
        />
      </View>
      {vegSuggestions.length > 0 && (
        <View style={styles.suggestions}>
          {vegSuggestions.map((v) => (
            <Pressable key={v} onPress={() => addVeg(v)} style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>{v}</Text>
              <Ionicons name="add" size={18} color={COLORS.orange} />
            </Pressable>
          ))}
        </View>
      )}
      {avoidVeg.length > 0 && (
        <View style={styles.selectedWrap}>
          {avoidVeg.map((v, idx) => (
            <Pressable
              key={`${v}-${idx}`}
              onPress={() => setAvoidVeg((prev) => removeAt(prev, idx))}
              style={styles.selectedChip}
            >
              <Text style={styles.selectedChipText}>{v}</Text>
              <Ionicons name="close" size={14} color={COLORS.orange} />
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}
