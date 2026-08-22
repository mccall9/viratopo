-- Execute this in the Supabase SQL editor before connecting real data.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.ranking_cycles (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (status in ('open', 'closed')) default 'open'
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  url text not null,
  category text not null,
  description text not null check (char_length(description) <= 180),
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  cycle_id uuid not null references public.ranking_cycles(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 100),
  status text not null check (status in ('pending', 'paid', 'failed')) default 'pending',
  provider_reference text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.bids enable row level security;

create policy "profiles are readable" on public.profiles for select using (true);
create policy "users update their profile" on public.profiles for update using (auth.uid() = id);
create policy "products are readable" on public.products for select using (true);
create policy "users create their products" on public.products for insert with check (auth.uid() = owner_id);
create policy "users manage their products" on public.products for all using (auth.uid() = owner_id);
create policy "paid bids are readable" on public.bids for select using (status = 'paid' or auth.uid() = (select owner_id from public.products where products.id = product_id));
create policy "owners create bids" on public.bids for insert with check (auth.uid() = (select owner_id from public.products where products.id = product_id));

-- Ranking query: paid bids in the current open cycle, ordered by amount then confirmation.
create index bids_current_ranking on public.bids (cycle_id, amount_cents desc, confirmed_at asc) where status = 'paid';
