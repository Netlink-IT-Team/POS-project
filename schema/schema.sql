-- ====================================================================
-- KOPIKO POS DATABASE SCHEMA (FOKUS KASIR & OPERASIONAL BOOTH)
-- Database Engine: PostgreSQL 15+ (Supabase)
-- ====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('kasir');
create type stock_category as enum ('powder', 'syrup', 'milk', 'galon', 'packaging', 'lid', 'sealer');
create type payment_method as enum ('cash', 'qris');
create type payment_status as enum ('pending', 'completed', 'failed', 'refunded');
create type shift_status as enum ('open', 'closed');
create type audit_tracking_type as enum ('weighed', 'counted');
create type audit_stage as enum ('opening', 'closing');

-- 1. BOOTHS (532 Booth Kopiko se-Jawa)
create table booths (
    id uuid primary key default uuid_generate_v4(),
    code varchar(50) unique not null,
    name varchar(255) not null,
    region varchar(100) not null,
    address text not null,
    latitude decimal(10, 8),
    longitude decimal(11, 8),
    static_qris_url text, -- QRIS statis booth saat koneksi offline
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. PROFILES (Akun Kasir)
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role user_role not null default 'kasir',
    booth_id uuid references booths(id) on delete set null,
    full_name varchar(255),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. BOOTH SHIFTS (Siklus Buka/Tutup Shift Kasir & Rekonsiliasi Kas)
create table booth_shifts (
    id uuid primary key default uuid_generate_v4(),
    booth_id uuid not null references booths(id) on delete cascade,
    cashier_id uuid not null references profiles(id),
    shift_number integer not null default 1 check (shift_number in (1, 2, 3)),
    status shift_status not null default 'open',
    opened_at timestamptz not null default now(),
    closed_at timestamptz,
    opening_cash numeric(12, 2) not null default 0 check (opening_cash >= 0),
    closing_cash_actual numeric(12, 2) check (closing_cash_actual >= 0),
    closing_cash_expected numeric(12, 2) check (closing_cash_expected >= 0),
    cash_discrepancy numeric(12, 2), -- actual - expected
    closing_notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. BOOTH STOCKS (Stok Bahan Baku Booth Kasir)
create table booth_stocks (
    id uuid primary key default uuid_generate_v4(),
    booth_id uuid not null references booths(id) on delete cascade,
    category stock_category not null,
    item_name varchar(150) not null,
    quantity numeric(12, 2) not null default 0 check (quantity >= 0),
    min_threshold numeric(12, 2) not null default 10 check (min_threshold >= 0),
    unit varchar(50) not null, -- e.g. 'kg', 'pcs', 'liter', 'galon'
    updated_at timestamptz default now(),
    unique(booth_id, item_name)
);

-- 5. SHIFT STOCK AUDITS (Audit Foto Timbangan Fisik Buka/Tutup Shift)
create table shift_stock_audits (
    id uuid primary key default uuid_generate_v4(),
    shift_id uuid not null references booth_shifts(id) on delete cascade,
    stock_item_id uuid references booth_stocks(id) on delete set null,
    item_name varchar(150) not null,
    tracking_type audit_tracking_type not null, -- 'weighed' (timbangan) vs 'counted' (hitungan fisik)
    measured_quantity numeric(12, 2) not null check (measured_quantity >= 0),
    unit varchar(50) not null, -- e.g. 'grams', 'pcs', 'ml'
    stage audit_stage not null, -- 'opening' vs 'closing'
    photo_url text not null, -- foto terkompresi <= 1280px
    notes text,
    created_at timestamptz default now()
);

-- 6. MENU (Katalog Minuman Kopiko untuk Kasir POS)
create table menu (
    id uuid primary key default uuid_generate_v4(),
    name varchar(255) not null,
    sku varchar(100) unique not null,
    description text,
    price numeric(12, 2) not null check (price >= 0),
    image_url text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 7. TRANSACTIONS (Transaksi Penjualan Kasir POS)
create table transactions (
    id uuid primary key default uuid_generate_v4(),
    booth_id uuid not null references booths(id),
    shift_id uuid references booth_shifts(id) on delete set null,
    cashier_id uuid references profiles(id),
    idempotency_key uuid unique not null, -- pelindung race condition & offline sync
    payment_method payment_method not null,
    status payment_status not null default 'pending',
    total_amount numeric(12, 2) not null check (total_amount >= 0),
    xendit_invoice_id varchar(255),
    xendit_payment_url text,
    offline_created_at timestamptz, -- timestamp asli saat transaksi offline di tablet
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 8. TRANSACTION ITEMS (Detail Item Struk Penjualan Kasir)
create table transaction_items (
    id uuid primary key default uuid_generate_v4(),
    transaction_id uuid not null references transactions(id) on delete cascade,
    menu_id uuid not null references menu(id),
    quantity integer not null check (quantity > 0),
    price_per_unit numeric(12, 2) not null check (price_per_unit >= 0),
    subtotal numeric(12, 2) not null check (subtotal >= 0),
    created_at timestamptz default now()
);

-- ====================================================================
-- INDEXES UNTUK PERFORMA QUERY CEPAT TABLET KASIR
-- ====================================================================
create index idx_booth_shifts_booth on booth_shifts (booth_id);
create index idx_booth_shifts_status on booth_shifts (status);
create index idx_booth_shifts_cashier on booth_shifts (cashier_id);
create index idx_shift_stock_audits_shift on shift_stock_audits (shift_id);
create index idx_shift_stock_audits_stage on shift_stock_audits (shift_id, stage);
create index idx_booth_stocks_booth on booth_stocks (booth_id);
create index idx_transactions_booth on transactions (booth_id);
create index idx_transactions_shift on transactions (shift_id);
create index idx_transactions_status on transactions (status);
create index idx_transactions_idempotency on transactions (idempotency_key);

-- TRIGGER: Auto-create profile kasir saat signup via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, role, full_name)
    values (
        new.id,
        'kasir',
        coalesce(new.raw_user_meta_data->>'full_name', 'Kasir Kopiko')
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) KHUSUS KASIR
-- ====================================================================
alter table booths enable row level security;
alter table profiles enable row level security;
alter table booth_shifts enable row level security;
alter table shift_stock_audits enable row level security;
alter table booth_stocks enable row level security;
alter table menu enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;

-- Kasir dapat membaca booth dan menu aktif
create policy "kasir_read_booths" on booths for select using (is_active = true);
create policy "kasir_read_menu" on menu for select using (is_active = true);

-- Kasir hanya dapat melihat profil booth sendiri
create policy "kasir_read_profiles" on profiles for select
    using (auth.uid() = id);

-- Kasir mengelola shift booth sendiri
create policy "kasir_manage_shifts" on booth_shifts for all
    using (booth_id = (select booth_id from profiles where id = auth.uid()));

-- Kasir mengunggah dan melihat audit stok shift booth sendiri
create policy "kasir_view_stock_audits" on shift_stock_audits for select
    using (
        shift_id in (
            select id from booth_shifts 
            where booth_id = (select booth_id from profiles where id = auth.uid())
        )
    );

create policy "kasir_insert_stock_audits" on shift_stock_audits for insert
    with check (
        shift_id in (
            select id from booth_shifts 
            where booth_id = (select booth_id from profiles where id = auth.uid())
        )
    );

-- Kasir mengelola stok bahan baku di boothnya
create policy "kasir_manage_booth_stocks" on booth_stocks for all
    using (booth_id = (select booth_id from profiles where id = auth.uid()));

-- Kasir mencatat transaksi di boothnya
create policy "kasir_insert_transactions" on transactions for insert
    with check (booth_id = (select booth_id from profiles where id = auth.uid()));

create policy "kasir_view_transactions" on transactions for select
    using (booth_id = (select booth_id from profiles where id = auth.uid()));
