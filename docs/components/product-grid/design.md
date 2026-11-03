# Product Grid Component Design Specification (`docs/components/product-grid/design.md`)
> **Component:** `ProductGrid`  
> **Source Screen:** `Menu - Kopiko Pos` (Node ID: `1:33`–`1:34`)  
> **Schema Reference:** `schema/schema.sql` (`menu`)  
> **PRD Reference:** `PRD.md` (Sections 3, 10, 11.1)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & Data Source
The `ProductGrid` component coordinates the 3-column layout container for all active ready-to-sell items retrieved from the `menu` table (`GET /api/v1/products`).

---

## 2. Geometry & Grid Architecture

- **Layout Mode:** CSS Grid (`grid-template-columns: repeat(3, minmax(0, 1fr))`)
- **Row Height:** `321px` per card
- **Gap:** `20px` (Horizontal and Vertical)
- **Container Sizing:** `width: 100%`, `flex: 1`
- **Padding:** `0px 4px 40px 0px`
- **Scroll Behavior:** Vertical momentum scrolling (`overflow-y: auto`).

---

## 3. Empty & Search State Handling

### 3.1 Empty Search State
When a cashier's search query yields no matches from `menu`:
- **Container:** Centered flex column, padding `64px 20px`.
- **Heading:** `"Menu tidak ditemukan"` (Plus Jakarta Sans Bold 16px, `#2C1810`).
- **Subtext:** `"Periksa kata kunci atau ganti filter kategori"` (Plus Jakarta Sans Medium 14px, `#6A5E59`).

### 3.2 Loading / Skeleton State
- Renders 6 skeleton cards (`321px × 100%`) with pulsing background `#EAE5DE`.

---

## 4. Recommended Component Interface (Props)

```typescript
import { MenuItem } from '../product-card/design';

export interface ProductGridProps {
  products: MenuItem[];
  isLoading?: boolean;
  onAddToCart: (product: MenuItem) => void;
  onCardPress?: (product: MenuItem) => void;
  emptySearchQuery?: string;
}
```
