export type StockCategoryEnum =
  | 'powder'
  | 'syrup'
  | 'milk'
  | 'galon'
  | 'packaging'
  | 'lid'
  | 'sealer';

export type StockStatusType = 'safe' | 'warning' | 'out_of_stock';

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

