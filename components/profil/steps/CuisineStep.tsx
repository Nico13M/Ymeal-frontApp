import CuisineSelector from "@/components/profil/CuisineSelector";
import StepIntro from "@/components/profil/StepIntro";
import { MAX_CUISINE_SELECTIONS } from "@/constants/profileConfig";
import { CuisineOption } from "@/src/lib/cuisine-preferences";
import React from "react";
import { View } from "react-native";

type Props = {
  cuisines: string[];
  toggleCuisine: (name: string) => void;
  availableCuisines: CuisineOption[];
  isLoading?: boolean;
  styles: any;
  isWebDesktop?: boolean;
};

export default function CuisineStep({ cuisines, toggleCuisine, availableCuisines, isLoading = false, styles, isWebDesktop }: Props) {
  const limit = Math.min(MAX_CUISINE_SELECTIONS, availableCuisines.length);
  const selectedIds = availableCuisines
    .filter((item) => cuisines.includes(item.name))
    .map((item) => item.id);

  return (
    <>
      <StepIntro
        icon="restaurant-outline"
        title="Quelles cuisines te font envie ?"
        subtitle={limit > 0
          ? `Choisis jusqu’à ${limit} style${limit > 1 ? "s" : ""} de cuisine, ou continue sans sélection pour les découvrir toutes.`
          : "Sans sélection, toutes les cuisines conviennent."}
        isWebDesktop={isWebDesktop}
      />
      <View style={styles.stepControls}>
        <CuisineSelector
          options={availableCuisines}
          selectedIds={selectedIds}
          onToggle={(id) => {
            const item = availableCuisines.find((cuisine) => cuisine.id === id);
            if (item) toggleCuisine(item.name);
          }}
          columns={isWebDesktop ? 3 : 2}
          maxSelections={limit}
          isLoading={isLoading}
        />
      </View>
    </>
  );
}
