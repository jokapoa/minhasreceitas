import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RecipeCard } from '../recipe/RecipeCard';
import { 
  Sparkles, 
  Plus, 
  Flame, 
  Search, 
  SlidersHorizontal, 
  ArrowRight
} from 'lucide-react';

export const ExploreView: React.FC = () => {
  const { 
    recipes, 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory, 
    setIsImportModalOpen, 
    setIsCreateModalOpen,
    cookbooks,
    setActiveTab
  } = useApp();

  const [sortBy, setSortBy] = useState<'newest' | 'fastest' | 'rating'>('newest');

  const categories = [
    'Todas',
    'Jantar',
    'Almoço',
    'Café da Manhã',
    'Sobremesa',
    'Lanches & Aperitivos',
    'Bebidas & Smoothies',
  ];

  // Filter and sort recipes
  const filteredRecipes = recipes
    .filter(recipe => {
      // Category filter
      if (selectedCategory !== 'Todas' && recipe.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = recipe.title.toLowerCase().includes(q);
        const matchesDesc = recipe.description?.toLowerCase().includes(q);
        const matchesCuisine = recipe.cuisine?.toLowerCase().includes(q);
        const matchesTag = recipe.tags?.some(t => t.toLowerCase().includes(q));
        const matchesIngredient = recipe.ingredients?.some(i => i.name.toLowerCase().includes(q));
        return matchesTitle || matchesDesc || matchesCuisine || matchesTag || matchesIngredient;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'fastest') {
        const timeA = (a.prepTimeMinutes || 0) + (a.cookTimeMinutes || 0);
        const timeB = (b.prepTimeMinutes || 0) + (b.cookTimeMinutes || 0);
        return timeA - timeB;
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      // Default: newest
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-8">
      
      {/* Editorial Hero Section (Inspired by ReciMe aesthetic) */}
      <section className="relative rounded-4xl bg-recime-navy text-white overflow-hidden p-6 sm:p-12 shadow-2xl border border-recime-navy-light">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-recime-mango/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 rounded-full bg-recime-corn/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl flex flex-col gap-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-recime-corn text-xs font-bold tracking-wide w-fit">
            <Flame className="w-3.5 h-3.5 fill-recime-corn" />
            <span>O organizador de receitas mais amado do mundo</span>
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-5xl lg:text-6xl text-recime-parchment leading-[1.1]">
            Todas as suas receitas, <br className="hidden sm:inline" />
            <span className="text-recime-corn italic font-normal">em um só lugar.</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
            Salve receitas do Instagram, TikTok, YouTube e blogs com 1 clique. Escale porções, organize o cardápio semanal e cozinhe com modo passo a passo sem a tela apagar.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-recime-mango to-recime-mango-hover hover:from-recime-mango-hover hover:to-recime-mango text-white font-bold text-sm shadow-glow transition-all active:scale-95 group"
            >
              <Sparkles className="w-4 h-4 text-recime-corn group-hover:rotate-12 transition-transform" />
              <span>Importar Receita com IA</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Minha Receita</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Collections Mini Strip */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg sm:text-xl text-recime-navy">
            Coleções em Destaque
          </h2>
          <button
            onClick={() => setActiveTab('cookbooks')}
            className="text-xs font-bold text-recime-mango hover:underline flex items-center gap-1"
          >
            Ver todos os livros <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cookbooks.slice(0, 4).map((cb) => (
            <div
              key={cb.id}
              onClick={() => setActiveTab('cookbooks')}
              className="p-4 rounded-2xl bg-white border border-recime-parchment-border shadow-xs hover:border-recime-mango/50 cursor-pointer transition-all flex items-center gap-3 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cb.icon || '📖'}</span>
              <div className="truncate">
                <h4 className="font-bold text-xs text-recime-navy truncate">{cb.name}</h4>
                <span className="text-[10px] text-recime-muted">{cb.recipeIds.length} receitas</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Pills & Sorting Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-recime-parchment-border">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-recime-navy text-white shadow-sm scale-105'
                  : 'bg-white text-recime-muted hover:text-recime-navy border border-recime-parchment-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs font-bold text-recime-muted flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Ordenar por:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 rounded-xl bg-white text-xs font-bold text-recime-navy border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango"
          >
            <option value="newest">Mais Recentes</option>
            <option value="fastest">Mais Rápidas</option>
            <option value="rating">Melhor Avaliadas</option>
          </select>
        </div>

      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-recime-parchment-border text-center flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-recime-parchment flex items-center justify-center text-recime-muted">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-lg text-recime-navy">
            Nenhuma receita encontrada
          </h3>
          <p className="text-xs text-recime-muted max-w-sm">
            Tente buscar com outros termos ou limpe os filtros de categoria.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Todas');
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-recime-parchment hover:bg-recime-parchment-subtle text-xs font-bold text-recime-navy"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

    </div>
  );
};
