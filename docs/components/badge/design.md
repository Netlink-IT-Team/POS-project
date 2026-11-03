# Badge Component Design Specification (`docs/components/badge/design.md`)
> **Component:** `Badge` (Primitive)  
> **Source Screens:** `Menu` (`node-id: 1:2`) & `Stock Management` (`node-id: 26:2513`)  
> **Schema Reference:** `schema/schema.sql` (`payment_status`, `booth_stocks`, `booths.is_active`)  
> **PRD Reference:** `PRD.md` (Sections 3, 6, 7)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & Purpose
The `Badge` component is a shared visual primitive for rendering metadata tags, queue flags, operational connectivity states, stock status alerts, and payment verification indicators across Kopiko POS.

---

## 2. Badge Variants & Tokens

### 2.1 Product Category Highlights (`variant="product"`)
Mounted on top-right of catalog images in the `menu` catalog.
- **Border Radius:** `9999px` (`rounded-full`)
- **Padding:** `4px 10px`
- **Box Shadow:** `0px 2px 4px -2px rgba(0, 0, 0, 0.1), 0px 4px 6px -1px rgba(0, 0, 0, 0.1)` (`effect_4b8be7f0`)
- **Typography:** `Plus Jakarta Sans`, Bold `700`, `11px / 16.5px`, Letter Spacing `0.025em`
- **Sub-types:**
  - `best-seller`: Background `#C62828`, Text `#FFFFFF`
  - `manual-brew`: Background `#2C1810`, Text `#FBF9F5`
  - `snack`: Background `#92400E`, Text `#FFFFFF`

---

### 2.2 Connection Status Badge (`variant="status"`)
Used in the header bar to reflect live network reachability per **PRD Section 7**.
- **Border Radius:** `9999px` (`rounded-full`)
- **Padding:** `4px 12px`
- **Gap:** `6px`
- **Typography:** `Plus Jakarta Sans`, SemiBold `600`, `12px / 16px`
- **Sub-types:**
  - `online`:
    - Background: `#ECFDF5`, Border: `1px solid #A7F3D0`
    - Dot: `8px × 8px` circle, background `#10B981` (pulsing)
    - Color: `#047857`, Label: `Online POS`
  - `offline`:
    - Background: `#FEF3C7`, Border: `1px solid #FDE68A`
    - Dot: `8px × 8px` circle, background `#F59E0B`
    - Color: `#B45309`, Label: `Offline POS (Lokal)`

---

### 2.3 Inventory Status Badges (`variant="stock"`)
Derived directly from `booth_stocks.quantity` and `booth_stocks.min_threshold` in `schema.sql`:
- **Sub-types:**
  - `safe` (`Aman`):
    - Trigger: `quantity > min_threshold`
    - Background: `#ECFDF5`, Border: `1px solid #A7F3D0`, Text: `#047857` (Bold 12px)
  - `warning` (`Menipis` / `WARNING`):
    - Trigger: `quantity <= min_threshold AND quantity > 0`
    - Background: `#FEF3C7`, Border: `1px solid #FDE68A`, Text: `#B45309` (Bold 12px)
  - `out_of_stock` (`Kosong` / `HABIS`):
    - Trigger: `quantity = 0`
    - Background: `rgba(255, 218, 214, 0.4)`, Border: `1px solid #FECACA`, Text: `#BA1A1A` (Bold 12px)

---

### 2.4 Payment & Transaction Status Badges (`variant="payment"`)
Directly maps to the `payment_status` enum from `schema.sql` (`pending`, `completed`, `failed`, `refunded`):
- `completed` (`LUNAS`): Background `#ECFDF5`, Text `#047857`
- `pending` (`MENUNGGU`): Background `#FEF3C7`, Text `#B45309`
- `failed` (`GAGAL`): Background `#FEF2F2`, Text `#DC2626`
- `refunded` (`REFUND`): Background `#F3E8FF`, Text `#7E22CE`

---

### 2.5 Queue Badge (`variant="queue"`)
Mounted in the Cart Header for counter queue indexing:
- **Border Radius:** `9999px` (`rounded-full`)
- **Padding:** `2px 10px`
- **Background Color:** `rgba(198, 40, 40, 0.1)`
- **Border:** `1px solid rgba(198, 40, 40, 0.2)`
- **Typography:** `Plus Jakarta Sans`, Bold `700`, `12px / 16px`, Color `#C62828`

---

### 2.6 Booth Tag Pill (`variant="booth"`)
Displays `booths.name` in the sticky top header:
- **Border Radius:** `9999px` (`rounded-full`)
- **Padding:** `6px 14px`, Gap `8px`
- **Background Color:** `#2C1810`, Border: `1px solid rgba(68, 40, 30, 0.4)`
- **Leading Icon:** Map pin (`12px × 15px`, fill `#EF5350`)
- **Typography:** `Plus Jakarta Sans`, Bold `700`, `12px / 16px`, Color `#FBF9F5`

---

## 3. Recommended Component Interface (Props)

```typescript
import { PaymentStatus } from '../../types';

export interface BadgeProps {
  variant: 'product' | 'status' | 'queue' | 'booth' | 'stock' | 'payment';
  type?: 
    | 'best-seller' | 'manual-brew' | 'snack' 
    | 'online' | 'offline' 
    | 'safe' | 'warning' | 'out_of_stock'
    | PaymentStatus;
  label: string;
  dot?: boolean;
  icon?: React.ReactNode;
}
```
