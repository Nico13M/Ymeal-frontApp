import { radius } from "@/constants/design";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useSegments } from "expo-router";
import { Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_COUNT = 5;

/**
 * Couleur des logos de la barre du bas selon la page affichée :
 *  - Accueil, Recettes, Profil : orange #FF9C1A
 *  - Frigo, Favoris : fond du logo actif en #E5EA98
 */
type TabTheme = { icon: string; label: string; pill: string; inactive: string };
const ORANGE_THEME: TabTheme = {
  icon: "#FF9C1A",
  label: "#FF9C1A",
  pill: "rgba(255,156,26,0.14)",
  inactive: "#5B6472",
};
// Frigo / Favoris : fond du logo actif en #E5EA98, logo et libellé vert olive pour rester lisibles
const LIME_THEME: TabTheme = {
  icon: "#4F5612",
  label: "#6B7420",
  pill: "#E5EA98",
  inactive: "#5B6472",
};
const TAB_THEMES: Record<string, TabTheme> = {
  index: ORANGE_THEME,
  recipes: ORANGE_THEME,
  profile: ORANGE_THEME,
  fridge: LIME_THEME,
  favorites: LIME_THEME,
};

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  // segments = ["(tabs)", "fridge"] ; l'accueil n'a pas de 2e segment
  const current = (segments[1] as string | undefined) ?? "index";
  const theme = TAB_THEMES[current] ?? ORANGE_THEME;

  // « Recettes » est le libellé le plus long : la taille est calculée
  // pour qu'il tienne en entier dans la largeur d'un onglet.
  const itemWidth = width / TAB_COUNT;
  const labelSize = Math.max(9, Math.min(12.5, (itemWidth - 2) / 5.6));

  const icon =
    (outline: IconName, filled: IconName) =>
    ({ color, focused }: { color: string; focused: boolean }) => (
      <View style={[styles.iconWrap, focused && { backgroundColor: theme.pill }]}>
        <Ionicons name={focused ? filled : outline} size={22} color={focused ? theme.icon : color} />
      </View>
    );

  const label =
    (text: string) =>
    ({ color, focused }: { color: string; focused: boolean }) => (
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        allowFontScaling={false}
        style={[
          styles.label,
          { color: focused ? theme.label : color, fontSize: labelSize, width: itemWidth, maxWidth: itemWidth, flexShrink: 0, fontWeight: focused ? "800" : "700" },
        ]}
      >
        {text}
      </Text>
    );

  const bottomPad = Platform.OS === "web" ? 8 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.icon,
        tabBarInactiveTintColor: theme.inactive,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarItemStyle: { flex: 1, minWidth: 0, paddingHorizontal: 0, paddingTop: 4 },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          height: 64 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
          elevation: 16,
          shadowColor: "#7A4800",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Accueil", tabBarLabel: label("Accueil"), tabBarIcon: icon("home-outline", "home") }}
      />
      <Tabs.Screen
        name="fridge"
        options={{ title: "Frigo", tabBarLabel: label("Frigo"), tabBarIcon: icon("nutrition-outline", "nutrition") }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recettes",
          tabBarLabel: label("Recettes"),
          tabBarIcon: icon("restaurant-outline", "restaurant"),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{ title: "Favoris", tabBarLabel: label("Favoris"), tabBarIcon: icon("heart-outline", "heart") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profil", tabBarLabel: label("Profil"), tabBarIcon: icon("person-outline", "person") }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 46,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 3,
    // l'onglet ajoute 5 px de marge de chaque côté : on les récupère pour le libellé
    marginHorizontal: -5,
    letterSpacing: -0.3,
    textAlign: "center",
  },
});
