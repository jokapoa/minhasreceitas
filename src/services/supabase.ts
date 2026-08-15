import { createClient } from '@supabase/supabase-js';
import type { Recipe, Cookbook, MealPlanItem, GroceryItem } from '../types/recipe';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pxwoqnwqpgzxchthggib.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4d29xbndxcGd6eGNodGhnZ2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MzExODMsImV4cCI6MjEwMjQwNzE4M30.yzRCWvinQqNHQ3srgxx24lOk-U7bphYvc-IwqCL3FPI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to convert DB snake_case row to TypeScript Recipe
export function mapRowToRecipe(row: any): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    image: row.image || '',
    prepTimeMinutes: row.prep_time_minutes || 15,
    cookTimeMinutes: row.cook_time_minutes || 20,
    servings: row.servings || 4,
    difficulty: row.difficulty || 'Fácil',
    cuisine: row.cuisine || 'Brasileira',
    category: row.category || 'Almoço',
    tags: row.tags || [],
    sourceUrl: row.source_url || '',
    sourcePlatform: row.source_platform || 'manual',
    videoEmbedUrl: row.video_embed_url || '',
    author: row.author || '',
    rating: Number(row.rating) || 5.0,
    favorite: Boolean(row.favorite),
    notes: row.notes || '',
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    nutrition: row.nutrition || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// Helper to convert TypeScript Recipe to DB snake_case row
export function mapRecipeToRow(recipe: Recipe, syncCode: string = 'joka-receitas') {
  return {
    id: recipe.id,
    sync_code: syncCode,
    title: recipe.title,
    description: recipe.description || '',
    image: recipe.image || '',
    prep_time_minutes: recipe.prepTimeMinutes || 15,
    cook_time_minutes: recipe.cookTimeMinutes || 20,
    servings: recipe.servings || 4,
    difficulty: recipe.difficulty || 'Fácil',
    cuisine: recipe.cuisine || 'Brasileira',
    category: recipe.category || 'Almoço',
    tags: recipe.tags || [],
    source_url: recipe.sourceUrl || '',
    source_platform: recipe.sourcePlatform || 'manual',
    video_embed_url: recipe.videoEmbedUrl || '',
    author: recipe.author || '',
    rating: recipe.rating || 5.0,
    favorite: recipe.favorite || false,
    notes: recipe.notes || '',
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    nutrition: recipe.nutrition || {},
    updated_at: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// RECIPES CRUD
// -------------------------------------------------------------
export async function dbFetchRecipes(syncCode: string = 'joka-receitas'): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('sync_code', syncCode)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase dbFetchRecipes error:', error);
      return [];
    }
    return (data || []).map(mapRowToRecipe);
  } catch (e) {
    console.warn('Supabase network error in dbFetchRecipes:', e);
    return [];
  }
}

export async function dbSaveRecipe(recipe: Recipe, syncCode: string = 'joka-receitas'): Promise<boolean> {
  try {
    const row = mapRecipeToRow(recipe, syncCode);
    const { error } = await supabase
      .from('recipes')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Supabase dbSaveRecipe error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase network error in dbSaveRecipe:', e);
    return false;
  }
}

export async function dbDeleteRecipe(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase dbDeleteRecipe error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase network error in dbDeleteRecipe:', e);
    return false;
  }
}

// -------------------------------------------------------------
// COOKBOOKS CRUD
// -------------------------------------------------------------
export async function dbFetchCookbooks(syncCode: string = 'joka-receitas'): Promise<Cookbook[]> {
  try {
    const { data, error } = await supabase
      .from('cookbooks')
      .select('*')
      .eq('sync_code', syncCode)
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      icon: row.icon || '📖',
      color: row.color || '#F97316',
      recipeIds: row.recipe_ids || [],
    }));
  } catch {
    return [];
  }
}

export async function dbSaveCookbook(cookbook: Cookbook, syncCode: string = 'joka-receitas'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cookbooks')
      .upsert({
        id: cookbook.id,
        sync_code: syncCode,
        name: cookbook.name,
        description: cookbook.description || '',
        icon: cookbook.icon || '📖',
        color: cookbook.color || '#F97316',
        recipe_ids: cookbook.recipeIds || [],
      }, { onConflict: 'id' });

    return !error;
  } catch {
    return false;
  }
}

export async function dbDeleteCookbook(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cookbooks').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// MEAL PLANS CRUD
// -------------------------------------------------------------
export async function dbFetchMealPlans(syncCode: string = 'joka-receitas'): Promise<MealPlanItem[]> {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('sync_code', syncCode);

    if (error) return [];
    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      mealType: row.meal_type,
      recipeId: row.recipe_id,
      servings: row.servings || 4,
      customNotes: row.custom_notes || '',
    }));
  } catch {
    return [];
  }
}

export async function dbSaveMealPlan(item: MealPlanItem, syncCode: string = 'joka-receitas'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('meal_plans')
      .upsert({
        id: item.id,
        sync_code: syncCode,
        date: item.date,
        meal_type: item.mealType,
        recipe_id: item.recipeId,
        servings: item.servings || 4,
        custom_notes: item.customNotes || '',
      }, { onConflict: 'id' });

    return !error;
  } catch {
    return false;
  }
}

export async function dbDeleteMealPlan(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('meal_plans').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// GROCERY ITEMS CRUD
// -------------------------------------------------------------
export async function dbFetchGroceryItems(syncCode: string = 'joka-receitas'): Promise<GroceryItem[]> {
  try {
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('sync_code', syncCode)
      .order('added_at', { ascending: false });

    if (error) return [];
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      amount: Number(row.amount) || 1,
      unit: row.unit || 'un',
      category: row.category || 'Outros',
      checked: Boolean(row.checked),
      recipeId: row.recipe_id || undefined,
      recipeTitle: row.recipe_title || undefined,
      addedAt: row.added_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function dbSaveGroceryItem(item: GroceryItem, syncCode: string = 'joka-receitas'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('grocery_items')
      .upsert({
        id: item.id,
        sync_code: syncCode,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        category: item.category,
        checked: item.checked,
        recipe_id: item.recipeId || '',
        recipe_title: item.recipeTitle || '',
      }, { onConflict: 'id' });

    return !error;
  } catch {
    return false;
  }
}

export async function dbDeleteGroceryItem(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('grocery_items').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// REALTIME SUBSCRIPTION
// -------------------------------------------------------------
export function subscribeToSupabase(syncCode: string, onChange: () => void) {
  const channel = supabase
    .channel(`realtime_${syncCode}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
      onChange();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cookbooks' }, () => {
      onChange();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plans' }, () => {
      onChange();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, () => {
      onChange();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
