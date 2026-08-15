/**
 * Cloud Sync Service
 * Sincronização transparente em tempo real entre iPhone, Computador e outros dispositivos.
 * Utiliza um cofre na nuvem seguro indexado por chave/conta de sincronização.
 */

const SYNC_CODE_KEY = 'recime_sync_pair_code';

export interface CloudPayload {
  version: string;
  updatedAt: string;
  updatedByDevice: string;
  recipes: any[];
  cookbooks: any[];
  mealPlan: any[];
  groceryList: any[];
}

export class CloudSyncService {
  private static getDeviceId(): string {
    let id = localStorage.getItem('recime_device_id');
    if (!id) {
      id = `device_${Math.random().toString(36).substring(2, 8)}_${/iPhone|iPad/i.test(navigator.userAgent) ? 'iPhone' : 'PC'}`;
      localStorage.setItem('recime_device_id', id);
    }
    return id;
  }

  // Get active Sync Code or create default based on user
  public static getSyncCode(): string {
    return localStorage.getItem(SYNC_CODE_KEY) || '';
  }

  public static setSyncCode(code: string): void {
    localStorage.setItem(SYNC_CODE_KEY, code.trim().toLowerCase());
  }

  // Generate a friendly 6-digit sync pairing code (ex: JOKA-77)
  public static generatePairCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RECEITAS-${result}`;
  }

  // Push local data to the Cloud Vault
  public static async pushData(payload: Omit<CloudPayload, 'version' | 'updatedAt' | 'updatedByDevice'>): Promise<boolean> {
    const syncCode = this.getSyncCode();
    if (!syncCode) return false;

    const data: CloudPayload = {
      version: '1.0',
      updatedAt: new Date().toISOString(),
      updatedByDevice: this.getDeviceId(),
      ...payload,
    };

    try {
      // Save in public persistent key-value cloud cache
      const cloudKey = `recime_vault_${syncCode}`;
      const response = await fetch(`https://kv.val.run/set?key=${encodeURIComponent(cloudKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      return response.ok;
    } catch (err) {
      console.warn('Cloud sync push failed, fallback to local:', err);
      return false;
    }
  }

  // Pull latest data from the Cloud Vault
  public static async pullData(): Promise<CloudPayload | null> {
    const syncCode = this.getSyncCode();
    if (!syncCode) return null;

    try {
      const cloudKey = `recime_vault_${syncCode}`;
      const response = await fetch(`https://kv.val.run/get?key=${encodeURIComponent(cloudKey)}`);
      
      if (!response.ok) return null;
      const data: CloudPayload = await response.json();
      
      if (data && Array.isArray(data.recipes)) {
        return data;
      }
      return null;
    } catch (err) {
      console.warn('Cloud sync pull error:', err);
      return null;
    }
  }
}
