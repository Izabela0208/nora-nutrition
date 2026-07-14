-- Nora — Fasting: optiunea "Other" (durata custom, peste 24h).
-- fasting_mode: 'recurring' (fereastra zilnica 16:8 etc.) sau 'extended' (post custom, o singura data).
-- fasting_extended_start_at: momentul de start al postului extins (timestamptz).
-- fasting_extended_hours: durata totala planificata, in ore (poate fi >24, ex. 36 sau 72).
-- Ruleaza o singura data in Supabase -> SQL Editor.

alter table user_settings add column if not exists fasting_mode text not null default 'recurring';
alter table user_settings add column if not exists fasting_extended_start_at timestamptz;
alter table user_settings add column if not exists fasting_extended_hours numeric;
