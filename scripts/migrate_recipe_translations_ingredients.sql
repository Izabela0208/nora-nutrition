-- Nora — adaugă coloana pentru traducerea (doar afișare) ingredientelor, alături de title/steps
-- deja existente în recipe_translations. Numele englezesc original al ingredientului
-- (meal.ingredients[].item) rămâne neschimbat — logica de listă de cumpărături
-- (normIngKey/categorizIng din Eat.jsx) continuă să opereze pe el. Ruleaza o singura data
-- in Supabase -> SQL Editor.

alter table recipe_translations add column if not exists ingredients jsonb not null default '[]'::jsonb;
