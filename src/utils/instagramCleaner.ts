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
  
  // Strategy 1: Find the line IMMEDIATELY before "INGREDIENTES:" or "MODO DE PREPARO:"
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^(?:ingredientes|ingredients|modo de preparo|instruções|preparo):?$/i.test(l)) {
      // Look upwards for the actual recipe title line
      for (let j = i - 1; j >= 0; j--) {
        const prev = lines[j].replace(/^[\s*•\-–—#️⃣✨🍳🔥💥⭐❤️🌟📌👉👇💡]+\s*/u, '').trim();
        if (prev.length >= 3 && prev.length <= 80 && !/^(dica|observação|atenção|obs|rendimento|salva|salve|olha):?$/i.test(prev)) {
          return prev.replace(/["!?:.]/g, '').trim();
        }
      }
    }
  }

  // Strategy 2: Look for an ALL-CAPS title anywhere before ingredients
  for (const line of lines) {
    const cleaned = line.replace(/^[\s*•\-–—#️⃣✨🍳🔥💥⭐❤️🌟📌👉👇💡]+\s*/u, '').trim();
    if (/^(?:ingredientes|ingredients|modo de preparo):?$/i.test(cleaned)) break;
    if (cleaned.length >= 4 && cleaned.length <= 60 && cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned)) {
      if (!/^(dica|observação|atenção|obs|rendimento|salva|salve|importante):?$/i.test(cleaned)) {
        return cleaned.replace(/["!?:.]/g, '').trim();
      }
    }
  }

  // Strategy 3: Check for colon separation e.g. "Receita: Mousse de Coco"
  for (const line of lines) {
    const cleaned = line.replace(/^[\s*•\-–—#️⃣✨🍳🔥💥⭐❤️🌟📌👉👇💡]+\s*/u, '').trim();
    if (cleaned.includes(':') && !/^(https?|http):/i.test(cleaned)) {
      const parts = cleaned.split(':');
      const candidate = parts[parts.length - 1].trim();
      if (candidate.length >= 3 && candidate.length <= 60) {
        return candidate.replace(/["!?:.]/g, '').trim();
      }
    }
  }

  // Strategy 4: Fallback to first non-conversational line
  for (const line of lines) {
    const cleaned = line.replace(/^[\s*•\-–—#️⃣✨🍳🔥💥⭐❤️🌟📌👉👇💡]+\s*/u, '').trim();
    if (!cleaned || /^(ingredientes|ingrediente|modo de preparo|instruções|preparo|passos|rendimento|tempo):?$/i.test(cleaned)) continue;
    if (!/^(salva|salve|curte|compartilha|marca|olha|veja|vem aprender|confira|fica|rende|serve|hoje)\b/i.test(cleaned) && cleaned.length >= 3 && cleaned.length <= 70) {
      return cleaned.replace(/["!?:.]/g, '').trim();
    }
  }

  return defaultTitle;
}
