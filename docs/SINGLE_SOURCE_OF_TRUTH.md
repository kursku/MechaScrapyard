# Mecha Scrapyard — Single Source of Truth (SSOT)

Last updated: 2026-02-25

This document consolidates project status from:
- `docs/task.md`
- `docs/sprint2/RECLAIM_SPRINT_INDEX.md`
- `docs/logs/changelog_plumbing_sprint.md`
- `docs/logs/FIX_REPORT.md`
- `docs/logs/implementation_plan.md`
- Sprint and combat planning docs under `docs/sprint2/` and `docs/specs/`
- External/internal design reference for UI/UX inspiration: `ref/arcanum-master/src`

## 1. Done

### Reclaim Priority 1 — First Contact
- Require gate audit for early chain
- Early moral hook event
- Directive tracker
- Grandpa micro-feedback milestones
- Progressive tab emergence badges

Source: `docs/task.md`

### Reclaim Priority 2 — K.I.T.A. Android Companion
- Discovery event + milestone trigger
- Android state + `g.` namespace integration
- Assignment task loop
- Android upgrades
- Scrapyard UI panel
- Save/load support

Source: `docs/task.md`

### Reclaim Priority 3 — City Zones
- Zones data integrated
- Zone loading/discovery/task binding
- Zones UI map tab + details
- Save/load support
- Verification flow completed

Source: `docs/task.md`

### Reclaim Priority 4 — Faction Alliances (mostly complete)
- `awardFactionRep` with morality modifier
- Event routing via `FACTION_REP_AWARD_REQUEST`
- Rep-gated vendor system
- Tier transitions + faction status display
- Alliance labels in UI

Source: `docs/task.md`

### Plumbing sprint bugfixes (critical stability)
- Mission require chain fixed (`completed` exposed in `g.`)
- Skill gates fixed (`g.skill_*` value handling)
- Mission completion persistence fixed (save/load)
- Blueprint unlock-on-tier logic fixed
- Narrative-only mission flow handling added

Source: `docs/logs/changelog_plumbing_sprint.md`

### Build and smoke verification state
- Chromium factions smoke suite currently passing after updates

Source: local test run + `tests/e2e/factions-smoke.spec.js`

### Frame swapping and inventory UX pass
- Active frame swapping flow implemented with compatibility/unequip handling.
- Parts/frames/weapons garage tabs improved with manufacturer metadata and visual cues.
- Walkthrough and manual verification captured.

Source: `docs/walkthrough.md`, `docs/feature_frame_swapping.md`

## 2. In Progress

### Reclaim Priority 4 — Faction Rivalry Matrix data
- Engine code supports rivalry spillover.
- Remaining work is faction rivalry entries in `factions.json`.

Source: `docs/task.md`

## 3. Planned (Next Queue)

### Reclaim Priority 5 — Deep Skill Trees
- Skill tree data structure (combat + crafting first)
- Skill point economy
- Skill tree UI
- Save/load for sub-skills
- Combat integration with `skillBonuses`

Source: `docs/task.md`, `docs/sprint2/IMPL_SPEC_06_deep_skill_trees.md`

### Combat polish track (safe against prestige redesign)
- Weapon damage integration into combat runner (remove hardcoded damage)
- Off-combat stress recovery loop

Source: `docs/frente_a_combat_polish.md`

### Content rollout track
- Full content drop wiring (factions/blueprints/bosses/structures/slot migration)
- Blueprint/crafting and faction progression depth

Source: `docs/sprint_briefing_content_drop.md`

### UI/UX reference track
- Use `ref/arcanum-master/src/ui` and related modules as comparative reference for hierarchy, readability, and interaction pacing.
- Apply only pattern-level inspiration; keep Mecha Scrapyard visual identity and data contracts.

Source: local reference tree `ref/arcanum-master/src`

## 4. Deferred / Pending Decision

### Prestige/Glory redesign alignment
- Sprint 2C combat progression assumptions are partially outdated.
- Combat core work is safe; Glory/Rank economy requires alignment with prestige framework.

Source: `docs/sprint2_combat_verification.md`, `docs/gdd/gdd_prestige_mechanical_framework.md`

### Legacy/archaeology backlog
- Job progression depth
- Full morality consequence web
- Expanded zone/exploration richness
- Deeper faction roleplay branches
- Expanded skill tree breadth

Source: `docs/design_archaeology.md`

## 5. Current Priority Order (Operational)

1. Close faction rivalry matrix data gap
2. Execute Deep Skill Trees (Reclaim Priority 5)
3. Apply combat polish (weapon integration + stress recovery)
4. Resume content-drop items that depend on above

## 6. Acceptance Criteria for "Sprint 2 Reclaim Core Complete"

- Reclaim 1-4 fully complete (including rivalry matrix data)
- Reclaim 5 Deep Skill Trees shipped end-to-end
- No regression in Chromium smoke tests
- Save/load stable for new progression systems

## 7. Change Control

When status changes:
- Update this file first
- Then reflect checkbox changes in `docs/task.md`
- Keep implementation logs in `docs/logs/` as supporting evidence
