/*
# Update form_url and reward_points for missions

## Overview
- Sets form_url on the sort_order=3 mission (靴と一緒に足元を撮ろう).
- Updates reward_points on all three missions:
  - sort_order 1 (朝焼け): 50 pt
  - sort_order 2 (身の回りの危険): 10 pt
  - sort_order 3 (靴): 20 pt

## Changes
- missions table rows updated in place (no schema changes).
*/

UPDATE missions SET form_url = 'https://forms.gle/zr9Lu27fvnWe2iaRA' WHERE sort_order = 3;

UPDATE missions SET reward_points = 50 WHERE sort_order = 1;
UPDATE missions SET reward_points = 10 WHERE sort_order = 2;
UPDATE missions SET reward_points = 20 WHERE sort_order = 3;
