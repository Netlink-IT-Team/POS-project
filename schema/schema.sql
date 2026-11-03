-- enable extension
create extension if not exists "uuid-ossp";

-- enums
create type user_role as enum ('visitor', 'kasir', 'pic', 'super_admin');
create type stock_category as enum ('powder', 'syrup', 'milk', 'galon', 'packaging', 'lid', 'sealer');
create type payment_method as enum ('cash', 'qris');
create type payment_status as enum ('pending', 'completed', 'failed', 'refunded');
create type redemption_status as enum ('pending', 'claimed', 'expired');

-- 1. BOOTHS
create table booths (
    id uuid primary key default uuid_generate_v4(),
    code varchar(50) unique not null,
    name varchar(255) not null,
    region varchar(100) not null,
    address text not null,
    latitude decimal(10, 8),
    longitude decimal(11, 8),
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. PROFILES (RBAC internal staff/ops)
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role user_role not null default 'kasir',
    booth_id uuid references booths(id) on delete set null,
    full_name varchar(255),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. BOOTH STOCKS (inventory with non-negative constraints)
create table booth_stocks (
    id uuid primary key default uuid_generate_v4(),
    booth_id uuid not null references booths(id) on delete cascade,
    category stock_category not null,
    item_name varchar(150) not null,
    quantity numeric(12, 2) not null default 0 check (quantity >= 0),
    min_threshold numeric(12, 2) not null default 10 check (min_threshold >= 0),
    unit varchar(50) not null, -- e.g. 'kg', 'pcs', 'ml'
    updated_at timestamptz default now(),
    unique(booth_id, item_name)
);

-- 4. MENU (menu catalog)
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

-- 5. VISITOR PROFILES (gamified customer accounts)
create table visitor_profiles (
    id uuid primary key default uuid_generate_v4(),
    auth_user_id uuid references auth.users(id) on delete set null,
    phone_number varchar(20) unique,
    email varchar(255) unique,
    points integer not null default 0 check (points >= 0),
    is_verified boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 6. TRANSACTIONS (orders, payments, idempotency)
create table transactions (
    id uuid primary key default uuid_generate_v4(),
    booth_id uuid not null references booths(id),
    cashier_id uuid references profiles(id),
    idempotency_key uuid unique not null, -- race condition & retry shield
    payment_method payment_method not null,
    status payment_status not null default 'pending',
    total_amount numeric(12, 2) not null check (total_amount >= 0),
    xendit_invoice_id varchar(255),
    xendit_payment_url text,
    offline_created_at timestamptz, -- client timestamp pas offline sync
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 7. TRANSACTION ITEMS
create table transaction_items (
    id uuid primary key default uuid_generate_v4(),
    transaction_id uuid not null references transactions(id) on delete cascade,
    menu_id uuid not null references menu(id),
    quantity integer not null check (quantity > 0),
    price_per_unit numeric(12, 2) not null check (price_per_unit >= 0),
    subtotal numeric(12, 2) not null check (subtotal >= 0),
    created_at timestamptz default now()
);

-- 8. SPIN REWARDS (gamification config & quotas)
create table spin_rewards (
    id uuid primary key default uuid_generate_v4(),
    title varchar(150) not null,
    reward_type varchar(50) not null, -- 'points', 'free_drink', 'discount'
    reward_value integer default 0,
    weight integer not null default 1 check (weight >= 0), -- probability weight
    daily_quota integer not null default 10 check (daily_quota >= 0),
    remaining_daily_quota integer not null default 10 check (remaining_daily_quota >= 0),
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 9. MEMBER SPIN LOGS (audit trail daily spin)
create table member_spin_logs (
    id uuid primary key default uuid_generate_v4(),
    visitor_id uuid not null references visitor_profiles(id) on delete cascade,
    reward_id uuid references spin_rewards(id),
    ip_address varchar(45),
    created_at timestamptz default now()
);

-- 10. USER REDEMPTIONS (free drink / point claims)
create table user_redemptions (
    id uuid primary key default uuid_generate_v4(),
    visitor_id uuid not null references visitor_profiles(id) on delete cascade,
    reward_id uuid references spin_rewards(id),
    booth_id uuid references booths(id), -- booth tempat klaim
    code varchar(50) unique not null,
    status redemption_status default 'pending',
    claimed_at timestamptz,
    expires_at timestamptz not null,
    created_at timestamptz default now()
);

-- INDEXES
create index idx_booths_location on booths (latitude, longitude);
create index idx_booths_active on booths (is_active);
create index idx_booth_stocks_booth on booth_stocks (booth_id);
create index idx_transactions_booth on transactions (booth_id);
create index idx_transactions_status on transactions (status);
create index idx_transactions_idempotency on transactions (idempotency_key);
create index idx_member_spin_logs_visitor_date on member_spin_logs (visitor_id, created_at);

-- TRIGGER: Auto-create profile saat signup via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, role, full_name)
    values (
        new.id,
        coalesce((new.raw_user_meta_data->>'role')::user_role, 'kasir'),
        new.raw_user_meta_data->>'full_name'
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ROW LEVEL SECURITY (RLS)
alter table booths enable row level security;
alter table profiles enable row level security;
alter table booth_stocks enable row level security;
alter table menu enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;
alter table visitor_profiles enable row level security;
alter table spin_rewards enable row level security;
alter table member_spin_logs enable row level security;
alter table user_redemptions enable row level security;

-- Public read for catalog & nearest booth
create policy "public_read_booths" on booths for select using (is_active = true);
create policy "public_read_menu" on menu for select using (is_active = true);
create policy "public_read_rewards" on spin_rewards for select using (is_active = true);

-- Staff & Admin policies
create policy "staff_read_profiles" on profiles for select
    using (auth.uid() = id or (select role from profiles where id = auth.uid()) in ('pic', 'super_admin'));

create policy "kasir_manage_booth_stocks" on booth_stocks for all
    using (
        booth_id = (select booth_id from profiles where id = auth.uid())
        or (select role from profiles where id = auth.uid()) in ('pic', 'super_admin')
    );

create policy "kasir_insert_transactions" on transactions for insert
    with check (
        booth_id = (select booth_id from profiles where id = auth.uid())
        or (select role from profiles where id = auth.uid()) = 'super_admin'
    );

create policy "staff_view_transactions" on transactions for select
    using (
        booth_id = (select booth_id from profiles where id = auth.uid())
        or (select role from profiles where id = auth.uid()) in ('pic', 'super_admin')
    );