-- Nora — policy-uri RLS suplimentare pentru oura_daily_data (INSERT/UPDATE/DELETE).
-- Ruleaza o singura data in Supabase -> SQL Editor. Necesar doar daca ai rulat deja
-- migrate_oura.sql inainte de aceasta adaugare (acum inclusa acolo pentru instalari noi).

-- Defense in depth: sincronizarea scrie mereu prin service_role (ocoleste RLS
-- complet), deci aceste policy-uri nu se activeaza in operarea normala. Exista
-- ca plasa de siguranta, daca vreodata se adauga din greseala o scriere client-side.
create policy "oura_daily_data_insert_own" on oura_daily_data
  for insert with check (auth.uid() = user_id);
create policy "oura_daily_data_update_own" on oura_daily_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "oura_daily_data_delete_own" on oura_daily_data
  for delete using (auth.uid() = user_id);
