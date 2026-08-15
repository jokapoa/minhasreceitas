import React, { useState } from 'react';
import type { Recipe } from '../../types/recipe';
import { useApp } from '../../context/AppContext';
import { scaleAmount, convertUnitAndAmount } from '../../utils/unitConverter';
import { 
  X, 
  Heart, 
  Clock, 
  Flame, 
  Users, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Calendar, 
  Play, 
  Bookmark, 
  Trash2, 
  Check, 
  Share2,
  Sparkles,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose }) => {
  const { 
    toggleFavorite, 
    deleteRecipe, 
    cookbooks, 
    toggleRecipeInCookbook, 
    importIngredientsToGrocery,
    addToMealPlan,
    setCookingRecipe,
    unitSystem,
    setUnitSystem
  } = useApp();

  const [currentServings, setCurrentServings] = useState(recipe.servings || 4);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'notes'>('ingredients');
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [addedGroceryFeedback, setAddedGroceryFeedback] = useState(false);
  const [showMealPlanPicker, setShowMealPlanPicker] = useState(false);
  const [showCookbookPicker, setShowCookbookPicker] = useState(false);
  const [mealDate, setMealDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [mealPlanFeedback, setMealPlanFeedback] = useState(false);

  const toggleCheckIngredient = (id: string) => {
    setCheckedIngredients(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToGrocery = () => {
    importIngredientsToGrocery(recipe, currentServings);
    setAddedGroceryFeedback(true);
    setTimeout(() => setAddedGroceryFeedback(false), 2500);
  };

  const handleAddToMealPlan = () => {
    addToMealPlan({
      date: mealDate,
      mealType,
      recipeId: recipe.id,
      servings: currentServings,
    });
    setMealPlanFeedback(true);
    setTimeout(() => {
      setMealPlanFeedback(false);
      setShowMealPlanPicker(false);
    }, 1500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Confira essa receita de ${recipe.title} no ReciMe!`,
          url: window.location.href,
        });
      } catch (err) {
        // Ignored or cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link da receita copiado para a área de transferência!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
      <div 
        className="relative bg-recime-parchment w-full max-w-3xl min-h-screen sm:min-h-0 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-recime-parchment-border animate-in fade-in zoom-in-95 duration-200 pb-16 sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sticky Action Bar (Fixed at top of modal on all screens) */}
        <div className="sticky top-0 z-50 bg-recime-navy text-white px-4 py-3 sm:px-6 flex items-center justify-between border-b border-white/10 shadow-lg">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-transform active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <span className="font-serif font-bold text-sm text-white truncate max-w-[160px] sm:max-w-xs text-center">
            {recipe.title}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-transform active:scale-95"
              title="Compartilhar"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => toggleFavorite(recipe.id)}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-transform active:scale-95"
              title="Favoritar"
            >
              <Heart className={`w-4 h-4 ${recipe.favorite ? 'fill-recime-mango text-recime-mango' : 'text-white'}`} />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-recime-mango hover:bg-recime-mango-hover flex items-center justify-center text-white transition-transform active:scale-95 shadow-sm"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-gray-900 overflow-hidden">
          <img
            src={recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80'}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Hero text overlay */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {recipe.cuisine && (
                <span className="bg-recime-mango text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {recipe.cuisine}
                </span>
              )}
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                {recipe.category}
              </span>
              {recipe.difficulty && (
                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {recipe.difficulty}
                </span>
              )}
            </div>

            <h1 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-white leading-tight">
              {recipe.title}
            </h1>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 sm:pb-8 flex-1 flex flex-col gap-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-white border border-recime-parchment-border shadow-sm text-center">
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-recime-muted uppercase font-semibold">Preparo</span>
              <div className="flex items-center gap-1 font-bold text-recime-navy text-sm sm:text-base mt-0.5">
                <Clock className="w-3.5 h-3.5 text-recime-mango" />
                <span>{recipe.prepTimeMinutes || 10} min</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[11px] text-recime-muted uppercase font-semibold">Cozimento</span>
              <div className="flex items-center gap-1 font-bold text-recime-navy text-sm sm:text-base mt-0.5">
                <Flame className="w-3.5 h-3.5 text-recime-corn" />
                <span>{recipe.cookTimeMinutes || 15} min</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[11px] text-recime-muted uppercase font-semibold">Calorias</span>
              <div className="flex items-center gap-1 font-bold text-recime-navy text-sm sm:text-base mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-recime-sage" />
                <span>{recipe.nutrition?.calories || 450} kcal</span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-center">
              <span className="text-[11px] text-recime-muted uppercase font-semibold">Autor</span>
              <span className="font-bold text-recime-navy text-sm mt-0.5 truncate max-w-[110px]">
                {recipe.author || 'Chef ReciMe'}
              </span>
            </div>
          </div>

          {/* Description & Tags */}
          {recipe.description && (
            <p className="text-sm text-recime-charcoal/80 leading-relaxed italic bg-recime-parchment-subtle p-3.5 rounded-xl border-l-4 border-recime-mango">
              "{recipe.description}"
            </p>
          )}

          {/* Embedded Video Player (YouTube / Social) */}
          {recipe.videoEmbedUrl && (
            <div className="rounded-2xl overflow-hidden border border-recime-parchment-border shadow-soft bg-black aspect-video w-full">
              <iframe
                src={recipe.videoEmbedUrl}
                title={recipe.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          {/* Action CTAs (Cozinhar agora, Adicionar à Lista, Planejar) */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                onClose();
                setCookingRecipe(recipe);
              }}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-recime-mango to-recime-mango-hover text-white font-bold shadow-md hover:shadow-glow transition-all active:scale-98"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Modo Cozinha (Passo a Passo)</span>
            </button>

            <button
              onClick={handleAddToGrocery}
              className={`flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl font-bold border transition-all ${
                addedGroceryFeedback
                  ? 'bg-recime-sage text-white border-recime-sage'
                  : 'bg-white text-recime-navy border-recime-parchment-border hover:bg-recime-parchment-subtle'
              }`}
            >
              {addedGroceryFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Adicionado!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 text-recime-mango" />
                  <span>+ Lista de Compras</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowMealPlanPicker(!showMealPlanPicker)}
              className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-white text-recime-navy font-bold border border-recime-parchment-border hover:bg-recime-parchment-subtle transition-all"
            >
              <Calendar className="w-4 h-4 text-recime-corn" />
              <span>Planejar</span>
            </button>

            <button
              onClick={() => setShowCookbookPicker(!showCookbookPicker)}
              className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-white text-recime-navy font-bold border border-recime-parchment-border hover:bg-recime-parchment-subtle transition-all"
            >
              <Bookmark className="w-4 h-4 text-recime-sage" />
              <span>Salvar em Livro</span>
            </button>
          </div>

          {/* Meal Plan Drawer Picker */}
          {showMealPlanPicker && (
            <div className="p-4 rounded-2xl bg-white border border-recime-parchment-border shadow-soft flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
              <h4 className="font-bold text-sm text-recime-navy flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-recime-mango" />
                Agendar no Cardápio Semanal
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-recime-muted mb-1">Data:</label>
                  <input
                    type="date"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-recime-muted mb-1">Refeição:</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango"
                  >
                    <option value="breakfast">Café da Manhã</option>
                    <option value="lunch">Almoço</option>
                    <option value="dinner">Jantar</option>
                    <option value="snack">Lanche</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddToMealPlan}
                className="w-full py-2.5 rounded-xl bg-recime-navy text-white text-xs font-bold hover:bg-recime-navy-light transition-all flex items-center justify-center gap-1.5"
              >
                {mealPlanFeedback ? <Check className="w-4 h-4 text-recime-corn" /> : null}
                {mealPlanFeedback ? 'Agendado com sucesso!' : 'Confirmar Agendamento'}
              </button>
            </div>
          )}

          {/* Cookbook Selector Drawer */}
          {showCookbookPicker && (
            <div className="p-4 rounded-2xl bg-white border border-recime-parchment-border shadow-soft flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
              <h4 className="font-bold text-sm text-recime-navy flex items-center gap-1.5 mb-1">
                <Bookmark className="w-4 h-4 text-recime-sage" />
                Adicionar aos seus Livros de Receitas
              </h4>
              <div className="flex flex-col gap-1.5">
                {cookbooks.map(cb => {
                  const inCookbook = cb.recipeIds.includes(recipe.id);
                  return (
                    <button
                      key={cb.id}
                      onClick={() => toggleRecipeInCookbook(cb.id, recipe.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                        inCookbook 
                          ? 'bg-recime-sage-light text-recime-sage border border-recime-sage/30' 
                          : 'bg-recime-parchment hover:bg-recime-parchment-subtle text-recime-navy'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{cb.icon || '📖'}</span>
                        <span>{cb.name}</span>
                      </span>
                      {inCookbook && <Check className="w-4 h-4 text-recime-sage" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs: Ingredientes / Modo de Preparo / Notas */}
          <div className="border-b border-recime-parchment-border flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'ingredients'
                    ? 'border-recime-mango text-recime-mango'
                    : 'border-transparent text-recime-muted hover:text-recime-navy'
                }`}
              >
                Ingredientes ({recipe.ingredients.length})
              </button>

              <button
                onClick={() => setActiveTab('instructions')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'instructions'
                    ? 'border-recime-mango text-recime-mango'
                    : 'border-transparent text-recime-muted hover:text-recime-navy'
                }`}
              >
                Modo de Preparo ({recipe.instructions.length} passos)
              </button>

              {recipe.nutrition && (
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                    activeTab === 'notes'
                      ? 'border-recime-mango text-recime-mango'
                      : 'border-transparent text-recime-muted hover:text-recime-navy'
                  }`}
                >
                  Nutrição & Dicas
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: INGREDIENTS WITH SERVING SCALER */}
          {activeTab === 'ingredients' && (
            <div className="flex flex-col gap-4">
              {/* Scaler & Unit selector toolbar */}
              <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-white border border-recime-parchment-border gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-recime-navy flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-recime-mango" />
                    Porções:
                  </span>
                  <div className="flex items-center gap-2 bg-recime-parchment px-2 py-1 rounded-xl border border-recime-parchment-border">
                    <button
                      onClick={() => setCurrentServings(Math.max(1, currentServings - 1))}
                      className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 text-recime-navy font-bold text-xs"
                      aria-label="Diminuir porção"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-sm text-recime-navy px-1.5 min-w-[20px] text-center">
                      {currentServings}
                    </span>
                    <button
                      onClick={() => setCurrentServings(currentServings + 1)}
                      className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 text-recime-navy font-bold text-xs"
                      aria-label="Aumentar porção"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {currentServings !== recipe.servings && (
                    <button
                      onClick={() => setCurrentServings(recipe.servings)}
                      className="text-[11px] text-recime-mango underline"
                    >
                      Resetar ({recipe.servings})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setUnitSystem('metric')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      unitSystem === 'metric' ? 'bg-recime-navy text-white' : 'text-recime-muted hover:text-recime-navy'
                    }`}
                  >
                    Métrico (g/ml)
                  </button>
                  <button
                    onClick={() => setUnitSystem('imperial')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      unitSystem === 'imperial' ? 'bg-recime-navy text-white' : 'text-recime-muted hover:text-recime-navy'
                    }`}
                  >
                    Imperial (oz/xíc)
                  </button>
                </div>
              </div>

              {/* Ingredient List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {recipe.ingredients.map((ing) => {
                  const scaled = scaleAmount(ing.amount, recipe.servings, currentServings);
                  const converted = convertUnitAndAmount(scaled, ing.unit, unitSystem);
                  const isChecked = !!checkedIngredients[ing.id];

                  return (
                    <div
                      key={ing.id}
                      onClick={() => toggleCheckIngredient(ing.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked 
                          ? 'bg-recime-parchment-subtle/60 border-recime-parchment-border opacity-60' 
                          : 'bg-white border-recime-parchment-border hover:border-recime-mango/40 shadow-xs'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-recime-sage border-recime-sage text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="flex-1 text-xs">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className={`font-bold text-recime-navy text-sm ${isChecked ? 'line-through text-gray-400' : ''}`}>
                            {ing.name}
                          </span>
                          <span className="font-semibold text-recime-mango whitespace-nowrap">
                            {converted.display}
                          </span>
                        </div>
                        {ing.note && (
                          <p className="text-[11px] text-recime-muted italic mt-0.5">
                            {ing.note}
                          </p>
                        )}
                        <span className="inline-block mt-1 text-[10px] font-medium text-gray-400">
                          {ing.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="flex flex-col gap-4">
              {recipe.instructions.map((step) => (
                <div
                  key={step.step}
                  className="p-4 rounded-2xl bg-white border border-recime-parchment-border shadow-xs flex gap-4 items-start"
                >
                  <div className="w-8 h-8 rounded-xl bg-recime-mango/15 text-recime-mango font-serif font-bold text-base flex items-center justify-center shrink-0">
                    {step.step}
                  </div>

                  <div className="flex-1">
                    {step.title && (
                      <h4 className="font-bold text-sm text-recime-navy mb-1 font-serif">
                        {step.title}
                      </h4>
                    )}
                    <p className="text-xs sm:text-sm text-recime-charcoal leading-relaxed">
                      {step.instruction}
                    </p>

                    {step.timerSeconds && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-recime-corn-light text-recime-navy border border-recime-corn/30 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-recime-corn fill-recime-corn" />
                        <span>Timer sugerido: {Math.round(step.timerSeconds / 60)} minutos</span>
                      </div>
                    )}

                    {step.tip && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-recime-sage-light text-recime-sage text-xs font-medium border border-recime-sage/20">
                        💡 <strong>Dica do Chef:</strong> {step.tip}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: NUTRITION & NOTES */}
          {activeTab === 'notes' && (
            <div className="flex flex-col gap-4">
              {recipe.nutrition && (
                <div className="p-4 rounded-2xl bg-white border border-recime-parchment-border">
                  <h4 className="font-bold text-sm text-recime-navy mb-3">
                    Informações Nutricionais (por porção)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-recime-parchment text-center">
                      <span className="text-[10px] uppercase font-bold text-recime-muted">Calorias</span>
                      <p className="font-bold text-lg text-recime-navy">{recipe.nutrition.calories} kcal</p>
                    </div>
                    <div className="p-3 rounded-xl bg-recime-parchment text-center">
                      <span className="text-[10px] uppercase font-bold text-recime-muted">Proteína</span>
                      <p className="font-bold text-lg text-recime-sage">{recipe.nutrition.protein}g</p>
                    </div>
                    <div className="p-3 rounded-xl bg-recime-parchment text-center">
                      <span className="text-[10px] uppercase font-bold text-recime-muted">Carboidratos</span>
                      <p className="font-bold text-lg text-recime-corn">{recipe.nutrition.carbs}g</p>
                    </div>
                    <div className="p-3 rounded-xl bg-recime-parchment text-center">
                      <span className="text-[10px] uppercase font-bold text-recime-muted">Gorduras</span>
                      <p className="font-bold text-lg text-recime-mango">{recipe.nutrition.fat}g</p>
                    </div>
                  </div>
                </div>
              )}

              {recipe.notes && (
                <div className="p-4 rounded-2xl bg-white border border-recime-parchment-border">
                  <h4 className="font-bold text-sm text-recime-navy mb-2">Notas do Autor</h4>
                  <p className="text-xs text-recime-muted leading-relaxed">{recipe.notes}</p>
                </div>
              )}

              {recipe.sourceUrl && (
                <div className="p-4 rounded-2xl bg-white border border-recime-parchment-border flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-recime-navy">Fonte Original</h5>
                    <p className="text-[11px] text-recime-muted truncate max-w-xs">{recipe.sourceUrl}</p>
                  </div>
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-recime-parchment hover:bg-recime-parchment-subtle text-recime-navy transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Danger zone (Delete recipe) */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir esta receita?')) {
                      onClose();
                      deleteRecipe(recipe.id);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold p-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Receita
                </button>
              </div>
            </div>
          )}

          {/* Persistent Bottom Return Button */}
          <div className="pt-4 border-t border-recime-parchment-border">
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-recime-navy hover:bg-recime-navy-light text-white font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para o Livro de Receitas</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
