# MECHA SCRAPYARD — Reclaim Sprint: Master Index
## 6 Implementation Specs for Antigravity

**From:** Design (Claude) | **Date:** February 2026

---

## IMPLEMENTATION ORDER

```
Reclaim-01: Morale System ◄── FOUNDATION
    ├── Reclaim-02: Job Progression (branches on morality)
    ├── Reclaim-05: Faction Alliances (morality modifies rep)
    └── Reclaim-04: City Zones (morale-gated content)
Reclaim-03: Android Companion (standalone, enhances idle loop)
Reclaim-06: Deep Skill Trees (standalone, deepens progression)
```

**Recommended order:** 01 → 02 → 05 → 04 → 03 → 06

---

## SPECS

| # | File | System | Priority | Effort | Depends On |
|---|------|--------|----------|--------|------------|
| 01 | `IMPL_SPEC_01_morale_system.md` | Morale & Moral Choices | 🔴 CRITICAL | 4-6 hrs | None |
| 02 | `IMPL_SPEC_02_job_progression.md` | 4 Career Paths + Passive Income | 🔴 CRITICAL | 6-8 hrs | 01 |
| 03 | `IMPL_SPEC_03_android_companion.md` | K.I.T.A. Automation Companion | 🟡 HIGH | 5-7 hrs | None |
| 04 | `IMPL_SPEC_04_city_zones.md` | 8 City Zones & Exploration | 🟡 HIGH | 6-8 hrs | None |
| 05 | `IMPL_SPEC_05_faction_alliances.md` | Faction Rivalry & Vendors | 🟡 HIGH | 5-7 hrs | 01 |
| 06 | `IMPL_SPEC_06_deep_skill_trees.md` | 70 Sub-Skills, 7 Trees, 4 Tiers | 🟢 MEDIUM | 6-8 hrs | None |
| | | **TOTAL** | | **32-44 hrs** | |

---

## WHAT EACH SPEC DELIVERS

**01 — Morale:** Wires existing `BipolarStat.js` into GameState. `g.morality>=30` gates all content. 3 moral choice events. Bipolar UI bar.

**02 — Jobs:** Police/Trader/Netrunner/Arena with 3 tiers × 2 paths (Idealist/Pragmatic). Passive income per tick = the missing idle loop. Job-gated missions.

**03 — Android:** K.I.T.A. found through scrapyard event. Assignable to perpetual tasks. Own energy pool. Levels 1-10. Upgradeable modules. Personality quips.

**04 — Zones:** Scrapyard → Downtown → Slums → Industrial → Arena → Corporate → CyberLab → Nexus. Sub-areas with require gates. Exploration mechanic. Discovery narratives.

**05 — Factions:** Rivalry matrix (helping NTPD hurts Exile). Morality modifier on rep. Vendor system gated by rep tier. Enhanced tier transitions with unlocks.

**06 — Skills:** 10 sub-skills per category (4 tiers: 1→2→3→4). Skill point resource. Prerequisites. Tree visualization UI. Combat stat integration.

---

## ARCHITECTURE PATTERNS (ALL SPECS)

All follow existing codebase conventions:
- Data in `data/mecha/*.json`, not hardcoded
- `reactive()` items registered via `state.register()`
- `require` strings evaluated via `new Function('g', ...)`
- New data files added to `modules.json` core array
- Save/load in `modules/persist.js`
- Narrative via `showDialogue(speakerId, pages[], callback?)`
- `g.xxx` namespace for cross-system require expressions

---

## THE TRANSFORMATION

**Before:** A combat engine with a scrapyard wrapper.
**After:** An idle RPG with moral choices, career paths, a companion character, 8 explorable zones, 5 rival factions, and 70 branching skills.

*The TTRPG soul, reclaimed.*
