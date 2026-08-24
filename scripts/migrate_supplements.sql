-- Nora — Longevity Score (Ritual): suplimentele erau tinute doar local
-- (nora_supps_list / nora_supps_taken in localStorage) - fara user_id, fara
-- istoric, bifa "luat azi" se resetea complet in fiecare zi. Fara aceste doua
-- tabele, aderenta la suplimente nu poate intra in calculul scorului si se
-- pierde la schimbarea dispozitivului.
--
-- Stergerea unui supliment din lista activa NU sterge randul din `supplements`
-- (si deci nu-i sterge nici bifele din `supplement_logs`, prin FK) - doar
-- seteaza `archived_at`. Lista activa = `archived_at is null`. Istoricul de
-- bife ramane intact pentru orice supliment, arhivat sau nu.
--
-- Ruleaza o singura data in Supabase -> SQL Editor.

create table if not exists supplements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  archived_at   timestamptz,
  created_at    timestamptz default now()
);

alter table supplements enable row level security;

create policy "supplements_select_own" on supplements
  for select using (auth.uid() = user_id);
create policy "supplements_insert_own" on supplements
  for insert with check (auth.uid() = user_id);
create policy "supplements_update_own" on supplements
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "supplements_delete_own" on supplements
  for delete using (auth.uid() = user_id);

create table if not exists supplement_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  supplement_id   uuid not null references supplements(id) on delete cascade,
  taken_date      date not null,
  created_at      timestamptz default now(),
  unique (user_id, supplement_id, taken_date)
);

alter table supplement_logs enable row level security;

create policy "supplement_logs_select_own" on supplement_logs
  for select using (auth.uid() = user_id);
create policy "supplement_logs_insert_own" on supplement_logs
  for insert with check (auth.uid() = user_id);
create policy "supplement_logs_update_own" on supplement_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "supplement_logs_delete_own" on supplement_logs
  for delete using (auth.uid() = user_id);
