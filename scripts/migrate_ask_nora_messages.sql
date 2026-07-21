-- Nora — Persistenta reala a conversatiei Ask Nora (inlocuieste localStorage).
-- Ruleaza o singura data in Supabase -> SQL Editor.

create table if not exists ask_nora_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz default now()
);

create index if not exists ask_nora_messages_user_created_idx
  on ask_nora_messages(user_id, created_at);

alter table ask_nora_messages enable row level security;

create policy "ask_nora_messages_select_own" on ask_nora_messages
  for select using (auth.uid() = user_id);
create policy "ask_nora_messages_insert_own" on ask_nora_messages
  for insert with check (auth.uid() = user_id);
create policy "ask_nora_messages_delete_own" on ask_nora_messages
  for delete using (auth.uid() = user_id);
