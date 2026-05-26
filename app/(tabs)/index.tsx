import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router'; // <--- IMPORT IMPORTANT
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- LISTE DES ASTUCES ---
const TIPS = [
  "Achète tes légumes au marché le samedi après-midi : les prix baissent jusqu'à 50% !",
  "Cuisine en gros lots le dimanche (batch cooking) pour gagner du temps et de l'argent la semaine.",
  "Regarde toujours le prix au kilo, pas le prix du paquet, pour trouver les vraies bonnes affaires.",
  "Utilise les applications anti-gaspillage pour récupérer des paniers surprises à petit prix.",
  "Ne jette pas tes fanes de radis ou carottes, elles font d'excellentes soupes !",
  "Congèle tes restes de pain pour en faire du pain perdu ou de la chapelure plus tard.",
  "Remplace la viande par des lentilles ou des pois chiches une fois par semaine : c'est moins cher et protéiné !"
];

const TRENDING_RECIPES = [
  {
    id: '1', 
    title: "Pâtes Carbonara",
    time: "15 min",
    price: "2.50€",
    image: { uri: "https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg" }
  },
  {
    id: '2',
    title: "Buddha Bowl",
    time: "20 min",
    price: "3.80€",
    image: { uri: "https://www.themealdb.com/images/media/meals/1529444113.jpg" }
  },
  {
    id: '3',
    title: "Omelette aux légumes",
    time: "10 min",
    price: "1.90€",
    image: { uri: "https://www.themealdb.com/images/media/meals/1529446137.jpg" }
  }
];

export default function DashboardScreen() {
  const [todaysTip, setTodaysTip] = useState(TIPS[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * TIPS.length);
    setTodaysTip(TIPS[randomIndex]);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF9F1C" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HEADER ORANGE */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
               <Ionicons name="restaurant" size={24} color="#FFF" />
               <Text style={styles.brandName}>Ymeal</Text>
            </View>
          </View>
          <Text style={styles.greetingTitle}>Bonjour ! 👋</Text>
          <Text style={styles.greetingSub}>Prêt à cuisiner quelque chose de délicieux ?</Text>
        </View>

        {/* ACTIONS RAPIDES */}
        <View style={styles.actionsContainer}>
          {/* Lien vers Frigo */}
          <Link href="/(tabs)/fridge" asChild>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.cardHeaderRow}>
                 <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                   <Ionicons name="cube-outline" size={24} color="#2196F3" />
                 </View>
                 <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
              </View>
              <Text style={styles.actionTitle}>Mon Frigo</Text>
              <Text style={styles.actionDesc}>Gère ton inventaire et génère des recettes</Text>
            </TouchableOpacity>
          </Link>

          {/* Lien vers Recettes */}
          <Link href="/(tabs)/recipes" asChild>
            <TouchableOpacity style={styles.actionCard}>
               <View style={styles.cardHeaderRow}>
                 <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                   <Ionicons name="book-outline" size={24} color="#4CAF50" />
                 </View>
               </View>
              <Text style={styles.actionTitle}>Recettes</Text>
              <Text style={styles.actionDesc}>Découvre des recettes adaptées à ton budget</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* RECETTES TENDANCES */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={24} color="#FF9F1C" style={{marginRight: 8}} />
            <Text style={styles.sectionTitle}>Recettes tendances</Text>
          </View>
          
          {TRENDING_RECIPES.map((recipe) => (
            /* 👇 AJOUT DU LIEN ICI 👇 */
            <Link key={recipe.id} href={`/recipe/${recipe.id}`} asChild>
              <TouchableOpacity style={styles.recipeCard}>
                <Image source={recipe.image} style={styles.recipeImage} resizeMode="cover" />
                <View style={styles.recipeContent}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <View style={styles.recipeMeta}>
                    <Text style={styles.recipeTime}>{recipe.time}</Text>
                    <Text style={styles.recipePrice}>{recipe.price}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </View>

        {/* ASTUCE DU JOUR */}
        <LinearGradient
          colors={['#D500F9', '#FF4081']} 
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.tipContainer}
        >
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={24} color="#FFF" style={{marginRight: 8}} />
            <Text style={styles.tipTitle}>Astuce du jour</Text>
          </View>
          <Text style={styles.tipText}>{todaysTip}</Text>
        </LinearGradient>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F2' },
  headerContainer: { backgroundColor: '#FF9F1C', paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  brandName: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  greetingTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
  greetingSub: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  actionsContainer: { paddingHorizontal: 20, marginTop: -20, gap: 15 },
  actionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  badge: { backgroundColor: '#FF6B6B', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'absolute', right: 0, top: 0 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  actionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 5 },
  actionDesc: { fontSize: 14, color: '#888', lineHeight: 20 },
  sectionContainer: { paddingHorizontal: 20, marginTop: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A2E' },
  recipeCard: { backgroundColor: '#FFF', borderRadius: 15, marginBottom: 15, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  recipeImage: { width: '100%', height: 150 },
  recipeContent: { padding: 15 },
  recipeTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 8 },
  recipeMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  recipeTime: { color: '#888', fontSize: 14 },
  recipePrice: { color: '#FF9F1C', fontWeight: 'bold', fontSize: 16 },
  tipContainer: {
    marginHorizontal: 20, marginTop: 10, marginBottom: 30, borderRadius: 20, padding: 20,
    shadowColor: '#D500F9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tipTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  tipText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
});