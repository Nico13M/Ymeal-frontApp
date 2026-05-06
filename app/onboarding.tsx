import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image as Img,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

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
      { icon: 'trending-down-outline', title: 'Budget maitrise', desc: 'Des idees repas pour mieux gerer ton budget.' },
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
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const slidesRef = useRef<FlatList<(typeof SLIDES)[number]> | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });
  const isDesktop = width >= 1024;
  const isWideDesktop = width >= 1440;
  const desktopContentMaxWidth = isWideDesktop ? 1320 : 1180;
  const desktopTextMaxWidth = isWideDesktop ? 920 : 840;
  const desktopImageWidth = Math.min(width - 220, 580);
  const desktopStepsWidth = 640;
  const desktopFeatureWidth = Math.min(width - 120, isWideDesktop ? 760 : 760);

  const updateCurrentIndex = (index: number) => {
    const nextIndex = Math.max(
      0,
      Math.min(SLIDES.length - 1, index)
    );

    currentIndexRef.current = nextIndex;
    setCurrentIndex((prev) => (prev === nextIndex ? prev : nextIndex));
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const firstVisible = viewableItems?.[0];
    if (typeof firstVisible?.index === 'number') {
      updateCurrentIndex(firstVisible.index);
    }
  });

  const scrollToSlide = (targetIndex: number) => {
    const nextIndex = Math.max(0, Math.min(SLIDES.length - 1, targetIndex));
    const offset = nextIndex * width;
    const list = slidesRef.current as any;

    if (list) {
      if (typeof list.scrollToOffset === 'function') {
        list.scrollToOffset({ offset, animated: true });
      } else if (typeof list.scrollToIndex === 'function') {
        list.scrollToIndex({ index: nextIndex, animated: true });
      }
    }

    updateCurrentIndex(nextIndex);
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/register');
    } catch (err) { console.log(err); }
  };

  const scrollToNext = () => {
    const nextIndex = (currentIndexRef.current + 1) % SLIDES.length;
    scrollToSlide(nextIndex);
  };

  const renderItem = ({ item }) => {
    
    if (item.type === 'welcome') {
      return (
        <View style={{ width, height }}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={[styles.gradientContainer, isDesktop && styles.gradientContainerDesktop]}
          >
            <View
              style={[
                styles.contentContainer,
                { marginTop: isDesktop ? -10 : -50 },
                isDesktop && { maxWidth: desktopContentMaxWidth },
              ]}
            > 
              <Text style={[styles.mainTitle, isDesktop && styles.mainTitleDesktop]}>{item.title}</Text>
              <Text
                style={[
                  styles.mainDesc,
                  isDesktop && styles.mainDescDesktop,
                  isDesktop && { maxWidth: desktopTextMaxWidth },
                ]}
              >
                {item.description}
              </Text>
              
              <View
                style={[
                  styles.imagePlaceholder,
                  {
                    width: isDesktop ? desktopImageWidth : width * 0.85,
                    height: isDesktop ? 280 : 260,
                    marginTop: isDesktop ? 36 : 30,
                  },
                ]}
              >
                <Img source={require('../assets/images/onboarding-picture.jpg')} style={styles.imageSlide} />
              </View>

              <View style={[styles.statsContainer, isDesktop && styles.statsContainerDesktop]}>
                 <Text style={[styles.statText, isDesktop && styles.statTextDesktop]}>
                  ✨ Pensé pour les étudiants
                 </Text>
                 <Text style={[styles.statText, isDesktop && styles.statTextDesktop]}>
                  🥗 Recettes faciles
                 </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    }

    if (item.type === 'features') {
      return (
        <View
          style={[
            styles.creamContainer,
            { width, height },
            isDesktop && styles.creamContainerDesktop,
            styles.creamContainerCentered,
          ]}
        >
          <View
            style={[
              styles.centeredSlideBlock,
              isDesktop && styles.centeredSlideBlockDesktop,
              isDesktop && { maxWidth: desktopFeatureWidth },
              styles.centeredSlideBlockNoFooterOffset,
            ]}
          >
            <Text style={[styles.darkTitle, isDesktop && styles.darkTitleDesktop]} accessibilityRole="header">{item.title}</Text>
            <Text style={[styles.darkSubtitle, isDesktop && styles.darkSubtitleDesktop]}>{item.subtitle}</Text>
            
            <View style={[styles.cardsWrapper, isDesktop && styles.cardsWrapperDesktop]}>
              {item.items.map((feature, index) => (
                <View
                  key={index}
                  style={[styles.featureCard, isDesktop && styles.featureCardDesktop]}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`${feature.title}. ${feature.desc}`}
                >
                  <View
                    style={[styles.iconBox, isDesktop && styles.iconBoxDesktop]}
                    accessible={false}
                    importantForAccessibility="no"
                  >
                    <Ionicons name={feature.icon} size={28} color="#FFF" />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={[styles.cardTitle, isDesktop && styles.cardTitleDesktop]}>{feature.title}</Text>
                    <Text style={[styles.cardDesc, isDesktop && styles.cardDescDesktop]}>{feature.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (item.type === 'steps') {
      return (
        <View style={[styles.creamContainer, { width, height }, isDesktop && styles.creamContainerDesktop]}>
          <View
            style={[
              styles.centeredSlideBlock,
              isDesktop && styles.centeredSlideBlockDesktop,
              isDesktop && { maxWidth: desktopStepsWidth },
            ]}
          >
             <Text style={[styles.darkTitle, isDesktop && styles.darkTitleDesktop]} accessibilityRole="header">{item.title}</Text>
             <Text style={[styles.darkSubtitle, isDesktop && styles.darkSubtitleDesktop]}>{item.subtitle}</Text>

             <View style={[styles.stepsWrapper, isDesktop && styles.stepsWrapperDesktop]}>
                {item.steps.map((step, index) => (
                  <View key={index} style={[styles.stepItem, isDesktop && styles.stepItemDesktop]}>
                    <View style={[styles.stepCircle, isDesktop && styles.stepCircleDesktop]}>
                      <Text style={[styles.stepNum, isDesktop && styles.stepNumDesktop]}>{step.num}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[styles.stepTitle, isDesktop && styles.stepTitleDesktop]}>{step.title}</Text>
                      <Text style={[styles.stepDesc, isDesktop && styles.stepDescDesktop]}>{step.desc}</Text>
                    </View>
                  </View>
                ))}
             </View>
          </View>
        </View>
      );
    }

    if (item.type === 'final') {
      return (
        <View style={{ width, height }}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={[styles.gradientContainer, isDesktop && styles.gradientContainerDesktop]}
          >
             <View style={[styles.contentContainer, isDesktop && { maxWidth: desktopContentMaxWidth }]}>
                <Ionicons
                  name="happy-outline"
                  size={isDesktop ? 120 : 100}
                  color="white"
                  style={{ marginBottom: isDesktop ? 40 : 30 }}
                />
                <Text style={[styles.mainTitle, isDesktop && styles.mainTitleDesktop]}>{item.title}</Text>
                <Text
                  style={[
                    styles.mainDesc,
                    isDesktop && styles.mainDescDesktop,
                    isDesktop && { maxWidth: desktopTextMaxWidth },
                  ]}
                >
                  {item.description}
                </Text>
                
                <TouchableOpacity
                  style={[styles.whiteBtn, isDesktop && styles.whiteBtnDesktop]}
                  onPress={finishOnboarding}
                >
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
        keyExtractor={(item) => item.type}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        onMomentumScrollEnd={(e) => {
          updateCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      />

      <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.indicator, 
                isDesktop && styles.indicatorDesktop,
                currentIndex === index && styles.activeIndicator,
                currentIndex === index && isDesktop && styles.activeIndicatorDesktop,
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
            isDesktop && styles.nextTextDesktop,
            (currentIndex === 1 || currentIndex === 2) ? { color: COLORS.primary } : { color: '#FFF' }
          ]}>
            Suivant
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageSlide: { width: '100%', height: '100%', borderRadius: 25, resizeMode: 'cover' },
  container: { flex: 1 },
  
  gradientContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  gradientContainerDesktop: { paddingHorizontal: 48 },
  creamContainer: { flex: 1, backgroundColor: COLORS.cream, padding: 20, paddingTop: 80, alignItems: 'center' },
  creamContainerCentered: { paddingTop: 0 },
  creamContainerDesktop: { paddingHorizontal: 34, paddingTop: 64 },
  
  contentContainer: { alignItems: 'center', width: '30%' },

  mainTitle: { fontSize: 34, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 20 },
  mainTitleDesktop: { fontSize: 62, lineHeight: 68, marginBottom: 24 },
  mainDesc: { fontSize: 17, color: '#FFF', textAlign: 'center', opacity: 0.95, lineHeight: 26, paddingHorizontal: 10 },
  mainDescDesktop: { fontSize: 20, lineHeight: 31, paddingHorizontal: 0 },
  
  darkTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8, textAlign: 'center' },
  darkTitleDesktop: { fontSize: 42, lineHeight: 48 },
  darkSubtitle: { fontSize: 15, color: '#4D4D4D', marginBottom: 30, textAlign: 'center' },
  darkSubtitleDesktop: { fontSize: 19, lineHeight: 26, marginBottom: 40 },
  centeredSlideBlock: { flex: 1, width: '100%', justifyContent: 'center', paddingBottom: 85 },
  centeredSlideBlockNoFooterOffset: { paddingBottom: 0 },
  centeredSlideBlockDesktop: { alignSelf: 'center', paddingBottom: 32 },

  imagePlaceholder: {
    width: '55%', height: 260, backgroundColor: '#FFF', borderRadius: 35,
    justifyContent: 'center', alignItems: 'center', marginTop: 30, elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: {width:0, height:5}
  },
  statsContainer: { flexDirection: 'row', marginTop: 25, gap: 20 },
  statsContainerDesktop: { marginTop: 30 },
  statText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600'},
  statTextDesktop: { fontSize: 20, lineHeight: 26 },

  cardsWrapper: { width: '100%', gap: 12 },
  cardsWrapperDesktop: { gap: 16, alignSelf: 'center' },
  featureCard: {
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    paddingVertical: 18,
    paddingHorizontal: 20, 
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 10, 
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,159,28, 0.1)',
    width : '100%',
    
  },
  featureCardDesktop: { paddingVertical: 20, paddingHorizontal: 24},
  iconBox: { 
    width: 52, height: 52, backgroundColor: COLORS.primary, borderRadius: 14, 
    justifyContent: 'center', alignItems: 'center', marginRight: 18 
  },
  iconBoxDesktop: { width: 58, height: 58, borderRadius: 16, marginRight: 20 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardTitleDesktop: { fontSize: 22, lineHeight: 28 },
  cardDesc: { fontSize: 14, color: '#4A4A4A', lineHeight: 20 },
  cardDescDesktop: { fontSize: 17, lineHeight: 24 },

  // --- PAGE 3 : ETAPES ---
  stepsWrapper: { width: '100%', alignItems: 'center', gap: 35 },
  stepsWrapperDesktop: { gap: 30 },
  stepItem: { alignItems: 'center', width: '85%' },
  stepItemDesktop: { width: '100%' },
  stepCircle: { 
    width: 55, height: 55, backgroundColor: COLORS.primary, borderRadius: 30, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6
  },
  stepCircleDesktop: { width: 68, height: 68, borderRadius: 34, marginBottom: 14 },
  stepNum: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  stepNumDesktop: { fontSize: 30, lineHeight: 34 },
  stepTitle: { fontSize: 19, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  stepTitleDesktop: { fontSize: 28, lineHeight: 34 },
  stepDesc: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
  stepDescDesktop: { fontSize: 18, lineHeight: 26 },

  // --- FOOTER ---
  footer: { position: 'absolute', bottom: 50, left: 25, right: 25, minHeight: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 30, elevation: 30 },
  footerDesktop: { bottom: 34, left: 34, right: 34 },
  indicatorContainer: { flexDirection: 'row' },
  indicator: { height: 8, width: 8, borderRadius: 4, marginHorizontal: 4 },
  indicatorDesktop: { height: 10, width: 10, borderRadius: 5, marginHorizontal: 5 },
  activeIndicator: { width: 22 },
  activeIndicatorDesktop: { width: 28 },
  nextBtn: { paddingVertical: 10, paddingHorizontal: 12, minWidth: 90, alignItems: 'flex-end' },
  nextText: { fontSize: 18, fontWeight: 'bold' },
  nextTextDesktop: { fontSize: 22 },

  whiteBtn: { 
    backgroundColor: '#FFF', paddingVertical: 18, paddingHorizontal: 35, 
    borderRadius: 35, marginTop: 50, width: '90%', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
  },
  whiteBtnDesktop: { width: '100%', maxWidth: 1040, marginTop: 62, paddingVertical: 20 },
  whiteBtnText: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold' }
});
