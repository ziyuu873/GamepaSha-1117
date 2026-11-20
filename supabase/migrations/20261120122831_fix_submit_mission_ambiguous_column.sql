/*
# Fix submit_mission ambiguous column reference

## Overview
- Recreates submit_mission with `#variable_conflict use_column` at the top of
  the function body (before DECLARE) to resolve the "column reference
  player_number is ambiguous" error that occurs because the RETURN TABLE
  column name `player_number` clashes with the `players.player_number` column
  in RETURNING / SELECT INTO.
- Function body logic is unchanged from the previous version (JST daily limit,
  player creation, point awarding).

## Security
- SECURITY DEFINER, search_path = public.
- EXECUTE revoked from PUBLIC, granted to anon + authenticated.
*/

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
#variable_conflict use_column
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
