import React from 'react';

interface JKLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const JKLogo: React.FC<JKLogoProps> = ({ 
  size = 'md', 
  showText = true,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Image with Glow Effect */}
      <div className={`relative flex-shrink-0 overflow-hidden shadow-glow border border-amber-500/30 group-hover:scale-105 transition-all duration-300 ${sizeClasses[size]}`}>
        <img 
          src="/logo-jk.jpg" 
          alt="Minhas Receitas - JK (Jonas Kaffka)" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none" />
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-recime-parchment leading-none">
              Minhas <span className="text-recime-mango">Receitas</span>
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-recime-navy font-sans shadow-sm">
              JK
            </span>
          </div>
          <span className="text-[11px] font-medium text-recime-parchment/60 tracking-wider">
            by Jonas Kaffka
          </span>
        </div>
      )}
    </div>
  );
};
