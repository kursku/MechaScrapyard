# Phase 3 — Content & Polish

**Status:** NOT STARTED
**Prerequisite:** Phase 2 fully complete and `npm run build` passing

---

## Objective

With the foundation solid and core gameplay loop working, Phase 3 brings the world to life:
expanded story content, zone exploration, the Android companion slot, visual equipment
management, design-system compliance, and the full DOT/token combat system.

This phase is the longest — plan for ~2–3 weeks of intermittent work.

---

## Specs

| Rank | File | Topic | Effort | Status |
|------|------|-------|--------|--------|
| 1 | [SPEC_phase3_missions.md](SPEC_phase3_missions.md) | Story missions + narrative branches | Medium | ⬜ |
| 2 | [SPEC_zone_exploration.md](SPEC_zone_exploration.md) | Zone unlock + scout / patrol loop | Medium | ⬜ |
| 3 | [SPEC_token_dot_system.md](SPEC_token_dot_system.md) | Full DOT class + 6 combat tokens | High | ⬜ |
| 4 | [SPEC_android_slot.md](SPEC_android_slot.md) | Android second task slot + dialog | Medium | ⬜ |
| 5 | [SPEC_event_display.md](SPEC_event_display.md) | Event modal with speaker + choices | Medium | ⬜ |
| 6 | [SPEC_icon_migration.md](SPEC_icon_migration.md) | Replace emoji icons with SVG/CSS | Low | ⬜ |
| 7 | [SPEC_visual_equip.md](SPEC_visual_equip.md) | Equipment slot grid with drag-drop | High | ⬜ |

---

## Phase 3 Completion Criteria

- [ ] At least 3 story missions with narrative branching
- [ ] Zone unlock flow: base zone → scout → unlock neighbour
- [ ] BREACH, BURN, ERROR, SLOW, TARGET_LOCK, SUPPRESS tokens functional in combat
- [ ] Android companion visible in UI with a dedicated task slot
- [ ] Event modal shows speaker name (and optional portrait stub) + choice buttons
- [ ] No emoji used as functional icons in any panel (decorative only)
- [ ] Rig config uses slot-grid layout rather than flat table
- [ ] `npm run build` passes with no new warnings

---

## Commit Convention

```
feat(<scope>/p3): <description>
content(<scope>/p3): <description>
ui(<scope>/p3): <description>
fix(<scope>/p3): <description>
```

---

## Notes

- Specs in this phase often touch multiple files; read each spec fully before starting
- SPEC_token_dot_system.md requires CombatRunner refactoring — do it on a feature branch
- SPEC_visual_equip.md is the largest change; defer to end of phase if needed
- SPEC_icon_migration.md is low-effort but high visual impact; can be batched with any PR
