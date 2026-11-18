/*
# Create game tables (players, missions, submissions)

## Overview
Creates the core tables for a photo-mission game where players compete on a ranking.
This is a no-auth (single-tenant) app: no sign-in screen, so policies allow anon + authenticated.

## New Tables

### players
- `id` (uuid, primary key)
- `name` (text, not null) — player display name
- `avatar_color` (text) — a color used for the avatar badge
- `score` (integer, default 0) — total score used for ranking
- `created_at` (timestamptz, default now())

### missions
- `id` (uuid, primary key)
- `title` (text, not null) — mission title
- `description` (text) — what the player needs to do
- `reward` (integer, default 100) — points awarded on completion
- `active` (boolean, default true) — whether the mission is currently available
- `created_at` (timestamptz, default now())

### submissions
- `id` (uuid, primary key)
- `player_id` (uuid, references players) — who submitted
- `mission_id` (uuid, references missions) — which mission
- `photo_url` (text) — the submitted photo (URL or data path)
- `status` (text, default 'pending') — pending / approved / rejected
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on all tables.
- Grants: SELECT, INSERT, UPDATE, DELETE to anon + authenticated (no-auth app, shared data).
- Policies: all open (USING true / WITH CHECK true) because this is a no-auth game with intentionally public shared data.
*/

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_color text NOT NULL DEFAULT '#3b82f6',
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  reward integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  photo_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON players TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON missions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON submissions TO anon, authenticated;

-- players policies
DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);

-- missions policies
DROP POLICY IF EXISTS "anon_select_missions" ON missions;
CREATE POLICY "anon_select_missions" ON missions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_missions" ON missions;
CREATE POLICY "anon_insert_missions" ON missions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_missions" ON missions;
CREATE POLICY "anon_update_missions" ON missions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_missions" ON missions;
CREATE POLICY "anon_delete_missions" ON missions FOR DELETE
  TO anon, authenticated USING (true);

-- submissions policies
DROP POLICY IF EXISTS "anon_select_submissions" ON submissions;
CREATE POLICY "anon_select_subissions" ON submissions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_submissions" ON submissions;
CREATE POLICY "anon_insert_submissions" ON submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_submissions" ON submissions;
CREATE POLICY "anon_update_submissions" ON submissions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_submissions" ON submissions;
CREATE POLICY "anon_delete_submissions" ON submissions FOR DELETE
  TO anon, authenticated USING (true);
