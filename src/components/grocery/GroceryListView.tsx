import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { AisleCategory } from '../../types/recipe';
import { categorizeIngredient } from '../../utils/recipeParser';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Check, 
  Share2, 
  Copy, 
  ShoppingBag
} from 'lucide-react';

export const GroceryListView: React.FC = () => {
  const { 
    groceryList, 
    addGroceryItem, 
    toggleGroceryItem, 
    removeGroceryItem, 
    clearCompletedGrocery, 
    clearAllGrocery 
  } = useApp();

  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unidade');
  const [newItemCategory, setNewItemCategory] = useState<AisleCategory>('Mercearia & Grãos');
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const totalItems = groceryList.length;
  const checkedItems = groceryList.filter(i => i.checked).length;
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const categories: AisleCategory[] = [
    'Hortifrúti & Frutas',
    'Carnes, Peixes & Aves',
    'Laticínios & Ovos',
    'Mercearia & Grãos',
    'Temperos & Molhos',
    'Padaria & Confeitaria',
    'Congelados',
    'Bebidas',
    'Outros'
  ];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addGroceryItem({
      name: newItemName.trim(),
      amount: newItemAmount,
      unit: newItemUnit.trim(),
      category: newItemCategory || categorizeIngredient(newItemName),
      checked: false,
    });

    setNewItemName('');
    setNewItemAmount(1);
  };

  const handleCopyList = () => {
    if (groceryList.length === 0) return;

    let text = '🛒 *Lista de Compras ReciMe*\n\n';

    categories.forEach(cat => {
      const itemsInCat = groceryList.filter(i => (i.category || 'Outros') === cat);
      if (itemsInCat.length > 0) {
        text += `*${cat}*\n`;
        itemsInCat.forEach(item => {
          text += `${item.checked ? '✅' : '⬜'} ${item.name} (${item.amount} ${item.unit})\n`;
        });
        text += '\n';
      }
    });

    navigator.clipboard.writeText(text);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (groceryList.length === 0) return;

    let text = '🛒 *Lista de Compras ReciMe*\n\n';
    categories.forEach(cat => {
      const itemsInCat = groceryList.filter(i => (i.category || 'Outros') === cat);
      if (itemsInCat.length > 0) {
        text += `*${cat}*\n`;
        itemsInCat.forEach(item => {
          text += `${item.checked ? '✅' : '⬜'} ${item.name} (${item.amount} ${item.unit})\n`;
        });
        text += '\n';
      }
    });

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Header & Progress Card */}
      <div className="bg-white p-6 rounded-3xl border border-recime-parchment-border shadow-soft flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-recime-mango text-xs font-bold uppercase tracking-wider mb-1">
              <ShoppingCart className="w-4 h-4" />
              <span>Lista de Compras Inteligente</span>
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-recime-navy">
              Itens para o Mercado
            </h1>
            <p className="text-xs sm:text-sm text-recime-muted mt-1">
              Agrupados automaticamente por corredores do supermercado para facilitar suas compras.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyList}
              disabled={totalItems === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-recime-parchment hover:bg-recime-parchment-subtle text-recime-navy text-xs font-bold border border-recime-parchment-border transition-colors disabled:opacity-50"
            >
              {copiedFeedback ? <Check className="w-3.5 h-3.5 text-recime-sage" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFeedback ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              disabled={totalItems === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar */}
        {totalItems > 0 && (
          <div className="pt-3 border-t border-recime-parchment-border flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-recime-navy">
              <span>Progresso das Compras</span>
              <span className="text-recime-sage font-extrabold">{checkedItems} de {totalItems} itens ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-recime-parchment overflow-hidden border border-recime-parchment-border">
              <div 
                className="h-full bg-gradient-to-r from-recime-mango to-recime-sage transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddItem} className="bg-white p-4 sm:p-5 rounded-3xl border border-recime-parchment-border shadow-xs flex flex-col sm:flex-row items-center gap-2.5">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => {
            setNewItemName(e.target.value);
            setNewItemCategory(categorizeIngredient(e.target.value));
          }}
          placeholder="Adicionar item rápido (ex: Leite de Amêndoas, Ovos, Tomates...)"
          className="flex-1 w-full p-3 rounded-2xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="number"
            min="0.1"
            step="any"
            value={newItemAmount}
            onChange={(e) => setNewItemAmount(parseFloat(e.target.value) || 1)}
            className="w-16 p-3 rounded-2xl bg-recime-parchment text-sm border border-recime-parchment-border text-center font-bold"
          />

          <input
            type="text"
            value={newItemUnit}
            onChange={(e) => setNewItemUnit(e.target.value)}
            placeholder="unid"
            className="w-20 p-3 rounded-2xl bg-recime-parchment text-sm border border-recime-parchment-border text-center"
          />

          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as AisleCategory)}
            className="p-3 rounded-2xl bg-recime-parchment text-xs font-semibold border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            type="submit"
            className="p-3 rounded-2xl bg-recime-mango hover:bg-recime-mango-hover text-white font-bold transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Grocery Items Grouped by Supermarket Aisle */}
      {totalItems === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-recime-parchment-border text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-recime-parchment-subtle flex items-center justify-center text-recime-muted">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-recime-navy">
              Sua lista de compras está vazia
            </h3>
            <p className="text-xs text-recime-muted mt-1 max-w-sm">
              Adicione itens manualmente acima ou use a opção "Adicionar à Lista" nas receitas ou no Cardápio Semanal.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((cat) => {
            const itemsInCat = groceryList.filter(i => (i.category || 'Outros') === cat);
            if (itemsInCat.length === 0) return null;

            return (
              <div key={cat} className="bg-white rounded-3xl border border-recime-parchment-border p-5 shadow-xs flex flex-col gap-3">
                <h3 className="font-serif font-bold text-sm text-recime-navy flex items-center justify-between pb-2 border-b border-recime-parchment-border">
                  <span>{cat}</span>
                  <span className="text-xs font-sans text-recime-muted">
                    {itemsInCat.filter(i => i.checked).length}/{itemsInCat.length} comprados
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {itemsInCat.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleGroceryItem(item.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                        item.checked
                          ? 'bg-recime-parchment-subtle/50 border-recime-parchment-border opacity-50'
                          : 'bg-recime-parchment hover:bg-white border-recime-parchment-border shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          item.checked ? 'bg-recime-sage border-recime-sage text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="flex flex-col">
                          <span className={`text-xs font-bold text-recime-navy ${item.checked ? 'line-through text-gray-400' : ''}`}>
                            {item.name}
                          </span>
                          {item.recipeTitle && (
                            <span className="text-[10px] text-recime-muted truncate max-w-[150px]">
                              Para: {item.recipeTitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-recime-mango">
                          {item.amount} {item.unit}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGroceryItem(item.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Bottom Clears */}
          <div className="flex justify-end gap-3 pt-2">
            {checkedItems > 0 && (
              <button
                onClick={clearCompletedGrocery}
                className="px-4 py-2 rounded-xl bg-recime-parchment hover:bg-recime-parchment-subtle text-recime-navy text-xs font-bold transition-colors"
              >
                Limpar Itens Comprados ({checkedItems})
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('Deseja limpar todos os itens da lista?')) {
                  clearAllGrocery();
                }
              }}
              className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
            >
              Limpar Lista Inteira
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
