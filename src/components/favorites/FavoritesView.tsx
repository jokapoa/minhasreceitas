import React from 'react';
import { useApp } from '../../context/AppContext';
import { RecipeCard } from '../recipe/RecipeCard';
import { Heart, Compass } from 'lucide-react';

export const FavoritesView: React.FC = () => {
  const { recipes, setActiveTab } = useApp();

  const favoriteRecipes = recipes.filter(r => r.favorite);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-recime-parchment-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-recime-mango text-xs font-bold uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 fill-recime-mango" />
            <span>Receitas Salvas</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-recime-navy">
            Minhas Receitas Favoritas
          </h1>
          <p className="text-xs sm:text-sm text-recime-muted mt-1">
            Acesse rapidamente seus pratos prediletos a qualquer momento.
          </p>
        </div>

        <span className="px-4 py-2 rounded-2xl bg-recime-mango-light text-recime-mango font-bold text-xs self-start sm:self-auto border border-recime-mango/20">
          {favoriteRecipes.length} {favoriteRecipes.length === 1 ? 'favorita' : 'favoritas'}
        </span>
      </div>

      {/* Grid */}
      {favoriteRecipes.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-recime-parchment-border text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-recime-navy">
              Você ainda não favoritou nenhuma receita
            </h3>
            <p className="text-xs text-recime-muted mt-1 max-w-sm">
              Navegue pela aba Explorar e clique no coração nos cards das receitas que você mais gostar.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('explore')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-recime-navy text-white text-xs font-bold hover:bg-recime-navy-light transition-all shadow-sm"
          >
            <Compass className="w-4 h-4" />
            <span>Explorar Receitas Agora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

    </div>
  );
};
