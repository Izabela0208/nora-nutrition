-- Nora — Pas 5 (My Day): fereastra de fasting, opt-in din Me.
-- fasting_enabled: toggle. fasting_start/fasting_end: "HH:MM" (24h), fereastra de mancare aleasa.
-- Ruleaza o singura data in Supabase -> SQL Editor.

alter table user_settings add column if not exists fasting_enabled boolean not null default false;
alter table user_settings add column if not exists fasting_start text;
alter table user_settings add column if not exists fasting_end text;
