# Category Chips Component Design Specification (`docs/components/category-chips/design.md`)
> **Component:** `CategoryChips`  
> **Source Screen:** `Menu - Kopiko Pos` (Node ID: `1:21`–`1:32`)  
> **Schema Reference:** `schema/schema.sql` (`menu`)  
> **PRD Reference:** `PRD.md` (Sections 3, 10, 11.1)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & Operational Purpose
The `CategoryChips` component renders a horizontally scrollable list of category filter buttons that partition items queried from the `menu` table (`SELECT * FROM menu WHERE is_active = true`).

---

## 2. Geometry & Layout

- **Container Height:** `46px` (Fixed)
- **Container Overflow:** `overflow-x: auto` (horizontal scrolling with hidden scrollbars)
- **Item Gap:** `8px`–`12px`
- **Item Sizing:** `horizontal: hug`, `vertical: hug` (individual chip height: `40px`)
- **Alignment:** Flex row, vertically centered

---

## 3. Chip Specs

### 3.1 Active Category Chip (`#1:22`–`#1:24`)
Example: `"Semua Menu"`
- **Padding:** `10px 20px`, Border Radius: `14px` (`rounded-lg`)
- **Background Color:** `#C62828` (Kopiko Signature Crimson)
- **Border:** None
- **Box Shadow:** `0px 2px 4px -2px rgba(198, 40, 40, 0.25), 0px 4px 6px -1px rgba(198, 40, 40, 0.25)`
- **Typography:** `Plus Jakarta Sans`, Bold `700`, `14px / 20px`, Color `#FFFFFF`

### 3.2 Inactive Category Chip (`#1:25`–`#1:32`)
Examples: `"Signature Coffee"`, `"Manual Brew"`, `"Non-Coffee"`, `"Pastry & Snack"`
- **Padding:** `10px 20px`, Border Radius: `14px` (`rounded-lg`)
- **Background Color:** `#FFFFFF` (`fill_658ab2fa`)
- **Border:** `1px solid #E0D9D1` (`fill_e2e15dae`)
- **Box Shadow:** `0px 1px 2px 0px rgba(0, 0, 0, 0.05)` (`effect_0d0ada4b`)
- **Typography:** `Plus Jakarta Sans`, SemiBold `600`, `14px / 20px`, Color `#2C1810`
- **Hover / Active State:** Background `#F7F5F0`, border `#D6CEC5`

---

## 4. Default POS Menu Categories
1. `all`: "Semua Menu" (default, shows all active items from `menu`)
2. `signature`: "Signature Coffee" (e.g. Kopiko Aren Latte, Kopiko Black Supreme)
3. `manual_brew`: "Manual Brew" (e.g. Manual V60 Gayo, Aeropress)
4. `non_coffee`: "Non-Coffee" (e.g. Matcha Espresso, Chocolate)
5. `pastry`: "Pastry & Snack" (e.g. Croissant Butter, Biskuit Regal)

---

## 5. Recommended Component Interface (Props)

```typescript
export interface CategoryItem {
  id: string;
  name: string;
}

export interface CategoryChipsProps {
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}
```
