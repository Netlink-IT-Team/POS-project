# Sidebar Navigation Component Design Specification (`docs/components/sidebar/design.md`)
> **Component:** `Sidebar`  
> **Source Screen:** `Menu - Kopiko Pos` (Node ID: `1:2`)  
> **Schema Reference:** `schema/schema.sql` (`profiles`, `user_role`)  
> **PRD Reference:** `PRD.md` (Sections 1, 2, 6)  
> **Target Platform:** Tablet Landscape (React Native / Expo & Next.js)  
> **Status:** Specification Complete

---

## 1. Overview & RBAC Role Enforcement

The `Sidebar` is the persistent left navigation column (width `288px`, height `100vh`).

Per **PRD Section 6 (RBAC)**:
- Specifically configured for `role: 'kasir'`.
- Restricts navigation strictly to cashier operational tasks:
  1. `Menu` — POS checkout & cart entry (`/menu`)
  2. `Stok` — Physical inventory & shift audit verification (`/stock`)
  3. `Settlement` — Shift close reconciliation & local history (`/settlement`)
- Administrative endpoints (`/admin`, global PIC metrics) are excluded by design.

---

## 2. Container Geometry & Styling

- **Placement:** Left anchor (`top: 0, left: 0, bottom: 0`)
- **Width:** `288px` (Fixed)
- **Height:** `100vh` (`1024px` in design frame)
- **Background Color:** `#1D0F0A` (Deep Espresso Dark)
- **Border:** `1px solid #3D2318` on right edge
- **Box Shadow:** `0px 25px 50px -12px rgba(0, 0, 0, 0.25)` (`effect_842d987c`)

---

## 3. Sections & Child Elements

### 3.1 Brand Header Section
- **Padding:** Top `24px`, bottom `32px`, horizontal `24px`.
- **Logo Badge Container:**
  - Width `72.72px`, Height `46px`, padding `6px`, background `rgba(255, 255, 255, 0.1)`, border `1px solid rgba(255, 255, 255, 0.15)`, border-radius `14px`, backdrop-filter `blur(6px)`.
- **Kopiko Brand Wordmark:**
  - Text: `KOPIKO`
  - Font: `Plus Jakarta Sans`, ExtraBold `800`, `24px / 24px`, letter-spacing `0.1em`, Color `#FFFFFF`.

---

### 3.2 Navigation Menu Items (Stack, Gap: 8px)

#### 1. Menu (Active Tab)
- **Padding:** `14px 16px`, border-radius `14px`, background `#C62828`.
- **Box Shadow:** `0px 4px 16px 0px rgba(198, 40, 40, 0.4)`.
- **Icon + Label:** Menu glyph (`18.33×18.33px`, `#FFFFFF`) + `Menu` (Bold 15px, `#FFFFFF`).

#### 2. Stok (Inactive Tab)
- Navigates to `/stock` (`booth_stocks` audit view).
- Background: Transparent, Icon + Text: `rgba(251, 249, 245, 0.75)` (SemiBold 15px).
- Hover: Background `rgba(255, 255, 255, 0.05)`, text `#FFFFFF`.

#### 3. Settlement (Inactive Tab)
- Navigates to `/settlement` (shift closing view).
- Background: Transparent, Icon + Text: `rgba(251, 249, 245, 0.75)` (SemiBold 15px).
- Hover: Background `rgba(255, 255, 255, 0.05)`, text `#FFFFFF`.

---

### 3.3 Bottom Section (Log Out)
- **Border Top:** `1px solid rgba(255, 255, 255, 0.1)`, padding-top `16px`.
- **Logout Link:** Padding `12px 16px`, border-radius `14px`, text `Log Out` (SemiBold 16px, `#FCA5A5`).
- **Action:** Clears active Supabase Auth session.

---

## 4. Recommended Component Interface (Props)

```typescript
export interface SidebarProps {
  activeRoute: 'menu' | 'stok' | 'settlement';
  onNavigate: (route: 'menu' | 'stok' | 'settlement') => void;
  onLogout: () => void;
  boothName?: string;
  isCollapsed?: boolean;
}
```
