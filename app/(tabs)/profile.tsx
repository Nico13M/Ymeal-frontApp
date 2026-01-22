import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RECIPES } from '../../constants/recipesData';

export default function ProfileScreen() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('FAVORITES');
      if (stored) setFavorites(JSON.parse(stored));
    })();
  }, []);

  const favoriteRecipes = RECIPES.filter(r => favorites.includes(r.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#FFF" />
        </View>
        <Text style={styles.name}>Étudiant Ymeal</Text>
        <Text style={styles.email}>etudiant@ymeal.com</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>⚙️ Paramètres</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <Text style={styles.menuText}>❤️ Mes favoris ({favoriteRecipes.length})</Text>
        </View>

        <FlatList
          data={favoriteRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.favCard}>
              <Text style={styles.favTitle}>{item.title}</Text>
              <Text style={styles.favSub}>{item.time} • {item.difficulty}</Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={{ color: '#888', marginTop: 20 }}>
              Aucun favori pour le moment.
            </Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFF9F2' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF9F1C', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1A1A2E' },
  email: { fontSize: 14, color: '#888' },
  menu: { padding: 20 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  menuText: { fontSize: 16, color: '#333' },
  favCard: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  favTitle: { fontSize: 16, fontWeight: 'bold' },
  favSub: { color: '#888', marginTop: 4 }
});
