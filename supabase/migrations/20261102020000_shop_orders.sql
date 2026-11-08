-- Shop orders. Created and changed only by the server (service role).
-- RLS is on with NO public policies, so customers can never read or edit orders directly.
create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','paid','processing','shipped','delivered','cancelled','refunded')),
  payment_method text not null default 'razorpay' check (payment_method in ('razorpay','manual')),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_state text not null,
  shipping_pincode text not null,
  shipping_country text not null default 'India',
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null check (total >= 0),
  currency text not null default 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  customer_notes text not null default '',
  tracking_info text not null default '',
  admin_notes text not null default '',
  stock_adjusted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shop_orders_status_idx on public.shop_orders (status, created_at desc);
create unique index if not exists shop_orders_rzp_idx on public.shop_orders (razorpay_order_id) where razorpay_order_id is not null;
alter table public.shop_orders enable row level security;
