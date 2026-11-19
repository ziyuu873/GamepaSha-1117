/*
# Lock down anon writes + JST daily limit + form_url

## Overview
- Removes INSERT / UPDATE / DELETE policies for anon role on players, missions,
  submissions. Keeps anon SELECT (read-only). The submit_mission SECURITY DEFINER
  function remains the only write path — it runs as the table owner, so it bypasses
  RLS for inserts/updates.
- Grants for anon are reduced to SELECT only on all three tables.
- submit_mission daily-limit check now counts submissions by Asia/Tokyo calendar day
  instead of the server's UTC CURRENT_DATE.
- Sets form_url on the sort_order=1 mission (朝焼け).

## Security changes
- players: anon loses INSERT/UPDATE/DELETE policies + grants.
- missions: anon loses INSERT/UPDATE/DELETE policies + grants.
- submissions: anon loses INSERT/UPDATE/DELETE policies + grants.
- authenticated keeps full CRUD (unchanged) so the Data API still works for
  signed-in contexts if ever added.
- submit_mission (SECURITY DEFINER) still writes on behalf of anon callers.
*/

-- Drop anon write policies on players
DROP POLICY IF EXISTS "anon_insert_players" ON players;
DROP POLICY IF EXISTS "anon_update_players" ON players;
DROP POLICY IF EXISTS "anon_delete_players" ON players;

-- Drop anon write policies on missions
DROP POLICY IF EXISTS "anon_insert_missions" ON missions;
DROP POLICY IF EXISTS "anon_update_missions" ON missions;
DROP POLICY IF EXISTS "anon_delete_missions" ON missions;

-- Drop anon write policies on submissions
DROP POLICY IF EXISTS "anon_insert_submissions" ON submissions;
DROP POLICY IF EXISTS "anon_update_submissions" ON submissions;
DROP POLICY IF EXISTS "anon_delete_submissions" ON submissions;

-- Reduce anon grants to SELECT only
REVOKE INSERT, UPDATE, DELETE ON players FROM anon;
REVOKE INSERT, UPDATE, DELETE ON missions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON submissions FROM anon;

GRANT SELECT ON players TO anon;
GRANT SELECT ON missions TO anon;
GRANT SELECT ON submissions TO anon;

-- Update submit_mission to use Asia/Tokyo for daily limit
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
  v_today_jst date;
BEGIN
  -- Japan calendar day (UTC+9)
  v_today_jst := (now() AT TIME ZONE 'Asia/Tokyo')::date;

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

  -- Enforce daily limit using JST date
  IF v_mission_max_per_day IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM submissions
    WHERE player_id = v_player_id
      AND mission_id = p_mission_id
      AND (created_at AT TIME ZONE 'Asia/Tokyo')::date >= v_today_jst;
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

-- Set form_url for 朝焼け mission (sort_order 1)
UPDATE missions SET form_url = 'https://forms.gle/em9db8QCar3UsoGH6' WHERE sort_order = 1;
