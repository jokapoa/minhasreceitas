import React from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, BookOpen, Calendar, ShoppingCart, Heart } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, groceryList, mealPlan, recipes } = useApp();

  const favoriteCount = recipes.filter(r => r.favorite).length;
  const groceryCount = groceryList.filter(i => !i.checked).length;
  const plannedCount = mealPlan.length;

  interface NavTab {
    id: 'explore' | 'cookbooks' | 'planner' | 'grocery' | 'favorites';
    label: string;
    icon: any;
    badge?: number | null;
  }

  const tabs: NavTab[] = [
    { id: 'explore', label: 'Explorar', icon: Compass },
    { id: 'cookbooks', label: 'Livros', icon: BookOpen },
    { id: 'planner', label: 'Cardápio', icon: Calendar, badge: plannedCount > 0 ? plannedCount : null },
    { id: 'grocery', label: 'Compras', icon: ShoppingCart, badge: groceryCount > 0 ? groceryCount : null },
    { id: 'favorites', label: 'Salvos', icon: Heart, badge: favoriteCount > 0 ? favoriteCount : null },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-recime-navy/95 backdrop-blur-lg border-t border-recime-navy-light px-2 py-1.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-recime-mango font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive && tab.id === 'favorites' ? 'fill-recime-mango' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-recime-mango text-white min-w-[16px] text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
