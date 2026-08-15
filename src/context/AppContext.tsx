import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Recipe, Cookbook, MealPlanItem, GroceryItem, AisleCategory } from '../types/recipe';
import { defaultRecipes, defaultCookbooks } from '../data/defaultRecipes';
import type { UnitSystem } from '../utils/unitConverter';
import { scaleAmount } from '../utils/unitConverter';
import { CloudSyncService } from '../services/cloudSync';

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
      CloudSyncService.setSyncCode(syncParam);
      return syncParam.toLowerCase().trim();
    }
    return CloudSyncService.getSyncCode() || 'joka-receitas';
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const isSyncingRef = useRef(false);

  // Load from localStorage or defaults
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('recime_recipes');
    return saved ? JSON.parse(saved) : defaultRecipes;
  });

  const [cookbooks, setCookbooks] = useState<Cookbook[]>(() => {
    const saved = localStorage.getItem('recime_cookbooks');
    return saved ? JSON.parse(saved) : defaultCookbooks;
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
    CloudSyncService.setSyncCode(code);
    setSyncCodeState(code.toLowerCase().trim());
  };

  // Cloud Sync Handler with smart union merge
  const syncNow = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus('syncing');

    try {
      const remoteData = await CloudSyncService.pullData();

      if (remoteData && remoteData.recipes && remoteData.recipes.length > 0) {
        // Smart merge recipes by ID
        setRecipes(prevLocal => {
          const map = new Map<string, Recipe>();
          // 1. Put all remote recipes
          remoteData.recipes.forEach((r: Recipe) => map.set(r.id, r));
          // 2. Put local recipes (if local is newer or unique)
          prevLocal.forEach(r => {
            if (!map.has(r.id)) {
              map.set(r.id, r);
            }
          });
          return Array.from(map.values());
        });

        if (remoteData.cookbooks && remoteData.cookbooks.length > 0) {
          setCookbooks(prev => {
            const map = new Map();
            remoteData.cookbooks.forEach((c: Cookbook) => map.set(c.id, c));
            prev.forEach(c => { if (!map.has(c.id)) map.set(c.id, c); });
            return Array.from(map.values());
          });
        }

        if (remoteData.mealPlan) {
          setMealPlan(remoteData.mealPlan);
        }

        if (remoteData.groceryList) {
          setGroceryList(remoteData.groceryList);
        }
      } else {
        // If remote vault is empty, push local state to initialize it
        await CloudSyncService.pushData({
          recipes,
          cookbooks,
          mealPlan,
          groceryList,
        });
      }

      setSyncStatus('synced');
      setLastSyncedTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Sync failed:', err);
      setSyncStatus('error');
    } finally {
      isSyncingRef.current = false;
    }
  }, [recipes, cookbooks, mealPlan, groceryList]);

  // Initial sync on startup
  useEffect(() => {
    if (syncCode) {
      syncNow();
    }
  }, [syncCode]);

  // Auto-sync polling every 5 seconds and when window/screen gets focus
  useEffect(() => {
    if (!syncCode) return;

    const interval = setInterval(() => {
      syncNow();
    }, 5000);

    const onFocus = () => {
      syncNow();
    };

    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [syncCode, syncNow]);

  // Persistence & Cloud push effects on local change
  useEffect(() => {
    localStorage.setItem('recime_recipes', JSON.stringify(recipes));
    if (syncCode && !isSyncingRef.current) {
      CloudSyncService.pushData({ recipes, cookbooks, mealPlan, groceryList });
    }
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('recime_cookbooks', JSON.stringify(cookbooks));
    if (syncCode && !isSyncingRef.current) {
      CloudSyncService.pushData({ recipes, cookbooks, mealPlan, groceryList });
    }
  }, [cookbooks]);

  useEffect(() => {
    localStorage.setItem('recime_mealplan', JSON.stringify(mealPlan));
    if (syncCode && !isSyncingRef.current) {
      CloudSyncService.pushData({ recipes, cookbooks, mealPlan, groceryList });
    }
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem('recime_grocery', JSON.stringify(groceryList));
    if (syncCode && !isSyncingRef.current) {
      CloudSyncService.pushData({ recipes, cookbooks, mealPlan, groceryList });
    }
  }, [groceryList]);

  useEffect(() => {
    localStorage.setItem('recime_unit_system', unitSystem);
  }, [unitSystem]);

  // Recipe actions
  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt'>): Recipe => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setRecipes(prev => [newRecipe, ...prev]);
    return newRecipe;
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    setCookbooks(prev => prev.map(cb => ({
      ...cb,
      recipeIds: cb.recipeIds.filter(rId => rId !== id)
    })));
    setMealPlan(prev => prev.filter(mp => mp.recipeId !== id));
    if (selectedRecipe?.id === id) setSelectedRecipe(null);
  };

  const toggleFavorite = (id: string) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, favorite: !r.favorite } : r));
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
    }
  };

  // Cookbook actions
  const addCookbook = (cookbookData: Omit<Cookbook, 'id'>) => {
    const newCookbook: Cookbook = {
      ...cookbookData,
      id: `cb-${Date.now()}`,
    };
    setCookbooks(prev => [...prev, newCookbook]);
  };

  const updateCookbook = (id: string, updates: Partial<Cookbook>) => {
    setCookbooks(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCookbook = (id: string) => {
    setCookbooks(prev => prev.filter(c => c.id !== id));
  };

  const toggleRecipeInCookbook = (cookbookId: string, recipeId: string) => {
    setCookbooks(prev => prev.map(cb => {
      if (cb.id !== cookbookId) return cb;
      const exists = cb.recipeIds.includes(recipeId);
      return {
        ...cb,
        recipeIds: exists ? cb.recipeIds.filter(id => id !== recipeId) : [...cb.recipeIds, recipeId]
      };
    }));
  };

  // Meal plan actions
  const addToMealPlan = (item: Omit<MealPlanItem, 'id'>) => {
    const newItem: MealPlanItem = {
      ...item,
      id: `mp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setMealPlan(prev => [...prev, newItem]);
  };

  const removeFromMealPlan = (id: string) => {
    setMealPlan(prev => prev.filter(mp => mp.id !== id));
  };

  const clearMealPlan = () => {
    setMealPlan([]);
  };

  // Grocery actions
  const addGroceryItem = (item: Omit<GroceryItem, 'id' | 'addedAt'>) => {
    const newItem: GroceryItem = {
      ...item,
      id: `groc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: new Date().toISOString(),
    };
    setGroceryList(prev => [newItem, ...prev]);
  };

  const toggleGroceryItem = (id: string) => {
    setGroceryList(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const removeGroceryItem = (id: string) => {
    setGroceryList(prev => prev.filter(item => item.id !== id));
  };

  const clearCompletedGrocery = () => {
    setGroceryList(prev => prev.filter(item => !item.checked));
  };

  const clearAllGrocery = () => {
    setGroceryList([]);
  };

  const importIngredientsToGrocery = (recipe: Recipe, targetServings?: number) => {
    const servingsRatio = targetServings && recipe.servings ? targetServings : recipe.servings;
    
    const newItems: GroceryItem[] = recipe.ingredients.map(ing => {
      const scaled = scaleAmount(ing.amount, recipe.servings, servingsRatio);
      return {
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
    });

    setGroceryList(prev => [...newItems, ...prev]);
  };

  const generateGroceryFromMealPlan = () => {
    if (mealPlan.length === 0) return;

    const newItems: GroceryItem[] = [];

    mealPlan.forEach(planItem => {
      const recipe = recipes.find(r => r.id === planItem.recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach(ing => {
        const scaled = scaleAmount(ing.amount, recipe.servings, planItem.servings || recipe.servings);
        newItems.push({
          id: `groc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: ing.name,
          amount: scaled,
          unit: ing.unit,
          category: ing.category || 'Mercearia & Grãos',
          checked: false,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          addedAt: new Date().toISOString(),
        });
      });
    });

    setGroceryList(prev => [...newItems, ...prev]);
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
