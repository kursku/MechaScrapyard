# SPEC — Profile Tab Sub-Tabs

**Phase:** 4-UI — Spec 7 of 7
**Area:** PilotPanel / Profile / Tab System
**Priority:** 🟠 HIGH — Monolithic 3-column layout wasted space and cramped Skill Tree
**Status:** ✅ COMPLETE

---

## PROBLEM

The Profile tab used a 3-column layout (Morphology | Training | Neural Skills) that created three issues:

1. **Stats column too sparse** — 7 stats in a single tall column with tiny progress bars
2. **Training cards oversized** — simple tasks used full card layouts wasting vertical space
3. **Skill Tree cramped** — 7 tree tabs + 4 tiers + sub-skill cards squeezed into a narrow right column with unreadable descriptions

## SOLUTION

### 7.1 Profile TAB_GROUP with Sub-Tabs

Added `profile` to `TAB_GROUPS` in `TerminalUI.vue` with 3 children:

```js
profile: {
    label: 'PROFILE',
    children: ['pilot_overview', 'pilot_training', 'pilot_skills'],
    childLabels: { pilot_overview: 'OVERVIEW', pilot_training: 'TRAINING', pilot_skills: 'SKILL TREE' },
},
```

Sub-tab bar renders as: `[ OVERVIEW ] [ TRAINING ] [ SKILL TREE ]`

### 7.2 Overview Sub-Tab

- **Stats grid:** 4-across compact cards with icon, stat name, value, tier label, and progress bar
- **Morality + Street Cred:** Integrated into stats grid (removed duplicate standalone widgets)
- **Identity row:** Alignment badge + Glory Pool + Street Cred details in a bordered section
- **Neural Skills:** Collapsible inline badge grid (`skillsCollapsed` toggle)

### 7.3 Training Sub-Tab

Tasks grouped by category with stat effect labels:

| Group | Tasks | Effect |
|-------|-------|--------|
| PHYSICAL | Heavy Lifting, Endure the Wastes | → MUSCLE, → GRIT |
| TECHNICAL | Repair Circuitry, Drone Chasing | → NEURO, → REFLEX |
| SOCIAL | Intel Gathering | → INTEL TOKENS |

2-column compact row layout with progress bars and [INITIATE]/[ABORT] actions.

### 7.4 Skill Tree Sub-Tab

Full-width dedicated view:

- 7 tree tabs displayed in a single row with progress (`0/10`)
- 3-across tier cards with readable name, description, and SP cost
- Glory Shop section below (when eligible)

## VERIFICATION CRITERIA

- [x] Sub-tabs switch correctly between Overview, Training, Skill Tree
- [x] Stats grid shows all morphology stats in 4-across layout
- [x] Training tasks grouped by category with stat effect labels
- [x] Skill Tree has full width with 3-across tier cards
- [x] Neural Skills collapse/expand works
- [x] No duplicate morality/cred displays
- [x] `tasks` computed correctly filters pilot-group tasks for all sub-tab views

## FILE REFERENCE

| File | Action |
|------|--------|
| `src/ui/TerminalUI.vue` | ADD `profile` TAB_GROUP, childLabels, leaf categories, tab order, tasks filter |
| `src/ui/sections/PilotPanel.vue` | REWRITE — 3 conditional views, stats grid, training groups, full-width skill tree |
