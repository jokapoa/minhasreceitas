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
      const embedUrl = `https://www.instagram.com/reel/${reelId}/embed/captioned/`;

      try {
        const igRes = await fetch(embedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.7',
          },
        });

        if (igRes.ok) {
          const igHtml = await igRes.text();

          // Strategy 1: og:description meta tag (often has the caption)
          const ogDescMatch = igHtml.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                              igHtml.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);

          // Strategy 2: The caption text inside the embed HTML
          const captionMatch = igHtml.match(/<div\s+class="Caption"[^>]*>[\s\S]*?<div\s+class="CaptionUsername"[^>]*>[\s\S]*?<\/div>([\s\S]*?)<\/div>/i);

          // Strategy 3: blockquote text content
          const blockquoteMatch = igHtml.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i);

          // Strategy 4: data in embedded JSON/script
          const scriptDataMatch = igHtml.match(/"caption":\s*\{[^}]*"text":\s*"([^"]+)"/i) ||
                                  igHtml.match(/"edge_media_to_caption"[\s\S]*?"text":\s*"([^"]+)"/i);

          // Strategy 5: alternate meta description
          const metaDescMatch = igHtml.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

          // Collect the best caption
          let caption = '';
          if (scriptDataMatch && scriptDataMatch[1] && scriptDataMatch[1].length > 20) {
            caption = scriptDataMatch[1].replace(/\\n/g, '\n').replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
          } else if (ogDescMatch && ogDescMatch[1] && ogDescMatch[1].length > 30 && !ogDescMatch[1].includes('Instagram')) {
            caption = ogDescMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
          } else if (captionMatch && captionMatch[1]) {
            caption = captionMatch[1].replace(/<[^>]+>/g, '').trim();
          } else if (blockquoteMatch && blockquoteMatch[1]) {
            caption = blockquoteMatch[1].replace(/<[^>]+>/g, '').trim();
          } else if (metaDescMatch && metaDescMatch[1] && metaDescMatch[1].length > 30) {
            caption = metaDescMatch[1];
          }

          // Extract title from og:title
          const ogTitleMatch = igHtml.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                               igHtml.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);

          // Extract image from og:image
          const ogImageMatch = igHtml.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                               igHtml.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);

          // Extract author from caption @mentions or profile link
          const authorMatch = caption.match(/@([\w.]+)/) || igHtml.match(/"username":\s*"([^"]+)"/);

          const title = ogTitleMatch ? ogTitleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'") : '';
          const image = ogImageMatch ? ogImageMatch[1] : '';
          const author = authorMatch ? `@${authorMatch[1]}` : '';

          return res.status(200).json({
            platform: 'instagram',
            title: title || 'Receita do Instagram',
            description: caption ? caption.substring(0, 500) : '',
            image,
            caption,
            videoEmbedUrl: `https://www.instagram.com/reel/${reelId}/embed`,
            author,
            sourceUrl: url,
          });
        }
      } catch (igErr: any) {
        console.warn('Instagram embed fetch failed:', igErr.message);
      }

      // If embed fetch failed, return minimal data with embed URL
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
