import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Flame, Download, Upload, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { recipes, cookbooks, mealPlan, groceryList } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      recipes,
      cookbooks,
      mealPlan,
      groceryList,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recime-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.recipes) {
          localStorage.setItem('recime_recipes', JSON.stringify(data.recipes));
          if (data.cookbooks) localStorage.setItem('recime_cookbooks', JSON.stringify(data.cookbooks));
          if (data.mealPlan) localStorage.setItem('recime_mealplan', JSON.stringify(data.mealPlan));
          if (data.groceryList) localStorage.setItem('recime_grocery', JSON.stringify(data.groceryList));
          alert('Backup restaurado com sucesso! A página será recarregada.');
          window.location.reload();
        }
      } catch (err) {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <footer className="bg-recime-navy text-white mt-12 pb-24 lg:pb-12 border-t border-recime-navy-light pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-recime-mango to-recime-corn flex items-center justify-center">
              <Flame className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="font-serif font-bold text-xl tracking-tight text-recime-parchment">
                Reci<span className="text-recime-mango">Me</span>
              </span>
              <p className="text-xs text-gray-400">
                O aplicativo definitivo para colecionar, planejar e cozinhar.
              </p>
            </div>
          </div>

          {/* Backup Data Export/Import */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
              title="Fazer backup de todas as suas receitas em JSON"
            >
              <Download className="w-3.5 h-3.5 text-recime-corn" />
              <span>Exportar Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
              title="Restaurar backup JSON"
            >
              <Upload className="w-3.5 h-3.5 text-recime-sage" />
              <span>Restaurar Backup</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportData}
              accept=".json"
              className="hidden"
            />
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-3">
          <p>© 2026 ReciMe App • Inspirado na experiência mobile e web do ReciMe.</p>
          <div className="flex items-center gap-1 text-gray-300 font-medium">
            <span>Feito com</span>
            <Heart className="w-3.5 h-3.5 text-recime-mango fill-recime-mango inline" />
            <span>para amantes da boa gastronomia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
