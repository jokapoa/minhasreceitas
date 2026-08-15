import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { RecipeCategory, RecipeDifficulty, AisleCategory, InstructionStep } from '../../types/recipe';
import { categorizeIngredient } from '../../utils/recipeParser';
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  Sparkles,
  ChefHat
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeFormModalProps {
  onClose: () => void;
}

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({ onClose }) => {
  const { addRecipe, setSelectedRecipe } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(15);
  const [cookTimeMinutes, setCookTimeMinutes] = useState(20);
  const [servings, setServings] = useState(4);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>('Fácil');
  const [cuisine, setCuisine] = useState('Brasileira');
  const [category, setCategory] = useState<RecipeCategory>('Jantar');
  const [tagsInput, setTagsInput] = useState('Fácil, Caseiro, Delicioso');

  // Dynamic ingredients
  const [ingredients, setIngredients] = useState([
    { id: '1', name: 'Peito de frango', amount: 500, unit: 'g', category: 'Carnes, Peixes & Aves' as AisleCategory },
    { id: '2', name: 'Azeite de oliva', amount: 2, unit: 'colheres de sopa', category: 'Mercearia & Grãos' as AisleCategory },
    { id: '3', name: 'Alho picado', amount: 3, unit: 'dentes', category: 'Hortifrúti & Frutas' as AisleCategory },
  ]);

  // Dynamic instructions
  const [instructions, setInstructions] = useState<InstructionStep[]>([
    { step: 1, title: 'Preparação', instruction: 'Tempere os ingredientes e organize sua bancada.', timerSeconds: 0 },
    { step: 2, title: 'Cozimento', instruction: 'Aqueça a panela e cozinhe até dourar perfeitamente.', timerSeconds: 600 },
  ]);

  const handleAddIngredient = () => {
    setIngredients(prev => [
      ...prev,
      { id: `${Date.now()}`, name: '', amount: 1, unit: 'unidade', category: 'Mercearia & Grãos' }
    ]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const handleIngredientChange = (id: string, field: string, val: any) => {
    setIngredients(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'name') {
        updated.category = categorizeIngredient(val);
      }
      return updated;
    }));
  };

  const handleAddStep = () => {
    setInstructions(prev => [
      ...prev,
      { step: prev.length + 1, instruction: '', timerSeconds: 0 }
    ]);
  };

  const handleRemoveStep = (stepNum: number) => {
    setInstructions(prev => prev.filter(s => s.step !== stepNum).map((s, idx) => ({ ...s, step: idx + 1 })));
  };

  const handleStepChange = (stepNum: number, field: string, val: any) => {
    setInstructions(prev => prev.map(s => {
      if (s.step !== stepNum) return s;
      return { ...s, [field]: val };
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe o título da receita.');
      return;
    }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const newRecipe = addRecipe({
      title,
      description,
      image,
      prepTimeMinutes: Number(prepTimeMinutes) || 10,
      cookTimeMinutes: Number(cookTimeMinutes) || 15,
      servings: Number(servings) || 4,
      difficulty,
      cuisine,
      category,
      tags,
      sourcePlatform: 'manual',
      author: 'Você (Chef da Casa)',
      ingredients: ingredients.filter(i => i.name.trim()),
      instructions: instructions.filter(i => i.instruction.trim()),
      favorite: false,
      rating: 5.0,
      nutrition: {
        calories: 420,
        protein: 32,
        carbs: 25,
        fat: 18,
      }
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 }
    });

    onClose();
    setSelectedRecipe(newRecipe);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-recime-parchment-border flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-recime-navy text-white flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-recime-mango flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-white">
                Cadastrar Nova Receita
              </h2>
              <p className="text-xs text-gray-300">
                Adicione suas próprias receitas de família e criações exclusivas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-6">
          
          {/* Section 1: Basic Info */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif font-bold text-base text-recime-navy pb-2 border-b border-recime-parchment-border">
              Informações Principais
            </h3>

            <div>
              <label className="block text-xs font-bold text-recime-navy mb-1">Título da Receita *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Moqueca de Peixe Baiana Tradicional"
                className="w-full p-3 rounded-xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-recime-navy mb-1">Descrição / História</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Breve descrição do prato, aromas e segredinhos..."
                className="w-full p-3 rounded-xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">URL da Foto</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 rounded-xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="ex: Rápido, Sem Glúten, Jantar"
                  className="w-full p-3 rounded-xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-recime-parchment text-xs font-semibold border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango"
                >
                  <option value="Jantar">Jantar</option>
                  <option value="Almoço">Almoço</option>
                  <option value="Café da Manhã">Café da Manhã</option>
                  <option value="Sobremesa">Sobremesa</option>
                  <option value="Lanches & Aperitivos">Lanches & Aperitivos</option>
                  <option value="Bebidas & Smoothies">Bebidas & Smoothies</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Culinária</label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="ex: Italiana"
                  className="w-full p-2.5 rounded-xl bg-recime-parchment text-xs border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Dificuldade</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-recime-parchment text-xs font-semibold border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango"
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Médio">Médio</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Porções</label>
                <input
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-recime-parchment text-xs border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Tempo de Preparo (minutos)</label>
                <input
                  type="number"
                  min="0"
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-recime-parchment text-xs border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Tempo de Cozimento (minutos)</label>
                <input
                  type="number"
                  min="0"
                  value={cookTimeMinutes}
                  onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-recime-parchment text-xs border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Ingredients */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center pb-2 border-b border-recime-parchment-border">
              <h3 className="font-serif font-bold text-base text-recime-navy">
                Ingredientes ({ingredients.length})
              </h3>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="flex items-center gap-1 text-xs font-bold text-recime-mango hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Ingrediente
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {ingredients.map((ing) => (
                <div key={ing.id} className="flex items-center gap-2 bg-recime-parchment p-2 rounded-xl border border-recime-parchment-border">
                  <input
                    type="number"
                    step="any"
                    value={ing.amount}
                    onChange={(e) => handleIngredientChange(ing.id, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="Qtd"
                    className="w-16 p-2 rounded-lg bg-white text-xs border border-gray-200 focus:ring-1 focus:ring-recime-mango"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => handleIngredientChange(ing.id, 'unit', e.target.value)}
                    placeholder="Unid (g, ml, colheres)"
                    className="w-24 p-2 rounded-lg bg-white text-xs border border-gray-200 focus:ring-1 focus:ring-recime-mango"
                  />
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(ing.id, 'name', e.target.value)}
                    placeholder="Nome do ingrediente..."
                    className="flex-1 p-2 rounded-lg bg-white text-xs border border-gray-200 focus:ring-1 focus:ring-recime-mango font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(ing.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Instructions */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center pb-2 border-b border-recime-parchment-border">
              <h3 className="font-serif font-bold text-base text-recime-navy">
                Modo de Preparo ({instructions.length} passos)
              </h3>
              <button
                type="button"
                onClick={handleAddStep}
                className="flex items-center gap-1 text-xs font-bold text-recime-mango hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Passo
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {instructions.map((step) => (
                <div key={step.step} className="flex gap-3 items-start bg-recime-parchment p-3 rounded-xl border border-recime-parchment-border">
                  <div className="w-7 h-7 rounded-lg bg-recime-mango text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                    {step.step}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={step.title || ''}
                      onChange={(e) => handleStepChange(step.step, 'title', e.target.value)}
                      placeholder="Título do passo (ex: Selar o Frango)"
                      className="w-full p-2 rounded-lg bg-white text-xs font-bold border border-gray-200 focus:ring-1 focus:ring-recime-mango"
                    />

                    <textarea
                      value={step.instruction}
                      onChange={(e) => handleStepChange(step.step, 'instruction', e.target.value)}
                      rows={2}
                      placeholder="Descreva a instrução deste passo..."
                      className="w-full p-2 rounded-lg bg-white text-xs border border-gray-200 focus:ring-1 focus:ring-recime-mango resize-none"
                    />

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-recime-corn" />
                      <span className="text-[11px] text-recime-muted font-medium">Timer em minutos:</span>
                      <input
                        type="number"
                        min="0"
                        value={step.timerSeconds ? Math.round(step.timerSeconds / 60) : 0}
                        onChange={(e) => handleStepChange(step.step, 'timerSeconds', (parseInt(e.target.value, 10) || 0) * 60)}
                        className="w-16 p-1 text-xs rounded bg-white border border-gray-200 text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveStep(step.step)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-recime-mango to-recime-mango-hover text-white font-bold text-sm shadow-md hover:shadow-glow transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Salvar Receita no Meu Livro</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
