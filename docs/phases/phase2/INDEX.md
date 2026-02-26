# Phase 2 — Core Experience: Checklist

**Status:** `NOT STARTED`
**Goal:** Skills matter mechanically. Combat has depth. UI is informative. First story beats land.
**Estimated effort:** ~1 week
**Prerequisite:** Phase 1 complete and tagged

> Tick each checkbox as it is done. Record the commit hash inline.
> When all boxes are checked, tag: `git tag -a phase2-complete -m "Phase 2 complete"`

---

## SPEC 1 — Skills Mods
> File: `SPEC_skills_mods.md`
> Commit type: `feat(skills/p2)`

- [ ] Add `mod` to `skill_mecha_tech` (repair speed bonus)
- [ ] Add `mod` to `skill_combat` (ATK bonus per level)
- [ ] Add `mod` to `skill_hacking` (data_chip rate bonus)
- [ ] Add `mod` to `skill_investigation` (event discovery rate)
- [ ] Add `mod` to `skill_social` (faction rep gain bonus)
- [ ] Add `mod` to `skill_crafting` (recipe speed bonus)
- [ ] Wire skill mods through `game.js` mod system

**Commit:** —

---

## SPEC 2 — Furniture Items
> File: `SPEC_furniture_items.md`
> Commit type: `feat(data/p2)`

- [ ] Add `cybernetic_bench` to `furniture.json`
- [ ] Add `research_desk` to `furniture.json` (replaces `mesa_pesquisa`)
- [ ] Give `workbench` a recipe_speed bonus in its `mod` field
- [ ] Add `pilot_sim` furniture (pilot skill training bonus)
- [ ] Add `repair_bay` furniture (auto-repairs frame condition)
- [ ] Register new furniture IDs in `modules.json` if required

**Commit:** —

---

## SPEC 3 — Home Event Wiring
> File: `SPEC_home_event_wiring.md`
> Commit type: `feat(narrative/p2)`

- [ ] Wire `scrapyard_phase2` unlock → fires `evt_sorting`
- [ ] Wire `scrapyard_phase3` unlock → fires `evt_garage_discovery` + unlocks `frame_hayabusa_mk1`
- [ ] Wire `scrapyard_phase4` unlock → fires `evt_refinery_online`
- [ ] Wire `msn_scrapyard_siege` complete → fires `evt_grandpa_memorial`
- [ ] Ensure events only fire once (seen tracking)

**Commit:** —

---

## SPEC 4 — Combat Depth
> File: `SPEC_combat_depth.md`
> Commit type: `feat(combat/p2)`

- [ ] Token legend strip below battle grid (active tokens + one-line descriptions)
- [ ] Enemy heat and stress bars in battle view
- [ ] Mid-combat stance switching in battle footer
- [ ] Mission power vs difficulty indicator on mission cards

**Commit:** —

---

## SPEC 5 — Mecha Depth
> File: `SPEC_mecha_depth.md`
> Commit type: `feat(mecha/p2)`

- [ ] Parts inventory grouped by slot (TORSO / ARMS / LEGS subheaders)
- [ ] Installed weapon badge in weapons inventory tab
- [ ] Stat diff on hover (compare to currently installed part)

**Commit:** —

---

## SPEC 6 — UI Fundamentals
> File: `SPEC_ui_fundamentals.md`
> Commit type: `feat(ui/p2)`

- [ ] Persistent task progress bar in HUD (task name + progress + ETA)
- [ ] Resource rates shown inline in ResourceMonitor sidebar
- [ ] Tab unlock dot badge when new content available
- [ ] Empty state messages for all section panels
- [ ] Backup save slot (BACKUP_KEY, saves every 5 min)
- [ ] Export / Import save UI

**Commit:** —

---

## SPEC 7 — Content Missions
> File: `SPEC_content_missions.md`
> Commit type: `content(p2)`

- [ ] Add `mission_narrative_intro` (narrative mission, no combat, always unlocked)
- [ ] Add `mission_rogue_labor` with correct enemy (difficulty 2, fills gap)
- [ ] Fix `mission_rogue_labor` enemy from `scrap_drone` to proper labor enemy
- [ ] First mecha directive chain (earn creds → buy frame → Mecha tab unlocks)
- [ ] Add energy regeneration tooltip/directive note

**Commit:** —

---

## Phase 2 Done?

When all 7 specs are committed:

```bash
git tag -a phase2-complete -m "Phase 2: Core experience complete. Skills mechanical, combat depth added, UI fundamentals in place, first story beats functional."
```

Then update `docs/phases/PHASE_INDEX.md` — mark Phase 2 as ✅ COMPLETE.
