import { CartLineItem } from '../types';

export interface RecipeRequirement {
  sku: string;
  quantity: number;
}

/**
 * Standard Recipe BOM (Bill of Materials) per MenuItem ID
 */
export const PRODUCT_RECIPES: Record<string, RecipeRequirement[]> = {
  // 1. Kopiko Aren Latte (prod-1)
  'prod-1': [
    { sku: 'PKG-C12-01', quantity: 1 },      // Cold Cup 12oz
    { sku: 'LID-H8-01', quantity: 1 },       // Lid
    { sku: 'RAW-ESP-01', quantity: 0.018 },   // 18g Espresso Blend
    { sku: 'RAW-MLK-01', quantity: 0.120 },   // 120ml Fresh Milk
    { sku: 'RAW-ARN-01', quantity: 0.025 },   // 25ml Aren Organic Liquid
  ],
  // 2. Kopiko Black Supreme / Americano (prod-2)
  'prod-2': [
    { sku: 'PKG-C12-01', quantity: 1 },
    { sku: 'LID-H8-01', quantity: 1 },
    { sku: 'RAW-ESP-01', quantity: 0.020 },   // 20g Double shot
    { sku: 'RAW-GLN-01', quantity: 0.010 },   // ~0.01 galon air mineral
  ],
  // 3. Caramel Macchiato (prod-3)
  'prod-3': [
    { sku: 'PKG-C12-01', quantity: 1 },
    { sku: 'LID-H8-01', quantity: 1 },
    { sku: 'RAW-ESP-01', quantity: 0.018 },
    { sku: 'RAW-MLK-01', quantity: 0.120 },
  ],
  // 4. Manual V60 Gayo (prod-4)
  'prod-4': [
    { sku: 'PKG-H8-01', quantity: 1 },       // Hot Cup Paper 8oz
    { sku: 'LID-H8-01', quantity: 1 },
    { sku: 'RAW-GYO-01', quantity: 0.015 },   // 15g Aceh Gayo
    { sku: 'RAW-GLN-01', quantity: 0.012 },
  ],
  // 5. Aeropress Flores Bajawa (prod-5)
  'prod-5': [
    { sku: 'PKG-H8-01', quantity: 1 },
    { sku: 'LID-H8-01', quantity: 1 },
    { sku: 'RAW-ESP-01', quantity: 0.016 },
    { sku: 'RAW-GLN-01', quantity: 0.010 },
  ],
  // 6. Matcha Espresso Fusion (prod-6)
  'prod-6': [
    { sku: 'PKG-C12-01', quantity: 1 },
    { sku: 'LID-H8-01', quantity: 1 },
    { sku: 'RAW-ESP-01', quantity: 0.018 },
    { sku: 'RAW-MLK-01', quantity: 0.120 },
  ],
  // 7. Classic Dark Chocolate (prod-7)
  'prod-7': [
    { sku: 'PKG-C12-01', quantity: 1 },
    { sku: 'LID-H8-01', quantity: 1 },
    { sku: 'RAW-MLK-01', quantity: 0.150 },
  ],
  // 8. Butter Croissant (prod-8)
  'prod-8': [
    { sku: 'RAW-CRS-01', quantity: 1 },      // 1 pcs Frozen Croissant
  ],
};

/**
 * Calculates total stock deductions for cart items, accounting for temperature and extra shot modifiers.
 */
export function calculateCartDeductions(cartItems: CartLineItem[]): Record<string, number> {
  const deductions: Record<string, number> = {};

  const addDeduction = (sku: string, amount: number) => {
    deductions[sku] = (deductions[sku] || 0) + amount;
  };

  for (const item of cartItems) {
    const qty = item.quantity;
    const recipe = PRODUCT_RECIPES[item.menuId];

    const modText = (item.modifiersText || '').toLowerCase();
    const isHot = modText.includes('panas') || modText.includes('hot');
    const isExtraShot = modText.includes('extra shot');

    if (recipe) {
      for (const ingredient of recipe) {
        let targetSku = ingredient.sku;
        let amountPerCup = ingredient.quantity;

        // If hot beverage, substitute cold PET cup with hot paper cup
        if (isHot && targetSku === 'PKG-C12-01') {
          targetSku = 'PKG-H8-01';
        }

        addDeduction(targetSku, amountPerCup * qty);
      }
    } else {
      // Fallback deduction for unknown drink items
      addDeduction(isHot ? 'PKG-H8-01' : 'PKG-C12-01', qty);
      addDeduction('LID-H8-01', qty);
      addDeduction('RAW-ESP-01', 0.018 * qty);
    }

    // Extra shot modifier deduction (+9 grams espresso)
    if (isExtraShot) {
      addDeduction('RAW-ESP-01', 0.009 * qty);
    }
  }

  // Round decimals to 3 places (e.g. 0.036 kg, 0.240 L)
  for (const sku in deductions) {
    deductions[sku] = Math.round(deductions[sku] * 1000) / 1000;
  }

  return deductions;
}
