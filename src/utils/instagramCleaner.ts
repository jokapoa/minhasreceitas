export function cleanInstagramCaption(raw: string): string {
  let text = raw || '';

  // 1. Decode HTML entities
  text = text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");

  // 2. Strip Instagram social header (e.g. "8,510 likes, 76 comments - vidasemacucar.dicas on June 29, 2026: \"...")
  text = text.replace(/^[\d,.\s\w\W]+?(?:likes?|curtidas?|comments?|comentários?)[^:\n]*:\s*"?/i, '');
  
  // 3. Strip any residual "X likes" line at start
  text = text.replace(/^\d[\d,.]+\s*(?:likes?|curtidas?|comments?|comentários?)[^\n]*\n?/i, '');

  // 4. Clean leading/trailing quotes
  text = text.replace(/^"/, '').replace(/"\s*$/, '').trim();

  return text;
}

export function extractSmartRecipeTitle(caption: string, defaultTitle: string = 'Receita do Instagram'): string {
  const lines = caption.split('\n').map(l => l.trim()).filter(Boolean);
  
  const candidates: string[] = [];

  for (const line of lines) {
    // Skip if line still has social info
    if (/(?:likes?|curtidas?|comments?|comentários?)\s*-/i.test(line)) continue;
    
    // Clean leading emojis, bullets, tags
    const cleaned = line.replace(/^[\p{Emoji}\u200d\uFE0F\s*•\-#️⃣✨🍳🔥💥⭐❤️🌟📌👉👇💡🥗🍰🍕🥪🥣🍪🍩🥞🥩🍖🍗🥑🥦🍅🥒🧀🥚]+\s*/u, '').trim();
    
    // Skip empty or section headers
    if (!cleaned || /^(ingredientes|ingrediente|modo de preparo|instruções|preparo|passos|rendimento|tempo):?$/i.test(cleaned)) {
      continue;
    }

    // Skip ingredient lines (e.g. "1 ovo", "2 colheres de...")
    if (/^\d+[\s\/\.,\d]*(?:g|kg|ml|l|xícara|xicara|colher|colheres|scoop|pitada|unidade|unidades|fatia|fatias|dente|dentes|folha|folhas|ovo|ovos)\b/i.test(cleaned)) {
      continue;
    }

    // Check for colon separation e.g. "Café da Manhã: Crepioca Cremosa"
    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      const candidate = parts[parts.length - 1].trim();
      if (candidate.length >= 3 && candidate.length <= 60 && !candidate.toLowerCase().startsWith('http')) {
        candidates.push(candidate.replace(/["!?:.]/g, '').trim());
      }
    }

    // If it's an ALL-CAPS line (e.g. "BOLO DE CANECA DE BANANA"), this is a prime title candidate!
    if (cleaned.length >= 4 && cleaned.length <= 60 && cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned)) {
      candidates.unshift(cleaned.replace(/["!?:.]/g, '').trim());
    }

    // Check if it's a specific recipe name
    if (!/^(salva|salve|curte|compartilha|marca|olha|veja|vem aprender|confira)\b/i.test(cleaned)) {
      if (cleaned.length >= 3 && cleaned.length <= 70) {
        candidates.push(cleaned.replace(/["!?:.]/g, '').trim());
      }
    } else {
      // If line is "Salva essa receita de Pão de Queijo", extract "Pão de Queijo"
      const match = cleaned.match(/(?:receita|opção|ideia|dica)\s+(?:de\s+|para\s+|do\s+|da\s+)(.+)/i);
      if (match && match[1] && !match[1].toLowerCase().startsWith('fazer') && !match[1].toLowerCase().startsWith('quando')) {
        candidates.push(match[1].replace(/["!?:.]/g, '').trim());
      }
    }
  }

  // Return the best candidate found
  if (candidates.length > 0) {
    return candidates[0];
  }

  return defaultTitle;
}
