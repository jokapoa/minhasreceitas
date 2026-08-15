import React, { useState, useEffect } from 'react';
import type { Recipe } from '../../types/recipe';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useTimer, playChimeSound } from '../../hooks/useTimer';
import confetti from 'canvas-confetti';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldCheck, 
  ListCheck,
  ChefHat
} from 'lucide-react';

interface CookingModeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const CookingModeModal: React.FC<CookingModeModalProps> = ({ recipe, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showIngredientsDrawer, setShowIngredientsDrawer] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const { isLocked, requestLock, releaseLock } = useWakeLock();

  const totalSteps = recipe.instructions.length;
  const currentStep = recipe.instructions[currentStepIndex];

  // Timer for current step
  const timer = useTimer(currentStep?.timerSeconds || 0);

  // When step changes, update timer
  useEffect(() => {
    if (currentStep?.timerSeconds) {
      timer.reset(currentStep.timerSeconds);
    } else {
      timer.reset(0);
    }
  }, [currentStepIndex]);

  // Request wake lock on mount so screen never sleeps
  useEffect(() => {
    requestLock();
    return () => {
      releaseLock();
    };
  }, [requestLock, releaseLock]);

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Completed recipe!
      setIsCompleted(true);
      playChimeSound();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E36338', '#F4B53F', '#4E7D63', '#FAF7F2']
      });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-recime-navy text-recime-parchment flex flex-col justify-between select-none">
      
      {/* Top Bar */}
      <header className="px-4 sm:px-8 py-4 border-b border-white/10 flex items-center justify-between bg-recime-navy-dark/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-transform active:scale-90"
            aria-label="Sair do modo cozinha"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-recime-corn">
              Modo Cozinha
            </span>
            <h2 className="font-serif font-bold text-base sm:text-lg text-white truncate max-w-xs sm:max-w-md">
              {recipe.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wake Lock Status Indicator */}
          <div 
            title={isLocked ? "Tela ativa: seu celular ou computador não irá suspender" : "Modo cozinha ativo"}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-recime-sage/20 border border-recime-sage/40 text-recime-sage text-xs font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isLocked ? 'Tela Ativa' : 'Cozinhando'}</span>
          </div>

          {/* Show ingredients toggle */}
          <button
            onClick={() => setShowIngredientsDrawer(!showIngredientsDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            <ListCheck className="w-4 h-4 text-recime-corn" />
            <span>Ingredientes</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 flex flex-col justify-center relative overflow-y-auto">
        
        {isCompleted ? (
          /* Completion Screen */
          <div className="text-center flex flex-col items-center justify-center gap-6 py-12 animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-recime-mango to-recime-corn flex items-center justify-center shadow-glow animate-bounce">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
            
            <div>
              <span className="text-recime-corn font-bold text-sm uppercase tracking-widest">
                Parabéns, Chef!
              </span>
              <h2 className="font-serif font-bold text-3xl sm:text-5xl text-white mt-2">
                Receita Concluída!
              </h2>
              <p className="text-gray-300 text-sm sm:text-base mt-3 max-w-md mx-auto">
                Seu prato está pronto para ser servido e apreciado. Bom apetite!
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setIsCompleted(false);
                  setCurrentStepIndex(0);
                }}
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
              >
                Cozinhar Novamente
              </button>
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-recime-mango hover:bg-recime-mango-hover text-white font-bold text-sm shadow-glow transition-all active:scale-95"
              >
                Finalizar
              </button>
            </div>
          </div>
        ) : (
          /* Step View */
          <div className="flex flex-col gap-6">
            
            {/* Step Counter & Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                <span>Passo {currentStepIndex + 1} de {totalSteps}</span>
                <span>{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%</span>
              </div>
              
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-recime-mango to-recime-corn transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md flex flex-col gap-6">
              
              {currentStep?.title && (
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-recime-corn">
                  {currentStep.title}
                </h3>
              )}

              {/* Big instruction text */}
              <p className="font-sans text-lg sm:text-2xl lg:text-3xl text-recime-parchment leading-relaxed sm:leading-relaxed font-medium">
                {currentStep?.instruction}
              </p>

              {/* Step Tip */}
              {currentStep?.tip && (
                <div className="p-4 rounded-2xl bg-recime-sage/15 border border-recime-sage/30 text-recime-parchment text-sm">
                  💡 <strong className="text-recime-sage">Dica:</strong> {currentStep.tip}
                </div>
              )}

              {/* Step Timer Control (if step has timer) */}
              {currentStep?.timerSeconds ? (
                <div className="mt-2 p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl sm:text-4xl font-mono font-bold text-recime-corn tracking-wider">
                      {timer.formattedTime}
                    </div>
                    {timer.isFinished && (
                      <span className="px-2.5 py-1 rounded-full bg-recime-mango text-white text-xs font-bold animate-pulse">
                        Tempo esgotado!
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={timer.isRunning ? timer.pause : timer.start}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 ${
                        timer.isRunning
                          ? 'bg-recime-corn text-recime-navy hover:bg-recime-corn/90'
                          : 'bg-recime-mango text-white hover:bg-recime-mango-hover'
                      }`}
                    >
                      {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      <span>{timer.isRunning ? 'Pausar' : 'Iniciar Timer'}</span>
                    </button>

                    <button
                      onClick={() => timer.addTime(60)}
                      className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                      title="+1 minuto"
                    >
                      +1m
                    </button>

                    <button
                      onClick={() => timer.reset(currentStep.timerSeconds)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Resetar"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : null}

            </div>

          </div>
        )}

        {/* Ingredients Drawer (Slides in on request) */}
        {showIngredientsDrawer && (
          <div className="absolute inset-y-4 right-4 sm:right-8 w-80 max-w-[90%] bg-recime-navy border border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="font-bold text-sm text-recime-parchment flex items-center gap-2">
                <ListCheck className="w-4 h-4 text-recime-corn" />
                Ingredientes da Receita
              </h4>
              <button
                onClick={() => setShowIngredientsDrawer(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2">
              {recipe.ingredients.map(ing => (
                <div key={ing.id} className="p-2.5 rounded-xl bg-white/5 text-xs flex justify-between items-center border border-white/5">
                  <span className="font-medium text-white">{ing.name}</span>
                  <span className="font-bold text-recime-corn whitespace-nowrap">{ing.amount} {ing.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Bottom Navigation Buttons */}
      {!isCompleted && (
        <footer className="px-4 sm:px-8 py-4 border-t border-white/10 bg-recime-navy-dark/40 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                currentStepIndex === 0
                  ? 'opacity-40 cursor-not-allowed text-gray-400 bg-white/5'
                  : 'bg-white/10 hover:bg-white/20 text-white active:scale-95'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Passo Anterior</span>
            </button>

            <div className="flex gap-1.5">
              {recipe.instructions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'bg-recime-mango w-6'
                      : idx < currentStepIndex
                      ? 'bg-recime-corn'
                      : 'bg-white/20'
                  }`}
                  aria-label={`Ir para passo ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-2xl bg-gradient-to-r from-recime-mango to-recime-mango-hover hover:from-recime-mango-hover hover:to-recime-mango text-white font-bold text-sm shadow-glow transition-all active:scale-95"
            >
              <span>{currentStepIndex === totalSteps - 1 ? 'Concluir Receita' : 'Próximo Passo'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </footer>
      )}

    </div>
  );
};
