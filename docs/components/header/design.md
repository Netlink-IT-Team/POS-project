# Header Component Design Specification (`docs/components/header/design.md`)
> **Component:** `Header`  
> **Source Screen:** `Menu - Kopiko Pos` (Node ID: `1:234`)  
> **Schema Reference:** `schema/schema.sql` (`booths`, `profiles`, `user_role`)  
> **PRD Reference:** `PRD.md` (Sections 1, 6, 7)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & Operational Purpose
The `Header` component is anchored at the top of the viewport (`x: 288px`, `width: calc(100% - 288px)`). It surfaces critical operational context:
- Physical booth identity (`booths.name` and `booths.code`).
- Live network connectivity indicator (Online POS vs. Offline POS Lokal fallback per **PRD Section 7**).
- Authenticated cashier session (`profiles.full_name`, where `profiles.role = 'kasir'`).

---

## 2. Container Geometry & Styling

- **Placement:** Absolute / sticky top (`top: 0, left: 288px, right: 0`)
- **Width:** `calc(100% - 288px)` (`992px` in 1280px viewport)
- **Height:** `80px` (Fixed)
- **Padding:** `0px 24px`
- **Background Color:** `rgba(251, 249, 245, 0.9)` (`fill_514aa795` with 90% opacity)
- **Border Bottom:** `1px solid #E3DCD5`
- **Backdrop Filter:** `blur(12px)`
- **Box Shadow:** `0px 1px 2px 0px rgba(0, 0, 0, 0.05)` (`effect_0d0ada4b`)
- **Layout:** Flex row, justify `space-between`, align `center`

---

## 3. Child Elements & Groupings

### 3.1 Left Context Group (Booth & Network Status)
Flex row, align `center`, gap `12px`.

#### 1. Booth Identifier Pill (`#1:236`)
- Maps to `booths.name` (e.g. `Booth Mall Senayan #01`).
- **Padding:** `6px 14px`, Border Radius: `9999px`
- **Background:** `#2C1810` (Dark Espresso), Border: `1px solid rgba(68, 40, 30, 0.4)`
- **Icon:** Location pin SVG (`12px × 15px`, fill `#EF5350`)
- **Typography:** `Plus Jakarta Sans`, Bold `700`, `12px / 16px`, tracking `0.025em`, Color `#FBF9F5`

#### 2. Connection Status Pill (`#1:241`)
Controls offline queue behavior per **PRD Section 7**:
- **Online State (`isOnline: true`):**
  - Background: `#ECFDF5`, Border: `1px solid #A7F3D0`
  - Dot: `8px × 8px`, background `#10B981` (Emerald Green)
  - Text: `Online POS` (SemiBold 12px, `#047857`)
- **Offline State (`isOnline: false`):**
  - Background: `#FEF3C7`, Border: `1px solid #FDE68A`
  - Dot: `8px × 8px`, background `#F59E0B` (Amber)
  - Text: `Offline POS (Lokal)` (SemiBold 12px, `#B45309`)

---

### 3.2 Right Profile Group (`#1:244`)
Flex row, align `center`, gap `14px`.

#### 1. Cashier Name
- Maps to `profiles.full_name` where `profiles.role = 'kasir'`.
- Typography: `Plus Jakarta Sans`, Bold `700`, `14px / 19.25px`, Color `#2C1810`.

#### 2. Avatar Container (`#1:251`)
- Sizing: `40px × 40px`, border-radius `9999px`, background `#2C1810`.
- Box Shadow: `0px 2px 4px -2px rgba(0, 0, 0, 0.1), 0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 0px 0px 2px rgba(198, 40, 40, 0.2)`.
- Active Presence Badge: `14px × 14px`, background `#10B981`, border `2px solid #FFFFFF`.

---

## 4. Recommended Component Interface (Props)

```typescript
export interface HeaderProps {
  boothId: string;              // references booths.id
  boothName: string;            // booths.name (e.g. "Booth Mall Senayan #01")
  boothCode?: string;           // booths.code (e.g. "JKT-SNY-01")
  isOnline: boolean;            // Controls Online vs Offline fallback
  cashierName: string;          // profiles.full_name
  cashierRole: 'kasir';         // user_role enum
  cashierAvatarUrl?: string;
  onProfileClick?: () => void;
}
```
