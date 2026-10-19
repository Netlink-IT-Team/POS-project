# Product Requirements Document (PRD) & Technical Specification
## Project: Kopiko POS & Interactive System

---

## 1. Scope & Stakeholders
- Scale: 532 booth locations across Java Island.
- Stakeholders: Booth workers (Kasir), PIC (Operations Managers), Visitors/Public, and Super Admin.

---

## 2. Render Platforms
- Web (PIC & Visitors): Next.js (Optimized for Desktop & Mobile views).
- Mobile App (Booth Workers): Expo / React Native (Tablet Horizontal Layout).

---

## 3. Core Features
- POS & Payments: Dynamic QRIS generation (via Xendit) and cash processing. Automatic fallback to cash and static booth QRIS during network outages.
- Shift-Based Stock Auditing: Mandatory opening and closing physical stock logging. Requires photo verification for counted items (cups, lids) and weighed items (syrup, sugar, powder) to track usage variance per shift without complex real-time recipe deduction.
- Revenue & Audit Monitoring: Global tracking for PIC across all booths (cash drawer reconciliation, sales totals, opening vs. closing inventory photos and weight discrepancies).
- Interactive Visitor Web Page: Nearest booth locator, immersive menu, and gamified points system to redeem free drinks.

---

## 4. Technology Stack
- Frontend: Monorepo (Next.js & Expo / React Native). Client-side image compression (Expo ImageManipulator) before storage upload.
- Backend: Go (Latest version).
- Database & Storage: Supabase (PostgreSQL with PgBouncer connection pooling & S3-compatible storage bucket for audit photos).
- Authentication: Supabase Auth.
- Infrastructure & Deployment: VPS Hosting via Docker Container.
- Payment Gateway: Xendit.

---

## 5. CI/CD Pipeline (GitHub Actions)
- Code quality checks (Linting & Type checking).
- Database & Auth connection verification.
- Automated API & routes test suites.
- Security scanning (Anti-SQL injection & input sanitization).
- Docker image build and automated VPS deployment.

---

## 6. Role-Based Access Control (RBAC)

| Role | Access Permissions | Restrictions |
| :--- | :--- | :--- |
| Visitor / Public | Interactive web page, browse menu, find nearest booths, play games, redeem points. | Zero access to POS, checkout APIs, or administrative dashboards. |
| Booth Worker (Kasir) | POS interface (QRIS & cash), submit shift open/close audit with scale/stock photos, local transaction history. | Cannot view global revenue, other booths' data, or system settings. |
| PIC (Operations Manager) | Global monitoring dashboard, full visibility of revenue, cash reconciliation, and side-by-side audit photo comparisons across all 532 booths. | Cannot modify backend code, database schemas, or low-level server configurations. |
| Super Admin | Full system control (backend, database, user management, game/point configs, deployment logs). | None. |

---

## 7. Offline Mode & Data Sync Strategy
- Payment Fallback: If internet connectivity drops, POS locks Dynamic QRIS and falls back to Cash or Static Booth QRIS.
- Local Storage First: Offline cash/static QR transactions are stored locally (SQLite on mobile/tablet) with unique client idempotency UUIDs.
- Background Synchronization: Queued transactions automatically sync to the Go backend via /api/v1/transactions/sync once internet connectivity recovers.
- Conflict Resolution: Server-side timestamp validation and transaction idempotency keys prevent duplicate transaction commits during sync retries.

---

## 8. Backend Performance, Security & Concurrency Control
- Rate Limiting: Redis and Token Bucket algorithm implemented in the Go backend to protect auth, checkout, and point-redemption endpoints from abuse.
- Spin-Wheel Game Architecture: Atomic decrement (DECR) via Redis Lua scripts for prize quotas to eliminate lock contention on PostgreSQL. Async background workers persist member_spin_logs to Supabase.
- Shift Audit Storage Optimization: Client compresses audit photos (max resolution 1280px, ~200-300 KB JPEG) before uploading directly to Supabase Storage via pre-signed URLs to prevent network timeouts at low-bandwidth booths.
- Caching Strategy: Redis caching layer for semi-static data (menus, booth coordinates, prize weight configurations) to minimize Supabase read load.

---

## 9. Payment Gateway & Webhook Security
- Flow: Cashier triggers checkout -> Go backend requests dynamic QRIS via Xendit -> Displayed on POS terminal -> Webhook listener processes payment status asynchronously.
- Webhook Endpoint: Public endpoint POST /api/v1/webhooks/xendit isolated from staff auth middleware.
- Security & Idempotency: Validates Xendit webhook callback token (x-callback-token) and checks webhook idempotency keys to safely ignore duplicate callbacks.

---

## 10. Database Schema Specifications
PostgreSQL schema configured for Supabase integration:

- booths: Stores 532 booth details, region, address, coordinates (lat/long), static QRIS image URL, and active status.
- profiles: Links to auth.users for RBAC roles (kasir, pic, super_admin) and assigned booth_id.
- booth_shifts: Tracks shift lifecycle (open, closed), assigned cashier, timestamps, opening/closing cash drawers, and PIC verification flags.
- shift_stock_audits: Stores physical audit logs per shift with item name, tracking type (weighed vs counted), measured quantity (grams/units), audit stage (opening vs closing), and Supabase Storage photo URL.
- products: Catalog of ready-to-sell Kopiko beverage items and retail pricing.
- transactions: Records orders, booth ID, shift ID, payment methods (dynamic_qris, static_qris, cash), payment status, Xendit invoice IDs, and mandatory idempotency_key.
- transaction_items: Line items mapping sold products and quantities to specific transactions.
- user_redemptions: Tracks visitor game points and drink claim statuses.
- visitor_profiles: Stores registered members with phone_number, email, and verification status.
- spin_rewards: Defines available spin-wheel prizes, probability weights, daily/total quotas, and active status.
- member_spin_logs: Tracks visitor spin history and awarded prizes to enforce daily rate limits.

---

## 11. API Specifications (Summary)

### 11.1. Visitor / Public
- GET /api/v1/booths/nearest: Nearest booth locator.
- GET /api/v1/products: Menu catalog listing.
- POST /api/v1/members/register: Member registration using phone/email.
- POST /api/v1/games/spin: Spin-wheel execution with server-side weighted randomization.
- POST /api/v1/games/redeem: Gamified point redemption for drink vouchers.
- GET /api/v1/members/rewards: View claimed vouchers and points history.

### 11.2. Booth Worker (Kasir)
- POST /api/v1/auth/login: Authentication wrapper.
- POST /api/v1/shifts/open: Start shift, submit opening cash, item weights, counts, and photo URLs.
- POST /api/v1/shifts/close: End shift, submit closing cash, item weights, counts, and closing photo URLs.
- POST /api/v1/transactions: POS checkout execution (requires Idempotency-Key header).
- POST /api/v1/transactions/sync: Offline transaction queue bulk synchronization.

### 11.3. PIC (Operations Manager)
- GET /api/v1/pic/dashboard/metrics: Global revenue, transaction counts, and active booths overview.
- GET /api/v1/pic/shifts: List shift records across booths.
- GET /api/v1/pic/shifts/{shift_id}/audit: Retrieve detailed side-by-side opening vs. closing stock photos, weighed deltas, and cash reconciliation.

### 11.4. Webhook & System
- POST /api/v1/webhooks/xendit: Xendit payment confirmation webhook (signature & token verified).

### 11.5. Super Admin
- POST /api/v1/admin/users: Create and assign kasir/PIC accounts.
- GET /api/v1/admin/users: Retrieve staff directory and booth assignments.
- DELETE /api/v1/admin/users/{id}: Revoke access or delete staff account.
- PATCH /api/v1/admin/rewards/quota: Manage spin-wheel prizes and daily quota limits.

---

## 12. Future Development (Phase 2)
- Bluetooth Thermal Printer: Integration for portable physical receipt printing on cashier tablets.
- Barcode / QR Handheld Scanner: USB/Bluetooth scanner support for faster voucher redemptions and cashier workflows.