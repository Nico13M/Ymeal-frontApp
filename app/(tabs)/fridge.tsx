import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FridgeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>Mon Frigo 🥕</Text>
        <Text style={styles.subText}>Gérez vos ingrédients ici.</Text>

        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.btnText}>Ajouter un ingrédient</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FF9F1C', marginBottom: 10 },
  subText: { fontSize: 16, color: '#666', marginBottom: 30 },
  addButton: { 
    flexDirection: 'row', backgroundColor: '#FF9F1C', paddingVertical: 15, paddingHorizontal: 30, 
    borderRadius: 30, alignItems: 'center', gap: 10 
  },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});