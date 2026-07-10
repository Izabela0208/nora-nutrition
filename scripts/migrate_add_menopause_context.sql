-- Nora — A3 (ajustare): adaugă 'menopause' ca al 5-lea context biologic opt-in.
-- Rulează o singură dată în Supabase → SQL Editor (după migrate_user_tables.sql din A2).

alter table profiles drop constraint if exists profiles_biological_context_check;

alter table profiles add constraint profiles_biological_context_check
  check (biological_context in ('cycle','pregnancy','perimenopause','menopause','none'));
