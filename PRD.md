# Product Requirements Document (PRD) & Technical Specification
## Project: Kopiko POS & Interactive System

---

## 1. Scope & Stakeholders
- **Scale:** 532 booth locations across Java Island.
- **Stakeholders:** Booth workers (Kasir), PIC (Operations Managers), Visitors/Public, and Super Admin.

---

## 2. Render Platforms
- **Web (PIC & Visitors):** Next.js (Optimized for Desktop & Mobile views).
- **Mobile App (Booth Workers):** Expo / React Native (Tablet Horizontal Layout).

---

## 3. Core Features
- **POS & Payments:** Dynamic QRIS generation (via Xendit) and cash processing.
- **Inventory Control:** Real-time stock monitoring, category-based tracking (powder, syrup, milk, galon, packaging, lid, sealer), and automated low-stock reminders.
- **Revenue Monitoring:** Global tracking for operations managers across all booths.
- **Interactive Visitor Web Page:** Nearest booth locator, immersive menu, and gamified points system to redeem free drinks.

---

## 4. Technology Stack
- **Frontend:** Monorepo (Next.js & Expo / React Native).
- **Backend:** Go (Latest version).
- **Database & Storage:** Supabase (PostgreSQL & S3 object storage).
- **Authentication:** Supabase Auth.
- **Infrastructure & Deployment:** VPS Hosting via Docker Container.
- **Payment Gateway:** Xendit.

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
| **Visitor / Public** | Interactive web page, browse menu, find nearest booths, play games, redeem points. | Zero access to POS, checkout APIs, or administrative dashboards. |
| **Booth Worker (Kasir)** | POS interface (QRIS & cash), local stock monitoring, and low-stock alerts for assigned booth. | Cannot view global revenue, other booths' data, or system settings. |
| **PIC (Operations Manager)** | Global monitoring dashboard, full visibility of revenue and stock levels across all 532 booths. | Cannot modify backend code, database schemas, or low-level server configurations. |
| **Super Admin** | Full system control (backend, database, user management, game/point configs, deployment logs). | None. |

---

## 7. Offline Mode & Data Sync Strategy
- **Local Storage First:** Transactions, local stock updates, and offline activity logs are stored locally (IndexedDB/SQLite) during network outages.
- **Background Synchronization:** Automatically syncs the transaction queue to the Go backend and Supabase once connection is re-established.
- **Conflict Resolution:** Server-side timestamp validation and transaction idempotency keys prevent double-deduction or inventory discrepancies.

---

## 8. Backend Performance, Security & Concurrency Control
- **Rate Limiting:** Redis and Token Bucket algorithm implemented in the Go backend to protect auth, payment generation, and point-redemption endpoints from bot spam.
- **Race Condition Prevention:** Database-level transaction isolation, row-level locking (`SELECT ... FOR UPDATE`), and idempotency keys to eliminate double-spending or negative inventory.
- **Caching Strategy:** Redis caching layer for semi-static data (menus, nearest booth coordinates, game configurations) to minimize Supabase read load.
- **Spin-Wheel Game Architecture:** Strict rate limiting via Redis per IP and member account. Server-side weighted probability randomization determines prize outcomes to prevent client tampering, executed within atomic database transactions with row locks on reward quotas.

---

## 9. Payment Gateway & Transaction Idempotency
- **Flow:** Cashier triggers checkout → Go backend requests dynamic QRIS via Xendit → Displayed on POS terminal → Webhook listener updates real-time payment status.
- **Idempotency Control:** Every checkout request requires a unique client-side UUID Idempotency Key. The backend verifies this key in Redis/Database to safely reject duplicate submissions from network retries or double taps.

---

## 10. Database Schema Specifications
PostgreSQL schema configured for Supabase integration:

- `booths`: Stores 532 booth details, region, address, coordinates (lat/long), and active status.
- `profiles`: Links to `auth.users` for RBAC roles (`kasir`, `pic`, `super_admin`) and assigned `booth_id`.
- `booth_stocks`: Manages inventory per booth with categories (powder, syrup, milk, galon, packaging, lid, sealer), quantities, and minimum thresholds with non-negative constraints.
- `products`: Catalog of Kopiko beverage items and pricing.
- `transactions`: Records orders, payment methods, status, total amount, Xendit invoice IDs, and mandatory unique `idempotency_key`.
- `transaction_items`: Line items mapping products and quantities to specific transactions.
- `user_redemptions`: Tracks visitor game points and free drink claim statuses.
- `visitor_profiles`: Stores registered members with `phone_number`, `email`, `created_at`, and `is_verified` status for authentication.
- `spin_rewards`: Defines available spin-wheel prizes, winning probability weights, daily/total quotas, and active status.
- `member_spin_logs`: Tracks individual member spin history, awarded prizes, and timestamp verification to enforce daily limits.

---

## 11. API Specifications (Summary)

### 11.1. Visitor / Public
- `GET /api/v1/booths/nearest` - Nearest booth locator.
- `GET /api/v1/products` - Menu listing.
- `POST /api/v1/games/redeem` - Gamified point redemption for free drinks.
- `POST /api/v1/members/register` - Member registration using phone number and email authentication.
- `POST /api/v1/games/spin` - Spin-wheel minigame execution with server-side prize randomization.
- `GET /api/v1/members/rewards` - View claimed rewards, active vouchers, and points history.

### 11.2. Booth Worker (Kasir)
- `POST /api/v1/auth/login` - Authentication wrapper.
- `POST /api/v1/transactions` - POS checkout execution (requires `Idempotency-Key` header).
- `POST /api/v1/webhooks/xendit` - Xendit payment confirmation webhook.
- `POST /api/v1/stocks/sync` - Offline transaction batch synchronization.

### 11.3. PIC (Operations Manager)
- `GET /api/v1/stocks` - Real-time inventory monitoring per booth.

### 11.4. Super Admin
- `POST /api/v1/admin/users` - Create new kasir/PIC account via Supabase Admin API.
- `GET /api/v1/admin/users` - Retrieve all staff/PIC accounts.
- `DELETE /api/v1/admin/users/{id}` - Revoke access / delete staff account.

---

## 12. Future Development (Phase 2)
- **Bluetooth Thermal Printer:** Integration for portable physical receipt printing on tablets/mobile devices.
- **Barcode / QR Handheld Scanner:** External USB/Bluetooth scanner support for high-traffic cashier queues.