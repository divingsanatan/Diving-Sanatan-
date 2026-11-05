-- Shop catalogue. Writes happen only through the server (service role) after an
-- admin-token check; the public can only read PUBLISHED products.
create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',            -- sanitised HTML
  price numeric(12,2) not null default 0 check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  currency text not null default 'INR',
  sku text not null default '',
  stock_status text not null default 'in_stock'
    check (stock_status in ('in_stock','out_of_stock','preorder')),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  category text not null default '',
  tags text[] not null default '{}',
  images jsonb not null default '[]'::jsonb,        -- [{url, alt}]
  highlights jsonb not null default '[]'::jsonb,    -- ["text", ...]
  specs jsonb not null default '[]'::jsonb,         -- [{label, value}]
  buy_url text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  -- SEO
  meta_title text not null default '',
  meta_description text not null default '',
  focus_keyword text not null default '',
  canonical_url text not null default '',
  og_image text not null default '',
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index if not exists shop_products_status_idx on public.shop_products (status, sort_order);
create index if not exists shop_products_category_idx on public.shop_products (category);

alter table public.shop_products enable row level security;

drop policy if exists "shop_products_public_read" on public.shop_products;
create policy "shop_products_public_read"
  on public.shop_products
  for select
  to anon, authenticated
  using (status = 'published');
