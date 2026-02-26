# Phase 1 — Foundation: Checklist

**Status:** `NOT STARTED`
**Goal:** Fix all blockers. Game is stable, data is consistent, first impression works.
**Estimated effort:** ~1–2 days

> Tick each checkbox as it is done. Record the commit hash inline.
> When all boxes are checked, tag: `git tag -a phase1-complete -m "Phase 1 complete"`

---

## SPEC 1 — Data Blockers
> File: `SPEC_data_blockers.md`
> Commit type: `fix(data/p1)`

- [ ] Fix zone mission ID mismatch (`msn_rogue_drone_patrol` → `mission_scrap_drone`)
- [ ] Standardize Portuguese IDs (`garagem` → `garage`, `mesa_pesquisa` → `research_desk`)
- [ ] Fix `evt_intro` require (`"energy"` → `""`)

**Commit:** —

---

## SPEC 2 — Save Basics
> File: `SPEC_save_basics.md`
> Commit type: `feat(save/p1)`

- [ ] Add `beforeunload` force-save handler in `game.js`
- [ ] Add `meta: { savedAt, version }` to save payload
- [ ] Show 2-second SAVED flash in HUD on autosave
- [ ] Detect `QuotaExceededError` and show in-game warning

**Commit:** —

---

## SPEC 3 — Narrative Foundation
> File: `SPEC_narrative_foundation.md`
> Commit type: `feat(narrative/p1)`

- [ ] Add `require` gate (`g.scrap>=30`) to training tasks in `tasks.json`
- [ ] Wire opening dialogue on first load (`!Persist.hasSave()`) in `game.js`
- [ ] Add `speaker` field to all 7 entries in `events.json`
- [ ] Add missing `evt_grandpa_memorial` entry to `events.json`

**Commit:** —

---

## SPEC 4 — Combat Trivials
> File: `SPEC_combat_trivials.md`
> Commit type: `fix(combat/p1)`

- [ ] Remove `slice(-12)` from `recentLog` computed — enable full log scroll
- [ ] Add retreat penalty `title` tooltip to RETREAT button
- [ ] Lock maneuver shop section behind `state.items.glory?.val > 0`
- [ ] Add empty state message for locked maneuver shop

**Commit:** —

---

## SPEC 5 — Mecha Trivials
> File: `SPEC_mecha_trivials.md`
> Commit type: `feat(mecha/p1)`

- [ ] Add item counts to inventory tabs (FRAMES, PARTS, WEAPONS)
- [ ] Add dismantle confirmation (two-step or confirm dialog)
- [ ] Add COR stat box to chassis overview bar
- [ ] Remove `energy` explanation hint (Energy tooltip — inline note in UI)

**Commit:** —

---

## Phase 1 Done?

When all 5 specs are committed:

```bash
git tag -a phase1-complete -m "Phase 1: Foundation complete. Data blockers fixed, save improved, narrative wired, UI polish applied."
```

Then update `docs/phases/PHASE_INDEX.md` — mark Phase 1 as ✅ COMPLETE.
