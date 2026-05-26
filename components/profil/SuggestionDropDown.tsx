// components/profil/SuggestionDropdown.tsx

import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SuggestionItem {
  id?: string;
  label: string;
  value?: string;
}

interface SuggestionDropdownProps {
  suggestions: SuggestionItem[];

  visible: boolean;

  loading?: boolean;

  emptyText?: string;

  onSelect: (item: SuggestionItem) => void;
}

export default function SuggestionDropdown({
  suggestions,
  visible,
  loading = false,
  emptyText = 'Aucun résultat',
  onSelect,
}: SuggestionDropdownProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FF7A00" />
        </View>
      ) : suggestions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {emptyText}
          </Text>
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.id ?? `${item.label}-${index}`}
              activeOpacity={0.85}
              onPress={() => onSelect(item)}
              style={styles.item}
            >
              <Text style={styles.itemText}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',

    top: 64,

    left: 0,
    right: 0,

    backgroundColor: '#1F1F1F',

    borderRadius: 18,

    borderWidth: 1,
    borderColor: '#2D2D2D',

    maxHeight: 220,

    zIndex: 999,

    overflow: 'hidden',
  },

  loadingContainer: {
    paddingVertical: 20,

    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },

  emptyText: {
    color: '#A0A0A0',

    textAlign: 'center',

    fontSize: 14,
  },

  item: {
    paddingHorizontal: 18,
    paddingVertical: 16,

    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },

  itemText: {
    color: '#FFFFFF',

    fontSize: 15,
  },
});