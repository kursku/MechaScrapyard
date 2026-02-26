# SPEC: Data Blockers — Phase 1 / Rank 1–2

**Type:** `fix(data/p1)`
**Effort:** Trivial — pure JSON edits, no code changes
**Depends on:** Nothing
**Blocks:** Zone exploration (P3), Phase 3–4 content gates

---

## Why This Matters

Three data consistency bugs cause silent failures at runtime:

1. `zones.json` references `msn_rogue_drone_patrol` — a mission ID that doesn't exist. The actual ID in `missions.json` is `mission_scrap_drone`. Any zone-mission lookup silently returns nothing.
2. Multiple files use Portuguese upgrade IDs (`garagem`, `mesa_pesquisa`) that don't match any actual item IDs. Phase 3 and Phase 4 content gates using `g.garagem>0` will never evaluate true.
3. `events.json` evt_intro has `"require": "energy"` — this evaluates the resource object as truthy and fires immediately every tick, not just once on game start.

---

## Files Changed

- `data/mecha/zones.json`
- `data/mecha/homes.json`
- `data/mecha/furniture.json`
- `data/mecha/events.json`

---

## Change 1 — Fix Zone Mission ID Mismatch

**File:** `data/mecha/zones.json`
**Location:** `zone_scrapyard.availableMissions[0]`

```json
// BEFORE
"availableMissions": ["msn_rogue_drone_patrol"]

// AFTER
"availableMissions": ["mission_scrap_drone"]
```

---

## Change 2 — Standardize Portuguese IDs

Do a global find-replace across all data files:

| Old ID | New ID | Appears in |
|--------|--------|-----------|
| `garagem` | `garage` | `zones.json`, `homes.json`, `furniture.json`, `skills.json` |
| `mesa_pesquisa` | `research_desk` | `homes.json`, `zones.json` |

**Verification after change:**
- Search codebase for `garagem` — should return 0 results
- Search codebase for `mesa_pesquisa` — should return 0 results
- Confirm `homes.json` phase 3 require reads: `"require": "g.refinery>0&&g.garage>0"`
- Confirm `homes.json` phase 4 require reads: `"require": "g.research_desk>0&&g.scrapyard_phase3>0"`

---

## Change 3 — Fix evt_intro Require

**File:** `data/mecha/events.json`
**Location:** First entry, `evt_intro`

```json
// BEFORE
{ "id": "evt_intro", "require": "energy", ... }

// AFTER
{ "id": "evt_intro", "require": "", ... }
```

An empty string require means "fire once when the event system first checks this event." No condition needed — it should always show at first play.

---

## Test Checklist

- [ ] `npm run build` — passes with no errors
- [ ] `npx playwright test` — all 5 faction tests pass
- [ ] In browser console: `Game.state.items['mission_scrap_drone']` — returns mission object (not undefined)
- [ ] In browser console: `Game.techTree.evaluate("g.garage>0")` — returns false initially (not error)
- [ ] `evt_intro` does not fire on every tick — fires once only

---

## Commit Message

```
fix(data/p1): fix zone mission ID, standardize Portuguese IDs, fix evt_intro require
```
