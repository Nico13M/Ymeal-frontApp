import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    FlatList, Image,
    Keyboard,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { RECIPES } from '../../constants/recipesData';

export default function RecipesScreen() {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);

  const filteredRecipes = RECIPES.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleSearch = () => {
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchQuery('');
      Keyboard.dismiss();
    } else {
      setIsSearchActive(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const renderRecipeItem = ({ item }) => (
    <Link href={`/recipe/${item.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={styles.rowBetween}>
             <Text style={styles.cardTitle}>{item.title}</Text>
             <View style={styles.ratingBadge}>
               <Ionicons name="star" size={12} color="#FFF" />
               <Text style={styles.ratingText}>{item.rating}</Text>
             </View>
          </View>
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.time}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.reviews} avis</Text>
            </View>
          </View>
          <View style={styles.rowBetween}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.difficulty}</Text>
            </View>
            <Text style={styles.linkText}>Voir la recette ➔</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

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