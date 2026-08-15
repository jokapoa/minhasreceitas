export type AisleCategory = 
  | 'Hortifrúti & Frutas'
  | 'Carnes, Peixes & Aves'
  | 'Laticínios & Ovos'
  | 'Mercearia & Grãos'
  | 'Temperos & Molhos'
  | 'Padaria & Confeitaria'
  | 'Congelados'
  | 'Bebidas'
  | 'Outros';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: AisleCategory;
  note?: string;
  originalText?: string;
}

export interface InstructionStep {
  step: number;
  title?: string;
  instruction: string;
  timerSeconds?: number;
  tip?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export type RecipeCategory = 
  | 'Jantar'
  | 'Almoço'
  | 'Café da Manhã'
  | 'Sobremesa'
  | 'Lanches & Aperitivos'
  | 'Bebidas & Smoothies'
  | 'Saladas & Bowls';

export type RecipeDifficulty = 'Fácil' | 'Médio' | 'Avançado';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  cuisine: string;
  category: RecipeCategory;
  tags: string[];
  sourceUrl?: string;
  sourcePlatform?: 'instagram' | 'tiktok' | 'youtube' | 'pinterest' | 'blog' | 'manual' | 'ai';
  videoEmbedUrl?: string;
  author?: string;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  nutrition?: NutritionInfo;
  notes?: string;
  favorite: boolean;
  rating: number;
  createdAt: string;
}

export interface Cookbook {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  recipeIds: string[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanItem {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  recipeId: string;
  servings: number;
  customNotes?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: AisleCategory;
  checked: boolean;
  recipeId?: string;
  recipeTitle?: string;
  addedAt: string;
}
