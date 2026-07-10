-- Nora — A3 sub-pasul (2): adaugă 'type' pe meals, ca să acopere și intrările de exercițiu
-- logate prin text liber în My Day (Claude clasifică food/exercise într-un singur apel).
-- Rulează o singură dată în Supabase → SQL Editor (după migrate_user_tables.sql din A2).

alter table meals add column if not exists type text default 'food' check (type in ('food','exercise'));
