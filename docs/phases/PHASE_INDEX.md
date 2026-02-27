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

## Status Key

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Complete — commit hash recorded |
| ❌ | Blocked — see spec for notes |
