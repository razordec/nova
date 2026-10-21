create table carts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade,  -- null = guest
  session_id  text,                                            -- guest cart key
  currency    char(3) not null default 'USD',
  updated_at  timestamptz not null default now()
);

create table cart_items (
  id         uuid primary key default uuid_generate_v4(),
  cart_id    uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  qty        integer not null check (qty > 0),
  unit_price integer not null,          -- snapshot at add-to-cart time
  unique (cart_id, product_id, variant_id)
);

create table addresses (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  label      text,
  line1      text not null,
  line2      text,
  city       text not null,
  region     text,
  postal     text not null,
  country    char(2) not null,
  phone      text,
  is_default boolean not null default false
);

create table orders (
  id                uuid primary key default uuid_generate_v4(),
  number            bigint generated always as identity,   -- human-friendly
  user_id           uuid not null references profiles(id),
  vendor_id         uuid not null references vendors(id),  -- one order row per vendor
  status            order_status not null default 'pending',
  payment_status    payment_status not null default 'unpaid',
  currency          char(3) not null default 'USD',
  subtotal          integer not null,
  shipping_total    integer not null default 0,
  tax_total         integer not null default 0,
  discount_total    integer not null default 0,
  total             integer not null,
  platform_fee      integer not null default 0,   -- your marketplace cut
  shipping_address  jsonb not null,
  stripe_payment_intent_id text,
  stripe_transfer_group    text,                  -- Connect: transfer_group = order id
  tracking_number   text,
  carrier           text,
  estimated_delivery date,
  placed_at         timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid not null references products(id),
  variant_id  uuid references product_variants(id),
  title_snap  text not null,        -- immutable snapshot
  image_snap  text,
  unit_price  integer not null,
  qty         integer not null
);

create table reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  order_item_id uuid references order_items(id),
  rating      smallint not null check (rating between 1 and 5),
  title       text,
  body        text,
  is_verified_purchase boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);

create table wishlists (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null default 'Default',
  is_public  boolean not null default false,
  unique (user_id, name)
);

create table wishlist_items (
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);

create table notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  channel    notif_channel not null default 'in_app',
  type       text not null,              -- order_shipped | price_drop | low_stock | review_reply
  title      text not null,
  body       text,
  data       jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, read_at);

-- Phase 2+: loyalty ledger (append-only, never mutate balances)
create table loyalty_ledger (
  id         bigserial primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  delta      integer not null,           -- points earned/redeemed
  reason     text not null,              -- purchase | referral | bonus | redemption
  ref_id     text,                       -- order id etc.
  created_at timestamptz not null default now()
);

-- Phase 3: realtime price snapshots for tracking
create table price_history (
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  price      integer not null,
  currency   char(3) not null default 'USD',
  recorded_at timestamptz not null default now(),
  primary key (product_id, variant_id, recorded_at)
);

create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();
create trigger trg_orders_updated   before update on orders
  for each row execute function set_updated_at();
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_vendors_updated  before update on vendors
  for each row execute function set_updated_at();