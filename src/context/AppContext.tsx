import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Recipe, Cookbook, MealPlanItem, GroceryItem, AisleCategory } from '../types/recipe';
import { defaultRecipes, defaultCookbooks } from '../data/defaultRecipes';
import type { UnitSystem } from '../utils/unitConverter';
import { scaleAmount } from '../utils/unitConverter';

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
  
  // Search & Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('recime_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('recime_cookbooks', JSON.stringify(cookbooks));
  }, [cookbooks]);

  useEffect(() => {
    localStorage.setItem('recime_mealplan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem('recime_grocery', JSON.stringify(groceryList));
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
    // Remove from cookbooks & meal plans
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
