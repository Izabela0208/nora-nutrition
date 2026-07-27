-- Nora — G4: baza proprie de coduri de bare, alimentata de useri.
-- Ruleaza o singura data in Supabase -> SQL Editor.

create table if not exists community_barcodes (
  barcode     text primary key,
  name        text not null,
  kcal        numeric not null,
  protein_g   numeric not null default 0,
  carbs_g     numeric not null default 0,
  fat_g       numeric not null default 0,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);
alter table community_barcodes enable row level security;

-- Vizibila oricarui user autentificat (baza comuna) — scriere doar pentru
-- rândul propriu, fara update/delete: odata adaugat, ramane (evita
-- suprascrieri accidentale; corectarea e o decizie separata, ulterioara).
create policy "community_barcodes_select_authenticated" on community_barcodes
  for select using (auth.uid() is not null);
create policy "community_barcodes_insert_own" on community_barcodes
  for insert with check (auth.uid() = created_by);
