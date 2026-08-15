import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { Footer } from './components/layout/Footer';
import { ExploreView } from './components/explore/ExploreView';
import { CookbookList } from './components/cookbooks/CookbookList';
import { MealPlannerView } from './components/planner/MealPlannerView';
import { GroceryListView } from './components/grocery/GroceryListView';
import { FavoritesView } from './components/favorites/FavoritesView';
import { RecipeDetailModal } from './components/recipe/RecipeDetailModal';
import { CookingModeModal } from './components/cooking/CookingModeModal';
import { RecipeImportModal } from './components/recipe/RecipeImportModal';
import { RecipeFormModal } from './components/recipe/RecipeFormModal';
import { SyncModal } from './components/auth/SyncModal';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    selectedRecipe, 
    setSelectedRecipe, 
    cookingRecipe, 
    setCookingRecipe, 
    isCreateModalOpen, 
    setIsCreateModalOpen, 
    isImportModalOpen, 
    setIsImportModalOpen,
    isSyncModalOpen,
    setIsSyncModalOpen
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-recime-parchment text-recime-charcoal antialiased">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'explore' && <ExploreView />}
        {activeTab === 'cookbooks' && <CookbookList />}
        {activeTab === 'planner' && <MealPlannerView />}
        {activeTab === 'grocery' && <GroceryListView />}
        {activeTab === 'favorites' && <FavoritesView />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Modals & Overlays */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {cookingRecipe && (
        <CookingModeModal
          recipe={cookingRecipe}
          onClose={() => setCookingRecipe(null)}
        />
      )}

      {isImportModalOpen && (
        <RecipeImportModal
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {isCreateModalOpen && (
        <RecipeFormModal
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {isSyncModalOpen && (
        <SyncModal
          onClose={() => setIsSyncModalOpen(false)}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
