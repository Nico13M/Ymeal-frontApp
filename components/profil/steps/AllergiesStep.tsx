import { COLORS } from "@/constants/profileConfig";
import { ReferenceItem } from "@/src/services/profile";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
  allergies: string[];          // noms sélectionnés
  toggleAllergy: (name: string) => void;
  availableAllergies: ReferenceItem[];
  isLoading?: boolean;
  styles: any;
}

export default function AllergiesStep({
  allergies,
  toggleAllergy,
  availableAllergies,
  isLoading = false,
  styles,
}: AllergiesStepProps) {
  return (
    <>
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons name="medkit-outline" size={18} color={COLORS.orange} />
        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          As-tu des allergies ?
        </Text>
      </View>

      <Text style={[styles.helper, isWebDesktop && styles.helperDesktop]}>
        Sélectionne toutes celles qui te concernent.
      </Text>

      {isLoading ? (
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 24 }} />
      ) : (
        <View style={[styles.chipsWrap, isWebDesktop && styles.chipsWrapDesktop]}>
          {availableAllergies.map((a) => {
            const selected = allergies.includes(a.name);
            return (
              <Pressable
                key={a.id}
                onPress={() => toggleAllergy(a.name)}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {a.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {allergies.length > 0 && (
        <Text style={[styles.helper, isWebDesktop && styles.helperDesktop, { marginTop: 12 }]}>
          {allergies.length} allergie{allergies.length > 1 ? "s" : ""} sélectionnée{allergies.length > 1 ? "s" : ""}
        </Text>
      )}
    </>
  );
}
