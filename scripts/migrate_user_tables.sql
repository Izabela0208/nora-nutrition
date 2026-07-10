-- Nora — A2: tabele per-utilizator, cu RLS activat de la creare.
-- Rulează tot fișierul o singură dată în Supabase → SQL Editor.

-- ─────────────────────────────────────────────────────────────
-- profiles — datele din onboarding + ținte + date biologice opt-in
-- ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  user_id                      uuid primary key references auth.users(id) on delete cascade,
  name                         text,
  age                          int,
  sex                          text check (sex in ('female','male')),
  height_cm                    numeric,
  height_unit                  text default 'cm',
  weight_kg                    numeric,
  weight_unit                  text default 'kg',
  goals                        text[] default '{}',
  activity                     text,
  preferences                  text,
  language                     text,
  targets                      jsonb,
  biological_tracking_enabled  boolean default false,
  biological_context           text check (biological_context in ('cycle','pregnancy','perimenopause','none')) default 'none',
  last_period_date             date,
  cycle_length                 int default 28,
  cycle_regularity             text,
  created_at                   timestamptz default now(),
  updated_at                   timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_delete_own" on profiles
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- meals — mesele logate (foto / barcode / căutare)
-- ─────────────────────────────────────────────────────────────
create table if not exists meals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  meal_group  text,
  calories    numeric,
  protein_g   numeric,
  carbs_g     numeric,
  fat_g       numeric,
  fiber_g     numeric,
  source      text check (source in ('photo','barcode','search','manual')) default 'manual',
  notes       text,
  estimated   boolean default true,
  logged_at   timestamptz default now(),
  created_at  timestamptz default now()
);

alter table meals enable row level security;

create policy "meals_select_own" on meals
  for select using (auth.uid() = user_id);
create policy "meals_insert_own" on meals
  for insert with check (auth.uid() = user_id);
create policy "meals_update_own" on meals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meals_delete_own" on meals
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- challenge_completions — challenge-uri Ritual completate per zi
-- ─────────────────────────────────────────────────────────────
create table if not exists challenge_completions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  challenge_id    text not null,
  completed_date  date not null,
  created_at      timestamptz default now(),
  unique (user_id, challenge_id, completed_date)
);

alter table challenge_completions enable row level security;

create policy "challenge_completions_select_own" on challenge_completions
  for select using (auth.uid() = user_id);
create policy "challenge_completions_insert_own" on challenge_completions
  for insert with check (auth.uid() = user_id);
create policy "challenge_completions_update_own" on challenge_completions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "challenge_completions_delete_own" on challenge_completions
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- user_settings — unități, notificări, preferințe
-- ─────────────────────────────────────────────────────────────
create table if not exists user_settings (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  height_unit             text default 'cm',
  weight_unit             text default 'kg',
  notifications_enabled   boolean default true,
  updated_at              timestamptz default now()
);

alter table user_settings enable row level security;

create policy "user_settings_select_own" on user_settings
  for select using (auth.uid() = user_id);
create policy "user_settings_insert_own" on user_settings
  for insert with check (auth.uid() = user_id);
create policy "user_settings_update_own" on user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_settings_delete_own" on user_settings
  for delete using (auth.uid() = user_id);
