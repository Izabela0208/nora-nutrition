-- Nora — Longevity Score (Ritual): istoric real de greutate.
-- profiles.weight_kg e o singura valoare curenta, suprascrisa la fiecare
-- editare din Me - fara serie temporala, fara trend posibil pentru scor.
-- Fiecare schimbare de greutate devine un rand propriu, la fel ca apa
-- (water_logs), nu o singura valoare suprascrisa.
-- Ruleaza o singura data in Supabase -> SQL Editor.

create table if not exists weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  weight_kg   numeric not null,
  logged_at   timestamptz default now()
);

alter table weight_logs enable row level security;

create policy "weight_logs_select_own" on weight_logs
  for select using (auth.uid() = user_id);
create policy "weight_logs_insert_own" on weight_logs
  for insert with check (auth.uid() = user_id);
create policy "weight_logs_update_own" on weight_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weight_logs_delete_own" on weight_logs
  for delete using (auth.uid() = user_id);
