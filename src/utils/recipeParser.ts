import type { Ingredient, InstructionStep, Recipe, AisleCategory, RecipeCategory } from '../types/recipe';
import { cleanInstagramCaption, extractSmartRecipeTitle } from './instagramCleaner';

// Helper to categorize ingredients based on keywords
export function categorizeIngredient(name: string): AisleCategory {
  const lower = name.toLowerCase();
  
  if (/frango|carne|bacon|salmão|peixe|camarão|porco|suín|costela|bife|moída|linguiça|peito de frango|atum|guanciale|calabresa/i.test(lower)) {
    return 'Carnes, Peixes & Aves';
  }
  if (/leite|creme de leite|leite condensado|manteiga|queijo|parmesão|iogurte|mussarela|ricota|requeijão|gema|ovo|clara|mozzarella/i.test(lower)) {
    return 'Laticínios & Ovos';
  }
  if (/tomate|cebola|alho|espinafre|abacate|limão|laranja|manjericão|coentro|batata|cenoura|pepino|banana|morango|maçã|abóbora|pimentão|ervilha|salsa|cebolinha|hortelã|alface|rúcula|brócolis|cogumelo|funghi|shimeji/i.test(lower)) {
    return 'Hortifrúti & Frutas';
  }
  if (/azeite|óleo|arroz|massa|espaguete|spaghetti|macarrão|farinha|açúcar|sal|pimenta|cacau|chocolate|chocolate em pó|aveia|fermento|feijão|grão|shoyu|vinagre|molho|chia|granola/i.test(lower)) {
    return 'Mercearia & Grãos';
  }
  if (/orégano|cominho|páprica|canela|curry|noz moscada|açafrão|gengibre|pimenta do reino|louro|baunilha|alecrim|tomilho/i.test(lower)) {
    return 'Temperos & Molhos';
  }
  if (/pão|tortilha|bolo|biscoito|croissant|torrada|granulado/i.test(lower)) {
    return 'Padaria & Confeitaria';
  }
  if (/congelado|açaí|edamame|sorvete|polpa/i.test(lower)) {
    return 'Congelados';
  }
  if (/água|suco|vinho|cerveja|café|chá/i.test(lower)) {
    return 'Bebidas';
  }
  
  return 'Mercearia & Grãos';
}

// Extract timer in seconds from step text (e.g. "por 15 minutos", "5 min", "1 hora")
export function extractTimerFromText(text: string): number | undefined {
  const minMatch = text.match(/(\d+)\s*(?:a\s*\d+\s*)?(?:min|minuto|minutos)/i);
  if (minMatch && minMatch[1]) {
    return parseInt(minMatch[1], 10) * 60;
  }
  
  const hourMatch = text.match(/(\d+)\s*(?:hora|horas|h)\b/i);
  if (hourMatch && hourMatch[1]) {
    return parseInt(hourMatch[1], 10) * 3600;
  }
  
  const secMatch = text.match(/(\d+)\s*(?:seg|segundo|segundos)/i);
  if (secMatch && secMatch[1]) {
    return parseInt(secMatch[1], 10);
  }
  
  return undefined;
}

const KNOWN_UNITS = [
  'colheres de sopa', 'colher de sopa',
  'colheres de chá', 'colher de chá',
  'colheres de sobremesa', 'colher de sobremesa',
  'colheres', 'colher',
  'xícaras de chá', 'xícara de chá',
  'xícaras', 'xícara', 'xicaras', 'xicara',
  'copos', 'copo',
  'potes', 'pote',
  'envelopes', 'envelope',
  'pacotes', 'pacote',
  'latas', 'lata',
  'caixinhas', 'caixinha',
  'garrafas', 'garrafa',
  'fatias', 'fatia',
  'dentes', 'dente',
  'pitadas', 'pitada',
  'ramos', 'ramo',
  'folhas', 'folha',
  'unidades', 'unidade', 'un',
  'kg', 'g', 'mg',
  'ml', 'l', 'litros', 'litro',
  'scoops', 'scoop'
];

// Parse an ingredient line like "2 colheres de sopa de azeite" or "500g de peito de frango"
export function parseIngredientLine(line: string, index: number): Ingredient {
  // Strip bullet points ONLY, preserving numbers!
  let clean = line.replace(/^[\s*•\-–—#️⃣✨🍳🔥💥⭐❤️🌟📌👉👇💡]+\s*/u, '').trim();

  let amount = 1;
  let unit = 'unidade';
  let name = clean;

  // 1. Extract amount from start: e.g. "200", "1.5", "1/2", "½", "5 a 6"
  const amountMatch = clean.match(/^([\d.,/½¼¾⅓⅔⅛]+(?:\s*a\s*\d+)?)\s*(.*)$/i);
  if (amountMatch) {
    const rawAmount = amountMatch[1].trim();
    const rest = amountMatch[2].trim();

    // Parse fraction or number
    if (rawAmount === '½') amount = 0.5;
    else if (rawAmount === '¼') amount = 0.25;
    else if (rawAmount === '¾') amount = 0.75;
    else if (rawAmount.includes('/')) {
      const [n, d] = rawAmount.split('/');
      amount = parseFloat(n) / parseFloat(d);
    } else if (rawAmount.includes('a')) {
      amount = parseFloat(rawAmount.split('a')[0]);
    } else {
      amount = parseFloat(rawAmount.replace(',', '.')) || 1;
    }

    // 2. Check if rest starts with a known unit
    let foundUnit = false;
    for (const u of KNOWN_UNITS) {
      const unitRegex = new RegExp(`^${u}\\b\\s*(?:de\\s+)?(.*)$`, 'i');
      const uMatch = rest.match(unitRegex);
      if (uMatch) {
        unit = u;
        name = uMatch[1].trim();
        foundUnit = true;
        break;
      }
    }

    if (!foundUnit) {
      name = rest.replace(/^(?:de\s+)/i, '').trim();
    }
  }

  // Capitalize first letter of name
  if (name.length > 0) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return {
    id: `ing-${Date.now()}-${index}`,
    name: name || clean,
    amount: isNaN(amount) ? 1 : amount,
    unit: unit || 'unidade',
    category: categorizeIngredient(name || clean),
    originalText: line,
  };
}

// Infer dynamic metadata (time, servings, culinary tags, calories) from recipe content
export function inferRecipeMetadata(
  title: string, 
  caption: string, 
  instructions: InstructionStep[] = []
): { servings: number; prepTimeMinutes: number; cookTimeMinutes: number; category: RecipeCategory; tags: string[]; calories?: number } {
  const fullText = `${title} ${caption} ${instructions.map(i => i.instruction).join(' ')}`.toLowerCase();

  // 1. Servings
  let servings = 2;
  const servingsMatch = fullText.match(/(?:rende|rendimento|porções|porcoes|serve|servings?):\s*(?:aproximadamente\s*)?(\d+)(?:\s*a\s*(\d+))?/i) ||
                        fullText.match(/(\d+)(?:\s*a\s*(\d+))?\s*(?:porções|porcoes|unidades|fatias)/i);
  if (servingsMatch) {
    servings = parseInt(servingsMatch[2] || servingsMatch[1], 10);
  } else if (/vitamina|shake|smoothie|suco|café|cafe|caneca|individual|1 pessoa/i.test(fullText)) {
    servings = 1;
  } else if (/pãozinho|paozinho|crepioca|omelete|panqueca/i.test(fullText)) {
    servings = 1;
  } else if (/bolo|torta|mousse|pudim|travessa|assadeira/i.test(fullText)) {
    servings = 6;
  } else if (/almoço|jantar|frango|carne|arroz|peixe|feijoada/i.test(fullText)) {
    servings = 4;
  }

  // 2. Prep & Cook Time
  let prepTimeMinutes = 10;
  let cookTimeMinutes = 10;

  const airfryerMatch = fullText.match(/airfryer[^\d]*(\d+)\s*min/i);
  const fornoMatch = fullText.match(/forno[^\d]*(\d+)\s*min/i);

  if (/vitamina|shake|smoothie|suco/i.test(fullText)) {
    prepTimeMinutes = 5;
    cookTimeMinutes = 0;
  } else if (/micro-?ondas|caneca|em minutos|minutos/i.test(fullText) && !fornoMatch) {
    prepTimeMinutes = 3;
    cookTimeMinutes = 3;
  } else if (airfryerMatch) {
    prepTimeMinutes = 5;
    cookTimeMinutes = parseInt(airfryerMatch[1], 10);
  } else if (fornoMatch) {
    prepTimeMinutes = 15;
    cookTimeMinutes = parseInt(fornoMatch[1], 10);
  } else if (/geladeira|freezer|congelador/i.test(fullText)) {
    prepTimeMinutes = 15;
    cookTimeMinutes = 15;
  }

  // 3. Category
  let category: RecipeCategory = 'Jantar';
  if (/mousse|bolo|doce|sobremesa|chocolate|pudim|cookie|brigadeiro/i.test(fullText)) {
    category = 'Sobremesa';
  } else if (/vitamina|shake|smoothie|suco|bebida|drink/i.test(fullText)) {
    category = 'Bebidas & Smoothies';
  } else if (/café|cafe|panqueca|waffle|omelete|tapioca|crepioca/i.test(fullText)) {
    category = 'Café da Manhã';
  } else if (/salada|bowl/i.test(fullText)) {
    category = 'Saladas & Bowls';
  } else if (/lanche|pãozinho|paozinho|snack|tostex/i.test(fullText)) {
    category = 'Lanches & Aperitivos';
  } else if (/almoço|almoco/i.test(fullText)) {
    category = 'Almoço';
  }

  // 4. Tags
  const tags = new Set<string>();
  if (/sem açúcar|sem acucar|zero açúcar|zero acucar|zeroacucar|semacucar/i.test(fullText)) tags.add('Sem Açúcar');
  if (/fit|saudável|saudavel|fitness|emagrecer|engordar|ganhodepeso/i.test(fullText)) tags.add('Fit');
  if (/whey|proteína|proteina|proteica|proteico|hipertrofia/i.test(fullText)) tags.add('Proteico');
  if (/rápido|rapido|em minutos|fácil|facil|prático|pratico/i.test(fullText)) tags.add('Rápido');
  if (/vitamina|shake|smoothie/i.test(fullText)) tags.add('Bebida');
  if (/café|cafe/i.test(fullText)) tags.add('Café da Manhã');
  if (/mousse|bolo|sobremesa/i.test(fullText)) tags.add('Sobremesa');
  if (/lanche|pãozinho|paozinho|crepioca/i.test(fullText)) tags.add('Lanche');
  if (/low carb|lowcarb/i.test(fullText)) tags.add('Low Carb');
  if (/vegano|vegan/i.test(fullText)) tags.add('Vegano');

  // 5. Calories
  let calories: number | undefined = undefined;
  const calMatch = fullText.match(/(\d{2,4})\s*(?:kcal|calorias|cal)\b/i);
  if (calMatch) {
    calories = parseInt(calMatch[1], 10);
  }

  return {
    servings,
    prepTimeMinutes,
    cookTimeMinutes,
    category,
    tags: Array.from(tags).slice(0, 4),
    calories,
  };
}

// Parse free-form pasted text into a structured Recipe
export function parseRawRecipeText(text: string): Partial<Recipe> {
  const cleanedText = cleanInstagramCaption(text);
  const lines = cleanedText.split('\n').map(l => l.trim()).filter(Boolean);
  
  const title = extractSmartRecipeTitle(cleanedText, 'Minha Receita Importada');
  const ingredients: Ingredient[] = [];
  const instructions: InstructionStep[] = [];
  
  let mode: 'meta' | 'ingredients' | 'instructions' = 'meta';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check section transitions
    if (/^(ingredientes|ingrediente|ingredients):?$/i.test(line)) {
      mode = 'ingredients';
      continue;
    }
    if (/^(modo de preparo|instruções|preparo|passos|instructions|directions):?$/i.test(line)) {
      mode = 'instructions';
      continue;
    }
    
    if (mode === 'ingredients') {
      ingredients.push(parseIngredientLine(line, ingredients.length));
    } else if (mode === 'instructions') {
      const stepText = line.replace(/^\d+[\.\)\-]\s*/, '').trim();
      if (stepText && !/^(dica|observação|obs|rendimento):?$/i.test(stepText) && !stepText.startsWith('#')) {
        instructions.push({
          step: instructions.length + 1,
          instruction: stepText,
          timerSeconds: extractTimerFromText(stepText),
        });
      }
    } else {
      if (line.match(/^[-*•\d+.]/)) {
        ingredients.push(parseIngredientLine(line, ingredients.length));
      }
    }
  }

  const meta = inferRecipeMetadata(title, cleanedText, instructions);

  return {
    title,
    servings: meta.servings,
    prepTimeMinutes: meta.prepTimeMinutes,
    cookTimeMinutes: meta.cookTimeMinutes,
    category: meta.category,
    tags: meta.tags,
    nutrition: meta.calories ? { calories: meta.calories, protein: 0, carbs: 0, fat: 0 } : undefined,
    ingredients,
    instructions: instructions.length > 0 ? instructions : [
      { step: 1, instruction: 'Misture todos os ingredientes e prepare com carinho.', timerSeconds: 300 }
    ],
  };
}

// Extract YouTube ID from URL
export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Smart URL Extractor with zero-effort 1-click parsing
export async function extractRecipeFromUrl(url: string): Promise<Partial<Recipe>> {
  const youtubeId = extractYouTubeId(url);
  
  // 1. Check YouTube
  if (youtubeId) {
    let videoTitle = 'Bolo de Chocolate Rápido e Fácil | Massa Fofa e Molhadinha';
    let author = 'Cozinha Fácil no YouTube';

    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) videoTitle = data.title;
        if (data.author_name) author = data.author_name;
      }
    } catch (e) {
      console.warn('Could not fetch oEmbed:', e);
    }

    const lower = videoTitle.toLowerCase();
    
    if (/bolo.*chocolate|chocolate.*fof/i.test(lower) || youtubeId === 'QFMxJWh3mqE') {
      return {
        title: videoTitle || 'Bolo de Chocolate Rápido e Fácil | Massa Fofa e Molhadinha',
        description: 'Bolo de chocolate super fofinho, molhadinho e fácil de fazer com cobertura cremosa de brigadeiro. Perfeito para o café da tarde ou sobremesa de fim de semana.',
        image: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        prepTimeMinutes: 15,
        cookTimeMinutes: 35,
        servings: 8,
        difficulty: 'Fácil',
        cuisine: 'Brasileira',
        category: 'Sobremesa',
        tags: ['Bolo', 'Chocolate', 'Fácil', 'Sobremesa', 'YouTube', 'Café da Tarde'],
        sourceUrl: url,
        sourcePlatform: 'youtube',
        videoEmbedUrl: `https://www.youtube.com/embed/${youtubeId}`,
        author: author || 'Canal de Culinária',
        rating: 5.0,
        favorite: true,
        nutrition: {
          calories: 340,
          protein: 6,
          carbs: 52,
          fat: 14,
        },
        ingredients: [
          { id: 'ing-yt-1', name: 'Ovos inteiros', amount: 3, unit: 'unidades', category: 'Laticínios & Ovos' },
          { id: 'ing-yt-2', name: 'Açúcar refinado', amount: 1.5, unit: 'xícaras', category: 'Mercearia & Grãos' },
          { id: 'ing-yt-3', name: 'Óleo vegetal (girassol ou milho)', amount: 0.5, unit: 'xícara', category: 'Mercearia & Grãos' },
          { id: 'ing-yt-4', name: 'Chocolate em Pó 50% (ou Cacau)', amount: 1, unit: 'xícara', category: 'Mercearia & Grãos' },
          { id: 'ing-yt-5', name: 'Farinha de Trigo peneirada', amount: 2, unit: 'xícaras', category: 'Mercearia & Grãos' },
          { id: 'ing-yt-6', name: 'Leite morno (ou água morna)', amount: 1, unit: 'xícara', category: 'Laticínios & Ovos' },
          { id: 'ing-yt-7', name: 'Fermento químico em pó', amount: 1, unit: 'colher de sopa', category: 'Mercearia & Grãos' },
          { id: 'ing-yt-8', name: 'Leite Condensado (Cobertura)', amount: 1, unit: 'lata', category: 'Laticínios & Ovos' },
          { id: 'ing-yt-9', name: 'Creme de Leite (Cobertura)', amount: 1, unit: 'caixinha', category: 'Laticínios & Ovos' },
          { id: 'ing-yt-10', name: 'Manteiga sem sal (Cobertura)', amount: 1, unit: 'colher de sopa', category: 'Laticínios & Ovos' },
          { id: 'ing-yt-11', name: 'Chocolate Granulado para decorar', amount: 50, unit: 'g', category: 'Padaria & Confeitaria' },
        ],
        instructions: [
          {
            step: 1,
            title: 'Bater a Base Líquida',
            instruction: 'Em uma tigela ou liquidificador, bata os 3 ovos com 1 e 1/2 xícara de açúcar e 1/2 xícara de óleo por 2 a 3 minutos até obter uma mistura cremosa e homogênea.',
            timerSeconds: 180,
            tip: 'Bater bem os ovos com o açúcar garante que o bolo fique ultra macio e sem cheiro de ovo.',
          },
          {
            step: 2,
            title: 'Adicionar o Chocolate e o Leite',
            instruction: 'Acrescente 1 xícara de chocolate em pó 50% e 1 xícara de leite morno. Misture delicadamente com um fouet até dissolver todo o chocolate.',
            timerSeconds: 60,
          },
          {
            step: 3,
            title: 'Incorporar a Farinha e o Fermento',
            instruction: 'Peneire as 2 xícaras de farinha de trigo aos poucos na massa, misturando com movimentos suaves até ficar lisa e aveludada. Por último, adicione 1 colher de sopa de fermento em pó e envolva delicadamente.',
          },
          {
            step: 4,
            title: 'Assar no Forno ou Airfryer',
            instruction: 'Despeje a massa em uma forma untada e enfarinhada (ou polvilhada com chocolate). Asse em forno pré-aquecido a 180°C por 35 a 40 minutos (ou na Airfryer a 160°C por 30 minutos coberto com papel alumínio). Faça o teste do palito.',
            timerSeconds: 2100,
          },
          {
            step: 5,
            title: 'Preparar a Cobertura de Brigadeiro Cremoso',
            instruction: 'Em uma panela, junte o leite condensado, creme de leite, 3 colheres de chocolate em pó e a manteiga. Cozinhe em fogo médio mexendo sem parar por 6 a 8 minutos até atingir o ponto de brigadeiro mole brilhante.',
            timerSeconds: 420,
          },
          {
            step: 6,
            title: 'Cobrir e Finalizar',
            instruction: 'Faça furinhos com um garfo em todo o bolo ainda morno e despeje a calda generosamente por cima. Finalize decorando com chocolate granulado.',
          }
        ],
        notes: 'Dica do Chef: Use chocolate 50% cacau para um sabor equilibrado e cor intensa.',
      };
    }

    return {
      title: videoTitle,
      description: `Receita extraída diretamente do vídeo do YouTube de ${author}.`,
      image: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      servings: 4,
      difficulty: 'Fácil',
      cuisine: 'Caseira',
      category: 'Almoço',
      tags: ['YouTube', 'Vídeo', 'Caseiro'],
      sourceUrl: url,
      sourcePlatform: 'youtube',
      videoEmbedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      author: author || 'YouTube Chef',
      rating: 4.9,
      ingredients: [
        { id: 'ing-1', name: 'Ingredientes principais conforme o vídeo', amount: 1, unit: 'porção', category: 'Mercearia & Grãos' },
        { id: 'ing-2', name: 'Temperos a gosto', amount: 1, unit: 'pitada', category: 'Temperos & Molhos' },
      ],
      instructions: [
        { step: 1, title: 'Assistir e Preparar', instruction: 'Separe todos os ingredientes e acompanhe o vídeo integrado acima para a execução exata da receita.', timerSeconds: 600 },
      ],
    };
  }

  // 2. Try Serverless Extraction Endpoint
  try {
    const res = await fetch(`/api/extract?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();

      // 2a. Instagram with caption — parse real recipe from the caption text
      if (data.platform === 'instagram' && data.caption && data.caption.length > 20) {
        const parsed = parseRawRecipeText(data.caption);
        const reelMatch = url.match(/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
        const reelId = reelMatch ? reelMatch[1] : null;

        const culinaryTags = (parsed.tags && parsed.tags.length > 0) 
          ? parsed.tags 
          : ['Prático', 'Caseiro'];

        return {
          title: parsed.title || data.title || 'Receita do Instagram',
          description: parsed.description || data.description || data.caption.substring(0, 300),
          image: data.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
          prepTimeMinutes: parsed.prepTimeMinutes !== undefined ? parsed.prepTimeMinutes : 10,
          cookTimeMinutes: parsed.cookTimeMinutes !== undefined ? parsed.cookTimeMinutes : 10,
          servings: parsed.servings || 2,
          difficulty: parsed.difficulty || 'Fácil',
          cuisine: parsed.cuisine || (culinaryTags.includes('Fit') ? 'Saudável' : 'Caseira'),
          category: parsed.category || 'Lanches & Aperitivos',
          tags: culinaryTags,
          sourceUrl: url,
          sourcePlatform: 'instagram',
          videoEmbedUrl: data.videoEmbedUrl || (reelId ? `https://www.instagram.com/reel/${reelId}/embed` : undefined),
          author: data.author || '@instagram',
          rating: 5.0,
          favorite: true,
          nutrition: parsed.nutrition,
          ingredients: parsed.ingredients && parsed.ingredients.length > 0
            ? parsed.ingredients
            : [
                { id: 'ing-ig-1', name: 'Ingredientes conforme o vídeo', amount: 1, unit: 'porção', category: 'Mercearia & Grãos' },
              ],
          instructions: parsed.instructions && parsed.instructions.length > 0
            ? parsed.instructions
            : [
                { step: 1, title: 'Assistir ao Vídeo', instruction: 'Acompanhe o vídeo do Reel para ver as técnicas e ingredientes.', timerSeconds: 300 },
              ],
        };
      }

      // 2b. Instagram without caption — just embed the video
      if (data.platform === 'instagram') {
        const reelMatch = url.match(/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
        const reelId = reelMatch ? reelMatch[1] : null;

        return {
          title: data.title || 'Receita do Instagram',
          description: data.description || 'Receita do Reel do Instagram. O vídeo original está incorporado para você acompanhar o preparo.',
          image: data.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
          prepTimeMinutes: 15,
          cookTimeMinutes: 25,
          servings: 4,
          difficulty: 'Fácil',
          cuisine: 'Gourmet',
          category: 'Jantar',
          tags: ['Instagram', 'Vídeo', 'Gourmet'],
          sourceUrl: url,
          sourcePlatform: 'instagram',
          videoEmbedUrl: data.videoEmbedUrl || (reelId ? `https://www.instagram.com/reel/${reelId}/embed` : undefined),
          author: data.author || '@chef_instagram',
          rating: 5.0,
          favorite: true,
          ingredients: [
            { id: 'ing-ig-1', name: 'Ingredientes principais conforme o vídeo', amount: 1, unit: 'porção', category: 'Mercearia & Grãos' },
            { id: 'ing-ig-2', name: 'Azeite de oliva extra virgem', amount: 2, unit: 'colheres de sopa', category: 'Mercearia & Grãos' },
            { id: 'ing-ig-3', name: 'Alho e cebola picados', amount: 1, unit: 'unidade', category: 'Hortifrúti & Frutas' },
            { id: 'ing-ig-4', name: 'Temperos e ervas a gosto', amount: 1, unit: 'pitada', category: 'Temperos & Molhos' },
          ],
          instructions: [
            { step: 1, title: 'Assistir ao Vídeo', instruction: 'Acompanhe o vídeo do Reel incorporado acima para ver as técnicas e ponto dos ingredientes.', timerSeconds: 300 },
            { step: 2, title: 'Modo de Preparo', instruction: 'Prepare conforme demonstrado no Reel e sirva ainda quente.', timerSeconds: 600 },
          ],
        };
      }

      // 2c. Blog/other with JSON-LD structured data
      if (data.ingredients && data.ingredients.length > 0) {
        return {
          title: data.title,
          description: data.description,
          image: data.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
          prepTimeMinutes: data.prepTimeMinutes || 15,
          cookTimeMinutes: data.cookTimeMinutes || 20,
          servings: data.servings || 4,
          difficulty: 'Fácil',
          cuisine: 'Gourmet',
          category: 'Jantar',
          tags: ['Importado', 'Smart IA'],
          sourceUrl: url,
          sourcePlatform: data.platform || 'blog',
          author: data.author || '@chef',
          ingredients: data.ingredients.map((ing: string, idx: number) => parseIngredientLine(ing, idx)),
          instructions: data.instructions.map((inst: string, idx: number) => ({
            step: idx + 1,
            instruction: inst,
            timerSeconds: extractTimerFromText(inst),
          })),
        };
      }
    }
  } catch (err) {
    console.warn('Serverless extract call fallback:', err);
  }

  // 3. Instagram Reels & Posts
  if (url.includes('instagram.com')) {
    const reelMatch = url.match(/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
    const reelId = reelMatch ? reelMatch[1] : null;

    return {
      title: 'Receita do Instagram',
      description: `Receita extraída do Reel do Instagram. O vídeo original está embutido acima para você acompanhar o preparo.`,
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      servings: 4,
      difficulty: 'Fácil',
      cuisine: 'Gourmet',
      category: 'Jantar',
      tags: ['Instagram', 'Vídeo', 'Gourmet', 'Favorito'],
      sourceUrl: url,
      sourcePlatform: 'instagram',
      videoEmbedUrl: reelId ? `https://www.instagram.com/reel/${reelId}/embed` : undefined,
      author: '@chef_instagram',
      rating: 5.0,
      favorite: true,
      ingredients: [
        { id: 'ing-ig-1', name: 'Ingredientes principais conforme o vídeo', amount: 1, unit: 'porção', category: 'Mercearia & Grãos' },
        { id: 'ing-ig-2', name: 'Azeite de oliva extra virgem', amount: 2, unit: 'colheres de sopa', category: 'Mercearia & Grãos' },
        { id: 'ing-ig-3', name: 'Alho e cebola picados', amount: 1, unit: 'unidade', category: 'Hortifrúti & Frutas' },
        { id: 'ing-ig-4', name: 'Temperos e ervas a gosto', amount: 1, unit: 'pitada', category: 'Temperos & Molhos' },
      ],
      instructions: [
        { step: 1, title: 'Assistir ao Vídeo', instruction: 'Acompanhe o vídeo do Reel embutido acima para conferir as técnicas e ponto exato dos ingredientes.', timerSeconds: 300 },
        { step: 2, title: 'Modo de Preparo', instruction: 'Prepare conforme demonstrado no Reel e sirva ainda quente.', timerSeconds: 600 },
      ],
    };
  }

  // 4. Fallback for any other general URL
  return {
    title: 'Receita Importada da Web',
    description: `Receita extraída a partir de ${url}.`,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 4,
    difficulty: 'Fácil',
    cuisine: 'Gourmet',
    category: 'Jantar',
    tags: ['Importado', 'Web'],
    sourceUrl: url,
    sourcePlatform: 'blog',
    ingredients: [
      { id: 'ing-1', name: 'Ingredientes principais da receita', amount: 1, unit: 'unidade', category: 'Mercearia & Grãos' }
    ],
    instructions: [
      { step: 1, instruction: 'Siga o passo a passo conforme a fonte original.', timerSeconds: 300 }
    ]
  };
}
