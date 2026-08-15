import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { MealType, Recipe } from '../../types/recipe';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Play 
} from 'lucide-react';

export const MealPlannerView: React.FC = () => {
  const { 
    recipes, 
    mealPlan, 
    addToMealPlan, 
    removeFromMealPlan, 
    clearMealPlan, 
    generateGroceryFromMealPlan,
    setSelectedRecipe,
    setCookingRecipe,
    setActiveTab
  } = useApp();

  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: MealType } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [grocerySuccess, setGrocerySuccess] = useState(false);

  // Generate current week dates (Mon to Sun)
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const week = [];
    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      week.push({
        date: iso,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('pt-BR', { month: 'short' }),
        isToday: iso === today.toISOString().split('T')[0],
      });
    }
    return week;
  };

  const weekDays = getWeekDates();

  const mealCategories: { type: MealType; label: string; icon: string }[] = [
    { type: 'breakfast', label: 'Café da Manhã', icon: '☕' },
    { type: 'lunch', label: 'Almoço', icon: '🥗' },
    { type: 'dinner', label: 'Jantar', icon: '🍲' },
    { type: 'snack', label: 'Lanches', icon: '🍎' },
  ];

  const handleSelectRecipeForSlot = (recipe: Recipe) => {
    if (!selectedSlot) return;
    addToMealPlan({
      date: selectedSlot.date,
      mealType: selectedSlot.mealType,
      recipeId: recipe.id,
      servings: recipe.servings,
    });
    setSelectedSlot(null);
  };

  const handleGenerateGrocery = () => {
    generateGroceryFromMealPlan();
    setGrocerySuccess(true);
    setTimeout(() => {
      setGrocerySuccess(false);
      setActiveTab('grocery');
    }, 1500);
  };

  const filteredRecipes = recipes.filter(r => 
    r.title.toLowerCase().includes(recipeSearch.toLowerCase()) ||
    r.category.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-recime-parchment-border shadow-soft">
        <div>
          <div className="flex items-center gap-2 text-recime-mango text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Planejador Semanal de Refeições</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-recime-navy">
            Cardápio da Semana
          </h1>
          <p className="text-xs sm:text-sm text-recime-muted mt-1">
            Organize suas refeições diárias e gere sua lista de compras com apenas 1 clique.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {mealPlan.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Deseja limpar todo o cardápio da semana?')) {
                  clearMealPlan();
                }
              }}
              className="px-4 py-2.5 rounded-2xl bg-recime-parchment hover:bg-recime-parchment-subtle text-recime-muted text-xs font-bold transition-colors"
            >
              Limpar Semana
            </button>
          )}

          <button
            onClick={handleGenerateGrocery}
            disabled={mealPlan.length === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 ${
              mealPlan.length === 0
                ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500'
                : grocerySuccess
                ? 'bg-recime-sage text-white shadow-glow'
                : 'bg-gradient-to-r from-recime-mango to-recime-mango-hover text-white shadow-glow'
            }`}
          >
            {grocerySuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Lista Gerada! Redirecionando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-recime-corn" />
                <span>Gerar Lista de Compras ({mealPlan.length} itens)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 7-Day Calendar Board */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayMeals = mealPlan.filter(mp => mp.date === day.date);

          return (
            <div
              key={day.date}
              className={`rounded-3xl border flex flex-col transition-all ${
                day.isToday
                  ? 'bg-white border-recime-mango shadow-soft ring-2 ring-recime-mango/20'
                  : 'bg-white/80 border-recime-parchment-border shadow-xs'
              }`}
            >
              {/* Day Header */}
              <div className={`p-3.5 border-b text-center rounded-t-3xl flex items-center justify-between md:flex-col md:justify-center ${
                day.isToday ? 'bg-recime-mango text-white' : 'bg-recime-parchment-subtle text-recime-navy'
              }`}>
                <span className="text-xs uppercase font-bold tracking-wider opacity-90">
                  {day.dayName}
                </span>
                <span className="font-serif font-bold text-lg md:text-xl">
                  {day.dayNumber} {day.monthName}
                </span>
              </div>

              {/* Meal Slots */}
              <div className="p-3 flex-1 flex flex-col gap-2.5">
                {mealCategories.map((cat) => {
                  const itemsInSlot = dayMeals.filter(m => m.mealType === cat.type);

                  return (
                    <div key={cat.type} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-recime-muted">
                        <span className="flex items-center gap-1">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                        <button
                          onClick={() => setSelectedSlot({ date: day.date, mealType: cat.type })}
                          className="w-5 h-5 rounded-full bg-recime-parchment hover:bg-recime-mango hover:text-white flex items-center justify-center transition-colors text-recime-navy"
                          title={`Adicionar receita para ${cat.label}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Items assigned to this slot */}
                      {itemsInSlot.length > 0 ? (
                        itemsInSlot.map((planItem) => {
                          const recipe = recipes.find(r => r.id === planItem.recipeId);
                          if (!recipe) return null;

                          return (
                            <div
                              key={planItem.id}
                              className="group relative p-2.5 rounded-2xl bg-recime-parchment hover:bg-recime-parchment-subtle border border-recime-parchment-border transition-all flex flex-col gap-1"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={recipe.image}
                                  alt={recipe.title}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                                />
                                <span 
                                  onClick={() => setSelectedRecipe(recipe)}
                                  className="font-bold text-xs text-recime-navy line-clamp-1 hover:text-recime-mango cursor-pointer flex-1"
                                >
                                  {recipe.title}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-recime-muted pt-1 border-t border-recime-parchment-border/50">
                                <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes}m</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setCookingRecipe(recipe)}
                                    className="text-recime-mango hover:text-recime-mango-hover font-bold flex items-center gap-0.5"
                                    title="Iniciar modo cozinha"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-recime-mango" />
                                    <span>Cozinhar</span>
                                  </button>
                                  <button
                                    onClick={() => removeFromMealPlan(planItem.id)}
                                    className="text-gray-400 hover:text-red-600 p-0.5"
                                    title="Remover"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div 
                          onClick={() => setSelectedSlot({ date: day.date, mealType: cat.type })}
                          className="p-2 rounded-xl border border-dashed border-recime-parchment-border hover:border-recime-mango/50 text-center text-[11px] text-gray-400 cursor-pointer transition-colors"
                        >
                          + Adicionar
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe Picker Modal for Meal Slot */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-recime-parchment-border flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-recime-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg">
                  Escolha uma Receita
                </h3>
                <p className="text-xs text-gray-300">
                  Para {selectedSlot.date} ({selectedSlot.mealType})
                </p>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-recime-parchment-border bg-recime-parchment">
              <input
                type="text"
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                placeholder="Buscar receita pelo nome..."
                className="w-full p-2.5 rounded-xl bg-white text-xs border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none"
              />
            </div>

            <div className="p-4 overflow-y-auto flex flex-col gap-2.5 flex-1">
              {filteredRecipes.map(recipe => (
                <div
                  key={recipe.id}
                  onClick={() => handleSelectRecipeForSlot(recipe)}
                  className="p-3 rounded-2xl bg-recime-parchment hover:bg-recime-parchment-subtle border border-recime-parchment-border hover:border-recime-mango cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-recime-navy">{recipe.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-recime-muted mt-0.5">
                        <span>{recipe.category}</span>
                        <span>•</span>
                        <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                      </div>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-xl bg-recime-mango text-white text-xs font-bold shrink-0">
                    Selecionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
