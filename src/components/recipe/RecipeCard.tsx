import React from 'react';
import type { Recipe } from '../../types/recipe';
import { useApp } from '../../context/AppContext';
import { Clock, Heart, Star, Flame, Utensils, PlayCircle } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const { setSelectedRecipe, toggleFavorite, setCookingRecipe } = useApp();

  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

  const getSourceIcon = (platform?: string) => {
    switch (platform) {
      case 'instagram':
        return <span className="bg-pink-600/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Instagram</span>;
      case 'tiktok':
        return <span className="bg-black/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">TikTok</span>;
      case 'youtube':
        return <span className="bg-red-600/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">YouTube</span>;
      case 'pinterest':
        return <span className="bg-red-700/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Pinterest</span>;
      case 'ai':
        return <span className="bg-purple-600/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">IA Smart</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      onClick={() => setSelectedRecipe(recipe)}
      className="group bg-white rounded-3xl overflow-hidden border border-recime-parchment-border shadow-soft recipe-card-hover cursor-pointer flex flex-col h-full relative"
    >
      {/* Image and badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <img
          src={recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Source Badge & Cuisine */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {getSourceIcon(recipe.sourcePlatform)}
          {recipe.cuisine && (
            <span className="bg-recime-navy/80 backdrop-blur-md text-recime-parchment text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {recipe.cuisine}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(recipe.id);
          }}
          aria-label="Favoritar receita"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md hover:bg-white flex items-center justify-center text-gray-700 hover:text-recime-mango shadow-md transition-all active:scale-90 z-10"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              recipe.favorite ? 'fill-recime-mango text-recime-mango' : 'text-gray-600 hover:text-recime-mango'
            }`}
          />
        </button>

        {/* Cooking Time & Rating overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold z-10">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-recime-corn" />
            <span>{totalTime > 0 ? `${totalTime} min` : '10 min'}</span>
          </div>

          <div className="flex items-center gap-2">
            {recipe.nutrition?.calories && recipe.nutrition.calories > 0 ? (
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-[11px]">
                <Flame className="w-3 h-3 text-recime-mango" />
                <span>{recipe.nutrition.calories} kcal</span>
              </div>
            ) : null}
            {recipe.rating && (
              <div className="flex items-center gap-1 bg-recime-corn text-recime-navy px-2 py-0.5 rounded-full text-[11px] font-bold">
                <Star className="w-3 h-3 fill-recime-navy" />
                <span>{recipe.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {recipe.tags
              ?.filter(t => !['Instagram', 'Vídeo', 'Video', 'Importado', 'Smart IA'].includes(t))
              .slice(0, 3)
              .map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-recime-parchment-subtle text-recime-muted border border-recime-parchment-border"
                >
                  {tag}
                </span>
              ))}
            {recipe.servings && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-recime-sage-light text-recime-sage border border-recime-sage/20 flex items-center gap-1">
                <Utensils className="w-2.5 h-2.5" />
                {recipe.servings} {recipe.servings === 1 ? 'porção' : 'porções'}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-serif font-bold text-lg text-recime-navy leading-snug line-clamp-2 group-hover:text-recime-mango transition-colors mb-2">
            {recipe.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-recime-muted line-clamp-2 leading-relaxed mb-4">
            {recipe.description || 'Uma receita irresistível e fácil de preparar para qualquer momento.'}
          </p>
        </div>

        {/* Author / Cook mode CTA */}
        <div className="pt-3 border-t border-recime-parchment-border flex items-center justify-between text-xs">
          <span className="text-recime-muted font-medium truncate max-w-[140px]">
            {recipe.author || 'Por Chef ReciMe'}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCookingRecipe(recipe);
            }}
            className="flex items-center gap-1 text-recime-mango font-bold hover:text-recime-mango-hover transition-colors group/btn"
          >
            <PlayCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            <span>Cozinhar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
