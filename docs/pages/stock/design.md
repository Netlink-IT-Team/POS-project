# Kopiko POS — Stock Management Page UI/UX Design Guidelines (`docs/pages/stock/design.md`)
> **Source of Truth for Frontend Implementation (Stock Management View)**  
> **Figma Reference:** `Manajemen Stok (Sidebar Tersembunyi / Hidden) - Kopiko POS` (Node ID: `26:2513` & `26:2006`)  
> **Schema Reference:** `schema/schema.sql` (`booth_stocks`, `stock_category` enum, `booths`, `profiles`)  
> **PRD Reference:** `PRD.md` (Sections 3, 4, 6, 8, 10, 11.2)  
> **Form Factor:** Tablet Landscape / Horizontal (1280px × 800px / 1024px)  
> **Platform:** Expo / React Native (Tablet Horizontal Layout)

---

## 1. Overview & Operational Purpose

The **Stock Management Page** (`Manajemen Stok & Bahan Baku`) is the inventory auditing terminal for booth cashiers (`role: 'kasir'`) across 532 retail booth locations.

Per **PRD Section 3 & 8**:
- Manages shift-based physical stock tracking without complex real-time recipe deductions.
- Supports **Weighed Items** (`powder`, `syrup`, `milk`, `galon`) and **Counted Items** (`packaging`, `lid`, `sealer`).
- Renders in both full-screen mode with collapsed sidebar (`node-id: 26:2513`) and standard sidebar mode (`node-id: 26:2006`).
- Directly powers mandatory opening and closing shift audits with client-compressed photo verification (max 1280px, ~200–300 KB JPEG).

---

## 2. Database Schema & Data Model Alignment (`schema.sql`)

All inventory records map to the `booth_stocks` PostgreSQL table and strict database constraints:

```sql
-- Category Enum defined in schema.sql
create type stock_category as enum (
    'powder',     -- Espresso powder, chocolate, matcha, sugar
    'syrup',      -- Aren liquid, flavored syrups
    'milk',       -- Fresh milk, evaporated milk, condensed milk
    'galon',      -- Brewing water gallons (19L)
    'packaging',  -- Paper cups, plastic cups, kraft carry bags
    'lid',        -- Hot cup flat lids, cold cup dome lids
    'sealer'      -- Cup sealer rolls
);

-- Booth Stocks Table
create table booth_stocks (
    id uuid primary key default uuid_generate_v4(),
    booth_id uuid not null references booths(id) on delete cascade,
    category stock_category not null,
    item_name varchar(150) not null,
    quantity numeric(12, 2) not null default 0 check (quantity >= 0),
    min_threshold numeric(12, 2) not null default 10 check (min_threshold >= 0),
    unit varchar(50) not null, -- e.g. 'kg', 'pcs', 'ml', 'liter'
    updated_at timestamptz default now(),
    unique(booth_id, item_name)
);
```

### 2.1 Calculated Inventory Status Rules
The UI derives its status badges directly from database fields:
- **`Aman` (Safe):** `booth_stocks.quantity > booth_stocks.min_threshold`
- **`Menipis` (Warning):** `booth_stocks.quantity <= booth_stocks.min_threshold AND booth_stocks.quantity > 0`
- **`Kosong` (Out of Stock / Critical):** `booth_stocks.quantity = 0` (non-negative constraint enforced)

---

## 3. Design Tokens (Stock Page)

### 3.1 Color Palette
| Token Name | Hex / RGBA | Role / Usage on Stock Page |
| :--- | :--- | :--- |
| `bg-canvas` | `#F7F5F0` | Warm cream background for main scrollable viewport. |
| `bg-surface-white` | `#FFFFFF` | KPI cards, search controls container, inventory table card. |
| `bg-neutral-subtle` | `#EFECE6` | Search field fill, table header fill, filter dropdown background. |
| `text-primary` | `#1E1A18` / `#2C1810` | Screen titles, table item names, metric values. |
| `text-secondary` | `#6A5E59` | Subtitles, table header labels, SKUs, reorder point text. |
| `text-placeholder` | `rgba(106, 94, 89, 0.7)` | Search input placeholder. |
| `brand-crimson` | `#C62828` | `+ Tambah Stok Masuk` button, `Penerimaan Stok Masuk` CTA. |
| `status-safe` | `#047857` | Green badge text for `Aman` stock status (`quantity > min_threshold`). |
| `status-safe-bg` | `#ECFDF5` | Green badge background (`border: 1px solid #A7F3D0`). |
| `status-warning` | `#B45309` / `#D97706` | Amber badge text and warning indicator for `Menipis`. |
| `status-warning-bg` | `#FEF3C7` | Amber badge background (`border: 1px solid #FDE68A`). |
| `status-danger` | `#BA1A1A` / `#93000A` | Red badge and alert text for `Kosong` (`quantity = 0`). |
| `status-danger-bg` | `rgba(255, 218, 214, 0.4)` | Critical red background for Out of Stock KPI card & table row. |
| `border-divider` | `#EFECE6` | Table row separator strokes (`1px 0px 0px 0px`). |
| `border-card` | `#E0D9D1` / `#E6E0D8` | Perimeter border for cards and dropdowns. |

---

### 3.2 Typography Hierarchy (`Plus Jakarta Sans`)

| Token | Weight | Size | Line Height | Case / Tracking | Usage on Stock Page |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `font-kpi-val` | 800 (ExtraBold) | 16px / 28px | 16px / 32px | Normal | KPI Card counts (`38`, `4`, `1`, `Rp 18.450.000`). |
| `font-header-title` | 700 (Bold) | 16px | 24px | Normal | `Manajemen Stok & Bahan Baku`. |
| `font-brand-flag` | 700 (Bold) | 16px | 24px | `UPPER` (`0.1em`) | `KOPIKO CENTRAL INVENTORY OS`. |
| `font-table-header` | 700 (Bold) | 16px | 24px | `UPPER` (`0.05em`) | Headers: `BAHAN / ITEM & SKU`, `STATUS`, etc. |
| `font-item-name` | 700 (Bold) | 16px | 24px | Normal | Table item titles (`booth_stocks.item_name`). |
| `font-stock-qty` | 800 (ExtraBold) | 16px | 24px | Normal | Actual quantity (`booth_stocks.quantity`). |
| `font-body-regular` | 500 (Medium) | 16px | 24px | Normal | Search input text, action descriptions, table meta. |
| `font-unit-badge` | 600 (SemiBold) | 16px | 24px | Normal | Category chips (`Powder`, `Syrup`, `Milk`, etc.). |
| `font-badge-status` | 700 (Bold) | 12px / 14px | 16px / 20px | Normal | Status badges (`Aman`, `Menipis`, `Kosong`). |
| `font-warning-tag` | 700 (Bold) | 12px | 16px | `UPPER` (`0.05em`) | Row tags (`WARNING`, `HABIS`). |

---

## 4. Screen Layout & Component Structure (1280px Landscape)

```
+---------------------------------------------------------------------------------------------------------------+
| HEADER (80px, Sticky)                                                                                         |
| - Toggle: "Buka Sidebar" | Booth: booths.name ("Booth Mall Senayan #01") | Profile: profiles.full_name       |
+---------------------------------------------------------------------------------------------------------------+
| MAIN SCROLLABLE VIEWPORT (Padding: 80px 0px 180px, Background: #F7F5F0)                                       |
|                                                                                                               |
| 1. CONTEXT BANNER & TOP ACTIONS                                                                               |
|    - Brand Flag: "KOPIKO CENTRAL INVENTORY OS • Auto-Sync Realtime"                                           |
|    - Title: "Manajemen Stok & Bahan Baku"                                                                     |
|    - Right Actions: [Refresh Data] [ + Tambah Stok Masuk (Crimson) ]                                          |
|                                                                                                               |
| 2. KPI METRICS BENTO GRID (4 Cards, Gap: 16px)                                                                |
|    [ Total Item (38) ] [ Stok Menipis (4) ] [ Stok Kosong (1) ] [ Estimasi Nilai Stok (Rp 18.450.000) ]       |
|                                                                                                               |
| 3. SEARCH & CATEGORY FILTER BAR (Card Container, Gap: 16px)                                                   |
|    - Top: [ Search Input (Flex: 1) ] [ Status: Semua Status (Dropdown) ] [ Export ]                          |
|    - Bottom Tabs (stock_category enum): [Semua (38)] [Powder] [Syrup] [Milk] [Galon] [Packaging] [Lid] [Sealer] |
|                                                                                                               |
| 4. DETAILED INVENTORY DATA TABLE (Card Container, Border-Radius: 20px)                                        |
|    - Table Header: BAHAN / ITEM & SKU | KATEGORI | SISA STOK AKTUAL | REORDER POINT | STATUS | AKSI CEPAT     |
|    - Rows: Items filtered from booth_stocks table scoped by booth_id                                         |
|    - Footer: "Menampilkan 8 dari 38 item" | Pagination: [Sebelumnya] [Hal 1 dari 5] [Berikutnya]              |
|                                                                                                               |
+---------------------------------------------------------------------------------------------------------------+
| 5. FLOATING BOTTOM QUICK ACTION DOCK (Sticky Bottom, Backdrop Blur)                                           |
|    - Left: "Aksi Cepat Inventaris Shift Barista"                                                              |
|    - Right Actions: [Penerimaan Stok Masuk (Crimson)] [Catat Stok Rusak (Waste)] [Unduh Rekap Inventaris]     |
+---------------------------------------------------------------------------------------------------------------+
```

---

## 5. Detailed Component Specifications

### 5.1 Context Banner & Top Action Bar (`#26:2516`)
- **Banner Layout:** Flex row, justify `space-between`, align `center`, padding `24px 0px 16px`.
- **Identity Group:**
  - Header flag: `KOPIKO CENTRAL INVENTORY OS` (Bold 16px, tracking `0.1em`, `#1E1A18`) + dot + `Auto-Sync Realtime` (`#6A5E59`).
  - Screen Title: `Manajemen Stok & Bahan Baku` (Medium 16px, `#1E1A18`).
- **Actions:**
  - `Refresh Data` (Height `44px`, background `#FFFFFF`, border-radius `14px`, shadow `shadow-sm`). Triggers re-fetch of `booth_stocks`.
  - `+ Tambah Stok Masuk` (Height `44px`, background `#C62828`, border-radius `14px`, text `#FBF9F5` SemiBold 16px).

---

### 5.2 Metrics & KPI Bento Row (`#26:2540`)
Calculated from `booth_stocks` scoped by current cashier's `booth_id`:

1. **Total Item Card (`#26:2541`):**  
   - Value: `COUNT(*)` from `booth_stocks` (e.g. `38`).
   - Label: `Total Item Terdaftar` / Subtitle: `Bahan Baku & Packaging`.
   - Footer: `100% SKU Terpantau Aktif`.
2. **Low Stock Warning Card (`#26:2557`):**  
   - Value: `COUNT(*)` where `quantity <= min_threshold AND quantity > 0` (e.g. `4`).
   - Label: `Stok Menipis` (Text `#1E1A18`, Bold 16px).
   - Subtitle: `Perlu Restock Segera` / Footer: `Di bawah batas minimum reorder`.
3. **Out of Stock Critical Alert Card (`#26:2572`):**  
   - Value: `COUNT(*)` where `quantity = 0` (e.g. `1`).
   - Background: `rgba(255, 218, 214, 0.4)` (Critical Alert Red).
   - Label: `Stok Kosong / Habis` (Text `#93000A`).
   - Footer: `Menu terkait otomatis non-aktif` (prevents POS ordering of depleted ingredients).
4. **Stock Valuation Card (`#26:2587`):**  
   - Value: Sum of estimated COGS stock valuation (e.g. `Rp 18.450.000`).
   - Footer: `COGS Valuasi Booth` + `Audit: Hari ini`.

---

### 5.3 Category Quick Tabs (Mapped to `stock_category` Enum)
The horizontal category bar maps directly to PostgreSQL's `stock_category` enum:
1. `all`: **Semua Bahan (38)** (Active: dark/crimson tone `#FBF9F5`)
2. `powder`: **Powder & Beans** (Kopiko Espresso Blend, Sugar Powder, Matcha)
3. `syrup`: **Syrup & Topping** (Aren Organic Liquid, Flavored Syrups)
4. `milk`: **Dairy & Milk** (Fresh Milk Greenfields, Condensed Milk)
5. `galon`: **Galon Air** (Air Galon 19L for espresso brewing)
6. `packaging`: **Packaging & Cup** (Artisan Kraft Cup, Cold Cup 12oz)
7. `lid`: **Lids & Caps** (Hot Cup Embossed Lids, Cold Cup Dome Lids)
8. `sealer`: **Sealer Roll** (Plastic Sealer Rolls)

---

### 5.4 Detailed Inventory Table (`#26:2641`)
- **Table Header (`#26:2643`, background `#EFECE6`):**
  - Col 1: `BAHAN / ITEM & SKU` (Width `416.22px`) -> maps to `item_name`
  - Col 2: `KATEGORI` (Width `172.16px`) -> maps to `category` (`stock_category`)
  - Col 3: `SISA STOK AKTUAL` (Width `188.75px`) -> maps to `quantity` + `unit`
  - Col 4: `REORDER POINT` (Width `158.14px`) -> maps to `min_threshold` + `unit`
  - Col 5: `STATUS` (Width `130.61px`, Center) -> maps to status pill
  - Col 6: `AKSI CEPAT` (Width `214.13px`, Right) -> `+ Quick Adjust` or `Restock Masuk`

#### Sample Data Rows Mapped to Schema:
| Item Name (`item_name`) | Category (`category`) | Quantity | Min Threshold | Unit | Status Badge | Quick Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Kopiko Signature Espresso Blend** | `powder` | `14.50` | `5.00` | `kg` | `Aman` (Green) | `+ Quick Adjust` |
| **Single Origin Aceh Gayo 1kg** | `powder` | `6.00` | `3.00` | `kg` | `Aman` (Green) | `+ Quick Adjust` |
| **Fresh Milk Greenfields 1L** | `milk` | `3.00` | `8.00` | `liter` | `Menipis` (Amber) | `+ Quick Adjust` |
| **Aren Organic Liquid 1L** | `syrup` | `1.50` | `3.00` | `liter` | `Menipis` (Amber) | `+ Quick Adjust` |
| **Croissant Butter Frozen** | `packaging` | `0.00` | `12.00` | `pcs` | `Kosong` (Red) | `Restock Masuk` |
| **Biskuit Marie Regal 250g** | `powder` | `18.00` | `5.00` | `pack` | `Aman` (Green) | `+ Quick Adjust` |
| **Hot Cup 8oz + Lid Embossed** | `packaging` | `45.00` | `100.00` | `pcs` | `Menipis` (Amber) | `+ Quick Adjust` |
| **Cold Cup 12oz + Sealer Roll** | `packaging` | `320.00` | `100.00` | `pcs` | `Aman` (Green) | `+ Quick Adjust` |

---

### 5.5 Bottom Quick Action Dock (`#26:2929`)
- **Dock Container:** Sticky bottom with `backdrop-filter: blur(6px)`, background `rgba(251, 249, 245, 0.95)`, shadow `shadow-dock`.
- **Actions:**
  1. **Penerimaan Stok Masuk (Primary Crimson CTA):** Opens delivery receiving modal to update incoming quantities.
  2. **Catat Stok Rusak (Waste):** Opens waste logging modal (e.g. spilled milk, dropped cups).
  3. **Unduh Rekap Inventaris:** Exports CSV/Excel inventory summary for shift handover.

---

## 6. TypeScript Interface Alignment (`schema.sql`)

```typescript
// Enum strictly aligned with schema.sql
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
  id: string;                      // UUID primary key
  booth_id: string;                // references booths(id)
  category: StockCategoryEnum;     // stock_category enum
  item_name: string;               // varchar(150)
  quantity: number;                // numeric(12,2) >= 0
  min_threshold: number;           // numeric(12,2) >= 0 (default 10)
  unit: string;                    // varchar(50) e.g. 'kg', 'pcs', 'ml', 'liter'
  updated_at: string;              // timestamptz
}

export interface StockMetricsSummary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  estimatedValuation: number;
}
```
