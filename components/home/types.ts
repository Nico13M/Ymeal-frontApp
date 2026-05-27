import type { RecipeMinimal } from '@/src/services/recipes';

export type SortOption =
  | 'ratings_count_desc'
  | 'average_rating_desc'
  | 'created_at_desc'
  | 'created_at_asc';

export type TrendingRecipeItem = RecipeMinimal & {
  ratings_count?: number | null;
  reviews_count?: number | null;
  comments_count?: number | null;
  average_rating?: number | null;
  avg_rating?: number | null;
  rating_average?: number | null;
  created_at?: string | null;
  ratings?: {
    stats?: {
      average?: number | null;
      count?: number | null;
    } | null;
  } | null;
  timestamps?: {
    created_at?: string | null;
  } | null;
};
