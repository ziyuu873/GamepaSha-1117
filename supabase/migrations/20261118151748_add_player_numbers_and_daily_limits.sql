/*
# Add player numbers, daily limits, and submission function

## Overview
- Adds auto-incrementing player numbers so players are identified by a number
  (no name input needed — a number is issued on first mission completion).
- Adds per-mission daily submission limits (NULL = unlimited, 1 = once per day).
- Updates the three missions to the new set.
- Creates a SECURITY DEFINER function `submit_mission` that atomically:
  creates/looks up a player by number, enforces the daily limit, records the
  submission, and awards points.

## Changes

### players table
- New column: `player_number` (bigint, GENERATED ALWAYS AS IDENTITY) — unique
  auto-incrementing number shown to the player.

### missions table
- New column: `max_per_day` (integer, nullable) — NULL = unlimited, N = max N
  submissions per calendar day.

### missions data (updated in place)
- sort_order 1 → 朝焼け（朝日）を撮影しよう — 100 pt, 1/day
- sort_order 2 → 身の回りで危ないと思った場所を撮影 — 150 pt, unlimited
- sort_order 3 → 靴と一緒に足元を撮ろう — 80 pt, 1/day

### New function: submit_mission(p_mission_id, p_player_number DEFAULT NULL)
- SECURITY DEFINER, search_path = public
- p_player_number NULL → creates a new player, returns the new number.
- p_player_number provided → looks up the existing player.
- Enforces max_per_day (counts submissions since CURRENT_DATE).
- Inserts submission row, adds reward_points to player's score.
- Returns: player_number, player_id, total_score, awarded_points,
  is_new_player, mission_title.
- EXECUTE revoked from PUBLIC; granted to anon + authenticated.
*/

-- 1. Add player_number as identity column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'player_number'
  ) THEN
    ALTER TABLE players ADD COLUMN player_number bigint GENERATED ALWAYS AS IDENTITY;
  END IF;
END $$;

-- 2. Default name to 'Player'
ALTER TABLE players ALTER COLUMN name SET DEFAULT 'Player';

-- 3. Add max_per_day to missions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'missions' AND column_name = 'max_per_day'
  ) THEN
    ALTER TABLE missions ADD COLUMN max_per_day integer;
  END IF;
END $$;

-- 4. Update mission content
UPDATE missions SET
  title = '朝焼け（朝日）を撮影しよう',
  description = '今日の朝焼けや美しい朝日を一枚投稿しよう',
  reward_points = 100,
  max_per_day = 1
WHERE sort_order = 1;

UPDATE missions SET
  title = '身の回りで危ないと思った場所を撮影',
  description = '日常生活で「ここ危ないかも」と思った場所を撮影して投稿しよう',
  reward_points = 150,
  max_per_day = NULL
WHERE sort_order = 2;

UPDATE missions SET
  title = '靴と一緒に足元を撮ろう',
  description = '今履いている靴と一緒に足元の風景を一枚投稿しよう',
  reward_points = 80,
  max_per_day = 1
WHERE sort_order = 3;

-- 5. Create submit_mission function
CREATE OR REPLACE FUNCTION submit_mission(
  p_mission_id uuid,
  p_player_number bigint DEFAULT NULL
) RETURNS TABLE(
  player_number bigint,
  player_id uuid,
  total_score int,
  awarded_points int,
  is_new_player boolean,
  mission_title text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id uuid;
  v_player_number bigint;
  v_player_score int;
  v_mission_title text;
  v_mission_reward int;
  v_mission_max_per_day int;
  v_count int;
  v_new boolean := false;
BEGIN
  -- Validate mission
  SELECT title, reward_points, max_per_day
    INTO v_mission_title, v_mission_reward, v_mission_max_per_day
  FROM missions WHERE id = p_mission_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ミッションが見つかりません';
  END IF;

  -- Get or create player
  IF p_player_number IS NOT NULL THEN
    SELECT id, player_number, score
      INTO v_player_id, v_player_number, v_player_score
    FROM players WHERE player_number = p_player_number;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'プレイヤー番号 % が見つかりません', p_player_number;
    END IF;
  ELSE
    INSERT INTO players (name, score) VALUES ('Player', 0)
    RETURNING id, player_number, score INTO v_player_id, v_player_number, v_player_score;
    UPDATE players SET name = 'Player #' || v_player_number WHERE id = v_player_id;
    v_new := true;
  END IF;

  -- Enforce daily limit
  IF v_mission_max_per_day IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM submissions
    WHERE player_id = v_player_id
      AND mission_id = p_mission_id
      AND created_at >= CURRENT_DATE;
    IF v_count >= v_mission_max_per_day THEN
      RAISE EXCEPTION 'DAILY_LIMIT_REACHED';
    END IF;
  END IF;

  -- Record submission and award points
  INSERT INTO submissions (player_id, mission_id)
  VALUES (v_player_id, p_mission_id);

  UPDATE players SET score = score + v_mission_reward WHERE id = v_player_id;
  v_player_score := v_player_score + v_mission_reward;

  RETURN QUERY
    SELECT v_player_number, v_player_id, v_player_score, v_mission_reward, v_new, v_mission_title;
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_mission(uuid, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_mission(uuid, bigint) TO anon, authenticated;
