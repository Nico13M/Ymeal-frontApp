import InputField from "@/components/ui/InputField";
import { COLORS } from "@/constants/profileConfig";
import { ALL_CUISINES_LABEL, CuisineOption, CuisineOptionId, filterCuisines } from "@/src/lib/cuisine-preferences";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";

type Props = {
  options: CuisineOption[];
  selectedIds: CuisineOptionId[];
  onToggle: (id: CuisineOptionId) => void;
  columns?: 2 | 3;
  maxSelections?: number;
  isLoading?: boolean;
};

export default function CuisineSelector({ options, selectedIds, onToggle, columns = 2, maxSelections, isLoading = false }: Props) {
  const [query, setQuery] = useState("");
  const list = useRef<ScrollView>(null);
  const filtered = useMemo(() => filterCuisines(options, query), [options, query]);
  const tileHeight = columns === 3 ? 96 : 80;
  const gap = columns === 3 ? 16 : 12;
  const rows = 6 / columns;
  const listHeight = rows * tileHeight + (rows - 1) * gap;

  useEffect(() => { list.current?.scrollTo({ y: 0, animated: false }); }, [query]);

  return (
    <View style={styles.container}>
      <InputField
        icon="search-outline"
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher une cuisine..."
        accessibilityLabel="Rechercher une cuisine"
        autoCorrect={false}
        autoCapitalize="none"
        trailing={query ? (
          <Pressable onPress={() => setQuery("")} style={styles.clearButton} accessibilityRole="button" accessibilityLabel="Effacer la recherche de cuisine">
            <Ionicons name="close-circle" size={20} color={COLORS.muted} />
          </Pressable>
        ) : undefined}
      />
      <ScrollView
        ref={list}
        style={[
          styles.list,
          { height: listHeight, maxHeight: listHeight },
          Platform.OS === "web" && ({ overscrollBehavior: "contain" } as ViewStyle),
        ]}
        contentContainerStyle={{ flexGrow: 1 }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        accessibilityLabel="Liste des cuisines, six options visibles"
      >
        {isLoading ? (
          <View style={styles.empty}><ActivityIndicator color={COLORS.orange} /></View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText} accessibilityLiveRegion="polite">
              {query ? "Aucune cuisine trouvée" : "Aucune cuisine disponible pour le moment."}
            </Text>
          </View>
        ) : (
          <View style={[styles.grid, { gap }, columns === 3 && styles.gridDesktop]}>
            {filtered.map((cuisine) => {
              const selected = selectedIds.includes(cuisine.id);
              const disabled = !selected && maxSelections !== undefined && selectedIds.length >= maxSelections;
              return (
                <Pressable
                  key={cuisine.id}
                  onPress={() => onToggle(cuisine.id)}
                  disabled={disabled}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled }}
                  style={[
                    styles.tile,
                    { width: columns === 3 ? "31%" : "47.5%", height: tileHeight },
                    selected && styles.selected,
                    disabled && styles.disabled,
                  ]}
                >
                  <Text numberOfLines={2} style={[styles.name, selected && styles.selectedName]}>{cuisine.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
      <Text style={styles.summary} accessibilityLiveRegion="polite">
        {selectedIds.length === 0 ? ALL_CUISINES_LABEL : `Sélection : ${selectedIds.length}${maxSelections === undefined ? "" : `/${maxSelections}`}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", gap: 12 },
  list: { flexGrow: 0, flexShrink: 0 },
  clearButton: { width: 36, height: 44, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridDesktop: { justifyContent: "flex-start" },
  tile: {
    borderRadius: 20, borderWidth: 2, borderColor: "rgba(15,23,42,0.08)", backgroundColor: COLORS.card,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 12, paddingVertical: 8,
  },
  selected: { borderColor: COLORS.orange, backgroundColor: "#FFF7ED" },
  disabled: { opacity: 0.5 },
  name: { fontSize: 15, lineHeight: 20, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  selectedName: { color: "#9A3412" },
  empty: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, lineHeight: 22, color: COLORS.sub, textAlign: "center" },
  summary: { fontSize: 13, lineHeight: 20, color: COLORS.sub, textAlign: "center" },
});
