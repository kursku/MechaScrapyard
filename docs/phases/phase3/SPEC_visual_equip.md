# SPEC: Visual Equipment Grid — Phase 3 / Rank 7

**Type:** `ui(mecha/p3)`
**Effort:** High — ~5–8 hours, MechaPanel.vue significant rework
**Depends on:** Phase 2 SPEC_mecha_depth (grouped parts + installed badge must exist)
**Blocks:** Nothing (final phase polish item)

---

## Why This Matters

The current `RIG_CONFIG` panel is a plain `<table>`-style list: mount points in rows,
equipment selects to the right. This is functional but fails to convey the physical
structure of the mech. Players have no spatial mental model of where parts connect.

A slot-grid layout (body silhouette with labeled zones) dramatically improves
legibility and makes equipping parts feel tactile rather than form-filling.

---

## Files Changed

- `src/ui/sections/MechaPanel.vue` (template + scoped CSS)
- No backend changes required

---

## Target Layout (ASCII Mockup)

```
┌─────────────────────────────────────────────┐
│  RIG_CONFIG: [ LIGHT CHASSIS ]              │
├─────────────────────────────────────────────┤
│         ┌──────────┐                        │
│  [ARM L] │  TORSO   │ [ARM R]               │
│  [slot]  │  [slot]  │ [slot]                │
│         └──────────┘                        │
│         ┌──────────┐                        │
│         │  LEGS    │                        │
│         │  [slot]  │                        │
│         └──────────┘                        │
├─────────────────────────────────────────────┤
│ MOUNT POINTS: [equip selects as before]     │
└─────────────────────────────────────────────┘
```

The slot cells show:
- Slot label (TORSO, LEFT ARM, etc.)
- Installed part name (or `-- EMPTY --`)
- HP bar + condition %
- Click → opens part-swap dropdown or highlights the part in inventory

---

## Change 1 — Slot Grid Template

Replace the `hardware-table` with a CSS grid:

```vue
<div class="rig-grid" v-if="frame && frame.parts">
    <div class="rig-cell" data-slot="torso">
        <div class="rig-cell-label">TORSO</div>
        <div class="rig-cell-part" v-if="frame.parts.torso">
            <div class="rig-part-name">{{ frame.parts.torso.name.toUpperCase() }}</div>
            <div class="rig-part-hp">
                HP: {{ renderBar(frame.parts.torso.hp, frame.parts.torso.maxHp, 8) }}
            </div>
            <div class="rig-part-cnd"
                 :class="{ 'text-warning': frame.parts.torso.condition < 0.5 }">
                CND: {{ Math.round(frame.parts.torso.condition * 100) }}%
            </div>
        </div>
        <div class="rig-cell-empty" v-else>-- EMPTY --</div>
    </div>

    <!-- Repeat for left_arm, right_arm, legs -->
    <!-- Use v-for over a slotLayout array to avoid code repetition -->
</div>
```

Better — use a `slotLayout` computed to avoid repeating the cell 4 times:

```js
computed: {
    slotLayout() {
        const defs = [
            { id: 'torso', label: 'TORSO', gridArea: 'torso' },
            { id: 'left_arm', label: 'LEFT ARM', gridArea: 'larm' },
            { id: 'right_arm', label: 'RIGHT ARM', gridArea: 'rarm' },
            { id: 'legs', label: 'LEGS', gridArea: 'legs' },
        ];
        return defs.map(d => ({
            ...d,
            part: this.frame?.parts?.[d.id] || null,
        }));
    },
},
```

Template using `slotLayout`:
```vue
<div class="rig-grid" v-if="frame">
    <div v-for="slot in slotLayout" :key="slot.id"
         class="rig-cell" :style="{ gridArea: slot.gridArea }">
        <div class="rig-cell-label">{{ slot.label }}</div>
        <template v-if="slot.part">
            <div class="rig-part-name">{{ slot.part.name.toUpperCase() }}</div>
            <div class="rig-part-hp">HP {{ renderBar(slot.part.hp, slot.part.maxHp, 8) }}</div>
            <div class="rig-part-cnd" :class="{ 'text-warning': slot.part.condition < 0.5 }">
                CND {{ Math.round(slot.part.condition * 100) }}%
            </div>
            <!-- Quick-swap: click to jump to PARTS tab filtered to this slot -->
            <button class="hud-btn micro" @click="jumpToPartSlot(slot.id)">SWAP</button>
        </template>
        <div v-else class="rig-cell-empty">-- EMPTY --</div>
    </div>
</div>
```

---

## Change 2 — CSS Grid Layout

```css
.rig-grid {
    display: grid;
    grid-template-areas:
        ". torso ."
        "larm torso rarm"
        ". legs .";
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 6px;
    margin-bottom: 12px;
}

.rig-cell {
    border: 1px solid var(--border-dim);
    padding: 8px;
    font-size: 11px;
    min-height: 70px;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.rig-cell-label {
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 2px;
    margin-bottom: 4px;
}

.rig-part-name {
    color: var(--text-bright);
    font-size: 11px;
}

.rig-cell-empty {
    color: var(--text-dim);
    font-size: 10px;
    font-style: italic;
}

.hud-btn.micro {
    font-size: 9px;
    padding: 2px 6px;
    margin-top: auto;
    align-self: flex-start;
}
```

---

## Change 3 — SWAP Button Behavior

When player clicks SWAP on a slot cell, jump to the PARTS tab pre-filtered to that slot:

```js
methods: {
    jumpToPartSlot(slotId) {
        this.selectedInventoryTab = 'parts';
        this.filterPartSlot = slotId; // new data field
    },
},
```

In the PARTS tab `partsBySlot` computed — if `filterPartSlot` is set, only show that group:
```js
partsBySlot() {
    // ... existing logic ...
    if (this.filterPartSlot) {
        const filtered = {};
        if (groups[this.filterPartSlot]) filtered[this.filterPartSlot] = groups[this.filterPartSlot];
        return filtered;
    }
    return groups;
},
```

Show a clear filter indicator:
```vue
<div v-if="filterPartSlot" class="slot-filter-bar">
    SHOWING: {{ filterPartSlot.replace('_', ' ').toUpperCase() }} PARTS ONLY
    <button class="hud-btn micro" @click="filterPartSlot = null">SHOW ALL</button>
</div>
```

---

## Mount Points Section (Unchanged)

The equip-slot selects (for weapons/modules linked to parts) remain below the grid,
unchanged from Phase 2. The grid only covers physical part slots.

---

## Test Checklist

- [ ] RIG_CONFIG grid shows 4 cells: TORSO, LEFT ARM, RIGHT ARM, LEGS
- [ ] Cells with parts installed show name + HP bar + condition %
- [ ] Empty cells show `-- EMPTY --`
- [ ] Low condition cells highlight in warning color
- [ ] Clicking SWAP navigates to PARTS tab filtered to that slot
- [ ] "SHOW ALL" clears the filter
- [ ] Mount point selects still work below the grid
- [ ] Grid layout doesn't break on narrow screens (< 400px width)
- [ ] `npm run build` passes

---

## Commit Message

```
ui(mecha/p3): rig slot grid, SWAP shortcut to filtered parts inventory
```
