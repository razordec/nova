create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";      -- fuzzy search (Phase 4)
create extension if not exists "vector";       -- pgvector for AI recommendations

create type user_role      as enum ('customer', 'vendor', 'admin');
create type order_status   as enum ('pending','paid','fulfilled','shipped','delivered','cancelled','refunded');
create type payment_status as enum ('unpaid','paid','refunded','disputed');
create type product_status as enum ('draft','active','archived');
create type notif_channel  as enum ('in_app','email','push');

-- Every table gets these
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;