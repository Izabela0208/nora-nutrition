-- Nora — Ciclu menstrual: istoric real (inceput + sfarsit), nu doar o singura data + durata estimata.
-- Inlocuieste sursa de adevar pentru getCyclePhase (profiles.last_period_date/cycle_length raman
-- ca fallback: cycle_length se mai foloseste cat timp nu exista 2+ cicluri complete in istoric).
-- Ruleaza o singura data in Supabase -> SQL Editor.

create table if not exists period_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  start_date  date not null,
  end_date    date,
  created_at  timestamptz default now()
);

alter table period_logs enable row level security;

create policy "period_logs_select_own" on period_logs
  for select using (auth.uid() = user_id);
create policy "period_logs_insert_own" on period_logs
  for insert with check (auth.uid() = user_id);
create policy "period_logs_update_own" on period_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "period_logs_delete_own" on period_logs
  for delete using (auth.uid() = user_id);
