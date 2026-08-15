/**
 * Cloud Sync Service
 * Sincronização transparente e instantânea entre iPhone e Computador via Cloud Vault.
 */

const CLOUD_API_BASE = 'https://api.restful-api.dev/objects';
const SYNC_CODE_KEY = 'recime_sync_pair_code';
const VAULT_ID_KEY = 'recime_vault_id';

// Default pre-provisioned cloud vault for instant zero-setup sync
const DEFAULT_VAULTS: Record<string, string> = {
  'joka-receitas': 'ff8081819ff5b11001a006f97e60276d',
  'minhasreceitas': 'ff8081819ff5b11001a006f97e60276d',
};

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

  public static setSyncCode(code: string, vaultId?: string): void {
    const clean = code.trim().toLowerCase();
    localStorage.setItem(SYNC_CODE_KEY, clean);
    if (vaultId) {
      localStorage.setItem(VAULT_ID_KEY + '_' + clean, vaultId);
    }
  }

  public static generatePairCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RECEITAS-${result}`;
  }

  public static getVaultId(): string | null {
    const syncCode = this.getSyncCode();
    // Check URL query param first
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlVault = params.get('vault');
      if (urlVault) {
        localStorage.setItem(VAULT_ID_KEY + '_' + syncCode, urlVault);
        return urlVault;
      }
    }
    
    // Check storage or pre-mapped defaults
    return localStorage.getItem(VAULT_ID_KEY + '_' + syncCode) || DEFAULT_VAULTS[syncCode] || null;
  }

  public static setVaultId(vaultId: string): void {
    const syncCode = this.getSyncCode();
    localStorage.setItem(VAULT_ID_KEY + '_' + syncCode, vaultId);
  }

  // Push local data to the Cloud Vault
  public static async pushData(payload: Omit<CloudPayload, 'version' | 'updatedAt' | 'updatedByDevice' | 'syncCode'>): Promise<boolean> {
    const syncCode = this.getSyncCode();
    let vaultId = this.getVaultId();

    const data: CloudPayload = {
      version: '1.0',
      syncCode,
      updatedAt: new Date().toISOString(),
      updatedByDevice: this.getDeviceId(),
      ...payload,
    };

    try {
      if (vaultId) {
        // Update existing cloud vault
        const res = await fetch(`${CLOUD_API_BASE}/${vaultId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `recime_vault_${syncCode}`,
            data,
          }),
        });
        return res.ok;
      } else {
        // Create a new cloud vault
        const res = await fetch(CLOUD_API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `recime_vault_${syncCode}`,
            data,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          if (created.id) {
            this.setVaultId(created.id);
            return true;
          }
        }
      }
      return false;
    } catch (err) {
      console.warn('Cloud sync push error:', err);
      return false;
    }
  }

  // Pull latest data from the Cloud Vault
  public static async pullData(): Promise<CloudPayload | null> {
    const vaultId = this.getVaultId();
    if (!vaultId) return null;

    try {
      const res = await fetch(`${CLOUD_API_BASE}/${vaultId}`);
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

  // Generate pair URL with sync code and vault ID included for instant iPhone QR scan
  public static getPairUrl(): string {
    const syncCode = this.getSyncCode();
    const vaultId = this.getVaultId() || DEFAULT_VAULTS[syncCode] || '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://minhasreceitas-puce.vercel.app';
    return `${origin}/?sync=${encodeURIComponent(syncCode)}&vault=${encodeURIComponent(vaultId)}`;
  }
}
