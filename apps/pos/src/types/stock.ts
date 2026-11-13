export type StockCategoryEnum =
  | 'powder'
  | 'syrup'
  | 'milk'
  | 'galon'
  | 'packaging'
  | 'lid'
  | 'sealer';

export type StockStatusType = 'safe' | 'warning' | 'out_of_stock';

export type ShiftStatus = 'open' | 'closed';
export type AuditTrackingType = 'weighed' | 'counted';
export type AuditStage = 'opening' | 'closing';

export interface BoothStockRecord {
  id: string;
  booth_id: string;
  category: StockCategoryEnum;
  item_name: string;
  sku: string;
  quantity: number;
  min_threshold: number;
  unit: string;
  estimated_cost_per_unit: number;
  updated_at: string;
}

export interface StockMetricsSummary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  estimatedValuation: number;
}

export interface BoothShift {
  id: string;
  booth_id: string;
  cashier_id: string;
  shift_number: 1 | 2 | 3;
  status: ShiftStatus;
  opened_at: string;
  closed_at?: string;
  opening_cash: number;
  closing_cash_actual?: number;
  closing_cash_expected?: number;
  cash_discrepancy?: number;
  closing_notes?: string;
  is_pic_verified: boolean;
  pic_verified_by?: string;
  pic_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftStockAudit {
  id: string;
  shift_id: string;
  stock_item_id?: string;
  item_name: string;
  tracking_type: AuditTrackingType;
  measured_quantity: number;
  unit: string;
  stage: AuditStage;
  photo_url: string;
  notes?: string;
  created_at: string;
}

export interface ShiftUsageSummary {
  coldCups: number;
  hotCups: number;
  lids: number;
  espressoKg: number;
  milkLiters: number;
  arenLiters: number;
  croissantPcs: number;
  totalTransactions: number;
}
