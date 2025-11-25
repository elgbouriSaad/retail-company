-- Categories table
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table categories
  add constraint categories_name_unique unique (name);

alter table products
  add column if not exists category_id uuid references categories(id) on delete set null;

update products
  set category_id = (
    select id
    from categories
    where lower(name::text) = lower(products.category::text)
    limit 1
  )
  where category_id is null
    and category is not null;

create index if not exists idx_products_category_id on products(category_id);

-- Category policies
drop policy if exists "Anyone can view categories" on categories;
create policy "Anyone can view categories"
  on categories for select
  using (true);

drop policy if exists "Admins manage categories" on categories;
create policy "Admins manage categories"
  on categories for all
  using (is_admin())
  with check (is_admin());

-- Update trigger timestamps
create or replace function update_categories_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
before update on categories
for each row execute function update_categories_updated_at();

