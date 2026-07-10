-- Nora — A3(4): user_settings ramane doar pentru notificari + preferinte viitoare.
-- height_unit/weight_unit sunt deja in profiles (sursa unica) - coloanele din
-- user_settings sunt nefolosite de aplicatie, se elimina ca sa nu existe doua surse.
-- Ruleaza o singura data in Supabase -> SQL Editor.

alter table user_settings drop column if exists height_unit;
alter table user_settings drop column if exists weight_unit;
