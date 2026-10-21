alter table profiles        enable row level security;
alter table vendors         enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table product_variants enable row level security;
alter table carts           enable row level security;
alter table cart_items      enable row level security;
alter table addresses       enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table reviews         enable row level security;
alter table wishlists       enable row level security;
alter table wishlist_items  enable row level security;
alter table notifications   enable row level security;
alter table loyalty_ledger  enable row level security;

-- Helper: is the current user a vendor of a given product?
create or replace function public.is_vendor_of(p_product_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from products p
    join vendors v on v.id = p.vendor_id
    where p.id = p_product_id and v.owner_id = auth.uid()
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- PROFILES: own row readable/writable; public can read name+avatar
create policy "profiles_select_self_or_public" on profiles
  for select using (true);
create policy "profiles_update_self" on profiles
  for update using (id = auth.uid());
create policy "profiles_insert_self" on profiles
  for insert with check (id = auth.uid());

-- VENDORS: owner manages; anyone can read verified vendors
create policy "vendors_read" on vendors for select using (true);
create policy "vendors_write_owner" on vendors
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- CATEGORIES: global read
create policy "categories_read" on categories for select using (true);

-- PRODUCTS: public sees active only; vendor sees own; admin sees all
create policy "products_public_read" on products
  for select using (status = 'active' or vendor_id in
    (select id from vendors where owner_id = auth.uid()) or public.is_admin());
create policy "products_vendor_write" on products
  for all using (vendor_id in (select id from vendors where owner_id = auth.uid()))
  with check (vendor_id in (select id from vendors where owner_id = auth.uid()));

-- VARIANTS follow their product
create policy "variants_read" on product_variants for select using (
  product_id in (select id from products where status = 'active')
  or public.is_vendor_of(product_id));
create policy "variants_vendor_write" on product_variants for all using (
  public.is_vendor_of(product_id)) with check (public.is_vendor_of(product_id));

-- CARTS / ITEMS: self or guest session
create policy "carts_own" on carts for all
  using (user_id = auth.uid() or (user_id is null and session_id = current_setting('app.session_id', true)))
  with check (user_id = auth.uid() or user_id is null);
create policy "cart_items_own" on cart_items for all using (
  cart_id in (select id from carts where user_id = auth.uid()));

-- ADDRESSES: self only
create policy "addresses_own" on addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ORDERS: buyer sees own; vendor sees theirs; admin all
create policy "orders_buyer_read" on orders for select using (user_id = auth.uid());
create policy "orders_vendor_read" on orders for select using (
  vendor_id in (select id from vendors where owner_id = auth.uid()));
create policy "orders_vendor_update" on orders for update using (
  vendor_id in (select id from vendors where owner_id = auth.uid()));
-- NOTE: inserts happen via service-role (checkout API), so no insert policy needed.

create policy "order_items_via_order" on order_items for select using (
  order_id in (select id from orders where user_id = auth.uid()
    or vendor_id in (select id from vendors where owner_id = auth.uid())));

-- REVIEWS: public read; author writes own
create policy "reviews_read" on reviews for select using (true);
create policy "reviews_insert_self" on reviews for insert
  with check (user_id = auth.uid());
create policy "reviews_update_self" on reviews for update using (user_id = auth.uid());

-- WISHLISTS
create policy "wishlists_own_or_public" on wishlists for select
  using (user_id = auth.uid() or is_public);
create policy "wishlists_own_write" on wishlists for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "wishlist_items_own" on wishlist_items for all using (
  wishlist_id in (select id from wishlists where user_id = auth.uid()));

-- NOTIFICATIONS & LOYALTY: self read; writes via service role
create policy "notifications_own" on notifications for select using (user_id = auth.uid());
create policy "notifications_mark_read" on notifications for update using (user_id = auth.uid());
create policy "loyalty_own" on loyalty_ledger for select using (user_id = auth.uid());