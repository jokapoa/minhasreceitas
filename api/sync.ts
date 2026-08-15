import type { VercelRequest, VercelResponse } from '@vercel/node';

// Shared in-memory storage across warm serverless invocations
const globalStore = new Map<string, any>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const syncCode = (req.query.code as string) || (req.body && req.body.syncCode) || 'joka-receitas';

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const payload = req.body;
      if (!payload || !payload.recipes) {
        return res.status(400).json({ error: 'Invalid payload structure' });
      }

      globalStore.set(syncCode, {
        ...payload,
        updatedAt: new Date().toISOString(),
      });

      return res.status(200).json({
        ok: true,
        syncCode,
        recipeCount: payload.recipes.length,
        savedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Save failed', details: err.message });
    }
  }

  if (req.method === 'GET') {
    const data = globalStore.get(syncCode);
    return res.status(200).json({
      ok: true,
      syncCode,
      data: data || null,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
