import StepIntro from "@/components/profil/StepIntro";
import InputField from "@/components/ui/InputField";
import { COLORS } from "@/constants/profileConfig";
import { CitySuggestion } from "@/types/profil";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type Props = {
  location: string;
  setLocation: (value: string) => void;
  citySuggestions: CitySuggestion[];
  cityLookupError: string | null;
  isCityLookupLoading: boolean;
  onSelectCity: (city: CitySuggestion) => void;
  setCitySuggestions: (value: CitySuggestion[]) => void;
  setCityLookupError: (value: string | null) => void;
  styles: any;
  isWebDesktop?: boolean;
};

export default function LocationStep({
  location,
  setLocation,
  citySuggestions,
  cityLookupError,
  isCityLookupLoading,
  onSelectCity,
  setCitySuggestions,
  setCityLookupError,
  styles,
  isWebDesktop,
}: Props) {
  return (
    <>
      <StepIntro
        icon="location-outline"
        title="Où habites-tu ?"
        subtitle="Indique ta ville ou ton code postal pour découvrir les bons plans autour de toi."
        isWebDesktop={isWebDesktop}
      />

      <View style={styles.stepControls}>
        <View>
          <Text style={styles.label}>Ville ou code postal</Text>
            <InputField
              icon="search-outline"
              iconSize={20}
              containerStyle={styles.inputWrap}
              focusedContainerStyle={styles.inputWrapFocused}
              value={location}
              onChangeText={(value) => {
                setLocation(value);
                setCitySuggestions([]);
                if (cityLookupError) setCityLookupError(null);
              }}
              placeholder="Ex. : Paris ou 75000"
              placeholderTextColor={COLORS.muted}
              accessibilityLabel="Ville ou code postal"
              style={styles.input}
              keyboardType="default"
              returnKeyType="done"
              autoCorrect={false}
              autoCapitalize="words"
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              spellCheck={false}
              clearButtonMode="while-editing"
            />

          {citySuggestions.length > 0 && (
            <View style={styles.suggestions}>
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {citySuggestions.map((city) => (
                  <Pressable
                    key={city.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Choisir ${city.label}`}
                    onPress={() => onSelectCity(city)}
                    style={styles.suggestionItem}
                  >
                    <Text style={styles.suggestionText}>{city.label}</Text>
                    <Ionicons name="location-outline" size={20} color={COLORS.orange} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {isCityLookupLoading && (
            <Text style={styles.lookupStateText}>Recherche de villes…</Text>
          )}
          {cityLookupError && (
            <Text style={styles.lookupErrorText}>{cityLookupError}</Text>
          )}
        </View>

        <View style={styles.infoPanel}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.orange} />
          <Text style={styles.note}>
            Nous utiliserons cette information pour te proposer des bons plans près de chez toi.
          </Text>
        </View>

        <Pressable
          onPress={() => {
            setLocation("Non renseigné");
            setCitySuggestions([]);
            setCityLookupError(null);
          }}
          style={[styles.skipLocationButton, location === "Non renseigné" && styles.choiceRowSelected]}
          accessibilityRole="button"
          accessibilityState={{ selected: location === "Non renseigné" }}
        >
          <Ionicons name="eye-off-outline" size={22} color={COLORS.orange} />
          <Text style={styles.skipLocationText}>
            Je ne souhaite pas faire connaître ma position
          </Text>
          {location === "Non renseigné" && (
            <Ionicons name="checkmark-circle" size={22} color={COLORS.orange} />
          )}
        </Pressable>
      </View>
    </>
  );
}
