/**
 * API Client for Go Backend Service (:8080)
 */

const API_BASE_URL = 'http://localhost:8080/api/v1';

export interface ApiProduct {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  image_url?: string;
  is_active: boolean;
}

export interface ApiTransactionPayload {
  booth_id: string;
  shift_id: string;
  payment_method: 'cash' | 'qris';
  total_amount: number;
  cash_received?: number;
  items: Array<{
    menu_id: string;
    quantity: number;
    price_per_unit: number;
    modifiers?: string;
  }>;
}

export const api = {
  // 1. Kasir Login
  async login(pin: string, boothId: string = 'booth-01') {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, booth_id: boothId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal login' }));
      throw new Error(err.error || 'PIN Salah');
    }
    return res.json();
  },

  // 2. Menu Catalog
  async getProducts(): Promise<ApiProduct[]> {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  // 3. Checkout Transaction
  async createTransaction(payload: ApiTransactionPayload, idempotencyKey: string) {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'Authorization': 'Bearer dev-kasir-usr-1',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal checkout' }));
      throw new Error(err.error || 'Checkout gagal');
    }
    return res.json();
  },

  // 3b. Check QRIS Transaction Status (Polling)
  async getTransactionStatus(idempotencyKey: string) {
    const res = await fetch(`${API_BASE_URL}/transactions/status?key=${encodeURIComponent(idempotencyKey)}`, {
      headers: {
        'Authorization': 'Bearer dev-kasir-usr-1',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch transaction status');
    return res.json();
  },

  // 3c. Simulate QRIS Customer Payment (Testing / Demo)
  async simulatePayment(idempotencyKey: string) {
    const res = await fetch(`${API_BASE_URL}/transactions/simulate-pay?key=${encodeURIComponent(idempotencyKey)}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dev-kasir-usr-1',
      },
    });
    if (!res.ok) throw new Error('Simulation failed');
    return res.json();
  },

  // 4. Batch Sync Offline Transactions
  async syncTransactions(transactions: any[], boothId: string = 'booth-01') {
    const res = await fetch(`${API_BASE_URL}/transactions/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-kasir-usr-1',
      },
      body: JSON.stringify({
        booth_id: boothId,
        transactions,
      }),
    });
    if (!res.ok) throw new Error('Sync failed');
    return res.json();
  },

  // 5. Open Shift with Audit Photos
  async openShift(payload: {
    booth_id: string;
    cashier_id: string;
    shift_number: number;
    opening_cash: number;
    audit_items: Array<{
      item_name: string;
      tracking_type: 'weighed' | 'counted';
      measured_quantity: number;
      unit: string;
      photo_url: string;
    }>;
  }) {
    const res = await fetch(`${API_BASE_URL}/shifts/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-kasir-usr-1',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Gagal membuka shift');
    return res.json();
  },

  // 6. Close Shift with Audit Photos
  async closeShift(payload: {
    shift_id: string;
    closing_cash_actual: number;
    closing_notes?: string;
    audit_items: Array<{
      item_name: string;
      tracking_type: 'weighed' | 'counted';
      measured_quantity: number;
      unit: string;
      photo_url: string;
    }>;
  }) {
    const res = await fetch(`${API_BASE_URL}/shifts/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-kasir-usr-1',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Gagal menutup shift');
    return res.json();
  },
};

