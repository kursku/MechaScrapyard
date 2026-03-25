# MechaScrapyard — Implementation Phase Index

> **How to use this file:**
> This is the single source of truth for implementation progress.
> Open this first. Update it after every spec is completed.
> Link each completed spec to its commit hash.

---

## Commit Convention

```
<type>(<scope>/p<N>): <short description>

Types:   feat | fix | content | data | ui | docs | test
Scopes:  combat | mecha | save | narrative | data | ui | skills | zones
Phase:   p1 | p2 | p3
```

**Examples:**

```
fix(data/p1): fix zone mission ID mismatch and standardize Portuguese IDs
feat(save/p1): add beforeunload force-save and save timestamp flash
feat(narrative/p2): wire home phase transitions to story events
content(p3): add Phase 3 story missions (corporate warning, arena registration)
```

**Rule:** One spec = one commit. Tag phase boundaries with `git tag -a phaseN-complete`.

---

## Phase 1 — Foundation

**Status:** `✅ COMPLETE` — tagged `phase1-complete`
**Goal:** Fix all blockers. Game is stable, consistent, and has a working first impression.
**Spec folder:** `docs/phases/phase1/`

| # | Spec | Area | Status | Commit |
|---|------|------|--------|--------|
| 1 | `SPEC_data_blockers.md` | Data / JSON | ✅ complete | `90d7f1d` |
| 2 | `SPEC_save_basics.md` | Save system | ✅ complete | `e39027e` |
| 3 | `SPEC_narrative_foundation.md` | Content / Events | ✅ complete | `3f3ca73` |
| 4 | `SPEC_combat_trivials.md` | Combat UI | ✅ complete | `5553029` |
| 5 | `SPEC_mecha_trivials.md` | Mecha UI | ✅ complete | `7f49781` |

> UI refactor (TerminalUI → section components + CSS restore): `edea19d`, `74ffc99`

---

## Phase 2 — Core Experience

**Status:** `✅ COMPLETE` — tagged `phase2-complete`
**Goal:** Skills matter. Combat has depth. UI is informative. First story beats land.
**Estimated effort:** ~1 week
**Spec folder:** `docs/phases/phase2/`

| # | Spec | Area | Status | Commit |
|---|------|------|--------|--------|
| 1 | `SPEC_skills_mods.md` | Skills system | ✅ complete | `e395431` |
| 2 | `SPEC_furniture_items.md` | Data / Furniture | ✅ complete | `1d5e14a` |
| 3 | `SPEC_home_event_wiring.md` | Narrative / Events | ✅ complete | `0e38b55` |
| 4 | `SPEC_combat_depth.md` | Combat UI | ✅ complete | `89f54e1` |
| 5 | `SPEC_mecha_depth.md` | Mecha UI | ✅ complete | `73a626a` |
| 6 | `SPEC_ui_fundamentals.md` | General UI | ✅ complete | `152425f` |
| 7 | `SPEC_content_missions.md` | Content / Missions | ✅ complete | `c076bac` |

---

## Phase 3 — Content & Polish

**Status:** `✅ COMPLETE` — tagged `phase3-complete`
**Goal:** Real story progression through Phase 3. Zones explorable. UI design-system compliant.
**Estimated effort:** ~2–3 weeks
**Spec folder:** `docs/phases/phase3/`

| # | Spec | Area | Status | Commit |
|---|------|------|--------|--------|
| 1 | `SPEC_phase3_missions.md` | Content / Missions | ✅ complete | `dc56deb` |
| 2 | `SPEC_zone_exploration.md` | Zones system | ✅ complete | `4d79ede` |
| 3 | `SPEC_token_dot_system.md` | Combat system | ✅ complete | `06acb82` |
| 4 | `SPEC_android_slot.md` | Runner / Android | ✅ complete | `6ac4c65` |
| 5 | `SPEC_event_display.md` | Narrative / Events | ✅ complete | `5c7a4a5` |
| 6 | `SPEC_icon_migration.md` | Design system | ✅ complete | `81de3a4` |
| 7 | `SPEC_visual_equip.md` | Mecha UI | ✅ complete | `75da800` |

---

## Phase 4 — Character & Systems Depth

**Status:** `✅ COMPLETE` — tagged `phase4-complete`
**Goal:** Pilot stats matter in combat. Skill trees shape playstyle. K.I.T.A. automates the scrapyard. Jobs build identity. Faction choices have consequences. Phase 4 story missions deliver the corporate conspiracy arc. DTL and street cred make the city react to the player.
**Spec folder:** `docs/phases/phase4/`

| # | Spec | Area | Status | Commit |
| --- | --- | --- | --- | --- |
| 1 | `SPEC_pilot_stats.md` | Combat / Stats | ✅ complete | `ce6bf05` |
| 2 | `SPEC_skill_trees.md` | Skills / UI | ✅ complete | `176e60f` |
| 3 | `SPEC_maneuvers.md` | Combat / Maneuvers | ✅ complete | `d7124b5` |
| 4 | `SPEC_android_companion.md` | Scrapyard / K.I.T.A. | ✅ complete | `51305f7`, `189b916` |
| 5 | `SPEC_jobs_system.md` | Career / Jobs + Fixer Voice | ✅ complete | `96cf72a` |
| 6 | `SPEC_faction_alliances.md` | Factions / Vendors + Contacts | ✅ complete | `7e65ccb` |
| 7 | `SPEC_parts_flavor.md` | Data / Parts | ✅ complete | `989a9e6`, `efd6006` |
| 8 | `SPEC_scrapyard_phase4.md` | Scrapyard / Structures | ✅ complete | `47ee1b9` |
| 9 | `SPEC_phase4_missions.md` | Content / Missions + Intel | ✅ complete | `514a757`, `f201f26` |
| 10 | `SPEC_prestige_foundation.md` | Prestige / Glory | ✅ complete | `f9a9d94` |
| 11 | `SPEC_district_threat.md` | World / DTL system | ✅ complete | `f4a126a` |
| 12 | `SPEC_street_credibility.md` | Reputation / Street Cred | ✅ complete | `27daef1` |

---

## Phase 4-UI — UI/UX Polish

**Status:** `✅ COMPLETE`
**Goal:** Close the UI/UX gaps identified by the Phase 4 audit. No new systems — only feedback clarity, accessibility, and making existing Phase 4 mechanics legible to the player.
**Spec folder:** `docs/phases/phase4_ui/`

| # | Spec | Area | Status | Commit |
| --- | --- | --- | --- | --- |
| 1 | `SPEC_accessibility_fixes.md` | Accessibility / Reduced Motion | ✅ complete | `11d5f7a` |
| 2 | `SPEC_stat_visibility.md` | HUD / Phase 4 Stats | ✅ complete | `11d5f7a` |
| 3 | `SPEC_panel_ux_clarity.md` | Career, Factions, Zones | ✅ complete | `11d5f7a` |
| 4 | `SPEC_prestige_ux_polish.md` | PilotPanel / Prestige | ✅ complete | `11d5f7a` |
| 5 | `SPEC_font_readability.md` | Global Typography / CSS Variables | ⚠️ revised | `42eb5e6` — body font regression fixed in Spec 10 |
| 6 | `SPEC_sidebar_redesign.md` | ResourceMonitor / Sidebar / Header | ✅ complete | `c292430` |
| 7 | `SPEC_profile_subtabs.md` | PilotPanel / Profile / Tab System | ✅ complete | `11d5f7a` |
| 8 | `SPEC_combat_ux.md` | Combat Tab UX / Layout | ✅ complete | `e1f467a` — Parts 2–5 fully implemented |
| 9 | `SPEC_mecha_subtabs.md` | MechaPanel / Sub-Tab Restructure | ✅ complete | this session |
| 10 | `SPEC_readability_overhaul.md` | Font Strategy + UX Polish | ✅ complete | polish pass |

---

## Phase 5 — The Confrontation

**Status:** `📋 PLANNED`
**Goal:** Phase 4 built the pilot. Phase 5 tests what they built against what they were built for. Five story missions, VOSS, K.I.T.A.'s arc resolution, memory fragments, full prestige, district defense, and five endings.
**Estimated effort:** ~4 weeks
**Spec folder:** `docs/phases/phase5/`

| # | Spec | Area | Status | Commit |
| --- | --- | --- | --- | --- |
| 1 | `SPEC_taeyang_confrontation.md` | Story / Missions | ⬜ not started | — |
| 2 | `SPEC_voss_android.md` | Combat / Narrative | ⬜ not started | — |
| 3 | `SPEC_kita_arc_completion.md` | Companion / Narrative | ⬜ not started | — |
| 4 | `SPEC_memory_fragments.md` | Collectibles / Story | ⬜ not started | — |
| 5 | `SPEC_prestige_full.md` | Meta / Prestige | ⬜ not started | — |
| 6 | `SPEC_district_endgame.md` | World / Defense | ⬜ not started | — |
| 7 | `SPEC_endings.md` | Narrative / Endings | ⬜ not started | — |

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Complete — commit hash recorded |
| ❌ | Blocked — see spec for notes |
