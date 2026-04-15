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
    View,
    ScrollView,
} from 'react-native';
import { RECIPES } from '../../constants/recipesData';

const EMOJI_MAP: Record<string, string> = {
    'poulet': '🍗', 'boeuf': '🥩', 'poisson': '🐟', 'oeuf': '🥚', 'lait': '🥛',
    'farine': '🌾', 'sucre': '🍬', 'sel': '🧂', 'poivre': '🧂', 'tomate': '🍅',
    'carotte': '🥕', 'oignon': '🧅', 'ail': '🧄', 'pomme de terre': '🥔',
    'riz': '🍚', 'pates': '🍝', 'fromage': '🧀', 'beurre': '🧈', 'huile': '🍾'
};

export default function RecipesScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showGenerator, setShowGenerator] = useState(false);
    const inputRef = useRef(null);

    const [nbPers, setNbPers] = useState(2);
    const [difficulty, setDifficulty] = useState('Débutant');
    const [type, setType] = useState('Plat');
    const [time, setTime] = useState('Moyen');
    const [price, setPrice] = useState('Moyen');
    const [context, setContext] = useState('');
    const [useFrigo, setUseFrigo] = useState(false);

    const [ingredientInput, setIngredientInput] = useState('');
    const [addedIngredients, setAddedIngredients] = useState<{name: string, emoji: string}[]>([]);

    const filteredRecipes = RECIPES.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAddIngredient = () => {
        if (ingredientInput.trim() === '' || useFrigo) return;
        const name = ingredientInput.toLowerCase().trim();
        const emoji = EMOJI_MAP[name] || '🍲';
        setAddedIngredients([...addedIngredients, { name: ingredientInput, emoji }]);
        setIngredientInput('');
    };

    const removeIngredient = (index: number) => {
        setAddedIngredients(addedIngredients.filter((_, i) => i !== index));
    };

    const Selector = ({ label, options, current, setter }) => (
        <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>{label}</Text>
            <View style={styles.chipRow}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt}
                        onPress={() => setter(opt)}
                        style={[styles.chip, current === opt && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, current === opt && styles.chipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

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
                    <View style={styles.rowBetween}>
                        <View style={styles.tag}><Text style={styles.tagText}>{item.difficulty}</Text></View>
                        <Text style={styles.linkText}>Voir la recette ➔</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#00C853" barStyle="light-content" />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Recettes</Text>

                    {/* BOUTON DE NAVIGATION HAUT DROITE */}
                    <TouchableOpacity
                        onPress={() => setShowGenerator(!showGenerator)}
                        style={styles.navButton}
                    >
                        <Ionicons
                            name={showGenerator ? "list" : "sparkles"}
                            size={18}
                            color="#00C853"
                        />
                        <Text style={styles.navButtonText}>
                            {showGenerator ? "Toutes les recettes" : "Générateur de recettes"}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSub}>
                    {showGenerator ? "Crée ta recette sur mesure" : "Basées sur tes ingrédients"}
                </Text>
            </View>

            {showGenerator ? (
                <ScrollView contentContainerStyle={styles.scrollForm}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.selectorLabel}>Ingrédients spécifiques</Text>
                        <View style={styles.row}>
                            <View style={[
                                styles.searchBarContainer,
                                { flex: 1, marginRight: 10 },
                                useFrigo && { backgroundColor: '#F0F0F0', opacity: 0.6 }
                            ]}>
                                <TextInput
                                    placeholder={useFrigo ? "Désactivé (Mode Frigo)" : "Ajouter un ingrédient..."}
                                    style={{ flex: 1 }}
                                    value={ingredientInput}
                                    onChangeText={setIngredientInput}
                                    editable={!useFrigo}
                                    onSubmitEditing={handleAddIngredient}
                                />
                                <TouchableOpacity onPress={handleAddIngredient} disabled={useFrigo}>
                                    <Ionicons name="add-circle" size={24} color={useFrigo ? "#CCC" : "#00C853"} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                onPress={() => setUseFrigo(!useFrigo)}
                                style={[styles.frigoBtn, useFrigo && styles.frigoBtnActive]}
                            >
                                <Ionicons name="fast-food" size={20} color={useFrigo ? "#FFF" : "#00C853"} />
                                <Text style={[styles.frigoBtnText, useFrigo && {color: '#FFF'}]}>Frigo</Text>
                            </TouchableOpacity>
                        </View>

                        {!useFrigo && addedIngredients.length > 0 && (
                            <View style={[styles.chipRow, { flexWrap: 'wrap', marginTop: 10 }]}>
                                {addedIngredients.map((ing, index) => (
                                    <View key={index} style={[styles.chip, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9' }]}>
                                        <Text>{ing.emoji} {ing.name}</Text>
                                        <TouchableOpacity onPress={() => removeIngredient(index)} style={{ marginLeft: 8 }}>
                                            <Ionicons name="close-circle" size={16} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.counterGroup}>
                        <Text style={styles.selectorLabel}>Nombre de personnes</Text>
                        <View style={styles.counter}>
                            <TouchableOpacity onPress={() => setNbPers(Math.max(1, nbPers - 1))}>
                                <Ionicons name="remove-circle-outline" size={32} color="#00C853" />
                            </TouchableOpacity>
                            <Text style={styles.counterText}>{nbPers}</Text>
                            <TouchableOpacity onPress={() => setNbPers(nbPers + 1)}>
                                <Ionicons name="add-circle-outline" size={32} color="#00C853" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Selector label="Difficulté" options={['Débutant', 'Initié', 'Chef étoilé']} current={difficulty} setter={setDifficulty} />
                    <Selector label="Type de plat" options={['Entrée', 'Plat', 'Dessert']} current={type} setter={setType} />
                    <Selector label="Temps" options={['Express', 'Moyen', 'Mijoté']} current={time} setter={setTime} />
                    <Selector label="Budget" options={['Éco', 'Équilibré', 'Gourmet']} current={price} setter={setPrice} />

                    <View style={styles.inputGroup}>
                        <Text style={styles.selectorLabel}>Contexte / Régime (Optionnel)</Text>
                        <TextInput
                            style={styles.textArea}
                            multiline
                            placeholder="Ex: Pas de lait, Sans gluten, Halal..."
                            value={context}
                            onChangeText={setContext}
                        />
                    </View>

                    <TouchableOpacity style={styles.generateBtn}>
                        <LinearGradient colors={['#FF9F1C', '#FF7E05']} style={styles.gradientBtn}>
                            <Text style={styles.generateBtnText}>Générer la recette</Text>
                            <Ionicons name="color-wand" size={20} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <FlatList
                    data={filteredRecipes}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderRecipeItem}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: {
        backgroundColor: '#00C853', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
        borderBottomLeftRadius: 25, borderBottomRightRadius: 25
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
    headerSub: { color: '#E8F5E9', fontSize: 14, marginTop: 4 },

    // NOUVEAU STYLE BOUTONS NAV
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 2,
        maxWidth: '70%'
    },
    navButtonText: {
        color: '#00C853',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },

    scrollForm: { padding: 20, paddingBottom: 50 },
    selectorContainer: { marginBottom: 20 },
    selectorLabel: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 10, marginLeft: 5 },
    chipRow: { flexDirection: 'row', gap: 10 },
    chip: {
        backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 8,
        borderRadius: 10, borderWidth: 1, borderColor: '#DDD'
    },
    chipActive: { backgroundColor: '#00C853', borderColor: '#00C853' },
    chipText: { color: '#666', fontWeight: '600' },
    chipTextActive: { color: '#FFF' },
    row: { flexDirection: 'row', alignItems: 'center' },
    searchBarContainer: {
        flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12,
        paddingHorizontal: 15, height: 45, alignItems: 'center', elevation: 2
    },
    frigoBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        paddingHorizontal: 15, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#00C853'
    },
    frigoBtnActive: { backgroundColor: '#00C853' },
    frigoBtnText: { marginLeft: 5, color: '#00C853', fontWeight: 'bold' },
    counterGroup: { marginBottom: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 15, padding: 5 },
    counterText: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, color: '#333' },
    textArea: {
        backgroundColor: '#FFF', borderRadius: 12, padding: 15, height: 80,
        textAlignVertical: 'top', borderWidth: 1, borderColor: '#DDD'
    },
    inputGroup: { marginBottom: 20 },
    generateBtn: { marginTop: 10, borderRadius: 15, overflow: 'hidden', elevation: 4 },
    gradientBtn: {
        paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10
    },
    generateBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    listContent: { padding: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 15, marginBottom: 15, overflow: 'hidden', elevation: 3 },
    cardImage: { width: '100%', height: 160 },
    cardContent: { padding: 15 },
    cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', flex: 1 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    ratingBadge: { flexDirection: 'row', backgroundColor: '#FFC107', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
    ratingText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4, color: '#333' },
    tag: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
    tagText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
    linkText: { color: '#FF9F1C', fontWeight: 'bold' }
});