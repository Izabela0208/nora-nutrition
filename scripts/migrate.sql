-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS concepts (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  slug           TEXT UNIQUE,
  level          TEXT,
  category       TEXT,
  summary        TEXT,
  body           TEXT,
  key_points     JSONB DEFAULT '[]',
  related_concepts JSONB DEFAULT '[]',
  tags           JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  author       TEXT,
  category     TEXT,
  level        TEXT,
  year         INTEGER,
  pages        INTEGER,
  rating       DECIMAL(3,1),
  description  TEXT,
  key_takeaway TEXT,
  amazon_url   TEXT,
  tags         JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS podcasts (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  host         TEXT,
  category     TEXT,
  description  TEXT,
  frequency    TEXT,
  avg_duration TEXT,
  level        TEXT,
  spotify_url  TEXT,
  apple_url    TEXT,
  top_episodes JSONB DEFAULT '[]',
  tags         JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security: public reads, no public writes
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE books    ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_concepts" ON concepts FOR SELECT USING (true);
CREATE POLICY "public_read_books"    ON books    FOR SELECT USING (true);
CREATE POLICY "public_read_podcasts" ON podcasts FOR SELECT USING (true);
