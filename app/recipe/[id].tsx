import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react'; // Ajout de useEffect
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RECIPES } from '../../constants/recipesData';

// --- LISTE DES ASTUCES ALÉATOIRES AUSSI ICI ---
const RANDOM_TIPS = [
  "En préparant tes repas toi-même, tu peux économiser jusqu'à 200€ par mois par rapport aux plats préparés !",
  "Cette recette peut se conserver 3 jours au frigo : idéale pour tes lunchbox.",
  "Tu peux remplacer la crème fraîche par du yaourt nature pour une version plus légère et moins chère.",
  "Astuce chef : Ajoute un filet de jus de citron à la fin pour rehausser tous les goûts.",
  "Pas de balance ? Une tasse à mug équivaut environ à 120g de farine ou 200g de sucre."
];

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const recipe = RECIPES.find(r => r.id === id) || RECIPES[0];

  const [checkedSteps, setCheckedSteps] = useState({});
  const [userRating, setUserRating] = useState(0);
  
  // État pour l'astuce aléatoire
  const [randomTip, setRandomTip] = useState(RANDOM_TIPS[0]);

  useEffect(() => {
    // Changement aléatoire à chaque chargement de recette
    const index = Math.floor(Math.random() * RANDOM_TIPS.length);
    setRandomTip(RANDOM_TIPS[index]);
  }, []);

  const toggleStep = (index) => {
    setCheckedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleRating = (score) => {
    setUserRating(score);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* HEADER IMAGE */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: recipe.image }} style={styles.image} />
        <View style={styles.overlay} />
        
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={{fontWeight: 'bold', marginLeft: 5}}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={styles.badgesRow}>
            <View style={styles.badge}><Ionicons name="time-outline" size={14} color="#FFF"/><Text style={styles.badgeText}>{recipe.time}</Text></View>
            <View style={styles.badge}><Ionicons name="flame-outline" size={14} color="#FFF"/><Text style={styles.badgeText}>{recipe.difficulty}</Text></View>
            <View style={styles.badge}><Ionicons name="person-outline" size={14} color="#FFF"/><Text style={styles.badgeText}>{recipe.people} pers.</Text></View>
          </View>
          <View style={styles.priceTag}>
             <Text style={styles.priceText}>≈ {recipe.price}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        
        {/* INGRÉDIENTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingrédients</Text>
          <View style={styles.card}>
            {recipe.ingredients.map((ing, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={styles.bullet} />
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* PRÉPARATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préparation</Text>
          {recipe.steps.map((step, index) => {
            const isChecked = checkedSteps[index];
            return (
              <TouchableOpacity key={index} onPress={() => toggleStep(index)} activeOpacity={0.8}>
                <View style={[styles.stepCard, isChecked && styles.stepCardChecked]}>
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked ? <Ionicons name="checkmark" size={16} color="#FFF" /> : <Text style={styles.stepNum}>{index + 1}</Text>}
                  </View>
                  <Text style={[styles.stepText, isChecked && styles.stepTextChecked]}>{step}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* NOTATION */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Note cette recette</Text>
           <View style={styles.ratingCard}>
             <View style={{flexDirection: 'row', gap: 10, marginBottom: 10}}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => handleRating(star)}>
                    <Ionicons 
                      name={star <= userRating ? "star" : "star-outline"} 
                      size={36} 
                      color={star <= userRating ? "#FFC107" : "#CCC"} 
                    />
                  </TouchableOpacity>
                ))}
             </View>
             <Text style={{color: '#666', fontSize: 16}}>
               {userRating > 0 ? `Tu as noté ${userRating}/5 ⭐` : "Touche une étoile pour noter"}
             </Text>
           </View>
        </View>

        {/* PARTAGE */}
        <TouchableOpacity style={styles.shareBtn}>
           <Ionicons name="share-social-outline" size={20} color="#FFF" />
           <Text style={styles.shareBtnText}>Partager avec la communauté</Text>
        </TouchableOpacity>

        {/* ASTUCE BOX (Maintenant Aléatoire) */}
        <View style={styles.tipBox}>
          <Ionicons name="bulb" size={20} color="#FFC107" style={{marginRight: 10}} />
          <View style={{flex: 1}}>
            <Text style={styles.tipTitle}>Le savais-tu ?</Text>
            {/* Ici on affiche l'astuce aléatoire stockée dans le state */}
            <Text style={styles.tipText}>{randomTip}</Text> 
          </View>
        </View>

        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F2' },
  imageContainer: { height: 300, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  backBtn: { position: 'absolute', top: 50, left: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 20 },
  headerInfo: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 },
  badgesRow: { flexDirection: 'row', gap: 10 },
  badge: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, alignItems: 'center', gap: 5 },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  priceTag: { position: 'absolute', right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 10 },
  priceText: { color: '#FFF', fontWeight: 'bold' },
  contentContainer: { flex: 1, marginTop: -20, backgroundColor: '#FFF9F2', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 30, paddingHorizontal: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 15 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, elevation: 2 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF9F1C', marginRight: 10 },
  ingredientText: { fontSize: 16, color: '#444' },
  stepCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: '#EEE' },
  stepCardChecked: { backgroundColor: '#F0F9F4', borderColor: '#4CAF50' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center', marginRight: 15, marginTop: 2 },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  stepNum: { color: '#AAA', fontSize: 12, fontWeight: 'bold' },
  stepText: { fontSize: 15, color: '#333', flex: 1, lineHeight: 22 },
  stepTextChecked: { color: '#888', textDecorationLine: 'line-through' },
  ratingCard: { alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 15 },
  shareBtn: { backgroundColor: '#FF9F1C', flexDirection: 'row', justifyContent: 'center', padding: 18, borderRadius: 15, alignItems: 'center', gap: 10, marginBottom: 20 },
  shareBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  // Style Astuce Detail
  tipBox: { backgroundColor: '#E3F2FD', padding: 20, borderRadius: 15, flexDirection: 'row', borderLeftWidth: 4, borderLeftColor: '#2196F3' },
  tipTitle: { fontWeight: 'bold', color: '#1565C0', marginBottom: 5 },
  tipText: { color: '#1565C0', lineHeight: 20 }
});