import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function RecipesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>Recettes 🍲</Text>
        <Text style={styles.subText}>Idées repas à moins de 2€</Text>
        
        <View style={styles.placeholderBox}>
          <Text style={{color: '#AAA'}}>Liste des recettes à venir...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A1A2E' },
  subText: { fontSize: 16, color: '#666', marginBottom: 30 },
  placeholderBox: { height: 200, backgroundColor: '#F0F0F0', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#DDD' }
});