# SPEC: Skills Mods — Phase 2 / Rank 1

**Type:** `feat(skills/p2)`
**Effort:** Medium — ~3–4 hours (data + mod system wiring in game.js)
**Depends on:** Phase 1 data_blockers (Portuguese ID standardization)
**Blocks:** Phase 3 zone exploration gates (skills are zone prerequisites)

---

## Why This Matters

6 out of 7 skills in `skills.json` have no `mod` field — they are purely progression gates.
Leveling `skill_combat` from 0 to 10 does absolutely nothing to the player's combat performance.
Skills should reward progression mechanically, not just act as locked doors.

The existing mod format used by `skill_gathering` is:
```
"mod": { "scrap.rate": "0.02//100/-8" }
```
Format: `"base_value//scale_cap/offset"` — provides diminishing returns as level increases.

---

## Files Changed

- `data/mecha/skills.json`
- `src/game.js` (if mod application needs wiring for new stat targets)

---

## Change 1 — Add Mods to All 6 Skills

**File:** `data/mecha/skills.json`

Apply the following mods. All use the same diminishing-return format as `skill_gathering`.

```json
{
    "id": "skill_mecha_tech",
    "name": "Mecha Upgrades",
    "mod": { "repair_speed": "0.05//20/0" },
    "desc": "Knowledge of mecha assembly, maintenance, and customization. Each level improves repair speed."
},
{
    "id": "skill_combat",
    "name": "Combat",
    "mod": { "frame_atk_bonus": "0.5//20/0" },
    "desc": "Piloting skill and weapon handling. Each level improves base ATK."
},
{
    "id": "skill_hacking",
    "name": "Hacking & Cybernetics",
    "mod": { "data_chip.rate": "0.01//20/0" },
    "desc": "Netrunning and system exploitation. Each level generates passive data chip income."
},
{
    "id": "skill_investigation",
    "name": "Investigation",
    "mod": { "event_reveal_speed": "0.03//20/0" },
    "desc": "Analyzing clues and uncovering information. Each level accelerates narrative event discovery."
},
{
    "id": "skill_social",
    "name": "Social Influence",
    "mod": { "faction_rep_gain_pct": "0.02//20/0" },
    "desc": "Diplomacy and negotiation. Each level gives a percentage bonus to all faction rep gains."
},
{
    "id": "skill_crafting",
    "name": "Crafting & Research",
    "mod": { "recipe_speed": "0.04//20/0" },
    "desc": "Fabrication and blueprint analysis. Each level speeds up all refinery recipes."
}
```

---

## Change 2 — Wire New Mod Targets in game.js

Some mod targets (`repair_speed`, `frame_atk_bonus`, `faction_rep_gain_pct`, `recipe_speed`)
may not be registered in the mod application system. Check `game.js` for where `skill_gathering`'s
`scrap.rate` mod is applied and add equivalent application points:

| Mod target | Apply location |
|-----------|---------------|
| `repair_speed` | `repairFrame()` in game.js — multiply repair amount by `1 + repair_speed` |
| `frame_atk_bonus` | `recalculateFrameStats()` in gameState.js — add flat bonus to final ATK |
| `faction_rep_gain_pct` | `awardFactionRep()` in game.js — multiply final rep award by `1 + faction_rep_gain_pct` |
| `recipe_speed` | `runner.getTaskSpeed()` in runner.js — check for recipe tag and apply bonus |
| `data_chip.rate` | Same pattern as `scrap.rate` — direct resource rate modifier |
| `event_reveal_speed` | Phase 3 concern — stub the target now, implement fully in SPEC_event_display |

---

## Test Checklist

- [ ] `skill_gathering` still works (regression check — don't break existing mod)
- [ ] Level up `skill_combat` in console → frame ATK stat increases
- [ ] Level up `skill_social` → `awardFactionRep` awards more rep than base
- [ ] Level up `skill_crafting` → recipe completes faster (visible in time estimate)
- [ ] `npm run build` passes
- [ ] Playwright tests pass

---

## Commit Message

```
feat(skills/p2): add mechanical mods to all 6 skills, wire new mod targets
```
