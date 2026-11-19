/**
 * Inventaire complet du frigo (produits enregistrés en base via l'API).
 * L'ancienne prise en compte des produits stockés en local est commentée.
 * Utilisé par le générateur IA pour pré-sélectionner tout le frigo.
 */
import { STORAGE_KEYS } from "@/constants/storage";
import { normalizeIngredientName } from "@/src/lib/ingredientName";
import { getFrigoIngredients } from "@/src/services/fridge";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FridgeInventoryItem = {
  name: string;
  emoji: string;
  source: "api" | "local";
};

type StoredEntry = { name?: string; emoji?: string; quantity?: number };

export async function getFullFridgeInventory(): Promise<FridgeInventoryItem[]> {
  const [apiResult, rawLocal] = await Promise.all([
    getFrigoIngredients().catch(() => []),
    AsyncStorage.getItem(STORAGE_KEYS.frigoIngredients).catch(() => null),
  ]);

  const items: FridgeInventoryItem[] = apiResult.map((ing) => ({
    name: ing.name,
    emoji: ing.image || "🍽️",
    source: "api",
  }));

  // Ancien : ajout des produits stockés uniquement en local (ids « local_… »).
  // Désactivé : le frigo ne contient plus que des ingrédients de la BDD.
  // try {
  //   const stored = rawLocal ? (JSON.parse(rawLocal) as Record<string, StoredEntry>) : {};
  //   Object.entries(stored).forEach(([key, entry]) => {
  //     if (!key.startsWith("local_") || !entry?.name) return;
  //     if ((entry.quantity ?? 1) <= 0) return;
  //     items.push({ name: entry.name, emoji: entry.emoji || "🛒", source: "local" });
  //   });
  // } catch {
  //   // stockage local illisible : on garde au moins les produits de l'API
  // }
  void rawLocal;

  // Dédoublonnage tolérant (casse, accents, singulier / pluriel)
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeIngredientName(item.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
