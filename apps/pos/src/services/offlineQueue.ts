/**
 * Offline-first transaction queue manager
 * Uses localStorage persistence for web/tablet reliability
 * Integrates with Go /api/v1/transactions/sync
 */

import { api } from './api';

const STORAGE_KEY = 'kopiko_offline_tx_queue_v1';

export interface QueuedTransaction {
  idempotency_key: string;
  booth_id: string;
  shift_id: string;
  cashier_id: string;
  payment_method: 'cash' | 'qris';
  status: 'completed' | 'pending';
  total_amount: number;
  offline_created_at: string;
  items: Array<{
    menu_id: string;
    quantity: number;
    price_per_unit: number;
    modifiers?: string;
  }>;
}

export const offlineQueue = {
  // Get all pending transactions from local storage
  getQueue(): QueuedTransaction[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[OfflineQueue] Gagal membaca storage:', e);
      return [];
    }
  },

  // Enqueue a transaction when offline
  enqueue(tx: QueuedTransaction): void {
    try {
      const current = this.getQueue();
      // Ensure no duplicate idempotency_key
      const exists = current.some((t) => t.idempotency_key === tx.idempotency_key);
      if (!exists) {
        current.push(tx);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        }
      }
      console.log(`[OfflineQueue] Transaksi antrean tersimpan lokal (${tx.idempotency_key}). Total antrean: ${current.length}`);
    } catch (e) {
      console.error('[OfflineQueue] Gagal menyimpan antrean:', e);
    }
  },

  // Clear specific keys after successful server sync
  removeKeys(keys: string[]): void {
    try {
      const current = this.getQueue();
      const filtered = current.filter((t) => !keys.includes(t.idempotency_key));
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {
      console.error('[OfflineQueue] Gagal membersihkan queue:', e);
    }
  },

  // Sync all pending transactions to Go Backend
  async syncToServer(boothId: string = 'booth-01'): Promise<{
    syncedCount: number;
    skippedCount: number;
    remaining: number;
  }> {
    const queue = this.getQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, skippedCount: 0, remaining: 0 };
    }

    try {
      const res = await api.syncTransactions(queue, boothId);
      const syncedKeys: string[] = res.synced_keys || [];
      this.removeKeys(syncedKeys);

      const remainingQueue = this.getQueue();
      console.log(`[OfflineQueue] Sinkronisasi sukses: ${syncedKeys.length} terkirim, ${res.skipped || 0} dilewati, sisa antrean: ${remainingQueue.length}`);

      return {
        syncedCount: syncedKeys.length,
        skippedCount: res.skipped || 0,
        remaining: remainingQueue.length,
      };
    } catch (err) {
      console.warn('[OfflineQueue] Sinkronisasi gagal (server offline / kendala jaringan):', err);
      throw err;
    }
  },

  getPendingCount(): number {
    return this.getQueue().length;
  },
};

