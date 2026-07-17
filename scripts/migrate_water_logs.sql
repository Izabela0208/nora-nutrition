-- Nora — Weekly Biohack Report (Ritual, Faza 2): istoric real de hidratare.
-- Apa era tinuta doar local (total pe azi, in localStorage) - fara istoric,
-- randul "Water" din raportul saptamanal nu poate fi calculat pentru zilele
-- trecute fara acest tabel. Fiecare adaugare de apa devine un rand propriu,
-- la fel ca mesele (meals), nu un total pre-agregat.
-- Ruleaza o singura data in Supabase -> SQL Editor.

create table if not exists water_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount_ml   numeric not null,
  logged_at   timestamptz default now()
);

alter table water_logs enable row level security;

create policy "water_logs_select_own" on water_logs
  for select using (auth.uid() = user_id);
create policy "water_logs_insert_own" on water_logs
  for insert with check (auth.uid() = user_id);
create policy "water_logs_update_own" on water_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "water_logs_delete_own" on water_logs
  for delete using (auth.uid() = user_id);
