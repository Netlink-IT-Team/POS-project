# Order Summary Component Design Specification (`docs/components/order-summary/design.md`)
> **Component:** `OrderSummary`  
> **Source Screen:** `Menu - Kopiko Pos` (Node ID: `1:212`–`1:233`)  
> **Schema Reference:** `schema/schema.sql` (`transactions`, `payment_method`, `payment_status`)  
> **PRD Reference:** `PRD.md` (Sections 3, 7, 9, 11.2)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & Operational Purpose

The `OrderSummary` component is the sticky checkout controller mounted at the bottom of the Cart Panel. It aggregates the order subtotal, validates readiness, computes `transactions.total_amount`, and triggers payment initialization:

```sql
-- Evaluates into transactions table
create table transactions (
    id uuid primary key default uuid_generate_v4(),
    booth_id uuid not null references booths(id),
    cashier_id uuid references profiles(id),
    idempotency_key uuid unique not null,
    payment_method payment_method not null,
    status payment_status not null default 'pending',
    total_amount numeric(12, 2) not null check (total_amount >= 0),
    ...
);
```

Per **PRD Section 7 & 9**:
- Prevents double-spend via mandatory client UUID `idempotency_key`.
- Switches between dynamic QRIS (via Xendit) and Cash payment workflows.

---

## 2. Geometry & Styling

- **Height:** Auto (`hug`)
- **Width:** `100%`
- **Padding:** `20px`
- **Gap:** `16px`
- **Background Color:** `#FFFFFF` (`fill_658ab2fa`)
- **Border Top:** `1px solid #E8E2DA` (`fill_e4da8716`, `1px 0px 0px 0px`)
- **Box Shadow:** `0px -6px 20px 0px rgba(44, 24, 16, 0.04)`
- **Layout:** Flex column, `align-items: stretch`

---

## 3. Sections & Rows

### 3.1 Subtotal Row (`#1:214`)
- **Layout:** Flex row, justify `space-between`, align `center`
- **Label (`#1:216`):** `Subtotal ({itemCount} items)` (Medium 14px, `#6A5E59`).
- **Amount (`#1:218`):** Formatted subtotal currency (SemiBold 14px, `#2C1810`).

### 3.2 Total Payment Block (`#1:219`)
- **Border Top:** `1px solid #ECE5DD`, padding-top `17px`
- **Layout:** Flex row, justify `space-between`, align `center`
- **Left Group:**
  - Overline: `TOTAL PEMBAYARAN` (Bold 12px, uppercase, tracking `0.05em`, `#6A5E59`).
  - Operational Status: `Siap diproses` (SemiBold 12px, `#059669`).
- **Right Group: Main Price Amount (`#1:224`):**
  - Displays `transactions.total_amount` (e.g. `Rp 129.950`).
  - Font: `Plus Jakarta Sans`, ExtraBold `800`, `24px / 32px`, Color `#C62828`.

### 3.3 Primary Payment CTA Button (`#1:226`)
- **Height:** `58px`, width `100%`, border-radius `20px` (`rounded-xl`).
- **Background:** `#C62828`, border `1px solid rgba(248, 113, 113, 0.2)`.
- **Box Shadow:** `0px 4px 6px -4px rgba(198, 40, 40, 0.25), 0px 10px 15px -3px rgba(198, 40, 40, 0.25)`.
- **Label:** `Lanjut ke Pembayaran` (ExtraBold 16px, `#FFFFFF`).
- **Disabled State:** Disabled when `itemCount === 0` (`opacity: 0.4`, non-clickable).

---

## 4. Recommended Component Interface (Props)

```typescript
export interface OrderSummaryProps {
  itemCount: number;
  subtotal: number;
  totalAmount: number;         // transactions.total_amount
  isReady?: boolean;
  onProceedToPayment: (idempotencyKey: string) => void;
}
```
