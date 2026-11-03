# Cart Item Component Design Specification (`docs/components/cart-item/design.md`)
> **Component:** `CartItem`  
> **Source Screen:** `Menu - Kopiko Pos` (Node ID: `1:152`, Template: `EL-0386a1a0`)  
> **Schema Reference:** `schema/schema.sql` (`transaction_items`, `menu`)  
> **PRD Reference:** `PRD.md` (Sections 3, 7, 10)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & Database Mapping

The `CartItem` card renders an ordered item in the cart. Each card directly corresponds to a `transaction_items` row upon checkout:

```sql
-- Schema binding from schema.sql
create table transaction_items (
    id uuid primary key default uuid_generate_v4(),
    transaction_id uuid not null references transactions(id) on delete cascade,
    menu_id uuid not null references menu(id),
    quantity integer not null check (quantity > 0),
    price_per_unit numeric(12, 2) not null check (price_per_unit >= 0),
    subtotal numeric(12, 2) not null check (subtotal >= 0),
    created_at timestamptz default now()
);
```

- `menu_id`: UUID reference to `menu.id`.
- `quantity`: Integer counter, enforced `check (quantity > 0)`.
- `price_per_unit`: Cached from `menu.price`.
- `subtotal`: Evaluated as `quantity * price_per_unit`.

---

## 2. Geometry & Styling

- **Width:** `100%` (`358px` net inside 390px panel with 16px padding)
- **Padding:** `14px`
- **Background Color:** `#FFFFFF` (`fill_658ab2fa`)
- **Border:** `1px solid #E9E4DC`
- **Border Radius:** `20px` (`rounded-xl`)
- **Box Shadow:** `0px 1px 2px 0px rgba(0, 0, 0, 0.05)` (`effect_0d0ada4b`)
- **Margin Bottom:** `12px`

---

## 3. Row Breakdown

### 3.1 Top Row (Item Title & Subtotal)
- **Item Title (`#1:157`):** Maps to `menu.name` (Plus Jakarta Sans Bold 700, `14px / 20px`, `#2C1810`).
- **Line Subtotal (`#1:160`):** Maps to `transaction_items.subtotal` (Plus Jakarta Sans Bold 700, `14px / 20px`, `#2C1810`, e.g. `Rp 56.000`).

### 3.2 Modifiers Sub-Row (`#1:159`)
- Displays barista preparation customizations: e.g. `Normal Ice • Less Sugar`, `Hot • Medium Roast`, `Warmed`.
- Font: Plus Jakarta Sans Medium 500, `12px / 16px`, Color `#6A5E59`.

### 3.3 Bottom Row (Unit Price & Quantity Stepper)
- **Border Top:** `1px solid #F2ECE5`, padding-top `8px`.
- **Unit Price (`#1:164`):** Maps to `transaction_items.price_per_unit` (Plus Jakarta Sans Medium 500, `12px / 16px`, `#6A5E59`, e.g. `Rp 28.000 / item`).
- **Quantity Stepper Controls (`#1:165`):**
  - **Minus (`-`):** `28×28px`, border-radius `10px`, background `#EFECE6`, text `#2C1810`. Decrements `quantity`. If `quantity == 1`, decrementing triggers item removal from cart.
  - **Counter:** Width `20px`, text center, Plus Jakarta Sans Bold 700, `14px`, `#2C1810`.
  - **Plus (`+`):** `28×28px`, border-radius `10px`, background `#2C1810`, text `#FFFFFF`. Increments `quantity`.

---

## 4. Recommended Component Interface (Props)

```typescript
export interface CartItemProps {
  id: string;                 // Client line item UUID
  menuId: string;             // references menu.id
  name: string;               // menu.name
  modifiersText?: string;     // e.g. "Normal Ice • Less Sugar"
  pricePerUnit: number;       // transaction_items.price_per_unit
  quantity: number;           // transaction_items.quantity
  subtotal: number;           // transaction_items.subtotal
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}
```
