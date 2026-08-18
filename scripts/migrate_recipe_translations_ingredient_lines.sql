-- Nora — adaugă coloana pentru traducerea (propoziție completă) a liniilor de ingrediente
-- folosite în Search Foods (Eat.jsx), unde fiecare ingredient e stocat ca o singură linie
-- naturală (ex. "2 cups all-purpose flour, sifted"), spre deosebire de Today's Plan/7-Day Plan
-- (unde ingredientele sunt {item, amount} separate, coloana "ingredients" existentă).
-- Update-ul acestei coloane pe un rând deja existent (creat de fluxul Today's Plan) necesită
-- o politică de UPDATE, care nu exista până acum (recipe_translations era doar insert-only).
-- Ruleaza o singura data in Supabase -> SQL Editor.

alter table recipe_translations add column if not exists ingredient_lines jsonb not null default '[]'::jsonb;

create policy "recipe_translations_update_authenticated" on recipe_translations
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
