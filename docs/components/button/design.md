# Button Component Design Specification (`docs/components/button/design.md`)
> **Component:** `Button`  
> **Source Screens:** `Menu` (`node-id: 1:2`) & `Stock Management` (`node-id: 26:2513`)  
> **Schema Reference:** `schema/schema.sql` (`transactions`, `payment_method`, `booth_stocks`)  
> **PRD Reference:** `PRD.md` (Sections 3, 7, 9, 11.2)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & Operational Role
Buttons in the Kopiko POS interface are designed for tactile feedback, rapid finger targeting under rush hours (minimum touch target 40×40px, up to 58px for checkout triggers), and zero ambiguity.

Per **PRD Section 7 & 9**:
- Primary checkout triggers generate a client UUID `idempotency_key` to shield against network retries and duplicate commits.
- Primary CTA triggers dynamic QRIS or Cash payment workflows.

---

## 2. Button Variants & Specs

### 2.1 Primary Crimson Checkout CTA (`variant="primary"`)
Used exclusively for executing transactions in the Cart Footer (`Lanjut ke Pembayaran`) and receiving incoming stock (`Penerimaan Stok Masuk`).

- **Height:** `58px` (Cart) / `48px` (Stock dock)
- **Width:** `100%` (fill container)
- **Padding:** `16px 20px`
- **Border Radius:** `20px` (`rounded-xl`)
- **Background Color:** `#C62828` (Kopiko Signature Deep Crimson)
- **Border:** `1px solid rgba(248, 113, 113, 0.2)`
- **Box Shadow:** `0px 4px 6px -4px rgba(198, 40, 40, 0.25), 0px 10px 15px -3px rgba(198, 40, 40, 0.25)`
- **Typography:** `Plus Jakarta Sans`, ExtraBold `800`, `16px / 24px`, tracking `0.025em`, Color `#FFFFFF`
- **Icons:** Leading payment/box icon + Trailing arrow right icon (`#FFFFFF`)
- **State Handling:**
  - *Disabled (Empty Cart / Processing):* `opacity: 0.4`, `box-shadow: none`, non-clickable. Prevents race conditions.

---

### 2.2 Product Add Button (`variant="product-add"`)
Mounted on bottom-right of each `menu` card. Increments `transaction_items.quantity`.

- **Sizing:** Fixed `36px × 36px`
- **Border Radius:** `14px` (`rounded-lg`)
- **Background Color:** `#2C1810` (Dark Espresso)
- **Box Shadow:** `0px 1px 2px 0px rgba(0, 0, 0, 0.05)`
- **Icon:** Centered `+` plus symbol (`11.67px × 11.67px`, `#FBF9F5`)
- **Active State:** `transform: scale(0.92)`

---

### 2.3 Stepper Buttons (`variant="stepper-minus"` & `variant="stepper-plus"`)
Manipulates `transaction_items.quantity` in cart line items. Enforces `check (quantity > 0)`.

- **Minus (`-`):** `28×28px`, border-radius `10px`, background `#EFECE6`, text `#2C1810` (Bold 14px). Decrementing past 1 triggers item removal from transaction draft.
- **Plus (`+`):** `28×28px`, border-radius `10px`, background `#2C1810`, text `#FFFFFF` (Bold 14px).

---

### 2.4 Category Filter Chip (`variant="category-chip"`)
Filters catalog items from the `menu` table.
- **Active State:** Background `#C62828`, Text `#FFFFFF` (Bold 14px), shadow `shadow-chip-active`.
- **Inactive State:** Background `#FFFFFF`, Border `1px solid #E0D9D1`, Text `#2C1810` (SemiBold 14px).

---

### 2.5 Quick Stock Adjust Button (`variant="quick-adjust"`)
Used in `booth_stocks` table rows for physical shift stock audit adjustments.
- **Height:** `32px`
- **Padding:** `6px 12px`
- **Border Radius:** `10px`
- **Background Color:** `#EFECE6` (Dark stone)
- **Typography:** `Plus Jakarta Sans`, Bold `700`, `12px`, Color `#1E1A18`
- **Text:** `+ Quick Adjust`

---

### 2.6 Destructive / Clear Cart Button (`variant="destructive-icon"`)
Clears active cart order draft.
- **Sizing:** Fixed `40px × 40px`, border-radius `14px`, background `#FEF2F2`, border `1px solid #FECACA`.
- **Icon:** Trash icon (`#C62828`).

---

## 3. Recommended Component Interface (Props)

```typescript
export interface ButtonProps {
  variant?: 
    | 'primary'          // Cart Checkout CTA
    | 'product-add'     // Product card (+)
    | 'stepper-minus'   // Cart quantity decrement (-)
    | 'stepper-plus'    // Cart quantity increment (+)
    | 'category-chip'   // Menu category tabs
    | 'quick-adjust'    // Stock table adjustment
    | 'filter'          // Filter beside search
    | 'destructive-icon'; // Clear cart (trash)
  
  isActive?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  onPress?: () => void;
  title?: string;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  children?: React.ReactNode;
}
```
