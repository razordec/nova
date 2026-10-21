-- Profiles mirror auth.users (1:1)
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  role          user_role not null default 'customer',
  locale        text not null default 'en',
  theme         text not null default 'system',   -- light|dark|system
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table vendors (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  name            text not null,
  slug            text not null unique,
  description     text,
  logo_url        text,
  banner_url      text,
  stripe_account_id text,                 -- Stripe Connect
  payouts_enabled boolean not null default false,
  rating_avg      numeric(3,2) not null default 0,
  rating_count    integer not null default 0,
  is_verified     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table categories (
  id        serial primary key,
  parent_id integer references categories(id) on delete set null,
  name      text not null,
  slug      text not null unique,
  image_url text
);

create table products (
  id            uuid primary key default uuid_generate_v4(),
  vendor_id     uuid not null references vendors(id) on delete cascade,
  category_id   integer references categories(id) on delete set null,
  title         text not null,
  slug          text not null unique,
  description   text,
  status        product_status not null default 'draft',
  base_price    integer not null,                    -- minor units (cents)
  compare_at_price integer,                          -- "was" price
  currency      char(3) not null default 'USD',
  sku           text unique,
  stock_qty     integer not null default 0,
  low_stock_threshold integer not null default 5,
  weight_grams  integer,
  tags          text[] not null default '{}',
  images        jsonb not null default '[]',         -- [{url, alt}]
  model_3d_url  text,                                -- GLB/GLTF
  ar_model_url  text,                                -- USDZ for iOS
  embedding     vector(1536),                        -- Phase 4: semantic search
  search_vector tsgenerated,                         -- Postgres 15+ generated FTS
  rating_avg    numeric(3,2) not null default 0,
  rating_count  integer not null default 0,
  view_count    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint price_positive check (base_price >= 0)
);

create index products_search_idx   on products using gin (search_vector);
create index products_vendor_idx   on products (vendor_id);
create index products_category_idx on products (category_id);
create index products_tags_idx     on products using gin (tags);
create index products_price_idx    on products (base_price);

create table product_variants (
  id           uuid primary key default uuid_generate_v4(),
  product_id   uuid not null references products(id) on delete cascade,
  sku          text unique,
  title        text not null,          -- "Black / XL"
  options      jsonb not null default '{}',  -- {"color":"black","size":"XL"}
  price        integer not null,
  stock_qty    integer not null default 0,
  image_url    text,
  is_active    boolean not null default true
);