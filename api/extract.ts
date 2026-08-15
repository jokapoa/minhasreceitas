import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to extract JSON-LD schema from HTML
function extractJsonLd(html: string) {
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'Recipe' || (Array.isArray(data['@graph']) && data['@graph'].some((item: any) => item['@type'] === 'Recipe'))) {
        return data['@type'] === 'Recipe' ? data : data['@graph'].find((item: any) => item['@type'] === 'Recipe');
      }
    } catch {
      // Continue to next script
    }
  }
  return null;
}

// Helper to extract OpenGraph tags from HTML
function extractMetaTags(html: string) {
  const getMeta = (prop: string) => {
    const match = html.match(new RegExp(`<meta[^>]*property=["'](?:og:|twitter:)?${prop}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
                  html.match(new RegExp(`<meta[^>]*name=["'](?:og:|twitter:)?${prop}["'][^>]*content=["']([^"']*)["']`, 'i'));
    return match ? match[1] : '';
  };

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

  return {
    title: getMeta('title') || (titleMatch ? titleMatch[1] : ''),
    description: getMeta('description'),
    image: getMeta('image'),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = (req.query.url as string) || (req.body && req.body.url);

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // 1. Check if YouTube
    const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    const youtubeId = ytMatch && ytMatch[2].length === 11 ? ytMatch[2] : null;

    if (youtubeId) {
      // Fetch YouTube oEmbed
      const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      let title = 'Receita do YouTube';
      let author = 'YouTube Creator';
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
      }

      return res.status(200).json({
        platform: 'youtube',
        title,
        author,
        image: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        videoEmbedUrl: `https://www.youtube.com/embed/${youtubeId}`,
        sourceUrl: url,
      });
    }

    // 2. Check if Instagram
    const igReelMatch = url.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
    if (igReelMatch) {
      const reelId = igReelMatch[1];
      // Clean URL without tracking params
      const cleanUrl = `https://www.instagram.com/reel/${reelId}/`;

      try {
        // KEY INSIGHT: Instagram serves full og:tags when User-Agent is a simple crawler (curl)
        // but returns empty JS shell when User-Agent simulates Chrome/browser.
        const igRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'curl/7.68.0',
            'Accept': '*/*',
          },
        });

        if (igRes.ok) {
          const igHtml = await igRes.text();

          // Helper to decode HTML entities (&#xf3; → ó, &quot; → ", etc.)
          const decodeHtmlEntities = (str: string) =>
            str
              .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
              .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)))
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&#39;/g, "'");

          // Extract og:description — contains the FULL caption with ingredients
          const ogDescMatch = igHtml.match(/property=["']og:description["'][^>]*content=["']([^"']+)/i);
          let rawCaption = ogDescMatch ? decodeHtmlEntities(ogDescMatch[1]) : '';

          // Clean Instagram social header (likes, comments, date, usernames with dots/hyphens)
          let caption = rawCaption.replace(/^[\d,.\s\w\W]+?(?:likes?|curtidas?|comments?|comentários?)[^:\n]*:\s*"?/i, '');
          caption = caption.replace(/^\d[\d,.]+\s*(?:likes?|curtidas?|comments?|comentários?)[^\n]*\n?/i, '');
          caption = caption.replace(/^"/, '').replace(/"\s*$/, '').trim();

          // Extract og:title — contains author + recipe name
          const ogTitleMatch = igHtml.match(/property=["']og:title["'][^>]*content=["']([^"']+)/i);
          const rawTitle = ogTitleMatch ? decodeHtmlEntities(ogTitleMatch[1]) : '';
          const titleParts = rawTitle.match(/^(.+?)\s+on\s+Instagram:\s*"?(.+)"?$/i);
          const author = titleParts ? titleParts[1] : '';

          // Smart title extraction from cleaned caption
          const lines = caption.split('\n').map(l => l.trim()).filter(Boolean);
          let recipeTitle = '';

          for (const line of lines) {
            if (/(?:likes?|curtidas?|comments?|comentários?)\s*-/i.test(line)) continue;
            const cleaned = line.replace(/^[\p{Emoji}\u200d\uFE0F\s*•\-#️⃣✨🍳🔥💥⭐❤️🌟📌👉👇💡🥗🍰🍕🥪🥣🍪🍩🥞🥩🍖🍗🥑🥦🍅🥒🧀🥚]+\s*/u, '').trim();
            if (!cleaned || /^(ingredientes|ingrediente|modo de preparo|instruções|preparo|passos|rendimento|tempo):?$/i.test(cleaned)) continue;
            if (/^\d+[\s\/\.,\d]*(?:g|kg|ml|l|xícara|xicara|colher|colheres|scoop|pitada|unidade|unidades|fatia|fatias|dente|dentes|folha|folhas|ovo|ovos)\b/i.test(cleaned)) continue;

            if (cleaned.includes(':')) {
              const parts = cleaned.split(':');
              const candidate = parts[parts.length - 1].trim();
              if (candidate.length >= 3 && candidate.length <= 60 && !candidate.toLowerCase().startsWith('http')) {
                recipeTitle = candidate.replace(/["!?:.]/g, '').trim();
                break;
              }
            }

            if (cleaned.length >= 4 && cleaned.length <= 60 && cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned)) {
              recipeTitle = cleaned.replace(/["!?:.]/g, '').trim();
              break;
            }

            if (!/^(salva|salve|curte|compartilha|marca|olha|veja|vem aprender|confira)\b/i.test(cleaned) && cleaned.length >= 3 && cleaned.length <= 70) {
              recipeTitle = cleaned.replace(/["!?:.]/g, '').trim();
              break;
            }
          }

          if (!recipeTitle) {
            recipeTitle = 'Receita do Instagram';
          }

          // Extract og:image — real thumbnail from Instagram CDN
          const ogImageMatch = igHtml.match(/property=["']og:image["'][^>]*content=["']([^"']+)/i);
          const image = ogImageMatch ? decodeHtmlEntities(ogImageMatch[1]) : '';

          return res.status(200).json({
            platform: 'instagram',
            title: recipeTitle,
            description: caption.substring(0, 500),
            image,
            caption,
            videoEmbedUrl: `https://www.instagram.com/reel/${reelId}/embed`,
            author: author || '@instagram',
            sourceUrl: url,
          });
        }
      } catch (igErr: any) {
        console.warn('Instagram fetch failed:', igErr.message);
      }

      // If fetch failed, return minimal data with embed URL
      return res.status(200).json({
        platform: 'instagram',
        title: 'Receita do Instagram',
        description: '',
        caption: '',
        image: '',
        videoEmbedUrl: `https://www.instagram.com/reel/${reelId}/embed`,
        sourceUrl: url,
      });
    }

    // 3. Fetch server-side with standard browser User-Agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();

    // Check JSON-LD Structured Recipe
    const recipeJsonLd = extractJsonLd(html);
    if (recipeJsonLd) {
      return res.status(200).json({
        platform: 'blog',
        title: recipeJsonLd.name || 'Receita Gourmet',
        description: recipeJsonLd.description || '',
        image: typeof recipeJsonLd.image === 'string' ? recipeJsonLd.image : Array.isArray(recipeJsonLd.image) ? recipeJsonLd.image[0] : '',
        prepTimeMinutes: recipeJsonLd.prepTime ? parseInt(recipeJsonLd.prepTime.replace(/\D/g, ''), 10) || 15 : 15,
        cookTimeMinutes: recipeJsonLd.cookTime ? parseInt(recipeJsonLd.cookTime.replace(/\D/g, ''), 10) || 20 : 20,
        servings: parseInt(recipeJsonLd.recipeYield || '4', 10) || 4,
        ingredients: Array.isArray(recipeJsonLd.recipeIngredient) ? recipeJsonLd.recipeIngredient : [],
        instructions: Array.isArray(recipeJsonLd.recipeInstructions) 
          ? recipeJsonLd.recipeInstructions.map((step: any) => typeof step === 'string' ? step : step.text || step.name || '') 
          : [],
        author: recipeJsonLd.author ? (typeof recipeJsonLd.author === 'string' ? recipeJsonLd.author : recipeJsonLd.author.name) : '',
        sourceUrl: url,
      });
    }

    // Fallback: OpenGraph Meta Tags
    const meta = extractMetaTags(html);

    let platform = 'blog';
    if (url.includes('instagram.com')) platform = 'instagram';
    else if (url.includes('tiktok.com')) platform = 'tiktok';
    else if (url.includes('pinterest.com')) platform = 'pinterest';

    return res.status(200).json({
      platform,
      title: meta.title || 'Receita da Web',
      description: meta.description || '',
      image: meta.image || '',
      rawText: `${meta.title}\n\n${meta.description}`,
      sourceUrl: url,
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to extract recipe from URL',
      details: error.message,
    });
  }
}
