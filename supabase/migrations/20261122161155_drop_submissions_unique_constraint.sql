/*
# Remove unique constraint on submissions (mission_id, player_id)

## Overview
- Drops the UNIQUE constraint "submissions_mission_id_player_id_key" so the same
  player can complete the same mission multiple times. Daily limits are enforced
  by submit_mission via max_per_day, not by this constraint.

## Security
- No RLS or privilege changes.
*/

ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_mission_id_player_id_key;
