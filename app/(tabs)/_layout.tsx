import { Ionicons } from '@expo/vector-icons'; // Bibliothèque d'icônes standard
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF9F1C', // Orange quand actif
        tabBarInactiveTintColor: '#A0A0A0', // Gris quand inactif
        headerShown: false, // On cache le titre par défaut en haut (on le fera nous-même)
        
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0, // Enlève la ligne du haut pour un look plus moderne
          elevation: 10, // Ombre sur Android
          shadowColor: '#000', // Ombre sur iOS
          shadowOpacity: 0.1,
          shadowRadius: 10,
          height: 65, // Hauteur confortable
          paddingBottom: 10, // Espace pour les barres de geste iPhone
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="fridge"
        options={{
          title: 'Frigo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="nutrition-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 3. RECETTES (recipes.tsx) */}
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recettes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 4. PROFIL (profile.tsx) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}