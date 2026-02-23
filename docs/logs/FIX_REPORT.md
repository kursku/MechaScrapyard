# Bug Fix: Scout Local Sector No Trigger

## Issue

The "Scout Local Sector" task was completing but not triggering the "Rogue Drone Patrol" mission.

## Cause

The mission trigger relied on `mission_scrap_drone` being unlocked, but it was locked in your save file (from before this update). The game logic silently failed to start locked missions.

## Fix Applied (src/game.js)

Modified `Game.tick()` to automatically **force-unlock** the mission when the task completes.

## Instructions

1. Refresh the game page.
2. Run the **Scout Local Sector** task again.
3. Upon completion, you should see a `[SYSTEM] Mission Unlocked` message and the combat should start immediately.
