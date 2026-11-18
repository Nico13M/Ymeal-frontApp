import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/constants/profileConfig";

import { CitySuggestion } from "@/types/profil";

type Props = {
  location: string;
  setLocation: (value: string) => void;

  citySuggestions: CitySuggestion[];

  cityLookupError: string | null;

  isCityLookupLoading: boolean;

  onSelectCity: (city: CitySuggestion) => void;

  setCitySuggestions: (
    value: CitySuggestion[]
  ) => void;

  setCityLookupError: (
    value: string | null
  ) => void;

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
      <View style={[styles.questionRow, isWebDesktop && styles.questionRowDesktop]}>
        <Ionicons
          name="location-outline"
          size={18}
          color={COLORS.orange}
        />

        <Text style={[styles.question, isWebDesktop && styles.questionDesktop]}>
          Où habites-tu ?
        </Text>
      </View>

      <Text style={[styles.label, isWebDesktop && styles.labelDesktop]}>
        Ville ou code postal
      </Text>

      {/* <View style={[{ position: "relative" }, isWebDesktop && styles.inputWrapDesktop]}>
        <View style={[styles.inputWrap, isWebDesktop && { maxWidth: 420, alignSelf: "center", width: "100%" }]}>
          <Ionicons
            name="location-outline"
            size={18}
            color={COLORS.muted}
          /> */}

          <View
  style={[
    {
      position: "relative",
      width: "100%",
      zIndex: 9999,
      elevation: 20,
    },
    isWebDesktop && styles.locationContainerDesktop,
  ]}
>
  <View
  style={[
    styles.inputWrap,
    isWebDesktop && styles.inputWrapDesktopFixed,
  ]}
>

          <TextInput
            value={location}
            onChangeText={(value) => {
              setLocation(value);

              if (cityLookupError) {
                setCityLookupError(null);
              }
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

        {citySuggestions.length > 0 && (
          // <View style={styles.suggestions}>
          // Liste affichée dans le flux (et non plus en position absolue) :
          // elle pousse le texte en dessous au lieu de passer derrière.
          <View style={[styles.suggestions, local.inlineList]}>
            {citySuggestions.map((city) => (
              <Pressable
                key={city.id}
                onPress={() =>
                  onSelectCity(city)
                }
                style={styles.suggestionItem}
              >
                <Text
                  style={
                    styles.suggestionText
                  }
                >
                  {city.label}
                </Text>

                <Ionicons
                  name="arrow-up-circle-outline"
                  size={18}
                  color={COLORS.orange}
                />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {isCityLookupLoading ? (
        <Text style={styles.lookupStateText}>
          Recherche de villes...
        </Text>
      ) : null}

      {cityLookupError ? (
        <Text style={styles.lookupErrorText}>
          {cityLookupError}
        </Text>
      ) : null}

      <Text style={styles.note}>
        Nous utiliserons cette information
        pour te proposer des bons plans
        près de chez toi.
      </Text>

      <Pressable
        onPress={() => {
          setLocation("Non renseigné");

          setCitySuggestions([]);

          setCityLookupError(null);
        }}
        style={[styles.skipLocationButton, local.skip]}
      >
        <Ionicons name="eye-off-outline" size={16} color={COLORS.sub} />
        <Text style={[styles.skipLocationText, local.skipText]}>
          Je ne souhaite pas faire connaître
          ma position
        </Text>
      </Pressable>
    </>
  );
}
const local = StyleSheet.create({
  skip: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFF",
  },
  skipText: { color: COLORS.sub, fontSize: 13.5, fontWeight: "700", textAlign: "center", flexShrink: 1 },
  inlineList: {
    position: "relative",
    top: 0,
    left: 0,
    right: 0,
    transform: [],
    width: "100%",
    marginTop: 8,
    marginBottom: 4,
    zIndex: 1,
    elevation: 0,
    shadowColor: "#7A4800",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
});
