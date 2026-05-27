import React from "react";
import { Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/profileConfig";
import { CitySuggestion } from "@/types/profil";

interface LocalisationStepProps {
  location: string;
  setLocation: (value: string) => void;
  citySuggestions: CitySuggestion[];
  cityLookupError: string | null;
  isCityLookupLoading: boolean;
  onSelectCity: (city: CitySuggestion) => void;
  setCitySuggestions: (value: CitySuggestion[]) => void;
  setCityLookupError: (value: string | null) => void;
  styles: any;
}

export default function LocalisationStep({
  location,
  setLocation,
  citySuggestions,
  cityLookupError,
  isCityLookupLoading,
  onSelectCity,
  setCitySuggestions,
  setCityLookupError,
  styles,
}: LocalisationStepProps) {
  return (
    <>
      <View style={styles.questionRow}>
        <Ionicons name="location-outline" size={18} color={COLORS.orange} />
        <Text style={styles.question}>Où habites-tu ?</Text>
      </View>
      <Text style={styles.label}>Ville ou code postal</Text>

      <View style={styles.inputWrap}>
        <Ionicons name="location-outline" size={18} color={COLORS.muted} />
        <TextInput
          value={location}
          onChangeText={(value) => {
            setLocation(value);
            if (cityLookupError) setCityLookupError(null);
          }}
          placeholder="ex: Paris ou 84300"
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
      </View>

      {isCityLookupLoading ? (
        <Text style={styles.lookupStateText}>Recherche de villes...</Text>
      ) : null}
      {citySuggestions.length > 0 && (
        <View style={styles.suggestions}>
          {citySuggestions.map((city) => (
            <Pressable
              key={city.id}
              onPress={() => onSelectCity(city)}
              style={styles.suggestionItem}
            >
              <Text style={styles.suggestionText}>{city.label}</Text>
              <Ionicons name="arrow-up-circle-outline" size={18} color={COLORS.orange} />
            </Pressable>
          ))}
        </View>
      )}
      {cityLookupError ? (
        <Text style={styles.lookupErrorText}>{cityLookupError}</Text>
      ) : null}
      <Text style={styles.note}>
        Nous utiliserons cette information pour te proposer des bons plans près de chez toi.
      </Text>

      <TouchableOpacity
        onPress={() => {
          setLocation("Non renseigné");
          setCitySuggestions([]);
          setCityLookupError(null);
        }}
        style={styles.skipLocationButton}
        activeOpacity={0.8}
      >
        <Text style={styles.skipLocationText}>
          Je ne souhaite pas faire connaître ma position
        </Text>
      </TouchableOpacity>
    </>
  );
}
