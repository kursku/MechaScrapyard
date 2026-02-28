# SPEC — Combat Tab UX Improvements

**Phase:** 4-UI — Spec 8 of 8
**Area:** CombatPanel — Pre-Combat + Battle View
**Priority:** 🟠 HIGH — Combat is the largest panel (1039 lines) and the most scroll-heavy
**Status:** 🔲 PENDING

---

## WHY THIS MATTERS

The Combat tab is the most complex UI in the game. Two main issues degrade the player experience:

1. **Pre-combat scroll depth** — 3 config selectors (Stance/Targeting/Position = 11 buttons) stacked vertically, plus tall mission cards, push the loadout off-screen. The player must scroll to see their own equipped maneuvers before starting a fight.

2. **Battle view log overflow** — The combat log has no height constraint. Long fights create unbounded scroll, pushing the stance-switch buttons and retreat button below the fold. Players lose tactical awareness.

---

## PART 1: COMPACT MISSION CARDS

### 1.1 Current behavior

Each mission card is ~120px tall with: name, difficulty stars, tags, full description (2+ lines), narrative briefing, and footer (cost/power/rewards).

### 1.2 Fix

Reduce card height:

- Description truncated to 1 line with `text-overflow: ellipsis`
- Remove narrative briefing preview from the card (it's visible in a tooltip or on hover)
- Tags and footer on same row for compact cards
- Reduce padding from 12px → 8px

---

## PART 2: INLINE CONFIG SELECTORS

### 2.1 Current behavior

Stance (4 buttons), Targeting (4 buttons), and Position (3 buttons) are stacked as vertical groups, each with large icon buttons occupying ~100px height per group.

### 2.2 Fix

Make config selectors horizontal inline rows:

- Each row: label + compact inline buttons (icon + name only, no stat details)
- Stat modifiers shown only on active button or via tooltip
- Saves ~200px of vertical space

---

## PART 3: 2-COLUMN MANEUVER GRID

### 3.1 Current behavior

`grid-template-columns: 1fr` — 3 maneuver cards stacked vertically.

### 3.2 Fix

Change to `grid-template-columns: repeat(2, 1fr)` — fits 2 cards per row.

---

## PART 4: FIXED-HEIGHT COMBAT LOG

### 4.1 Current behavior

`.battle-log` has no height constraint. Long fights grow the log indefinitely, pushing footer controls off-screen.

### 4.2 Fix

```css
.battle-log {
    max-height: 220px;
    overflow-y: auto;
    scroll-behavior: smooth;
}
```

Auto-scroll to bottom on new log entries using `scrollTop = scrollHeight` after each render tick.

---

## PART 5: COMPACT BATTLE FRAME ROWS

### 5.1 Current behavior

Each part row (Torso, Left Arm, Right Arm, Legs) has part label, integrity dots, HP bar, and HP value spread across the full panel width.

### 5.2 Fix

Tighter row layout:

- Reduce part row padding
- Part name + bar + value on a single compact line
- Vitals (Heat/Stress) inline with frame header instead of separate block

---

## VERIFICATION CRITERIA

- [ ] Pre-combat: 4+ missions visible without scrolling
- [ ] Config selectors don't require scrolling to see loadout
- [ ] Maneuver grid shows 2 cards per row
- [ ] Combat log stays within fixed height during long fights
- [ ] Log auto-scrolls to newest entry
- [ ] Battle part rows are compact but readable
- [ ] Stance switch and retreat button always visible during combat

---

## FILE REFERENCE

| File | Action |
|------|--------|
| `src/ui/components/CombatPanel.vue` | MODIFY template + CSS for all 5 parts |
