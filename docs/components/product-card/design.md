# Product Card Component Design Specification (`docs/components/product-card/design.md`)
> **Component:** `ProductCard`  
> **Source Screen:** `Menu - Kopiko Pos` (Node ID: `1:35`, Template: `EL-1a9dea2e`)  
> **Schema Reference:** `schema/schema.sql` (`menu`, `booth_stocks`)  
> **PRD Reference:** `PRD.md` (Sections 3, 8, 10, 11.1)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & Database Mapping

The `ProductCard` displays an individual ready-to-sell item queried from the `menu` table:

```sql
create table menu (
    id uuid primary key default uuid_generate_v4(),
    name varchar(255) not null,
    sku varchar(100) unique not null,
    description text,
    price numeric(12, 2) not null check (price >= 0),
    image_url text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

Per **PRD Section 3 & 8**:
- If `menu.is_active = false` or a required raw ingredient in `booth_stocks` has `quantity = 0`, the card automatically enters a disabled out-of-stock state.

---

## 2. Geometry & Styling

- **Width:** `100%` (Fluid in 3-column grid, `240px`–`270px`)
- **Height:** `321px` (Fixed)
- **Background Color:** `#FFFFFF` (`fill_658ab2fa`)
- **Border:** `1px solid #E6E0D8`
- **Border Radius:** `20px` (`rounded-xl`)
- **Overflow:** `hidden`
- **Layout:** Flex column, justify `space-between`, align `stretch`

---

## 3. Component Anatomy

### 3.1 Media Section (Top, Height: 160px)
- **Image (`menu.image_url`):** `height: 160px`, `width: 100%`, `object-fit: cover`.
- **Category Badge (Top Right):**
  - Position: Absolute `top: 10px, right: 10px`, padding `4px 10px`, radius `9999px`.
  - Variants:
    - *Best Seller:* Background `#C62828`, Text `#FFFFFF`
    - *Manual Brew:* Background `#2C1810`, Text `#FBF9F5`
    - *Snack:* Background `#92400E`, Text `#FFFFFF`

### 3.2 Information Section (Middle)
- **Padding:** `16px 16px 0px 16px`
- **Title (`menu.name`):** 16px Bold, line-height 24px, `#2C1810` (max 2 lines).
- **Description (`menu.description`):** 12px Medium, `#6A5E59` (e.g. `Espresso, Fresh Milk, …`).

### 3.3 Action & Pricing Footer (Bottom)
- **Padding:** `16px`, border-top `1px solid #F1EBE4`.
- **Price Tag (`menu.price`):** 16px ExtraBold `#2C1810` (e.g. `Rp 28.000`).
- **Add Button (`#1:50`):** Fixed `36px × 36px`, border-radius `14px`, background `#2C1810`, centered `+` icon (`#FBF9F5`).

### 3.4 Out-of-Stock Disabled State
- When `isAvailable === false` or `menu.is_active === false`:
  - Opacity: `0.5`
  - Overlay: Soft grey banner across image with text `Habis` (Bold 12px)
  - Add button: Disabled (`cursor: not-allowed`)

---

## 4. Recommended Component Interface (Props)

```typescript
export interface MenuItem {
  id: string;                  // menu.id (UUID)
  name: string;                // menu.name
  sku: string;                 // menu.sku
  description?: string;        // menu.description
  price: number;               // menu.price
  imageUrl?: string;           // menu.image_url
  isActive: boolean;           // menu.is_active
  badge?: 'Best Seller' | 'Manual Brew' | 'Snack' | string;
  isAvailable?: boolean;       // evaluated against booth_stocks
}

export interface ProductCardProps {
  product: MenuItem;
  onAddToCart: (product: MenuItem) => void;
  onCardPress?: (product: MenuItem) => void;
}
```
