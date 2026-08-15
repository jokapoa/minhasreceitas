import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RecipeCard } from '../recipe/RecipeCard';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export const CookbookList: React.FC = () => {
  const { cookbooks, recipes, addCookbook, deleteCookbook } = useApp();
  
  const [selectedCookbookId, setSelectedCookbookId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🍳');
  const [color, setColor] = useState('#E36338');

  const selectedCookbook = cookbooks.find(c => c.id === selectedCookbookId);
  const cookbookRecipes = selectedCookbook
    ? recipes.filter(r => selectedCookbook.recipeIds.includes(r.id))
    : [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCookbook({
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      recipeIds: [],
    });

    setName('');
    setDescription('');
    setIsCreating(false);
  };

  const icons = ['🍳', '🥗', '🍝', '🍰', '🥑', '🥩', '🌮', '🥣', '⚡', '☕'];
  const colors = ['#E36338', '#F4B53F', '#4E7D63', '#131D33', '#8B5CF6', '#EC4899'];

  if (selectedCookbook) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        
        {/* Back button & Title */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-recime-parchment-border shadow-soft">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedCookbookId(null)}
              className="w-10 h-10 rounded-2xl bg-recime-parchment hover:bg-recime-parchment-subtle flex items-center justify-center text-recime-navy transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedCookbook.icon || '📖'}</span>
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-recime-navy">
                  {selectedCookbook.name}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-recime-muted mt-1">
                {selectedCookbook.description || 'Coleção personalizada de receitas.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Deseja excluir este livro de receitas? As receitas permanecerão na biblioteca.')) {
                deleteCookbook(selectedCookbook.id);
                setSelectedCookbookId(null);
              }
            }}
            className="text-xs text-red-600 hover:text-red-700 font-semibold p-2 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Livro</span>
          </button>
        </div>

        {/* Recipe Grid for this cookbook */}
        {cookbookRecipes.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-recime-parchment-border text-center flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">{selectedCookbook.icon || '📖'}</span>
            <h3 className="font-serif font-bold text-lg text-recime-navy">
              Nenhuma receita adicionada ainda neste livro
            </h3>
            <p className="text-xs text-recime-muted max-w-sm">
              Abra qualquer receita na aba Explorar e clique no botão "Salvar em Livro" para organizá-la aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cookbookRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-recime-parchment-border shadow-soft">
        <div>
          <div className="flex items-center gap-2 text-recime-mango text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Livros & Coleções Digitais</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-recime-navy">
            Meus Livros de Receitas
          </h1>
          <p className="text-xs sm:text-sm text-recime-muted mt-1">
            Crie pastas personalizadas para organizar suas receitas por ocasião, dieta ou preferência.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-recime-mango to-recime-mango-hover text-white font-bold text-sm shadow-md hover:shadow-glow transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Livro</span>
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-recime-parchment-border flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-recime-parchment-border">
              <h3 className="font-serif font-bold text-lg text-recime-navy">
                Novo Livro de Receitas
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Nome do Livro *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Churrasco de Domingo, Almoço Fit..."
                  className="w-full p-3 rounded-xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Descrição</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrição da coleção..."
                  className="w-full p-3 rounded-xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Ícone</label>
                <div className="flex gap-2 flex-wrap">
                  {icons.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        icon === ic ? 'bg-recime-mango text-white scale-110 shadow-sm' : 'bg-recime-parchment hover:bg-recime-parchment-subtle'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-recime-navy mb-1">Cor de Destaque</label>
                <div className="flex gap-2">
                  {colors.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === col ? 'scale-125 ring-2 ring-offset-2 ring-recime-navy' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-recime-mango hover:bg-recime-mango-hover text-white font-bold text-sm shadow-md transition-all"
              >
                Salvar Livro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cookbooks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cookbooks.map((cb) => {
          const recipeCount = recipes.filter(r => cb.recipeIds.includes(r.id)).length;
          
          return (
            <div
              key={cb.id}
              onClick={() => setSelectedCookbookId(cb.id)}
              className="group bg-white p-6 rounded-3xl border border-recime-parchment-border shadow-soft hover:shadow-float recipe-card-hover cursor-pointer flex flex-col justify-between h-56 relative overflow-hidden"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: cb.color || '#E36338' }}
              />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-recime-parchment flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
                    {cb.icon || '📖'}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-recime-parchment text-recime-navy text-xs font-bold">
                    {recipeCount} {recipeCount === 1 ? 'receita' : 'receitas'}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-lg text-recime-navy group-hover:text-recime-mango transition-colors line-clamp-1">
                  {cb.name}
                </h3>
                <p className="text-xs text-recime-muted mt-1 line-clamp-2">
                  {cb.description || 'Coleção de receitas personalizadas.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-recime-mango pt-3 border-t border-recime-parchment-border">
                <span>Abrir Livro</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
