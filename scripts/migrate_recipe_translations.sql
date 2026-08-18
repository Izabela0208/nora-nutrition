-- Nora — cache global de traduceri RO pentru rețetele Spoonacular din Today's Plan / 7-Day Plan.
-- O rețetă se traduce o singură dată (primul user care o vede în RO plătește apelul AI);
-- toți userii următori, pentru aceeași rețetă, citesc din acest tabel. Ruleaza o singura data
-- in Supabase -> SQL Editor.

create table if not exists recipe_translations (
  spoonacular_id  integer primary key,
  title           text not null,
  steps           jsonb not null default '[]'::jsonb,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz default now()
);
alter table recipe_translations enable row level security;

-- Vizibila oricarui user autentificat (cache comun) — insert de la orice user autentificat,
-- fara update/delete: odata tradusa, ramane (aceeasi logica ca la community_barcodes).
create policy "recipe_translations_select_authenticated" on recipe_translations
  for select using (auth.uid() is not null);
create policy "recipe_translations_insert_authenticated" on recipe_translations
  for insert with check (auth.uid() is not null);
