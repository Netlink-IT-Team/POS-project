# Search Input Component Design Specification (`docs/components/search-input/design.md`)
> **Component:** `SearchInput`  
> **Source Screen:** `Menu - Kopiko Pos` (Node ID: `1:10`–`1:15`)  
> **Schema Reference:** `schema/schema.sql` (`menu.name`, `menu.sku`)  
> **PRD Reference:** `PRD.md` (Sections 3, 10)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & Operational Role
The `SearchInput` allows booth cashiers to quickly locate items in the `menu` table by matching against `menu.name` (e.g. "Aren", "Latte") or `menu.sku` (e.g. "KPK-AREN-01").

---

## 2. Geometry & Styling

- **Height:** `48px`
- **Width:** `100%` (`flex: 1` in the top search bar row)
- **Container Positioning:** Relative
- **Border Radius:** `14px` (`rounded-lg`)
- **Background Color:** `#FFFFFF` (`fill_658ab2fa`)
- **Border:** `1px solid #E0D9D1` (`fill_e2e15dae`)
- **Box Shadow:** `0px 1px 2px 0px rgba(0, 0, 0, 0.05)` (`effect_0d0ada4b`)
- **Padding:** `13px 16px 13px 44px` (Left padding accommodates the 15px search icon)

---

## 3. Elements & States

### 3.1 Leading Search Icon (`#1:15`)
- **Position:** Absolute `x: 14px, y: 16.5px` (vertically centered)
- **Sizing:** `15px × 15px`, Color: `#6A5E59` (`fill_0d72a8b4`)

### 3.2 Text & Placeholder (`#1:13`)
- **Placeholder:** `"Cari menu kopi, pastry, atau minuman..."`
- **Font Family:** `Plus Jakarta Sans`, Medium `500`, `14px / 20px`
- **Color:** `rgba(168, 156, 151, 0.7)`, Input text: `#2C1810`

### 3.3 Clear Button
- If input text length > 0, show `(x)` clear icon on the right (`right: 14px`, color `#A89C97`).

---

## 4. Recommended Component Interface (Props)

```typescript
export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}
```
