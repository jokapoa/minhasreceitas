/**
 * Cloud Sync Service
 * Sincronização transparente e ilimitada entre iPhone e Computador via Vercel Serverless Sync API.
 */

const SYNC_CODE_KEY = 'recime_sync_pair_code';

export interface CloudPayload {
  version: string;
  syncCode: string;
  updatedAt: string;
  updatedByDevice: string;
  recipes: any[];
  cookbooks: any[];
  mealPlan: any[];
  groceryList: any[];
}

export class CloudSyncService {
  private static getApiBase(): string {
    // If running in production on Vercel, use relative path, otherwise target the live Vercel endpoint
    if (typeof window !== 'undefined') {
      if (window.location.hostname.includes('vercel.app')) {
        return '/api/sync';
      }
    }
    return 'https://minhasreceitas-puce.vercel.app/api/sync';
  }

  private static getDeviceId(): string {
    let id = localStorage.getItem('recime_device_id');
    if (!id) {
      id = `device_${Math.random().toString(36).substring(2, 7)}_${/iPhone|iPad/i.test(navigator.userAgent) ? 'iPhone' : 'PC'}`;
      localStorage.setItem('recime_device_id', id);
    }
    return id;
  }

  public static getSyncCode(): string {
    return localStorage.getItem(SYNC_CODE_KEY) || 'joka-receitas';
  }

  public static setSyncCode(code: string): void {
    const clean = code.trim().toLowerCase();
    localStorage.setItem(SYNC_CODE_KEY, clean);
  }

  public static generatePairCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RECEITAS-${result}`;
  }

  // Push local data to the Cloud Vault
  public static async pushData(payload: Omit<CloudPayload, 'version' | 'updatedAt' | 'updatedByDevice' | 'syncCode'>): Promise<boolean> {
    const syncCode = this.getSyncCode();
    const apiBase = this.getApiBase();

    const data: CloudPayload = {
      version: '1.0',
      syncCode,
      updatedAt: new Date().toISOString(),
      updatedByDevice: this.getDeviceId(),
      ...payload,
    };

    try {
      const res = await fetch(`${apiBase}?code=${encodeURIComponent(syncCode)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (err) {
      console.warn('Cloud sync push error:', err);
      return false;
    }
  }

  // Pull latest data from the Cloud Vault
  public static async pullData(): Promise<CloudPayload | null> {
    const syncCode = this.getSyncCode();
    const apiBase = this.getApiBase();

    try {
      const res = await fetch(`${apiBase}?code=${encodeURIComponent(syncCode)}`);
      if (!res.ok) return null;
      
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.recipes)) {
        return json.data as CloudPayload;
      }
      return null;
    } catch (err) {
      console.warn('Cloud sync pull error:', err);
      return null;
    }
  }

  // Generate pair URL with sync code
  public static getPairUrl(): string {
    const syncCode = this.getSyncCode();
    return `https://minhasreceitas-puce.vercel.app/?sync=${encodeURIComponent(syncCode)}`;
  }
}
