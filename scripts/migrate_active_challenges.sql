-- Nora — A3(3): tabel pentru sesiunea challenge-urilor active (Ritual).
-- challenge_completions (creat în A2) ține doar zilele bifate; acest tabel ține
-- challenge-ul pornit (metadate + țintă de zile), separat de check-in-uri.
-- Rulează o singură dată în Supabase → SQL Editor.

create table if not exists active_challenges (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  challenge_id  text not null,
  title         text not null,
  instruction   text,
  difficulty    text,
  duration      text,
  category      text,
  label         text,
  target_days   int not null,
  start_date    date not null,
  created_at    timestamptz default now(),
  unique (user_id, challenge_id)
);

alter table active_challenges enable row level security;

create policy "active_challenges_select_own" on active_challenges
  for select using (auth.uid() = user_id);
create policy "active_challenges_insert_own" on active_challenges
  for insert with check (auth.uid() = user_id);
create policy "active_challenges_update_own" on active_challenges
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "active_challenges_delete_own" on active_challenges
  for delete using (auth.uid() = user_id);
