import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF9F1C', // Orange quand actif
        tabBarInactiveTintColor: '#A0A0A0', // Gris quand inactif
        headerShown: false, // On cache le titre par défaut en haut (on le fera nous-même)

        tabBarActiveTintColor: '#FF9F1C',
        tabBarInactiveTintColor: '#A0A0A0',
        headerShown: false,

        // MODIFICATION ICI : Ajustement des hauteurs et paddings
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 10,
          height: 60,        // Hauteur légèrement réduite (était 65)
          paddingBottom: 5,  // Beaucoup moins d'espace en bas (était 10)
          paddingTop: 5,     // Un peu d'espace en haut pour centrer
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 5, // Petit espace sous le texte si besoin
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'Frigo',
          tabBarIcon: ({ color, size }) => <Ionicons name="nutrition-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recettes',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}