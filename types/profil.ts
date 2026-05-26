export type BudgetChoice = "PETIT" | "MOYEN" | "LARGE";

export type PeopleChoice = "1" | "2" | "3-4" | "5+";

export type StoredProfileConfig = {
  diets?: string[];
  location?: string;
  budget?: BudgetChoice | null;
  cuisines?: string[];
  avoidVeg?: string[];
  avoid_ingredients?: string[];
  allergies?: string[];
  people?: PeopleChoice | null;
  people_count?: PeopleChoice | null;
};

export type CitySuggestion = {
  id: string;
  label: string;
  value: string;
};