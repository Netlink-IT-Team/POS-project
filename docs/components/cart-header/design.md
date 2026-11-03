# Cart Header Component Design Specification (`docs/components/cart-header/design.md`)
> **Component:** `CartHeader`  
> **Source Screen:** `Menu - Kopiko Pos` (Node ID: `1:136`)  
> **Schema Reference:** `schema/schema.sql` (`transactions`, `profiles`)  
> **PRD Reference:** `PRD.md` (Sections 3, 6, 7)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & Operational Purpose
The `CartHeader` sits at the top of the 390px fixed cart panel. It displays the active order sequence number (`Pesanan #104`), the customer queue tag (`Antrean #04`), and allows the cashier to discard the current transaction draft.

Per **PRD Section 6 & 7**:
- Enforces cashier-only management of active transaction drafts.
- Prepares client-side state before creating a `transactions` record with an idempotency UUID.

---

## 2. Geometry & Styling

- **Height:** `72px` (Fixed)
- **Width:** `100%`
- **Padding:** `20px`
- **Background Color:** `#FFFFFF` (`fill_658ab2fa`)
- **Border Bottom:** `1px solid #E8E2DA` (`fill_e4da8716`, `0px 0px 1px 0px`)
- **Layout:** Flex row, justify `space-between`, align `center`

---

## 3. Elements & Data Points

### 3.1 Order & Queue Group (Left)
- **Order Title (`#1:140`):**
  - Text: e.g. `Pesanan #104` (local session transaction counter)
  - Font Family: `Plus Jakarta Sans`, Bold `700`, `18px / 28px`, Color `#2C1810`
- **Queue Pill Badge (`#1:141`):**
  - Padding: `2px 10px`, border-radius `9999px`
  - Background: `rgba(198, 40, 40, 0.1)`, Border: `1px solid rgba(198, 40, 40, 0.2)`
  - Text: `Antrean #04` (Plus Jakarta Sans Bold 700, `12px / 16px`, Color `#C62828`)
- **Queue Subtext (`#1:147`):**
  - Icon + Text: `No. Antrean: 04` (Plus Jakarta Sans Medium 500, `12px / 16px`, Color `#6A5E59`)

### 3.2 Clear Cart Action Button (Right, `#1:148`)
- **Sizing:** Fixed `40px × 40px`, border-radius `14px`
- **Background:** `#FEF2F2`, Border: `1px solid #FECACA`
- **Icon (`#1:150`):** Trash can icon (`12.67px × 14.25px`, fill `#C62828`)
- **Behavior:** Discards in-memory draft of `transaction_items` and resets queue counter.

---

## 4. Recommended Component Interface (Props)

```typescript
export interface CartHeaderProps {
  orderNumber: string;         // e.g. "104"
  queueNumber: string;         // e.g. "04"
  isCartEmpty?: boolean;
  onClearCart: () => void;
}
```
