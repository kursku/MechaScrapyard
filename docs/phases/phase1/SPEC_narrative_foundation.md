# SPEC: Narrative Foundation — Phase 1 / Rank 4–6

**Type:** `feat(narrative/p1)`
**Effort:** Low — ~2 hours, changes to JSON data + game.js wiring
**Depends on:** Nothing (but SPEC_data_blockers should run first to fix evt_intro)
**Blocks:** Phase 2 home-event wiring, Phase 3 event display system

---

## Why This Matters

New players land on the Scrapyard tab with zero context and 5+ unlocked tasks.
The `DialogueModal` component exists but is never triggered for new players.
Events have no speaker attribution — all voices sound the same.
`evt_grandpa_memorial` is referenced in `narrative_bible.md` but missing from `events.json`.

---

## Files Changed

- `data/mecha/tasks.json`
- `data/mecha/events.json`
- `src/game.js`

---

## Change 1 — Gate Training Tasks Behind First Milestone

**File:** `data/mecha/tasks.json`

New players should only see 2 tasks at start: `scavenge_scrap` and `odd_jobs`.
Everything else should gate in as the player earns resources.

Add `require` fields to the following tasks:

```json
// train_muscle — unlocks after earning 30 scrap
{ "id": "train_muscle", "require": "g.scrap>=30", ... }

// train_neuro — unlocks after earning 30 scrap
{ "id": "train_neuro", "require": "g.scrap>=30", ... }

// train_reflex — same gate if it exists
{ "id": "train_reflex", "require": "g.scrap>=30", ... }

// Any other perpetual training tasks — same gate
```

`scavenge_scrap` and `odd_jobs` remain `"locked": false` with no require.

---

## Change 2 — Opening Dialogue on First Load

**File:** `src/game.js`
**Location:** Inside the `init()` or post-load callback, after `this.loaded = true`

```js
// Only fires when there is no existing save
if (!Persist.hasSave()) {
    // Small delay so UI has time to render
    setTimeout(() => {
        this.showDialogue('system', [
            'SYSTEM BOOT... PILOT INTERFACE ONLINE.',
            'Location: SECTOR 9 SCRAPYARD, NEW TOKYO. Year: 2187.',
            'Pilot status: UNREGISTERED. Frame status: NONE.',
            'You have nothing. Start digging.',
        ]);
    }, 800);
}
```

This uses the existing `DialogueModal` / `showDialogue` pattern already in `game.js`.
The `system` speaker renders in the System Narrator voice (cold, technical, ALL CAPS alerts).

---

## Change 3 — Add Speaker Fields to All Events

**File:** `data/mecha/events.json`

Per the narrative bible's Speaker Voice Guide, each event needs a `speaker` field.
This is data-only — the rendering for different speakers is a Phase 2 task (SPEC_event_display.md).
Adding it now means no second pass on the data file later.

| Event ID | Speaker | Voice |
|----------|---------|-------|
| `evt_intro` | `grandpa` | Gruff, warm, short sentences |
| `evt_sorting` | `grandpa` | Protective, practical |
| `evt_workshop` | `grandpa` | Emotional, rare crack through |
| `evt_garage_discovery` | `grandpa` | Grief, memory of Dad |
| `evt_refinery_online` | `grandpa` | Whispered, reverent |
| `evt_first_blueprint` | `system` | Clinical, curious |
| `evt_neon_bazaar` | `system` | Observational, cold |

```json
// Example — apply pattern to all 7
{
    "id": "evt_sorting",
    "name": "Getting Organized",
    "speaker": "grandpa",
    "require": "g.sorting_station>0",
    "desc": "Grandpa nods approvingly at your new sorting station. 'Your father used to keep things organized too,' he says, looking away."
}
```

---

## Change 4 — Add Missing evt_grandpa_memorial

**File:** `data/mecha/events.json`

The narrative bible's cross-reference table lists `evt_grandpa_memorial` as a required event
triggered after `msn_scrapyard_siege`. It does not exist yet. Add it:

```json
{
    "id": "evt_grandpa_memorial",
    "name": "The Empty Workshop",
    "speaker": "system",
    "require": "g.msn_scrapyard_siege>0",
    "desc": "The workshop is quieter now. The tools are where he left them. The bench he built forty years ago still stands against the wall. Some things outlast the people who made them.",
    "seen": false
}
```

Also add a post-death scrapyard observation event:

```json
{
    "id": "evt_workshop_after",
    "name": "Routines",
    "speaker": "system",
    "require": "g.msn_scrapyard_siege>0&&g.scrap>=100",
    "desc": "The sorting station runs. The refinery hums. The scrapyard does what it was built to do. You keep working. It's what he would have wanted.",
    "seen": false
}
```

---

## Test Checklist

- [ ] New game (clear localStorage) → opening dialogue fires after ~800ms
- [ ] Existing save → opening dialogue does NOT fire on reload
- [ ] Training tasks (`train_muscle` etc.) are locked at game start
- [ ] After earning 30 scrap → training tasks unlock
- [ ] `scavenge_scrap` and `odd_jobs` are always visible from start
- [ ] All events in `events.json` have a `speaker` field
- [ ] `evt_grandpa_memorial` exists in the data
- [ ] `npm run build` passes

---

## Commit Message

```
feat(narrative/p1): add opening dialogue, gate training tasks, add speaker fields to events
```
