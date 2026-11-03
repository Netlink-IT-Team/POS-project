# Kopiko POS — Menu Page UI/UX Design Guidelines (`docs/pages/menu/design.md`)
> **Source of Truth for Frontend Implementation (Menu Screen)**  
> **Figma Reference:** `Menu - Kopiko Pos` (Node ID: `1:2`, File: `uUoSZboNrpTiEVC8WXQDvU`)  
> **Schema Reference:** `schema/schema.sql` (`booths`, `profiles`, `menu`, `transactions`, `transaction_items`)  
> **PRD Reference:** `PRD.md` (Sections 1, 2, 4, 6, 7, 9, 11.2)  
> **Form Factor:** Tablet Landscape / Horizontal (1280px × 800px / 1024px)  
> **Platform:** Expo / React Native (Tablet Horizontal Layout)

---

## 1. Overview & Operational Scope

The **Menu Page** (`node-id: 1:2`) is the primary operational terminal used by booth cashiers (`role: 'kasir'`) across 532 retail booth locations.

Per **PRD Section 3 & 7**:
- Supports rapid POS order assembly, real-time item search, and category filtering.
- Bridges directly to dynamic QRIS generation (via Xendit) and cash processing.
- Built **Local Storage First** (SQLite on tablet) with automated background sync via `POST /api/v1/transactions/sync` to the Go backend upon internet recovery.
- Guarantees zero double-charging via client-generated UUID `idempotency_key` per transaction.

---

## 2. Database Schema & Data Model Alignment (`schema.sql`)

All data presented and manipulated on the Menu Page maps directly to PostgreSQL entities:

```
+----------------------------------------------------------------------------------------------------+
| BOOTHS (Header context)                                                                            |
| id (UUID) | code (VARCHAR) | name (VARCHAR: "Booth Mall Senayan #01") | is_active (BOOLEAN)        |
+----------------------------------------------------------------------------------------------------+
                                      | 1:N
                                      v
+----------------------------------------------------------------------------------------------------+
| PROFILES (Cashier session)                                                                         |
| id (UUID) | role (user_role: 'kasir') | booth_id (UUID) | full_name (VARCHAR: "Alex Martins")      |
+----------------------------------------------------------------------------------------------------+
                                      | 1:N
                                      v
+----------------------------------------------------------------------------------------------------+
| TRANSACTIONS (Order & Cart checkout)                                                               |
| id (UUID) | booth_id (UUID) | cashier_id (UUID) | idempotency_key (UUID UNIQUE)                     |
| payment_method (payment_method: 'cash' | 'qris') | status (payment_status: 'pending'|'completed')  |
| total_amount (NUMERIC(12,2)) | offline_created_at (TIMESTAMPTZ)                                    |
+----------------------------------------------------------------------------------------------------+
                                      | 1:N
                                      v
+----------------------------------------------------------------------------------------------------+
| TRANSACTION_ITEMS (Cart Line Items)                                                                |
| id (UUID) | transaction_id (UUID) | menu_id (UUID references menu.id)                              |
| quantity (INTEGER > 0) | price_per_unit (NUMERIC(12,2)) | subtotal (NUMERIC(12,2))                 |
+----------------------------------------------------------------------------------------------------+
                                      ^
                                      | N:1
+----------------------------------------------------------------------------------------------------+
| MENU (Product Catalog)                                                                             |
| id (UUID) | name (VARCHAR) | sku (VARCHAR UNIQUE) | description (TEXT)                             |
| price (NUMERIC(12,2)) | image_url (TEXT) | is_active (BOOLEAN default true)                        |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Design Tokens (Menu Page)

### 3.1 Color Tokens
| Token Name | Hex / RGBA | Schema / System Role |
| :--- | :--- | :--- |
| `bg-canvas` | `#F7F5F0` | Screen canvas background (warm cream wash). |
| `bg-sidebar` | `#1D0F0A` | Left navigation sidebar background (Deep Espresso). |
| `border-sidebar` | `#3D2318` | Sidebar border separating navigation from main catalog. |
| `bg-header` | `rgba(251, 249, 245, 0.9)` | Sticky top bar with `backdrop-filter: blur(12px)`. |
| `border-header` | `#E3DCD5` | 1px border at bottom of top header. |
| `bg-card` | `#FFFFFF` | Catalog cards (`menu`), search input, cart line items. |
| `bg-cart-panel` | `#F3EFEA` | Right-side Cart / Order Summary panel surface. |
| `border-cart-panel` | `#E2DBD3` | 1px left border separating product catalog from cart. |
| `brand-crimson` | `#C62828` | Primary brand accent: Active category chip, checkout CTA (`Lanjut ke Pembayaran`). |
| `brand-espresso` | `#2C1810` | Primary typography color, dark buttons (`+` add button, dark booth tag). |
| `text-muted` | `#6A5E59` | Secondary text, ingredient descriptions, unit prices. |
| `text-placeholder` | `rgba(168, 156, 151, 0.7)`| Search input placeholder text. |
| `text-inverted` | `#FFFFFF` | Text on crimson buttons, active tabs, dark stepper buttons. |
| `text-inverted-muted` | `rgba(251, 249, 245, 0.75)` | Inactive sidebar link text (`Stok`, `Settlement`). |
| `status-online` | `#10B981` | Green indicator dot and avatar status badge (`booths.is_active = true`). |
| `status-online-bg` | `#ECFDF5` | Green status pill background (`border: 1px solid #A7F3D0`, text `#047857`). |
| `status-offline-bg` | `#FEF3C7` | Amber offline status pill background (`border: 1px solid #FDE68A`, text `#B45309`). |
| `status-badge-ready` | `#059669` | `Siap diproses` status in cart summary. |
| `alert-danger` | `#C62828` / `#FEF2F2`| Cart delete button fill (`#FEF2F2`), border (`#FECACA`), icon (`#C62828`). |
| `alert-logout` | `#FCA5A5` | Sidebar logout text and icon accent. |
| `border-subtle` | `#F1EBE4` / `#F2ECE5`| Internal card dividers, item separators. |
| `border-default` | `#E0D9D1` / `#E6E0D8`| Input borders, product card stroke, inactive chip stroke. |

---

### 3.2 Typography Hierarchy (`Plus Jakarta Sans`)

| Token | Weight | Size | Line Height | Usage on Menu Page |
| :--- | :--- | :--- | :--- | :--- |
| `font-logo` | 800 (ExtraBold) | 24px | 24px | Sidebar `KOPIKO` brand logo (`letter-spacing: 0.1em`). |
| `font-total-price` | 800 (ExtraBold) | 24px | 32px | Cart Total Amount (`transactions.total_amount`). |
| `font-cart-header` | 700 (Bold) | 18px | 28px | Cart Header: `Pesanan #104`. |
| `font-product-title` | 700 (Bold) | 16px | 24px | Product card title (`menu.name`). |
| `font-product-price` | 800 (ExtraBold) | 16px | 24px | Product price tag (`menu.price`, e.g. `Rp 28.000`). |
| `font-cta-btn` | 800 (ExtraBold) | 16px | 24px | Cart CTA: `Lanjut ke Pembayaran` (`letter-spacing: 0.025em`). |
| `font-nav-active` | 700 (Bold) | 15px | 22.5px | Active sidebar link (`Menu`). |
| `font-nav-inactive` | 600 (SemiBold) | 15px | 22.5px | Inactive sidebar links (`Stok`, `Settlement`). |
| `font-category-active`| 700 (Bold) | 14px | 20px | Active Category Chip (`Semua Menu`). |
| `font-category-default`| 600 (SemiBold)| 14px | 20px | Inactive Category Chips (`Signature Coffee`, etc.). |
| `font-input` | 500 (Medium) | 14px | 20px | Search input text and placeholder. |
| `font-cart-item-title`| 700 (Bold) | 14px | 20px | Cart item title & line subtotal (`transaction_items.subtotal`). |
| `font-subtotal` | 600 (SemiBold) | 14px | 20px | Subtotal sum (`SUM(transaction_items.subtotal)`). |
| `font-cashier-name` | 700 (Bold) | 14px | 19.25px | Header user profile (`profiles.full_name`). |
| `font-badge` | 700 (Bold) | 11px | 16.5px | Product badges (`Best Seller`, `Manual Brew`, `Snack`). |
| `font-queue-badge` | 700 (Bold) | 12px | 16px | Cart queue pill (`Antrean #04`). |
| `font-meta` | 500 (Medium) | 12px | 16px | Modifiers (`Normal Ice • Less Sugar`), unit price. |
| `font-overline` | 700 (Bold) | 12px | 16px | Upper label: `TOTAL PEMBAYARAN` (`letter-spacing: 0.05em`). |

---

### 3.3 Radii & Elevation Tokens

- `rounded-stepper`: `10px` — Quantity stepper buttons (`-` / `+`).
- `rounded-btn`: `14px` — Inputs, Category chips, Filter button, Card `+` button, Clear cart button.
- `rounded-card`: `20px` — Product cards, Cart line item cards, Payment CTA button.
- `rounded-pill`: `9999px` — Product badges, Booth pill, Online/Offline status pill, Avatar dot.
- `shadow-sm` (`effect_0d0ada4b`): `0px 1px 2px 0px rgba(0, 0, 0, 0.05)`.
- `shadow-card` (`effect_4b8be7f0`): `0px 2px 4px -2px rgba(0, 0, 0, 0.1), 0px 4px 6px -1px rgba(0, 0, 0, 0.1)`.
- `shadow-chip-active`: `0px 2px 4px -2px rgba(198, 40, 40, 0.25), 0px 4px 6px -1px rgba(198, 40, 40, 0.25)`.
- `shadow-crimson-cta`: `0px 4px 6px -4px rgba(198, 40, 40, 0.25), 0px 10px 15px -3px rgba(198, 40, 40, 0.25)`.
- `shadow-cart-panel` (`effect_842d987c`): `0px 25px 50px -12px rgba(0, 0, 0, 0.25)`.
- `shadow-cart-footer`: `0px -6px 20px 0px rgba(44, 24, 16, 0.04)`.

---

## 4. Screen Layout & Component Anatomy (1280px Viewport)

```
+-----------------------------------------------------------------------------------------------------------+
| ASIDE (288px)    | HEADER (Fixed height: 80px, width: calc(100% - 288px))                                  |
| - Kopiko Logo    | - Booth Tag: booths.name | Online/Offline Status Pill | profiles.full_name              |
| - Menu (Active)  +----------------------------------------------------+-----------------------------------+
| - Stok           | LEFT: PRODUCT CATALOG (Flex: 1, ~602px net)        | RIGHT: CART PANEL (Fixed: 390px)  |
| - Settlement     | - Top Bar: Search Input + Filter Button            | - Header: Queue & Order ID        |
| ---------------- | - Category Chips (Horizontal Scroll)               | - Scrollable Line Items           |
| - Log Out        | - 3-Column Product Grid (Cards: menu items)        | - Sticky Footer: Total & CTA      |
+------------------+----------------------------------------------------+-----------------------------------+
```

### 4.1 Navigation Sidebar (Left, 288px)
- **Geometry:** Width `288px`, height `100vh`, background `#1D0F0A`, border-right `1px solid #3D2318`.
- **RBAC Enforcement (PRD Section 6):** Displays only cashier routes (`Menu`, `Stok`, `Settlement`). PIC/Super Admin global revenue dashboards are strictly hidden.
- **Brand Wordmark:** `KOPIKO` (24px ExtraBold `#FFFFFF`, tracking `0.1em`) with glass logo badge.
- **Nav Links:**
  - `Menu` (Active): Background `#C62828`, shadow `0px 4px 16px 0px rgba(198, 40, 40, 0.4)`, text `#FFFFFF` (15px Bold).
  - `Stok` (Inactive): Navigates to `/stock` (`booth_stocks` audit view).
  - `Settlement` (Inactive): Navigates to `/settlement` (shift reconciliation view).
  - `Log Out`: Triggers Supabase Auth session destruction.

---

### 4.2 Top Bar Header (80px)
- **Geometry:** Height `80px`, absolute top `288px` offset, background `rgba(251, 249, 245, 0.9)`, border-bottom `1px solid #E3DCD5`, backdrop filter `blur(12px)`.
- **Booth Pill (`booths` table):**
  - Displays `booths.name` (e.g. `Booth Mall Senayan #01`).
  - Background `#2C1810`, text `#FBF9F5` (Bold 12px), red pin icon (`#EF5350`).
- **Connection Status Pill (PRD Section 7):**
  - **Online State:** Background `#ECFDF5`, border `#A7F3D0`, dot `#10B981`, label `Online POS`.
  - **Offline State:** Background `#FEF3C7`, border `#FDE68A`, dot `#F59E0B`, label `Offline POS (Lokal)`. Indicates local SQLite fallback mode.
- **Cashier Identity (`profiles` table):**
  - Displays `profiles.full_name` (`Alex Martins`), role verified as `kasir`.
  - 40×40px circular avatar with online green badge.

---

### 4.3 Catalog Area (70%)

#### Search Input & Filter Bar
- **Search Input:** Flex: 1, height `48px`, background `#FFFFFF`, border `1px solid #E0D9D1`, border-radius `14px`.
  - Queries `menu.name` and `menu.sku` with real-time client debouncing (300ms).
  - Placeholder: `"Cari menu kopi, pastry, atau minuman..."`.
- **Filter Button:** Height `48px`, background `#FFFFFF`, border `1px solid #E0D9D1`, icon + text `Filter`.

#### Category Chips Bar
- Horizontal scrolling container (`height: 46px`).
- Filter options categorize ready-to-sell items from the `menu` catalog:
  - `Semua Menu` (Active by default, background `#C62828`, text `#FFFFFF`).
  - `Signature Coffee`, `Manual Brew`, `Non-Coffee`, `Pastry & Snack`.

#### Product Grid & Card
- **Grid Layout:** CSS Grid `repeat(3, minmax(0, 1fr))`, gap `20px`.
- **Card Container:** Background `#FFFFFF`, border `1px solid #E6E0D8`, border-radius `20px`, height `321px`.
- **Image Section (160px):** Source from `menu.image_url`. Displays floating badge (`Best Seller`, `Manual Brew`, `Snack`).
- **Content Section:**
  - Title (`menu.name`): 16px Bold, `#2C1810`.
  - Description (`menu.description`): 12px Medium, `#6A5E59`, single line truncated.
- **Footer Row:**
  - Price (`menu.price`): 16px ExtraBold `#2C1810` (e.g. `Rp 28.000`).
  - Add Button: 36×36px, background `#2C1810`, centered `+` icon (`#FBF9F5`).
- **Availability State:** If `menu.is_active = false`, card displays `Habis` overlay, reduces opacity to `0.5`, and disables the `+` button.

---

### 4.4 Right Cart & Order Summary Panel (390px)

- **Geometry:** Fixed width `390px`, background `#F3EFEA`, border-left `1px solid #E2DBD3`, shadow `shadow-cart-panel`.
- **Cart Header:**
  - Order ID: `Pesanan #104` + Queue Pill `Antrean #04`.
  - Clear Action: 40×40px red trash button (`#FEF2F2`, border `#FECACA`, icon `#C62828`).
- **Ordered Items List (`transaction_items`):**
  - Scrollable container, padding `16px`, gap `12px`.
  - **Item Card:** White surface, border `1px solid #E9E4DC`, border-radius `20px`, padding `14px`.
    - Title (`menu.name`) + Subtotal (`transaction_items.subtotal`, calculated as `price_per_unit * quantity`).
    - Modifiers summary (`Normal Ice • Less Sugar`).
    - Unit price (`transaction_items.price_per_unit`, e.g. `Rp 28.000 / item`).
    - **Quantity Stepper:** Tactile minus (`28×28px`, `#EFECE6`), quantity counter, plus button (`28×28px`, `#2C1810`).
- **Order Summary & Payment Footer (`transactions`):**
  - Sticky bottom, background `#FFFFFF`, border-top `1px solid #E8E2DA`, shadow `shadow-cart-footer`.
  - Subtotal: Sum of line items (`SUM(transaction_items.subtotal)`).
  - Total Payment: `transactions.total_amount` displayed in 24px ExtraBold Crimson (`#C62828`).
  - Status Flag: `Siap diproses` (Emerald `#059669`).
  - **Primary CTA (`Lanjut ke Pembayaran`):**
    - Height `58px`, border-radius `20px`, background `#C62828`, shadow `shadow-crimson-cta`.
    - Generates client UUID `idempotency_key` and navigates to the payment modal.
    - Disabled when cart item count is `0`.

---

## 5. Offline & Network Resilience Flow (PRD Section 7 & 11.2)

1. **Online Operation:**  
   Cart checkout sends `POST /api/v1/transactions` with the `Idempotency-Key: <UUID>` header. Server writes to `transactions` and `transaction_items`.
2. **Offline Fallback:**  
   If the network drops, the status pill changes to `Offline POS (Lokal)`. The order is committed to the tablet's local SQLite database with `offline_created_at = NOW()` and `status = 'completed'` (for cash/static QR).
3. **Background Sync:**  
   When connectivity recovers, queued transactions bulk-sync to `/api/v1/transactions/sync`. The server uses `idempotency_key` to avoid duplicate insertions.
