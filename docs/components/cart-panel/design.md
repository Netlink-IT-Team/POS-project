# Cart Panel Component Design Specification (`docs/components/cart-panel/design.md`)
> **Component:** `CartPanel`  
> **Source Screen:** `Menu - Kopiko Pos` (Node ID: `1:134`)  
> **Schema Reference:** `schema/schema.sql` (`transactions`, `transaction_items`, `payment_method`, `payment_status`)  
> **PRD Reference:** `PRD.md` (Sections 3, 7, 9, 11.2)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & System Role

The `CartPanel` occupies the right 30% of the tablet landscape viewport (`width: 390px`). It manages the order draft before committing it as a record in the `transactions` table:

```sql
-- Target record created on checkout from CartPanel
create table transactions (
    id uuid primary key default uuid_generate_v4(),
    booth_id uuid not null references booths(id),
    cashier_id uuid references profiles(id),
    idempotency_key uuid unique not null,
    payment_method payment_method not null, -- 'cash' | 'qris'
    status payment_status not null default 'pending',
    total_amount numeric(12, 2) not null check (total_amount >= 0),
    xendit_invoice_id varchar(255),
    xendit_payment_url text,
    offline_created_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

Per **PRD Section 7 & 11.2**:
- Generates a UUID `idempotency_key` client-side upon initiating checkout.
- Automatically handles network outages: persists to local SQLite when offline (`offline_created_at`), then syncs to `/api/v1/transactions/sync` once online.

---

## 2. Geometry & Container Specs

- **Width:** `390px` (Fixed)
- **Height:** `100%` (Fixed to viewport height, matching the 944px main container)
- **Background Color:** `#F3EFEA` (Soft warm beige)
- **Border Left:** `1px solid #E2DBD3`
- **Box Shadow:** `0px 25px 50px -12px rgba(0, 0, 0, 0.25)` (`effect_842d987c`)
- **Layout:** Flex column, `justify-content: space-between`, `align-items: stretch`

---

## 3. Sub-Component Structure

```
+-------------------------------------------------------------+
| CartHeader (72px fixed height, #FFFFFF surface)             |
| - Order ID: "Pesanan #104" | "Antrean #04" | Clear Button   |
+-------------------------------------------------------------+
| OrderedItemsList (Scrollable flex-1, padding: 16px)         |
| - List of CartItem cards bound to transaction_items         |
+-------------------------------------------------------------+
| OrderSummary Footer (Sticky bottom, #FFFFFF surface)        |
| - Subtotal sum(transaction_items.subtotal)                  |
| - transactions.total_amount: Rp 129.950 | "Siap diproses"   |
| - Primary CTA: "Lanjut ke Pembayaran"                       |
+-------------------------------------------------------------+
```

---

## 4. Recommended Component Interface (Props)

```typescript
import { CartLineItem } from '../cart-item/design';

export interface CartPanelProps {
  boothId: string;             // references booths.id
  cashierId: string;           // references profiles.id
  orderNumber: string;         // e.g. "104"
  queueNumber: string;         // e.g. "04"
  items: CartLineItem[];
  subtotal: number;
  totalAmount: number;         // transactions.total_amount
  isOnline: boolean;
  onIncrementItem: (itemId: string) => void;
  onDecrementItem: (itemId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: (idempotencyKey: string) => void;
}
```
