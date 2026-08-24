-- ViraTopo beta schema.
-- Idempotent Supabase bootstrap. Critical mutations are server-only.

begin;

create extension if not exists pgcrypto;
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

-- Protocol, www, query string, fragment and trailing slash do not create
-- separate products. Paths remain part of the product identity.
create or replace function public.normalize_product_url(input_url text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  with stripped as (
    select split_part(
      split_part(
        regexp_replace(btrim(input_url), '^https?://', '', 'i'),
        '#', 1
      ),
      '?', 1
    ) as without_suffix
  ), decomposed as (
    select
      regexp_replace(split_part(without_suffix, '/', 1), '^www\.', '', 'i') as host,
      substring(
        without_suffix
        from char_length(split_part(without_suffix, '/', 1)) + 1
      ) as path
    from stripped
  )
  select nullif(lower(host) || regexp_replace(path, '/+$', ''), '')
  from decomposed;
$$;

revoke all on function public.normalize_product_url(text) from public, anon, authenticated;
grant execute on function public.normalize_product_url(text) to authenticated, service_role;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 80
  )
);

create table if not exists public.ranking_cycles (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  constraint ranking_cycles_exactly_24_hours check (
    ends_at = starts_at + interval '24 hours'
  ),
  constraint ranking_cycles_status_check check (
    status in ('scheduled', 'open', 'closed', 'cancelled')
  )
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  url text not null,
  normalized_url text generated always as (public.normalize_product_url(url)) stored,
  category text not null,
  description text not null default '',
  logo_url text,
  verification_status text not null default 'pending',
  verification_method text,
  verification_note text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_length check (char_length(name) between 2 and 80),
  constraint products_url_length check (char_length(url) between 4 and 2048),
  constraint products_normalized_url_format check (
    normalized_url is not null
    and normalized_url ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(/[^[:space:]]*)?$'
  ),
  constraint products_category_length check (char_length(category) between 2 and 60),
  constraint products_description_length check (char_length(description) <= 280),
  constraint products_verification_status_check check (
    verification_status in ('pending', 'verified', 'rejected')
  ),
  constraint products_verification_method_length check (
    verification_method is null or char_length(verification_method) between 2 and 60
  ),
  constraint products_verification_note_length check (
    verification_note is null or char_length(verification_note) <= 500
  ),
  constraint products_verification_consistency check (
    (
      verification_status = 'verified'
      and verification_method is not null
      and verified_at is not null
    )
    or (verification_status <> 'verified' and verified_at is null)
  )
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  cycle_id uuid not null references public.ranking_cycles(id) on delete cascade,
  amount_cents integer not null,
  payable_cents integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  constraint bids_amount_cents_check check (
    amount_cents between 100 and 999900 and amount_cents % 100 = 0
  ),
  constraint bids_payable_cents_check check (
    payable_cents between 100 and amount_cents and payable_cents % 100 = 0
  ),
  constraint bids_status_check check (
    status in ('pending', 'confirmed', 'failed', 'cancelled')
  ),
  constraint bids_confirmation_consistency check (
    (status = 'confirmed' and confirmed_at is not null)
    or (status <> 'confirmed' and confirmed_at is null)
  )
);

-- Upgrade the earlier bootstrap schema without dropping business records.
alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();
alter table public.ranking_cycles
  add column if not exists created_at timestamptz not null default now();
alter table public.products
  add column if not exists normalized_url text
    generated always as (public.normalize_product_url(url)) stored,
  add column if not exists verification_status text not null default 'pending',
  add column if not exists verification_method text,
  add column if not exists verification_note text,
  add column if not exists verified_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();
-- Stored generated values created by an older normalizer are recomputed without
-- changing the public destination or treating the path as case-insensitive.
update public.products
set url = url
where normalized_url is distinct from public.normalize_product_url(url);
alter table public.bids
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists payable_cents integer;
update public.bids set payable_cents = amount_cents where payable_cents is null;
alter table public.bids alter column payable_cents set not null;

create table if not exists private.payment_attempts (
  bid_id uuid primary key references public.bids(id) on delete cascade,
  provider_reference text not null,
  provider_name text not null default 'mercado_pago',
  expected_amount_cents integer not null,
  paid_amount_cents integer,
  status text not null default 'initiated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_attempts_provider_reference_length check (
    char_length(provider_reference) between 6 and 255
  ),
  constraint payment_attempts_provider_name_length check (
    char_length(provider_name) between 2 and 60
  ),
  constraint payment_attempts_expected_amount_check check (
    expected_amount_cents between 100 and 999900 and expected_amount_cents % 100 = 0
  ),
  constraint payment_attempts_paid_amount_check check (
    paid_amount_cents is null
    or (paid_amount_cents between 100 and 999900 and paid_amount_cents % 100 = 0)
  ),
  constraint payment_attempts_amount_consistency check (
    (status in ('confirmed', 'refunded') and paid_amount_cents = expected_amount_cents)
    or (status in ('initiated', 'failed') and paid_amount_cents is null)
  ),
  constraint payment_attempts_status_check check (
    status in ('initiated', 'confirmed', 'failed', 'refunded')
  )
);

alter table private.payment_attempts
  add column if not exists expected_amount_cents integer,
  add column if not exists paid_amount_cents integer;
update private.payment_attempts as attempts
set expected_amount_cents = bids.payable_cents,
    paid_amount_cents = case
      when attempts.status in ('confirmed', 'refunded') then bids.payable_cents
      else attempts.paid_amount_cents
    end
from public.bids as bids
where bids.id = attempts.bid_id
  and attempts.expected_amount_cents is null;
alter table private.payment_attempts
  alter column expected_amount_cents set not null;
alter table private.payment_attempts drop constraint if exists payment_attempts_expected_amount_check;
alter table private.payment_attempts drop constraint if exists payment_attempts_paid_amount_check;
alter table private.payment_attempts drop constraint if exists payment_attempts_amount_consistency;
alter table private.payment_attempts
  add constraint payment_attempts_expected_amount_check check (
    expected_amount_cents between 100 and 999900 and expected_amount_cents % 100 = 0
  ),
  add constraint payment_attempts_paid_amount_check check (
    paid_amount_cents is null
    or (paid_amount_cents between 100 and 999900 and paid_amount_cents % 100 = 0)
  ),
  add constraint payment_attempts_amount_consistency check (
    (status in ('confirmed', 'refunded') and paid_amount_cents = expected_amount_cents)
    or (status in ('initiated', 'failed') and paid_amount_cents is null)
  );

create table if not exists private.waitlist_signups (
  id bigint generated always as identity primary key,
  email text not null,
  product_url text,
  normalized_product_url text generated always as (
    public.normalize_product_url(product_url)
  ) stored,
  bid_cents integer,
  consent boolean not null,
  consent_evidence text not null,
  source text not null default 'site',
  status text not null default 'waiting',
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint waitlist_signups_email_length check (char_length(email) between 5 and 254),
  constraint waitlist_signups_email_format check (
    email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint waitlist_signups_email_canonical check (email = lower(btrim(email))),
  constraint waitlist_signups_product_url_length check (
    product_url is null or char_length(product_url) between 4 and 2048
  ),
  constraint waitlist_signups_normalized_url_format check (
    normalized_product_url is null
    or normalized_product_url ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(/[^[:space:]]*)?$'
  ),
  constraint waitlist_signups_bid_cents_check check (
    bid_cents is null
    or (bid_cents between 100 and 999900 and bid_cents % 100 = 0)
  ),
  constraint waitlist_signups_consent_evidence_check check (
    consent_evidence in ('site_checkbox_v1', 'legacy_explicit_boolean', 'legacy_timestamp')
  ),
  constraint waitlist_signups_consent_required check (
    consent is true
    and (
      consented_at is not null
      or consent_evidence = 'legacy_explicit_boolean'
    )
  ),
  constraint waitlist_signups_source_length check (char_length(source) between 1 and 80),
  constraint waitlist_signups_status_check check (
    status in ('waiting', 'invited', 'unsubscribed')
  )
);

create table if not exists private.waitlist_rate_limits (
  fingerprint text not null,
  window_started_at timestamptz not null,
  attempts integer not null default 1,
  primary key (fingerprint, window_started_at),
  constraint waitlist_rate_limits_fingerprint_check check (
    fingerprint ~ '^[a-f0-9]{64}$'
  ),
  constraint waitlist_rate_limits_attempts_check check (attempts between 1 and 100000)
);

-- Upgrade the first private waitlist revision without exposing it through PostgREST.
-- Never manufacture consent for a legacy row: an explicit historical TRUE flag is
-- the minimum evidence retained, and rows without it are removed from the waitlist.
alter table private.waitlist_signups
  add column if not exists product_url text,
  add column if not exists normalized_product_url text generated always as (
    public.normalize_product_url(product_url)
  ) stored,
  add column if not exists bid_cents integer,
  add column if not exists consent boolean,
  add column if not exists consent_evidence text,
  add column if not exists consented_at timestamptz;

-- The legacy exact-case key and canonical check must be removed before two
-- addresses such as User@example.com and user@example.com are consolidated.
alter table private.waitlist_signups drop constraint if exists waitlist_signups_email_key;
alter table private.waitlist_signups drop constraint if exists waitlist_signups_email_canonical;
alter table private.waitlist_signups drop constraint if exists waitlist_signups_consent_evidence_check;
alter table private.waitlist_signups drop constraint if exists waitlist_signups_consent_required;
drop index if exists private.waitlist_signups_email_uidx;

update private.waitlist_signups
set consent_evidence = case
  when consented_at is not null then 'legacy_timestamp'
  else 'legacy_explicit_boolean'
end
where consent is true
  and consent_evidence is null;

delete from private.waitlist_signups
where consent is distinct from true
   or consent_evidence is null
   or (consented_at is null and consent_evidence <> 'legacy_explicit_boolean')
   or char_length(lower(btrim(email))) not between 5 and 254
   or lower(btrim(email)) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';

with duplicate_emails as (
  select
    id,
    row_number() over (
      partition by lower(btrim(email))
      order by
        (consented_at is not null) desc,
        consented_at desc nulls last,
        created_at desc,
        id desc
    ) as duplicate_position
  from private.waitlist_signups
)
delete from private.waitlist_signups as signups
using duplicate_emails
where signups.id = duplicate_emails.id
  and duplicate_emails.duplicate_position > 1;

update private.waitlist_signups
set email = lower(btrim(email))
where email is distinct from lower(btrim(email));

update private.waitlist_signups
set product_url = product_url
where product_url is not null
  and normalized_product_url is distinct from public.normalize_product_url(product_url);

alter table private.waitlist_signups
  alter column consent set not null,
  alter column consent_evidence set not null,
  alter column consented_at drop not null,
  alter column consented_at drop default;
alter table private.waitlist_signups drop constraint if exists waitlist_signups_product_url_length;
alter table private.waitlist_signups drop constraint if exists waitlist_signups_normalized_url_format;
alter table private.waitlist_signups drop constraint if exists waitlist_signups_bid_cents_check;
alter table private.waitlist_signups
  add constraint waitlist_signups_email_canonical check (email = lower(btrim(email))),
  add constraint waitlist_signups_product_url_length check (
    product_url is null or char_length(product_url) between 4 and 2048
  ),
  add constraint waitlist_signups_normalized_url_format check (
    normalized_product_url is null
    or normalized_product_url ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(/[^[:space:]]*)?$'
  ),
  add constraint waitlist_signups_bid_cents_check check (
    bid_cents is null
    or (bid_cents between 100 and 999900 and bid_cents % 100 = 0)
  ),
  add constraint waitlist_signups_consent_evidence_check check (
    consent_evidence in ('site_checkbox_v1', 'legacy_explicit_boolean', 'legacy_timestamp')
  ),
  add constraint waitlist_signups_consent_required check (
    consent is true
    and (
      consented_at is not null
      or consent_evidence = 'legacy_explicit_boolean'
    )
  );

create table if not exists private.product_events (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  cycle_id uuid not null references public.ranking_cycles(id) on delete cascade,
  event_type text not null,
  dedupe_key text not null,
  visitor_hash text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint product_events_type_check check (event_type in ('impression', 'click')),
  constraint product_events_dedupe_key_length check (char_length(dedupe_key) between 8 and 160),
  constraint product_events_visitor_hash_length check (
    visitor_hash is null or char_length(visitor_hash) between 16 and 160
  ),
  constraint product_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists private.product_cycle_metrics (
  cycle_id uuid not null references public.ranking_cycles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (cycle_id, product_id),
  constraint product_cycle_metrics_impressions_nonnegative check (impressions >= 0),
  constraint product_cycle_metrics_clicks_nonnegative check (clicks >= 0)
);

-- Move any legacy provider reference out of the public schema before dropping it.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bids'
      and column_name = 'provider_reference'
  ) then
    execute $migration$
      insert into private.payment_attempts (
        bid_id, provider_reference, provider_name, expected_amount_cents,
        paid_amount_cents, status, created_at, updated_at
      )
      select
        id,
        provider_reference,
        'legacy',
        payable_cents,
        case when status = 'paid' then payable_cents else null end,
        case when status = 'paid' then 'confirmed' else 'initiated' end,
        created_at,
        created_at
      from public.bids
      where provider_reference is not null
      on conflict (bid_id) do nothing
    $migration$;
    execute 'alter table public.bids drop column provider_reference';
  end if;
end;
$$;

-- Normalize legacy paid rows before replacing constraints.
alter table public.bids drop constraint if exists bids_status_check;
alter table public.bids drop constraint if exists bids_confirmation_consistency;
update public.bids
set status = 'confirmed', confirmed_at = coalesce(confirmed_at, created_at)
where status = 'paid';

alter table public.bids drop constraint if exists bids_amount_cents_check;
alter table public.bids drop constraint if exists bids_payable_cents_check;
alter table public.bids
  add constraint bids_amount_cents_check check (
    amount_cents between 100 and 999900 and amount_cents % 100 = 0
  ),
  add constraint bids_payable_cents_check check (
    payable_cents between 100 and amount_cents and payable_cents % 100 = 0
  ),
  add constraint bids_status_check check (
    status in ('pending', 'confirmed', 'failed', 'cancelled')
  ),
  add constraint bids_confirmation_consistency check (
    (status = 'confirmed' and confirmed_at is not null)
    or (status <> 'confirmed' and confirmed_at is null)
  );

alter table public.ranking_cycles drop constraint if exists ranking_cycles_exactly_24_hours;
alter table public.ranking_cycles drop constraint if exists ranking_cycles_status_check;
alter table public.ranking_cycles drop constraint if exists ranking_cycles_no_overlap;
alter table public.ranking_cycles
  add constraint ranking_cycles_exactly_24_hours check (
    ends_at = starts_at + interval '24 hours'
  ),
  add constraint ranking_cycles_status_check check (
    status in ('scheduled', 'open', 'closed', 'cancelled')
  ),
  add constraint ranking_cycles_no_overlap exclude using gist (
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'cancelled');

alter table public.products drop constraint if exists products_name_length;
alter table public.products drop constraint if exists products_name_check;
alter table public.products drop constraint if exists products_url_length;
alter table public.products drop constraint if exists products_normalized_url_format;
alter table public.products drop constraint if exists products_category_length;
alter table public.products drop constraint if exists products_description_length;
alter table public.products drop constraint if exists products_description_check;
alter table public.products drop constraint if exists products_verification_status_check;
alter table public.products drop constraint if exists products_verification_method_length;
alter table public.products drop constraint if exists products_verification_note_length;
alter table public.products drop constraint if exists products_verification_consistency;
alter table public.products
  add constraint products_name_length check (char_length(name) between 2 and 80),
  add constraint products_url_length check (char_length(url) between 4 and 2048),
  add constraint products_normalized_url_format check (
    normalized_url is not null
    and normalized_url ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(/[^[:space:]]*)?$'
  ),
  add constraint products_category_length check (char_length(category) between 2 and 60),
  add constraint products_description_length check (char_length(description) <= 280),
  add constraint products_verification_status_check check (
    verification_status in ('pending', 'verified', 'rejected')
  ),
  add constraint products_verification_method_length check (
    verification_method is null or char_length(verification_method) between 2 and 60
  ),
  add constraint products_verification_note_length check (
    verification_note is null or char_length(verification_note) <= 500
  ),
  add constraint products_verification_consistency check (
    (
      verification_status = 'verified'
      and verification_method is not null
      and verified_at is not null
    )
    or (verification_status <> 'verified' and verified_at is null)
  );

alter table public.profiles drop constraint if exists profiles_display_name_length;
alter table public.profiles
  add constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 80
  );

-- Access paths, including every non-PK foreign key.
create index if not exists products_owner_id_idx on public.products (owner_id);
create unique index if not exists products_normalized_url_uidx
  on public.products (normalized_url);
create index if not exists products_verified_idx
  on public.products (verified_at, id)
  where verification_status = 'verified';
create index if not exists ranking_cycles_status_window_idx
  on public.ranking_cycles (status, starts_at, ends_at);
create unique index if not exists ranking_cycles_single_open_uidx
  on public.ranking_cycles (status) where status = 'open';
create index if not exists bids_product_id_idx on public.bids (product_id);
create index if not exists bids_cycle_id_idx on public.bids (cycle_id);
drop index if exists public.bids_current_ranking;
create index bids_current_ranking
  on public.bids (cycle_id, amount_cents desc, confirmed_at asc, product_id)
  where status = 'confirmed';
create unique index if not exists bids_one_pending_per_product_cycle_uidx
  on public.bids (product_id, cycle_id) where status = 'pending';
create unique index if not exists payment_attempts_provider_reference_uidx
  on private.payment_attempts (provider_reference);
drop index if exists private.waitlist_signups_email_uidx;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'private.waitlist_signups'::regclass
      and conname = 'waitlist_signups_email_key'
  ) then
    alter table private.waitlist_signups
      add constraint waitlist_signups_email_key unique (email);
  end if;
end;
$$;
create unique index if not exists product_events_dedupe_key_uidx
  on private.product_events (dedupe_key);
create index if not exists product_events_product_id_idx
  on private.product_events (product_id);
create index if not exists product_events_cycle_id_idx
  on private.product_events (cycle_id);
create index if not exists product_events_cycle_product_time_idx
  on private.product_events (cycle_id, product_id, occurred_at desc);
create index if not exists product_cycle_metrics_product_id_idx
  on private.product_cycle_metrics (product_id);
create index if not exists waitlist_rate_limits_window_idx
  on private.waitlist_rate_limits (window_started_at);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create or replace function private.prepare_product_row()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.verification_status := 'pending';
    new.verification_method := null;
    new.verification_note := null;
    new.verified_at := null;
  elsif row(new.name, new.url, new.category, new.description, new.logo_url)
        is distinct from
        row(old.name, old.url, old.category, old.description, old.logo_url) then
    -- Every owner-editable field is moderated. A public change invalidates the
    -- prior review instead of letting approved content be swapped afterwards.
    new.verification_status := 'pending';
    new.verification_method := null;
    new.verification_note := null;
    new.verified_at := null;
  elsif current_user in ('anon', 'authenticated') then
    -- Product owners may edit presentation fields, never verification state.
    new.verification_status := old.verification_status;
    new.verification_method := old.verification_method;
    new.verification_note := old.verification_note;
    new.verified_at := old.verified_at;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function private.touch_updated_at();
drop trigger if exists products_prepare_row on public.products;
create trigger products_prepare_row
before insert or update on public.products
for each row execute function private.prepare_product_row();
drop trigger if exists bids_touch_updated_at on public.bids;
create trigger bids_touch_updated_at
before update on public.bids
for each row execute function private.touch_updated_at();
drop trigger if exists payment_attempts_touch_updated_at on private.payment_attempts;
create trigger payment_attempts_touch_updated_at
before update on private.payment_attempts
for each row execute function private.touch_updated_at();
drop trigger if exists waitlist_signups_touch_updated_at on private.waitlist_signups;
create trigger waitlist_signups_touch_updated_at
before update on private.waitlist_signups
for each row execute function private.touch_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(nullif(coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name'
    ), ''), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.profiles (id, display_name)
select
  users.id,
  left(nullif(coalesce(
    users.raw_user_meta_data ->> 'display_name',
    users.raw_user_meta_data ->> 'name'
  ), ''), 80)
from auth.users
on conflict (id) do nothing;

-- Restrictive RLS. Anonymous ranking reads happen only through the sanitized RPC.
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.ranking_cycles enable row level security;
alter table public.ranking_cycles force row level security;
alter table public.products enable row level security;
alter table public.products force row level security;
alter table public.bids enable row level security;
alter table public.bids force row level security;
alter table private.payment_attempts enable row level security;
alter table private.payment_attempts force row level security;
alter table private.waitlist_signups enable row level security;
alter table private.waitlist_signups force row level security;
alter table private.waitlist_rate_limits enable row level security;
alter table private.waitlist_rate_limits force row level security;
alter table private.product_events enable row level security;
alter table private.product_events force row level security;
alter table private.product_cycle_metrics enable row level security;
alter table private.product_cycle_metrics force row level security;

do $$
declare policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where (schemaname, tablename) in (
      ('public', 'profiles'),
      ('public', 'ranking_cycles'),
      ('public', 'products'),
      ('public', 'bids'),
      ('private', 'payment_attempts'),
      ('private', 'waitlist_signups'),
      ('private', 'waitlist_rate_limits'),
      ('private', 'product_events'),
      ('private', 'product_cycle_metrics')
    )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

create policy profiles_select_own on public.profiles
for select to authenticated using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
for insert to authenticated with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy products_select_own on public.products
for select to authenticated using (auth.uid() = owner_id);
create policy products_insert_own on public.products
for insert to authenticated
with check (auth.uid() = owner_id and verification_status = 'pending');
create policy products_update_own on public.products
for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy products_delete_own on public.products
for delete to authenticated using (auth.uid() = owner_id);

create policy bids_select_own on public.bids
for select to authenticated
using (
  exists (
    select 1 from public.products
    where products.id = bids.product_id
      and products.owner_id = auth.uid()
  )
);

revoke all on public.profiles from anon, authenticated;
revoke all on public.ranking_cycles from anon, authenticated;
revoke all on public.products from anon, authenticated;
revoke all on public.bids from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select on public.products to authenticated;
grant insert (owner_id, name, url, category, description, logo_url)
  on public.products to authenticated;
grant update (name, url, category, description, logo_url)
  on public.products to authenticated;
grant delete on public.products to authenticated;
grant select on public.bids to authenticated;

revoke all on private.payment_attempts from public, anon, authenticated;
revoke all on private.waitlist_signups from public, anon, authenticated;
revoke all on private.waitlist_rate_limits from public, anon, authenticated;
revoke all on private.product_events from public, anon, authenticated;
revoke all on private.product_cycle_metrics from public, anon, authenticated;
grant all on private.payment_attempts to service_role;
grant all on private.waitlist_signups to service_role;
grant all on private.waitlist_rate_limits to service_role;
grant all on private.product_events to service_role;
grant all on private.product_cycle_metrics to service_role;
grant usage, select on all sequences in schema private to service_role;

-- Server-only waitlist entry point. The private table is never a PostgREST resource.
drop function if exists public.join_waitlist(text, text);
drop function if exists public.register_waitlist_signup(text, text, integer, boolean);
drop function if exists public.register_waitlist_signup(text, text, integer, boolean, text);
create function public.register_waitlist_signup(
  email text,
  url text,
  bid integer,
  consent boolean,
  fingerprint text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(btrim($1));
  normalized_url text := public.normalize_product_url($2);
  current_attempts integer;
  current_window timestamptz := date_trunc('hour', statement_timestamp());
begin
  if normalized_email is null
     or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or char_length(normalized_email) not between 5 and 254 then
    raise exception 'invalid waitlist email' using errcode = '22023';
  end if;
  if char_length(btrim($2)) not between 4 and 2048
     or normalized_url is null
     or normalized_url !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(/[^[:space:]]*)?$' then
    raise exception 'invalid product url' using errcode = '22023';
  end if;
  if $3 is null or $3 not between 100 and 999900 or $3 % 100 <> 0 then
    raise exception 'bid must be a whole real between 100 and 999900 cents'
      using errcode = '22003';
  end if;
  if $4 is distinct from true then
    raise exception 'consent is required' using errcode = '22023';
  end if;
  if $5 is null or $5 !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid request fingerprint' using errcode = '22023';
  end if;
  delete from private.waitlist_rate_limits
  where window_started_at < current_window - interval '48 hours';
  insert into private.waitlist_rate_limits (fingerprint, window_started_at, attempts)
  values ($5, current_window, 1)
  on conflict (fingerprint, window_started_at) do update
  set attempts = least(private.waitlist_rate_limits.attempts + 1, 100000)
  returning attempts into current_attempts;
  if current_attempts > 5 then
    return 'rate_limited';
  end if;
  insert into private.waitlist_signups (
    email, product_url, bid_cents, consent, consent_evidence, consented_at, source
  ) values (
    normalized_email, btrim($2), $3, true, 'site_checkbox_v1', clock_timestamp(), 'site'
  )
  on conflict on constraint waitlist_signups_email_key do nothing;
  return 'accepted';
end;
$$;
revoke all on function public.register_waitlist_signup(text, text, integer, boolean, text)
  from public, anon, authenticated;
grant execute on function public.register_waitlist_signup(text, text, integer, boolean, text)
  to service_role;

-- Authenticated clients may request/update a pending bid, but cannot confirm it.
drop function if exists public.request_bid(uuid, uuid, integer);
create function public.request_bid(
  p_product_id uuid,
  p_cycle_id uuid,
  p_amount_cents integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_id uuid := auth.uid();
  product_record public.products%rowtype;
  cycle_record public.ranking_cycles%rowtype;
  bid_id uuid;
  previous_amount_cents integer;
  amount_due_cents integer;
  requested_at timestamptz := statement_timestamp();
begin
  if requester_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_amount_cents is null
     or p_amount_cents not between 100 and 999900
     or p_amount_cents % 100 <> 0 then
    raise exception 'bid must be a whole real between 100 and 999900 cents'
      using errcode = '22003';
  end if;
  select * into product_record from public.products where id = p_product_id;
  if not found or product_record.owner_id <> requester_id then
    raise exception 'product not found' using errcode = '42501';
  end if;
  if product_record.verification_status <> 'verified' then
    raise exception 'product must be verified before bidding' using errcode = '23514';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_product_id::text || ':' || p_cycle_id::text, 0)
  );
  select * into cycle_record from public.ranking_cycles where id = p_cycle_id;
  if not found
     or cycle_record.status <> 'open'
     or requested_at < cycle_record.starts_at
     or requested_at >= cycle_record.ends_at then
    raise exception 'cycle is not open' using errcode = '23514';
  end if;
  select coalesce(max(amount_cents), 0) into previous_amount_cents
  from public.bids
  where product_id = p_product_id
    and cycle_id = p_cycle_id
    and status = 'confirmed';
  if p_amount_cents <= previous_amount_cents then
    raise exception 'new bid must be greater than the confirmed product bid'
      using errcode = '22003';
  end if;
  amount_due_cents := p_amount_cents - previous_amount_cents;
  insert into public.bids (product_id, cycle_id, amount_cents, payable_cents, status)
  values (p_product_id, p_cycle_id, p_amount_cents, amount_due_cents, 'pending')
  on conflict (product_id, cycle_id) where (status = 'pending')
  do update set amount_cents = excluded.amount_cents,
                payable_cents = excluded.payable_cents,
                updated_at = clock_timestamp()
  returning id into bid_id;
  return bid_id;
end;
$$;
revoke all on function public.request_bid(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.request_bid(uuid, uuid, integer) to authenticated;

drop function if exists private.set_product_verification(uuid, text, text, text);
create function private.set_product_verification(
  p_product_id uuid,
  p_status text,
  p_method text default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status is null or p_status not in ('pending', 'verified', 'rejected') then
    raise exception 'invalid verification status' using errcode = '22023';
  end if;
  if p_status = 'verified'
     and (p_method is null or char_length(btrim(p_method)) not between 2 and 60) then
    raise exception 'verified products require a verification method'
      using errcode = '22023';
  end if;
  if p_note is not null and char_length(p_note) > 500 then
    raise exception 'verification note is too long' using errcode = '22023';
  end if;
  update public.products
  set verification_status = p_status,
      verification_method = case when p_status = 'verified' then btrim(p_method) else null end,
      verification_note = p_note,
      verified_at = case when p_status = 'verified' then clock_timestamp() else null end
  where id = p_product_id;
  if not found then
    raise exception 'product not found' using errcode = 'P0002';
  end if;
end;
$$;

drop function if exists private.create_ranking_cycle(timestamptz);
create function private.create_ranking_cycle(p_starts_at timestamptz)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cycle_id uuid;
  initial_status text;
begin
  initial_status := case
    when statement_timestamp() >= p_starts_at
     and statement_timestamp() < p_starts_at + interval '24 hours' then 'open'
    else 'scheduled'
  end;
  insert into public.ranking_cycles (starts_at, ends_at, status)
  values (p_starts_at, p_starts_at + interval '24 hours', initial_status)
  returning id into cycle_id;
  return cycle_id;
end;
$$;

drop function if exists private.set_ranking_cycle_status(uuid, text);
create function private.set_ranking_cycle_status(p_cycle_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cycle_record public.ranking_cycles%rowtype;
  changed_at timestamptz := statement_timestamp();
begin
  if p_status not in ('scheduled', 'open', 'closed', 'cancelled') then
    raise exception 'invalid cycle status' using errcode = '22023';
  end if;
  select * into cycle_record from public.ranking_cycles
  where id = p_cycle_id for update;
  if not found then
    raise exception 'cycle not found' using errcode = 'P0002';
  end if;
  if p_status = 'open'
     and (changed_at < cycle_record.starts_at or changed_at >= cycle_record.ends_at) then
    raise exception 'cycle can only open inside its 24-hour window' using errcode = '23514';
  end if;
  update public.ranking_cycles set status = p_status where id = p_cycle_id;
end;
$$;

-- Only service_role receives EXECUTE on payment confirmation.
drop function if exists private.confirm_bid(uuid, text, text, timestamptz);
drop function if exists private.confirm_bid(uuid, text, integer, text, timestamptz);
create function private.confirm_bid(
  p_bid_id uuid,
  p_provider_reference text,
  p_paid_amount_cents integer,
  p_provider_name text default 'mercado_pago',
  p_confirmed_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  bid_record public.bids%rowtype;
  cycle_record public.ranking_cycles%rowtype;
  product_verification_status text;
  existing_reference text;
  existing_paid_amount_cents integer;
  confirmed_time timestamptz := coalesce(p_confirmed_at, statement_timestamp());
begin
  if p_provider_reference is null
     or char_length(btrim(p_provider_reference)) not between 6 and 255 then
    raise exception 'invalid provider reference' using errcode = '22023';
  end if;
  if p_provider_name is null
     or char_length(btrim(p_provider_name)) not between 2 and 60 then
    raise exception 'invalid provider name' using errcode = '22023';
  end if;
  select * into bid_record from public.bids where id = p_bid_id;
  if not found then
    raise exception 'bid not found' using errcode = 'P0002';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(bid_record.product_id::text || ':' || bid_record.cycle_id::text, 0)
  );
  select * into bid_record from public.bids where id = p_bid_id for update;
  if p_paid_amount_cents is null or p_paid_amount_cents <> bid_record.payable_cents then
    raise exception 'provider amount does not match the amount due'
      using errcode = '22003';
  end if;
  if bid_record.status = 'confirmed' then
    select provider_reference, paid_amount_cents
    into existing_reference, existing_paid_amount_cents
    from private.payment_attempts where bid_id = p_bid_id;
    if existing_reference = btrim(p_provider_reference)
       and existing_paid_amount_cents = p_paid_amount_cents then
      return p_bid_id;
    end if;
    raise exception 'bid already confirmed with another provider reference'
      using errcode = '23505';
  end if;
  if bid_record.status <> 'pending' then
    raise exception 'only pending bids can be confirmed' using errcode = '23514';
  end if;
  select products.verification_status
  into product_verification_status
  from public.products as products
  where products.id = bid_record.product_id
  for update;
  if not found or product_verification_status <> 'verified' then
    raise exception 'product must remain verified when payment is confirmed'
      using errcode = '23514';
  end if;
  select * into cycle_record from public.ranking_cycles where id = bid_record.cycle_id;
  if cycle_record.status <> 'open'
     or confirmed_time < cycle_record.starts_at
     or confirmed_time >= cycle_record.ends_at then
    raise exception 'confirmation is outside the open cycle window' using errcode = '23514';
  end if;
  insert into private.payment_attempts (
    bid_id, provider_reference, provider_name,
    expected_amount_cents, paid_amount_cents, status
  ) values (
    p_bid_id, btrim(p_provider_reference), btrim(p_provider_name),
    bid_record.payable_cents, p_paid_amount_cents, 'confirmed'
  )
  on conflict (bid_id) do update
  set provider_reference = excluded.provider_reference,
      provider_name = excluded.provider_name,
      expected_amount_cents = excluded.expected_amount_cents,
      paid_amount_cents = excluded.paid_amount_cents,
      status = 'confirmed';
  update public.bids
  set status = 'confirmed', confirmed_at = confirmed_time
  where id = p_bid_id;
  return p_bid_id;
end;
$$;

drop function if exists private.record_product_event(uuid, uuid, text, text, text, jsonb, timestamptz);
create function private.record_product_event(
  p_product_id uuid,
  p_cycle_id uuid,
  p_event_type text,
  p_dedupe_key text,
  p_visitor_hash text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id bigint;
  event_time timestamptz := coalesce(p_occurred_at, statement_timestamp());
  cycle_record public.ranking_cycles%rowtype;
begin
  if p_event_type not in ('impression', 'click') then
    raise exception 'invalid event type' using errcode = '22023';
  end if;
  select * into cycle_record from public.ranking_cycles where id = p_cycle_id;
  if not found
     or event_time < cycle_record.starts_at
     or event_time >= cycle_record.ends_at then
    raise exception 'event is outside the cycle window' using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.bids
    join public.products on products.id = bids.product_id
    where bids.product_id = p_product_id
      and bids.cycle_id = p_cycle_id
      and bids.status = 'confirmed'
      and products.verification_status = 'verified'
  ) then
    raise exception 'product is not ranked in this cycle' using errcode = '23514';
  end if;
  insert into private.product_events (
    product_id, cycle_id, event_type, dedupe_key, visitor_hash, metadata, occurred_at
  ) values (
    p_product_id, p_cycle_id, p_event_type, p_dedupe_key,
    p_visitor_hash, p_metadata, event_time
  )
  on conflict (dedupe_key) do nothing
  returning id into event_id;
  if event_id is null then
    return false;
  end if;
  insert into private.product_cycle_metrics (
    cycle_id, product_id, impressions, clicks
  ) values (
    p_cycle_id,
    p_product_id,
    case when p_event_type = 'impression' then 1 else 0 end,
    case when p_event_type = 'click' then 1 else 0 end
  )
  on conflict (cycle_id, product_id) do update
  set impressions = private.product_cycle_metrics.impressions + excluded.impressions,
      clicks = private.product_cycle_metrics.clicks + excluded.clicks,
      updated_at = clock_timestamp();
  return true;
end;
$$;

revoke all on function private.set_product_verification(uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function private.create_ranking_cycle(timestamptz)
  from public, anon, authenticated;
revoke all on function private.set_ranking_cycle_status(uuid, text)
  from public, anon, authenticated;
revoke all on function private.confirm_bid(uuid, text, integer, text, timestamptz)
  from public, anon, authenticated;
revoke all on function private.record_product_event(uuid, uuid, text, text, text, jsonb, timestamptz)
  from public, anon, authenticated;
grant execute on function private.set_product_verification(uuid, text, text, text)
  to service_role;
grant execute on function private.create_ranking_cycle(timestamptz)
  to service_role;
grant execute on function private.set_ranking_cycle_status(uuid, text)
  to service_role;
grant execute on function private.confirm_bid(uuid, text, integer, text, timestamptz)
  to service_role;
grant execute on function private.record_product_event(uuid, uuid, text, text, text, jsonb, timestamptz)
  to service_role;

-- Sanitized public surface: one best confirmed bid per verified product.
drop function if exists public.get_public_ranking(uuid);
create function public.get_public_ranking(p_cycle_id uuid default null)
returns table (
  position bigint,
  cycle_id uuid,
  product_id uuid,
  product_name text,
  product_url text,
  category text,
  description text,
  logo_url text,
  amount_cents integer,
  confirmed_at timestamptz,
  impressions bigint,
  clicks bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with selected_cycle as materialized (
    select cycles.id, cycles.starts_at, cycles.ends_at
    from public.ranking_cycles as cycles
    where (
      p_cycle_id is null
      and cycles.status = 'open'
      and statement_timestamp() >= cycles.starts_at
      and statement_timestamp() < cycles.ends_at
    ) or (
      p_cycle_id is not null
      and cycles.id = p_cycle_id
      and cycles.status in ('open', 'closed')
    )
    order by cycles.starts_at desc, cycles.id
    limit 1
  ),
  best_per_product as materialized (
    select distinct on (bids.product_id)
      bids.cycle_id,
      bids.product_id,
      products.name as product_name,
      products.normalized_url as product_url,
      products.category,
      products.description,
      products.logo_url,
      bids.amount_cents,
      bids.confirmed_at
    from public.bids
    join selected_cycle on selected_cycle.id = bids.cycle_id
    join public.products on products.id = bids.product_id
    where bids.status = 'confirmed'
      and bids.confirmed_at >= selected_cycle.starts_at
      and bids.confirmed_at < selected_cycle.ends_at
      and products.verification_status = 'verified'
    order by bids.product_id, bids.amount_cents desc, bids.confirmed_at asc, bids.id asc
  ),
  ranked_products as (
    select
      row_number() over (
        order by
          best_per_product.amount_cents desc,
          best_per_product.confirmed_at asc,
          best_per_product.product_id asc
      ) as position,
      best_per_product.*
    from best_per_product
  )
  select
    ranked_products.position,
    ranked_products.cycle_id,
    ranked_products.product_id,
    ranked_products.product_name,
    ranked_products.product_url,
    ranked_products.category,
    ranked_products.description,
    ranked_products.logo_url,
    ranked_products.amount_cents,
    ranked_products.confirmed_at,
    metrics.impressions,
    metrics.clicks
  from ranked_products
  left join private.product_cycle_metrics as metrics
    on metrics.cycle_id = ranked_products.cycle_id
   and metrics.product_id = ranked_products.product_id
  order by
    ranked_products.amount_cents desc,
    ranked_products.confirmed_at asc,
    ranked_products.product_id asc;
$$;
revoke all on function public.get_public_ranking(uuid) from public, anon, authenticated;
grant execute on function public.get_public_ranking(uuid) to anon, authenticated;

comment on function public.get_public_ranking(uuid) is
  'One verified product per cycle, ordered by its best confirmed bid.';
comment on table private.payment_attempts is
  'Server-only payment-provider references. Never expose through PostgREST.';
comment on table private.waitlist_signups is
  'Private beta waitlist, writable only through the server-only register_waitlist_signup RPC.';
comment on table private.waitlist_rate_limits is
  'Short-lived HMAC fingerprints used to enforce waitlist request limits without storing raw IP addresses.';
comment on table private.product_events is
  'Deduplicated server-side impression and click events.';

commit;
