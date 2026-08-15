import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Recipe, Cookbook, MealPlanItem, GroceryItem, AisleCategory } from '../types/recipe';
import type { UnitSystem } from '../utils/unitConverter';
import { scaleAmount } from '../utils/unitConverter';
import {
  dbFetchRecipes,
  dbSaveRecipe,
  dbDeleteRecipe,
  dbFetchCookbooks,
  dbSaveCookbook,
  dbDeleteCookbook,
  dbFetchMealPlans,
  dbSaveMealPlan,
  dbDeleteMealPlan,
  dbFetchGroceryItems,
  dbSaveGroceryItem,
  dbDeleteGroceryItem,
  subscribeToSupabase,
} from '../services/supabase';

interface AppContextType {
  recipes: Recipe[];
  cookbooks: Cookbook[];
  mealPlan: MealPlanItem[];
  groceryList: GroceryItem[];
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  
  // Recipe methods
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => Recipe;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
  
  // Cookbook methods
  addCookbook: (cookbook: Omit<Cookbook, 'id'>) => void;
  updateCookbook: (id: string, updates: Partial<Cookbook>) => void;
  deleteCookbook: (id: string) => void;
  toggleRecipeInCookbook: (cookbookId: string, recipeId: string) => void;
  
  // Meal plan methods
  addToMealPlan: (item: Omit<MealPlanItem, 'id'>) => void;
  removeFromMealPlan: (id: string) => void;
  clearMealPlan: () => void;
  
  // Grocery list methods
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'addedAt'>) => void;
  toggleGroceryItem: (id: string) => void;
  removeGroceryItem: (id: string) => void;
  clearCompletedGrocery: () => void;
  clearAllGrocery: () => void;
  importIngredientsToGrocery: (recipe: Recipe, targetServings?: number) => void;
  generateGroceryFromMealPlan: () => void;
  
  // Active modals / navigation
  activeTab: 'explore' | 'cookbooks' | 'planner' | 'grocery' | 'favorites';
  setActiveTab: (tab: 'explore' | 'cookbooks' | 'planner' | 'grocery' | 'favorites') => void;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  cookingRecipe: Recipe | null;
  setCookingRecipe: (recipe: Recipe | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
  
  // Cloud Sync
  syncCode: string;
  setSyncCode: (code: string) => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  syncNow: () => Promise<void>;
  lastSyncedTime: string;

  // Search & Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check URL parameter for sync key (ex: ?sync=joka)
  const [syncCode, setSyncCodeState] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const syncParam = params.get('sync');
    if (syncParam) {
      localStorage.setItem('recime_sync_code', syncParam.toLowerCase().trim());
      return syncParam.toLowerCase().trim();
    }
    return localStorage.getItem('recime_sync_code') || 'joka-receitas';
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const isSyncingRef = useRef(false);

  // Load initial state from localStorage as immediate fast cache
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('recime_recipes');
    return saved ? JSON.parse(saved) : [];
  });

  const [cookbooks, setCookbooks] = useState<Cookbook[]>(() => {
    const saved = localStorage.getItem('recime_cookbooks');
    return saved ? JSON.parse(saved) : [];
  });

  const [mealPlan, setMealPlan] = useState<MealPlanItem[]>(() => {
    const saved = localStorage.getItem('recime_mealplan');
    return saved ? JSON.parse(saved) : [];
  });

  const [groceryList, setGroceryList] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem('recime_grocery');
    return saved ? JSON.parse(saved) : [];
  });

  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem('recime_unit_system');
    return (saved as UnitSystem) || 'metric';
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'explore' | 'cookbooks' | 'planner' | 'grocery' | 'favorites'>('explore');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const setSyncCode = (code: string) => {
    const cleaned = code.toLowerCase().trim();
    localStorage.setItem('recime_sync_code', cleaned);
    setSyncCodeState(cleaned);
  };

  // Pull all data directly from Supabase PostgreSQL
  const syncNow = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus('syncing');

    try {
      const [dbRecipes, dbCbooks, dbMeals, dbGroc] = await Promise.all([
        dbFetchRecipes(syncCode),
        dbFetchCookbooks(syncCode),
        dbFetchMealPlans(syncCode),
        dbFetchGroceryItems(syncCode),
      ]);

      setRecipes(dbRecipes);
      setCookbooks(dbCbooks);
      setMealPlan(dbMeals);
      setGroceryList(dbGroc);

      localStorage.setItem('recime_recipes', JSON.stringify(dbRecipes));
      localStorage.setItem('recime_cookbooks', JSON.stringify(dbCbooks));
      localStorage.setItem('recime_mealplan', JSON.stringify(dbMeals));
      localStorage.setItem('recime_grocery', JSON.stringify(dbGroc));

      setSyncStatus('synced');
      setLastSyncedTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Supabase fetch failed:', err);
      setSyncStatus('error');
    } finally {
      isSyncingRef.current = false;
    }
  }, [syncCode]);

  // Initial load from Supabase on mount or when syncCode changes
  useEffect(() => {
    syncNow();
  }, [syncCode]);

  // Realtime subscription via Supabase PostgreSQL
  useEffect(() => {
    if (!syncCode) return;

    const unsubscribe = subscribeToSupabase(syncCode, () => {
      console.log('⚡ Realtime update received from Supabase!');
      syncNow();
    });

    const onFocus = () => syncNow();
    window.addEventListener('focus', onFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, [syncCode, syncNow]);

  // Cache unit system locally
  useEffect(() => {
    localStorage.setItem('recime_unit_system', unitSystem);
  }, [unitSystem]);

  // -------------------------------------------------------------
  // RECIPE ACTIONS (Optimistic UI + Supabase Persistence)
  // -------------------------------------------------------------
  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt'>): Recipe => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setRecipes(prev => {
      const updated = [newRecipe, ...prev];
      localStorage.setItem('recime_recipes', JSON.stringify(updated));
      return updated;
    });

    // Save to Supabase in background
    dbSaveRecipe(newRecipe, syncCode).catch(console.error);

    return newRecipe;
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    let targetRecipe: Recipe | null = null;

    setRecipes(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          targetRecipe = { ...r, ...updates };
          return targetRecipe;
        }
        return r;
      });
      localStorage.setItem('recime_recipes', JSON.stringify(updated));
      return updated;
    });

    if (selectedRecipe?.id === id) {
      setSelectedRecipe(prev => prev ? { ...prev, ...updates } : null);
    }

    if (targetRecipe) {
      dbSaveRecipe(targetRecipe, syncCode).catch(console.error);
    }
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem('recime_recipes', JSON.stringify(updated));
      return updated;
    });

    setCookbooks(prev => {
      const updated = prev.map(cb => ({
        ...cb,
        recipeIds: cb.recipeIds.filter(rId => rId !== id)
      }));
      localStorage.setItem('recime_cookbooks', JSON.stringify(updated));
      return updated;
    });

    setMealPlan(prev => {
      const updated = prev.filter(mp => mp.recipeId !== id);
      localStorage.setItem('recime_mealplan', JSON.stringify(updated));
      return updated;
    });

    if (selectedRecipe?.id === id) setSelectedRecipe(null);

    // Delete in Supabase
    dbDeleteRecipe(id).catch(console.error);
  };

  const toggleFavorite = (id: string) => {
    let updatedFavRecipe: Recipe | null = null;
    setRecipes(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          updatedFavRecipe = { ...r, favorite: !r.favorite };
          return updatedFavRecipe;
        }
        return r;
      });
      localStorage.setItem('recime_recipes', JSON.stringify(updated));
      return updated;
    });

    if (selectedRecipe?.id === id) {
      setSelectedRecipe(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
    }

    if (updatedFavRecipe) {
      dbSaveRecipe(updatedFavRecipe, syncCode).catch(console.error);
    }
  };

  // -------------------------------------------------------------
  // COOKBOOK ACTIONS
  // -------------------------------------------------------------
  const addCookbook = (cookbookData: Omit<Cookbook, 'id'>) => {
    const newCookbook: Cookbook = {
      ...cookbookData,
      id: `cb-${Date.now()}`,
    };
    setCookbooks(prev => {
      const updated = [...prev, newCookbook];
      localStorage.setItem('recime_cookbooks', JSON.stringify(updated));
      return updated;
    });
    dbSaveCookbook(newCookbook, syncCode).catch(console.error);
  };

  const updateCookbook = (id: string, updates: Partial<Cookbook>) => {
    let updatedCb: Cookbook | null = null;
    setCookbooks(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          updatedCb = { ...c, ...updates };
          return updatedCb;
        }
        return c;
      });
      localStorage.setItem('recime_cookbooks', JSON.stringify(updated));
      return updated;
    });
    if (updatedCb) {
      dbSaveCookbook(updatedCb, syncCode).catch(console.error);
    }
  };

  const deleteCookbook = (id: string) => {
    setCookbooks(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('recime_cookbooks', JSON.stringify(updated));
      return updated;
    });
    dbDeleteCookbook(id).catch(console.error);
  };

  const toggleRecipeInCookbook = (cookbookId: string, recipeId: string) => {
    let updatedCb: Cookbook | null = null;
    setCookbooks(prev => {
      const updated = prev.map(cb => {
        if (cb.id !== cookbookId) return cb;
        const exists = cb.recipeIds.includes(recipeId);
        updatedCb = {
          ...cb,
          recipeIds: exists ? cb.recipeIds.filter(id => id !== recipeId) : [...cb.recipeIds, recipeId]
        };
        return updatedCb;
      });
      localStorage.setItem('recime_cookbooks', JSON.stringify(updated));
      return updated;
    });
    if (updatedCb) {
      dbSaveCookbook(updatedCb, syncCode).catch(console.error);
    }
  };

  // -------------------------------------------------------------
  // MEAL PLAN ACTIONS
  // -------------------------------------------------------------
  const addToMealPlan = (item: Omit<MealPlanItem, 'id'>) => {
    const newItem: MealPlanItem = {
      ...item,
      id: `mp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setMealPlan(prev => {
      const updated = [...prev, newItem];
      localStorage.setItem('recime_mealplan', JSON.stringify(updated));
      return updated;
    });
    dbSaveMealPlan(newItem, syncCode).catch(console.error);
  };

  const removeFromMealPlan = (id: string) => {
    setMealPlan(prev => {
      const updated = prev.filter(mp => mp.id !== id);
      localStorage.setItem('recime_mealplan', JSON.stringify(updated));
      return updated;
    });
    dbDeleteMealPlan(id).catch(console.error);
  };

  const clearMealPlan = () => {
    mealPlan.forEach(mp => dbDeleteMealPlan(mp.id).catch(console.error));
    setMealPlan([]);
    localStorage.removeItem('recime_mealplan');
  };

  // -------------------------------------------------------------
  // GROCERY ACTIONS
  // -------------------------------------------------------------
  const addGroceryItem = (item: Omit<GroceryItem, 'id' | 'addedAt'>) => {
    const newItem: GroceryItem = {
      ...item,
      id: `groc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: new Date().toISOString(),
    };
    setGroceryList(prev => {
      const updated = [newItem, ...prev];
      localStorage.setItem('recime_grocery', JSON.stringify(updated));
      return updated;
    });
    dbSaveGroceryItem(newItem, syncCode).catch(console.error);
  };

  const toggleGroceryItem = (id: string) => {
    let updatedItem: GroceryItem | null = null;
    setGroceryList(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          updatedItem = { ...item, checked: !item.checked };
          return updatedItem;
        }
        return item;
      });
      localStorage.setItem('recime_grocery', JSON.stringify(updated));
      return updated;
    });
    if (updatedItem) {
      dbSaveGroceryItem(updatedItem, syncCode).catch(console.error);
    }
  };

  const removeGroceryItem = (id: string) => {
    setGroceryList(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('recime_grocery', JSON.stringify(updated));
      return updated;
    });
    dbDeleteGroceryItem(id).catch(console.error);
  };

  const clearCompletedGrocery = () => {
    const completed = groceryList.filter(item => item.checked);
    completed.forEach(item => dbDeleteGroceryItem(item.id).catch(console.error));
    setGroceryList(prev => {
      const updated = prev.filter(item => !item.checked);
      localStorage.setItem('recime_grocery', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllGrocery = () => {
    groceryList.forEach(item => dbDeleteGroceryItem(item.id).catch(console.error));
    setGroceryList([]);
    localStorage.removeItem('recime_grocery');
  };

  const importIngredientsToGrocery = (recipe: Recipe, targetServings?: number) => {
    const servingsRatio = targetServings && recipe.servings ? targetServings : recipe.servings;
    
    const newItems: GroceryItem[] = recipe.ingredients.map(ing => {
      const scaled = scaleAmount(ing.amount, recipe.servings, servingsRatio);
      const item: GroceryItem = {
        id: `groc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: ing.name,
        amount: scaled,
        unit: ing.unit,
        category: ing.category || ('Mercearia & Grãos' as AisleCategory),
        checked: false,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        addedAt: new Date().toISOString(),
      };
      dbSaveGroceryItem(item, syncCode).catch(console.error);
      return item;
    });

    setGroceryList(prev => {
      const updated = [...newItems, ...prev];
      localStorage.setItem('recime_grocery', JSON.stringify(updated));
      return updated;
    });
  };

  const generateGroceryFromMealPlan = () => {
    if (mealPlan.length === 0) return;

    const newItems: GroceryItem[] = [];

    mealPlan.forEach(planItem => {
      const recipe = recipes.find(r => r.id === planItem.recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach(ing => {
        const scaled = scaleAmount(ing.amount, recipe.servings, planItem.servings || recipe.servings);
        const item: GroceryItem = {
          id: `groc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: ing.name,
          amount: scaled,
          unit: ing.unit,
          category: ing.category || 'Mercearia & Grãos',
          checked: false,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          addedAt: new Date().toISOString(),
        };
        dbSaveGroceryItem(item, syncCode).catch(console.error);
        newItems.push(item);
      });
    });

    setGroceryList(prev => {
      const updated = [...newItems, ...prev];
      localStorage.setItem('recime_grocery', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        recipes,
        cookbooks,
        mealPlan,
        groceryList,
        unitSystem,
        setUnitSystem,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavorite,
        addCookbook,
        updateCookbook,
        deleteCookbook,
        toggleRecipeInCookbook,
        addToMealPlan,
        removeFromMealPlan,
        clearMealPlan,
        addGroceryItem,
        toggleGroceryItem,
        removeGroceryItem,
        clearCompletedGrocery,
        clearAllGrocery,
        importIngredientsToGrocery,
        generateGroceryFromMealPlan,
        activeTab,
        setActiveTab,
        selectedRecipe,
        setSelectedRecipe,
        cookingRecipe,
        setCookingRecipe,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isImportModalOpen,
        setIsImportModalOpen,
        isSyncModalOpen,
        setIsSyncModalOpen,
        syncCode,
        setSyncCode,
        syncStatus,
        syncNow,
        lastSyncedTime,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
