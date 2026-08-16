import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BookOpen, 
  Calendar, 
  ShoppingCart, 
  Heart, 
  Plus, 
  Sparkles, 
  Search, 
  Compass,
  SlidersHorizontal,
  Cloud
} from 'lucide-react';

import { JKLogo } from '../brand/JKLogo';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    searchQuery, 
    setSearchQuery, 
    setIsCreateModalOpen, 
    setIsImportModalOpen,
    setIsSyncModalOpen,
    syncCode,
    unitSystem,
    setUnitSystem,
    recipes,
    groceryList,
    mealPlan
  } = useApp();

  const favoriteCount = recipes.filter(r => r.favorite).length;
  const groceryPendingCount = groceryList.filter(i => !i.checked).length;
  const plannedMealsCount = mealPlan.length;

  return (
    <header className="sticky top-0 z-40 bg-recime-navy text-white shadow-md border-b border-recime-navy-light transition-all">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('explore')}
            className="cursor-pointer group"
          >
            <JKLogo size="md" />
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por receita, ingrediente, tag..."
                className="w-full pl-10 pr-4 py-2 bg-recime-navy-light/80 border border-recime-navy-light text-sm text-recime-parchment rounded-full focus:outline-none focus:ring-2 focus:ring-recime-mango focus:border-transparent placeholder-gray-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'explore'
                  ? 'bg-recime-mango text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-recime-navy-light'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explorar
            </button>

            <button
              onClick={() => setActiveTab('cookbooks')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'cookbooks'
                  ? 'bg-recime-mango text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-recime-navy-light'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Livros
            </button>

            <button
              onClick={() => setActiveTab('planner')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative ${
                activeTab === 'planner'
                  ? 'bg-recime-mango text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-recime-navy-light'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Cardápio
              {plannedMealsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-recime-corn"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('grocery')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative ${
                activeTab === 'grocery'
                  ? 'bg-recime-mango text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-recime-navy-light'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Compras
              {groceryPendingCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-recime-corn text-recime-navy">
                  {groceryPendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'favorites'
                  ? 'bg-recime-mango text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-recime-navy-light'
              }`}
            >
              <Heart className={`w-4 h-4 ${favoriteCount > 0 ? 'text-recime-mango fill-recime-mango' : ''}`} />
              Favoritos
            </button>
          </nav>

          {/* Action Buttons & Unit Switcher */}
          <div className="flex items-center gap-2">
            {/* Cloud Sync Status */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                syncCode 
                  ? 'bg-recime-navy-light text-recime-parchment border-recime-sage/50 hover:border-recime-sage' 
                  : 'bg-recime-navy-light text-gray-300 border-white/10 hover:text-white'
              }`}
              title="Sincronização em Nuvem (iPhone e PC)"
            >
              <div className={`w-2 h-2 rounded-full ${syncCode ? 'bg-recime-sage animate-pulse' : 'bg-gray-400'}`} />
              <Cloud className="w-3.5 h-3.5 text-recime-corn" />
              <span className="hidden sm:inline">Nuvem</span>
            </button>

            {/* Unit toggle (Metric / Imperial) */}
            <button
              onClick={() => setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')}
              title={`Sistema de medidas: ${unitSystem === 'metric' ? 'Métrico (g, ml)' : 'Imperial (oz, xíc)'}`}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-recime-navy-light text-xs font-semibold text-gray-300 hover:text-white hover:bg-recime-navy-light/90 border border-white/10 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-recime-corn" />
              {unitSystem === 'metric' ? 'Métrico' : 'Imperial'}
            </button>

            {/* Smart Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-recime-navy-light text-recime-parchment hover:bg-recime-navy-light/90 text-sm font-semibold border border-recime-mango/40 transition-all hover:border-recime-mango group"
            >
              <Sparkles className="w-4 h-4 text-recime-corn group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Importar</span>
            </button>

            {/* Create Recipe Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-recime-mango to-recime-mango-hover text-white text-sm font-semibold shadow-md hover:shadow-glow transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Receita</span>
            </button>
          </div>

        </div>

        {/* Mobile Search input */}
        <div className="md:hidden pb-3 pt-1">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar receitas, ingredientes..."
              className="w-full pl-10 pr-4 py-2 bg-recime-navy-light/80 border border-recime-navy-light text-sm text-recime-parchment rounded-xl focus:outline-none focus:ring-2 focus:ring-recime-mango placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
