import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#FF9F1C',
  secondary: '#FF6B6B',
  cream: '#FFF9F2', 
  dark: '#1A1A2E',
  grey: '#666',
  white: '#FFFFFF',
};

const SLIDES = [
  {
    type: 'welcome',
    title: "Mange mieux,\nDépense moins 🎓",
    description: "L'app qui transforme ton budget étudiant en repas savoureux. Rejoins la communauté !",
  },
  {
    type: 'features',
    title: "Tout ce qu'il te faut",
    subtitle: "Une app complète pour cuisiner malin.",
    items: [
      { icon: 'phone-portrait-outline', title: "Inventaire Frigo", desc: "Génère des recettes avec ce que tu as." },
      { icon: 'trending-down-outline', title: "Budget Maîtrisé", desc: "Des recettes dès 2€ par repas." },
      { icon: 'location-outline', title: "Bons Plans", desc: "Les promos autour de toi." },
      { icon: 'people-outline', title: "Communauté", desc: "Partage et découvre les recettes préférées." }, 
    ]
  },
  {
    type: 'steps',
    title: "Comment ça marche ?",
    subtitle: "Simple comme bonjour en 3 étapes.",
    steps: [
      { num: '1', title: "Crée ton profil", desc: "Régime, budget et localisation." },
      { num: '2', title: "Remplis ton frigo", desc: "Ajoute tes ingrédients actuels." },
      { num: '3', title: "Cuisine & Partage", desc: "Découvre tes recettes personnalisées." },
    ]
  },
  {
    type: 'final',
    title: "Prêt à cuisiner ?",
    description: "Rejoins des milliers d'étudiants qui cuisinent malin avec Ymeal.",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/register');
    } catch (err) { console.log(err); }
  };

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finishOnboarding();
    }
  };

  const renderItem = ({ item }) => {
    
    if (item.type === 'welcome') {
      return (
        <View style={{ width, height }}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientContainer}>
            <View style={[styles.contentContainer, { marginTop: -50 }]}> 
              <Text style={styles.mainTitle}>{item.title}</Text>
              <Text style={styles.mainDesc}>{item.description}</Text>
              
              <View style={styles.imagePlaceholder}>
                <Ionicons name="restaurant-outline" size={80} color={COLORS.primary} />
                <Text style={{color: '#aaa', marginTop: 10}}>Image Cuisine ici</Text>
              </View>

              <View style={styles.statsContainer}>
                 <Text style={styles.statText}>✨ 10K+ Étudiants</Text>
                 <Text style={styles.statText}>🍲 500+ Recettes</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    }

    if (item.type === 'features') {
      return (
        <View style={[styles.creamContainer, { width }]}>
          <Text style={styles.darkTitle}>{item.title}</Text>
          <Text style={styles.darkSubtitle}>{item.subtitle}</Text>
          
          <View style={styles.cardsWrapper}>
            {item.items.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.iconBox}>
                  <Ionicons name={feature.icon} size={28} color="#FFF" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle}>{feature.title}</Text>
                  <Text style={styles.cardDesc}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (item.type === 'steps') {
      return (
        <View style={[styles.creamContainer, { width }]}>
           <Text style={styles.darkTitle}>{item.title}</Text>
           <Text style={styles.darkSubtitle}>{item.subtitle}</Text>

           <View style={styles.stepsWrapper}>
              {item.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNum}>{step.num}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              ))}
           </View>
        </View>
      );
    }

    if (item.type === 'final') {
      return (
        <View style={{ width, height }}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.gradientContainer}>
             <View style={styles.contentContainer}>
                <Ionicons name="happy-outline" size={100} color="white" style={{marginBottom: 30}} />
                <Text style={styles.mainTitle}>{item.title}</Text>
                <Text style={styles.mainDesc}>{item.description}</Text>
                
                <TouchableOpacity style={styles.whiteBtn} onPress={finishOnboarding}>
                  <Text style={styles.whiteBtnText}>Commencer maintenant ➔</Text>
                </TouchableOpacity>
             </View>
          </LinearGradient>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={currentIndex === 1 || currentIndex === 2 ? "dark-content" : "light-content"} />
      
      <FlatList
        ref={slidesRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        renderItem={renderItem}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {currentIndex < SLIDES.length - 1 && (
        <View style={styles.footer}>
          <View style={styles.indicatorContainer}>
            {SLIDES.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.indicator, 
                  currentIndex === index && styles.activeIndicator,
                  // Gestion intelligente des couleurs des points
                  (currentIndex === 1 || currentIndex === 2) ? { backgroundColor: '#E0D0C0' } : { backgroundColor: 'rgba(255,255,255,0.4)' },
                  (currentIndex === index && (currentIndex === 1 || currentIndex === 2)) && { backgroundColor: COLORS.primary },
                  (currentIndex === index && (currentIndex === 0 || currentIndex === 3)) && { backgroundColor: '#FFF' }
                ]} 
              />
            ))}
          </View>

          <TouchableOpacity onPress={scrollToNext} style={styles.nextBtn}>
            <Text style={[
              styles.nextText, 
              (currentIndex === 1 || currentIndex === 2) ? { color: COLORS.primary } : { color: '#FFF' }
            ]}>
              Suivant
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  gradientContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  creamContainer: { flex: 1, backgroundColor: COLORS.cream, padding: 20, paddingTop: 80, alignItems: 'center' },
  
  contentContainer: { alignItems: 'center', width: '100%' },

  mainTitle: { fontSize: 34, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 20 },
  mainDesc: { fontSize: 17, color: '#FFF', textAlign: 'center', opacity: 0.95, lineHeight: 26, paddingHorizontal: 10 },
  
  darkTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8, textAlign: 'center' },
  darkSubtitle: { fontSize: 15, color: COLORS.grey, marginBottom: 30, textAlign: 'center' },

  imagePlaceholder: {
    width: width * 0.85, height: 260, backgroundColor: '#FFF', borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginTop: 30, elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: {width:0, height:5}
  },
  statsContainer: { flexDirection: 'row', marginTop: 25, gap: 20 },
  statText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600'},

  cardsWrapper: { width: '100%', gap: 12 }, // Gap réduit légèrement pour faire tenir les 4
  featureCard: {
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    paddingVertical: 18, // Plus de hauteur
    paddingHorizontal: 20, 
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary, // Ombre orangée légère
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 10, 
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,159,28, 0.1)' // Bordure très fine orange pâle
  },
  iconBox: { 
    width: 52, height: 52, backgroundColor: COLORS.primary, borderRadius: 14, 
    justifyContent: 'center', alignItems: 'center', marginRight: 18 
  },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#777', lineHeight: 18 },

  // --- PAGE 3 : ETAPES ---
  stepsWrapper: { width: '100%', alignItems: 'center', gap: 35 },
  stepItem: { alignItems: 'center', width: '85%' },
  stepCircle: { 
    width: 55, height: 55, backgroundColor: COLORS.primary, borderRadius: 30, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6
  },
  stepNum: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  stepTitle: { fontSize: 19, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  stepDesc: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },

  // --- FOOTER ---
  footer: { position: 'absolute', bottom: 50, left: 25, right: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  indicatorContainer: { flexDirection: 'row' },
  indicator: { height: 8, width: 8, borderRadius: 4, marginHorizontal: 4 },
  activeIndicator: { width: 22 },
  nextBtn: { padding: 10 },
  nextText: { fontSize: 18, fontWeight: 'bold' },

  whiteBtn: { 
    backgroundColor: '#FFF', paddingVertical: 18, paddingHorizontal: 35, 
    borderRadius: 35, marginTop: 50, width: '90%', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
  },
  whiteBtnText: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold' }
});