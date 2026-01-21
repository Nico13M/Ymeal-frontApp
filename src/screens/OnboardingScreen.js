// src/screens/OnboardingScreen.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ONBOARDING_SLIDES } from '../constants/onboardingData'; // Ajustez le chemin

const { width, height } = Dimensions.get('window');

// Couleurs de votre charte (à adapter)
const COLORS = {
  primaryOrange: '#FF9F1C', // Orange Ymeal approximatif
  darkText: '#1A1A2E',
  lightText: '#FFFFFF',
  greyText: '#A0A0A0',
};

const OnboardingScreen = ({ navigation }) => {
  // Pour savoir sur quelle slide on est (0, 1, 2 ou 3)
  const [currentIndex, setCurrentIndex] = useState(0);
  // Référence pour contrôler la FlatList
  const slidesRef = useRef(null);

  // Fonction appelée quand on a fini l'onboarding
  const finishOnboarding = async () => {
    try {
      // On enregistre que c'est fait !
      await AsyncStorage.setItem('@onboarding_complete', 'true');
      // On navigue vers l'écran de connexion/inscription
      // Remplacez 'LoginScreen' par le nom de votre écran de auth
      navigation.replace('LoginScreen'); 
    } catch (error) {
      console.log('Erreur lors de la sauvegarde', error);
    }
  };

  // Fonction pour aller à la slide suivante
  const scrollToNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finishOnboarding();
    }
  };

  // Fonction pour mettre à jour l'index quand on swipe manuellement
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // Configuration pour que le swipe "accroche" bien à chaque slide
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Le rendu d'une seule slide
  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        {/* Image de la slide */}
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        
        {/* Contenu textuel */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  // Le rendu des boutons en bas
  const renderFooter = () => {
    return (
      <View style={styles.footer}>
        {/* Indicateurs (petits points) */}
        <View style={styles.indicatorContainer}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        {/* Boutons d'action */}
        <View style={styles.buttonContainer}>
          {/* Bouton "Passer" (masqué sur la dernière slide) */}
          {currentIndex < ONBOARDING_SLIDES.length - 1 ? (
             <TouchableOpacity onPress={finishOnboarding} style={styles.skipBtn}>
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>
          ) : (
             <View style={styles.skipBtn} /> // Espace vide pour garder l'alignement
          )}
         

          {/* Bouton Suivant / Commencer */}
          <TouchableOpacity onPress={scrollToNext} style={styles.nextBtn}>
            <Text style={styles.nextText}>
              {currentIndex === ONBOARDING_SLIDES.length - 1 ? "Commencer" : "Suivant"}
            </Text>
             {currentIndex !== ONBOARDING_SLIDES.length - 1 && (
                <Ionicons name="arrow-forward" size={20} color={COLORS.lightText} style={{marginLeft: 8}}/>
             )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <FlatList
        data={ONBOARDING_SLIDES}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
        scrollEventThrottle={32}
      />
      {renderFooter()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkText, // Fond sombre comme sur vos images
  },
  slide: {
    width: width,
    height: height, // Prend toute la hauteur
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  image: {
    width: width,
    height: height * 0.55, // L'image prend 55% du haut
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40, // Pour remonter un peu sur l'image si besoin
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryOrange,
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.greyText,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    height: height * 0.20, // Le pied de page prend 20% du bas
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  indicator: {
    height: 8,
    width: 8,
    backgroundColor: COLORS.greyText,
    marginHorizontal: 5,
    borderRadius: 4,
  },
  activeIndicator: {
    width: 25, // Le point actif est plus large
    backgroundColor: COLORS.primaryOrange,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    padding: 10,
    width: 80,
  },
  skipText: {
    color: COLORS.greyText,
    fontSize: 16,
  },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryOrange,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
  },
  nextText: {
    color: COLORS.lightText,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OnboardingScreen;