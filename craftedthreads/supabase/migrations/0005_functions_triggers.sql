-- Auto-create profile + default wishlist on signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
          new.raw_user_meta_data->>'avatar_url');
  insert into wishlists (user_id, name) values (new.id, 'Default');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Keep denormalised rating aggregates fresh
create or replace function refresh_product_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update products p set
    rating_avg   = coalesce((select round(avg(rating)::numeric,2) from reviews where product_id = pid), 0),
    rating_count = (select count(*) from reviews where product_id = pid)
  where p.id = pid;
  return null;
end $$;

create trigger on_review_change after insert or update or delete on reviews
  for each row execute function refresh_product_rating();

-- Vendor aggregate rating from their products
create or replace function refresh_vendor_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare vid uuid;
begin
  vid := (select vendor_id from products where id = coalesce(new.product_id, old.product_id));
  update vendors v set
    rating_avg   = coalesce((select round(avg(rating_avg)::numeric,2) from products where vendor_id = vid and rating_count > 0), 0),
    rating_count = coalesce((select sum(rating_count) from products where vendor_id = vid), 0)
  where v.id = vid;
  return null;
end $$;

create trigger on_product_rating_change after update of rating_avg on products
  for each row when (old.rating_avg is distinct from new.rating_avg)
  execute function refresh_vendor_rating();

-- Log price changes into history
create or replace function log_price_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.base_price is distinct from new.base_price then
    insert into price_history (product_id, price, currency)
    values (new.id, new.base_price, new.currency);
  end if;
  return null;
end $$;

create trigger on_product_price_change after update of base_price on products
  for each row execute function log_price_change();

-- Atomic stock decrement (prevents oversell under concurrency)
create or replace function decrement_stock(p_product uuid, p_variant uuid, p_qty int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_variant is not null then
    update product_variants set stock_qty = stock_qty - p_qty
      where id = p_variant and stock_qty >= p_qty
      returning 1 into strict p_qty;
  else
    update products set stock_qty = stock_qty - p_qty
      where id = p_product and stock_qty >= p_qty
      returning 1 into strict p_qty;
  end if;
exception
  when no_data_found then
    raise exception 'insufficient_stock';
end $$;

-- Full-text search vector maintenance
create or replace function refresh_search_vector() returns trigger
language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.tags, ' ')), 'C');
  return new;
end $$;

create trigger on_product_search before insert or update of title, description, tags
  on products for each row execute function refresh_search_vector();

-- Realtime publication
alter publication supabase_realtime add table orders, products, notifications;