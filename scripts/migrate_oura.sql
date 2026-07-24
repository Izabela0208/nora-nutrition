-- Nora — integrare Oura Ring (OAuth2 + sincronizare date zilnice).
-- Ruleaza o singura data in Supabase -> SQL Editor.

-- Tokenuri OAuth per user. NICIUN acces client-side — doar rutele server
-- (service role key) citesc/scriu aici. RLS activat, fara politici pentru
-- anon/authenticated => acces zero din browser, indiferent de userul logat.
create table if not exists oura_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  access_token  text not null,
  refresh_token text not null,
  expires_at    timestamptz not null,
  scope         text,
  connected_at  timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table oura_tokens enable row level security;

-- State OAuth temporar (CSRF + leaga callback-ul de userul care a initiat
-- conexiunea). Randuri sterse dupa consum sau expira in 10 minute.
create table if not exists oura_oauth_states (
  state       text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);
alter table oura_oauth_states enable row level security;

-- Date zilnice sincronizate (sleep/activity/readiness). Userul poate citi
-- doar propriile randuri; scrierea se face exclusiv din endpoint-ul de sync
-- (service role).
create table if not exists oura_daily_data (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  data_type   text not null check (data_type in ('sleep','activity','readiness')),
  score       integer,
  raw         jsonb,
  synced_at   timestamptz default now(),
  unique(user_id, date, data_type)
);
alter table oura_daily_data enable row level security;

create policy "oura_daily_data_select_own" on oura_daily_data
  for select using (auth.uid() = user_id);

-- Defense in depth: the sync code only ever writes via service_role (bypasses
-- RLS entirely), so these never fire in normal operation. They exist so that
-- if a client-side write is ever added by mistake, it can only touch the
-- caller's own rows, never another user's.
create policy "oura_daily_data_insert_own" on oura_daily_data
  for insert with check (auth.uid() = user_id);
create policy "oura_daily_data_update_own" on oura_daily_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "oura_daily_data_delete_own" on oura_daily_data
  for delete using (auth.uid() = user_id);

create index if not exists oura_daily_data_user_date_idx
  on oura_daily_data(user_id, date);
