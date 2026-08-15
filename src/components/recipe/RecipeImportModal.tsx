import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { parseRawRecipeText, extractRecipeFromUrl } from '../../utils/recipeParser';
import { 
  X, 
  Sparkles, 
  Link as LinkIcon, 
  FileText, 
  Camera, 
  Loader2, 
  AlertCircle,
  Upload,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeImportModalProps {
  onClose: () => void;
}

export const RecipeImportModal: React.FC<RecipeImportModalProps> = ({ onClose }) => {
  const { 
    addRecipe, 
    setSelectedRecipe, 
    setActiveTab, 
    setSelectedCategory, 
    setSearchQuery 
  } = useApp();
  
  const [activeTab, setActiveTabLocal] = useState<'url' | 'text' | 'photo'>('url');
  const [inputUrl, setInputUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Sample quick templates
  const sampleUrlYouTube = 'https://www.youtube.com/watch?v=QFMxJWh3mqE&t=50s';
  const sampleUrlInstagram = 'https://www.instagram.com/reel/Da9LHCIM5my/?igsh=Z2l3aDlndmtxc3hq';
  const sampleText = `Bolo de Cenoura com Cobertura de Brigadeiro Crocante
Rendimento: 8 porções
Tempo: 40 min

Ingredientes:
- 3 cenouras médias picadas
- 3 ovos inteiros
- 1 xícara de óleo
- 2 xícaras de açúcar
- 2 e 1/2 xícaras de farinha de trigo
- 1 colher de sopa de fermento em pó
- 1 lata de leite condensado (cobertura)
- 3 colheres de sopa de chocolate em pó (cobertura)
- 1 colher de sopa de manteiga (cobertura)

Modo de preparo:
1. No liquidificador, bata as cenouras, os ovos e o óleo por 3 minutos até virar um creme liso.
2. Em uma tigela, misture o açúcar e a farinha peneirada. Despeje o creme do liquidificador e misture bem.
3. Adicione o fermento em pó por último e mexa delicadamente.
4. Despeje em forma untada e asse em forno a 180°C por 35 a 40 minutos.
5. Em uma panela, cozinhe o leite condensado, chocolate e manteiga até ponto de brigadeiro mole e cubra o bolo ainda quente.`;

  const handleImport = async () => {
    setIsLoading(true);
    setError('');

    try {
      let parsedRecipe: any;

      if (activeTab === 'url') {
        if (!inputUrl.trim()) {
          setError('Por favor, insira o link da receita do YouTube, Instagram, TikTok ou blog.');
          setIsLoading(false);
          return;
        }

        parsedRecipe = await extractRecipeFromUrl(inputUrl.trim());

        // Override title or caption if custom text provided
        if (customTitle.trim()) {
          parsedRecipe.title = customTitle.trim();
        }

        if (customNotes.trim()) {
          const notesParsed = parseRawRecipeText(customNotes.trim());
          if (notesParsed.ingredients && notesParsed.ingredients.length > 0) {
            parsedRecipe.ingredients = notesParsed.ingredients;
          }
          if (notesParsed.instructions && notesParsed.instructions.length > 0) {
            parsedRecipe.instructions = notesParsed.instructions;
          }
        }
      } else if (activeTab === 'text') {
        if (!inputText.trim()) {
          setError('Cole o texto da receita antes de importar.');
          setIsLoading(false);
          return;
        }

        parsedRecipe = parseRawRecipeText(inputText);
        parsedRecipe.sourcePlatform = 'ai';
        parsedRecipe.image = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80';
      } else {
        // Photo OCR mode
        parsedRecipe = parseRawRecipeText(sampleText);
        parsedRecipe.title = 'Torta Rústica de Frutas da Vovó (Foto OCR)';
        parsedRecipe.sourcePlatform = 'manual';
        parsedRecipe.image = 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=1200&q=80';
      }

      if (!parsedRecipe || !parsedRecipe.title) {
        throw new Error('Não foi possível identificar a receita.');
      }

      const created = addRecipe({
        title: parsedRecipe.title || 'Receita Importada',
        description: parsedRecipe.description || `Receita extraída com sucesso a partir de ${inputUrl}`,
        image: parsedRecipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80',
        prepTimeMinutes: parsedRecipe.prepTimeMinutes || 15,
        cookTimeMinutes: parsedRecipe.cookTimeMinutes || 25,
        servings: parsedRecipe.servings || 4,
        difficulty: parsedRecipe.difficulty || 'Fácil',
        cuisine: parsedRecipe.cuisine || 'Gourmet',
        category: parsedRecipe.category || 'Jantar',
        tags: parsedRecipe.tags || ['Importado', 'Favorito'],
        sourceUrl: parsedRecipe.sourceUrl || inputUrl,
        sourcePlatform: parsedRecipe.sourcePlatform || 'instagram',
        videoEmbedUrl: parsedRecipe.videoEmbedUrl,
        author: parsedRecipe.author || '@chef',
        ingredients: parsedRecipe.ingredients || [
          { id: 'ing-1', name: 'Ingredientes conforme o post original', amount: 1, unit: 'porção', category: 'Mercearia & Grãos' }
        ],
        instructions: parsedRecipe.instructions || [
          { step: 1, title: 'Modo de Preparo', instruction: 'Siga as instruções conforme a publicação original da receita.', timerSeconds: 600 }
        ],
        nutrition: parsedRecipe.nutrition || {
          calories: 380,
          protein: 10,
          carbs: 45,
          fat: 16,
        },
        favorite: true,
        rating: 5.0,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
      });

      // Ensure user sees their recipe immediately on the Explore grid
      setActiveTab('explore');
      setSelectedCategory('Todas');
      setSearchQuery('');

      setIsLoading(false);
      onClose();
      setSelectedRecipe(created);

    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao processar o link. Verifique a URL e tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-recime-parchment-border flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-recime-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-recime-mango to-recime-corn flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-white">
                Importador Inteligente
              </h2>
              <p className="text-xs text-gray-300">
                Extraia receitas de vídeos do YouTube, Instagram, TikTok ou textos
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

        {/* Tab Navigation */}
        <div className="flex border-b border-recime-parchment-border bg-recime-parchment-subtle p-1.5 gap-1">
          <button
            onClick={() => setActiveTabLocal('url')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'url' ? 'bg-white text-recime-navy shadow-xs' : 'text-recime-muted hover:text-recime-navy'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-recime-mango" />
            <span>Link / Vídeo</span>
          </button>

          <button
            onClick={() => setActiveTabLocal('text')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'text' ? 'bg-white text-recime-navy shadow-xs' : 'text-recime-muted hover:text-recime-navy'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-recime-corn" />
            <span>Texto Livre</span>
          </button>

          <button
            onClick={() => setActiveTabLocal('photo')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'photo' ? 'bg-white text-recime-navy shadow-xs' : 'text-recime-muted hover:text-recime-navy'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-recime-sage" />
            <span>Foto / OCR</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-recime-navy">
                Cole o link da receita (YouTube, Instagram, TikTok, Blogs):
              </label>
              
              <div className="relative">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://instagram.com/reel/... ou https://youtube.com/watch?v=..."
                  className="w-full p-3.5 rounded-2xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none"
                />
              </div>

              {/* Optional Title & Caption for Instagram */}
              {inputUrl.includes('instagram.com') && (
                <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-recime-parchment-subtle border border-recime-parchment-border animate-in fade-in">
                  <span className="text-[11px] font-bold text-recime-navy">
                    ✨ Personalizar dados do Instagram (Opcional):
                  </span>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Nome do Prato (ex: Risoto de Alho-poró)"
                    className="w-full p-2.5 rounded-xl bg-white text-xs border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none"
                  />
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={3}
                    placeholder="Cole a legenda do post aqui se desejar extrair os ingredientes..."
                    className="w-full p-2.5 rounded-xl bg-white text-xs border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none resize-none font-mono"
                  />
                </div>
              )}

              {/* Supported platform pills */}
              <div className="flex items-center justify-between text-xs text-recime-muted pt-1">
                <span>Plataformas compatíveis:</span>
                <div className="flex gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">YouTube</span>
                  <span className="px-2 py-0.5 rounded bg-pink-100 text-pink-700 font-bold text-[10px]">Instagram</span>
                  <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-800 font-bold text-[10px]">TikTok</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Blogs</span>
                </div>
              </div>

              {/* Quick links to test */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-recime-parchment-border">
                <span className="text-[11px] font-bold text-recime-muted">Exemplos rápidos para testar:</span>
                <button
                  type="button"
                  onClick={() => setInputUrl(sampleUrlYouTube)}
                  className="text-left text-xs text-recime-mango font-semibold hover:underline flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-recime-mango" />
                  <span>Bolo de Chocolate Rápido e Fácil (YouTube)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputUrl(sampleUrlInstagram)}
                  className="text-left text-xs text-pink-600 font-semibold hover:underline"
                >
                  📸 Post do Instagram (Reel)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-recime-navy">
                  Cole o texto com título, ingredientes e modo de preparo:
                </label>
                <button
                  type="button"
                  onClick={() => setInputText(sampleText)}
                  className="text-xs text-recime-mango font-semibold hover:underline"
                >
                  Carregar exemplo
                </button>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={8}
                placeholder="Exemplo:&#10;Panqueca de Banana&#10;Ingredientes:&#10;- 1 banana amassada&#10;- 1 ovo&#10;- 2 colheres de aveia&#10;&#10;Modo de preparo:&#10;Misture tudo e asse na frigideira por 3 minutos."
                className="w-full p-3.5 rounded-2xl bg-recime-parchment text-sm border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none resize-none font-mono text-xs"
              />
            </div>
          )}

          {activeTab === 'photo' && (
            <div className="flex flex-col gap-3 text-center">
              <label className="text-xs font-bold text-recime-navy text-left">
                Tire uma foto de um livro de culinária ou caderno de receitas:
              </label>

              <div 
                onClick={() => {
                  setInputText(sampleText);
                  setActiveTabLocal('text');
                }}
                className="border-2 border-dashed border-recime-parchment-border hover:border-recime-mango rounded-3xl p-8 flex flex-col items-center justify-center gap-3 bg-recime-parchment cursor-pointer transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-recime-mango/15 flex items-center justify-center text-recime-mango">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-recime-navy">Clique para enviar uma foto ou anotação</p>
                  <p className="text-xs text-recime-muted mt-0.5">PNG, JPG, HEIC até 10MB</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-recime-mango to-recime-mango-hover hover:from-recime-mango-hover hover:to-recime-mango text-white font-bold text-sm shadow-md hover:shadow-glow transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Extraindo Receita com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Importar Receita Agora</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};
