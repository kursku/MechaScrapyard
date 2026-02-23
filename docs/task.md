# Sprint 2 — Reclaim Implementation Roadmap

## Priority 1: IMPL_SPEC_00 — First Contact
- [x] Part 1: Require gate audit (training tasks, mission_scout, scrap_thief)
- [x] Part 2: Early moral hook (`evt_moral_first_find`)
- [x] Part 3: Directive Tracker (computed + template + CSS)
- [x] Part 4: Grandpa micro-feedback milestones
- [x] Part 5: Tab emergence NEW badge

## Priority 2: IMPL_SPEC_03 — K.I.T.A. Android Companion
- [x] Part 1: Discovery event + milestone trigger
- [x] Part 2: Android data structure + g. namespace
- [x] Part 3: Task system (assign/unassign/tick)
- [x] Part 4: Upgrades (battery, arm, neural chip)
- [x] Part 5: UI panel in Scrapyard tab
- [x] Part 6: Save/Load

## Priority 3: IMPL_SPEC_04 — City Zones
- [x] Part 1: Zone data — create [data/mecha/zones.json](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/data/mecha/zones.json) + register in [modules.json](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/data/mecha/modules.json)
- [x] Part 2: Engine — [_loadZones](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/src/game.js#1937-1958), discovery events, zone task binding
- [x] Part 3: UI — Map tab with zone cards + detail panel
- [x] Part 4: Save/Load zone state
- [x] Part 5: Verification — test zone unlock flow

## Priority 4: IMPL_SPEC_05 — Faction Alliances
- [ ] Part 1: Rivalry matrix in `factions.json`
- [ ] Part 2: `awardFactionRep` with rivalry spillover + morality modifier
- [ ] Part 3: Vendor system (rep-gated shops)
- [x] Part 4: Faction status display + tier transitions
- [ ] Part 5: Alliance state labels

## Priority 5: IMPL_SPEC_06 — Deep Skill Trees
- [ ] Part 1: Skill tree data structure (Combat + Crafting first)
- [ ] Part 2: Skill point system (resource + earning + spending)
- [ ] Part 3: UI — Skill tree viewer
- [ ] Part 4: Save/Load sub-skills
- [ ] Part 5: Combat integration (skillBonuses)
