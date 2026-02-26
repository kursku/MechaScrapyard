# SPEC: Mecha Trivials — Phase 1 / Rank 9–11, 14

**Type:** `feat(mecha/p1)`
**Effort:** Low — ~1–2 hours, changes to `MechaPanel.vue` only
**Depends on:** Nothing
**Blocks:** Nothing (UX improvements only)

---

## Why This Matters

Four small issues in `MechaPanel.vue` cause friction without requiring significant effort:

1. Inventory tabs show no counts — players click each tab to discover if it has content.
2. Dismantle fires immediately on click — accidental destruction of rare early parts is irreversible.
3. COR (corruption) is a defined frame stat but is missing from the chassis overview bar.
4. Energy has no explanation in the UI — new players who run out don't know what to do.

---

## Files Changed

- `src/ui/sections/MechaPanel.vue`

---

## Change 1 — Inventory Tab Counts

**File:** `MechaPanel.vue`
**Location:** Inventory tab buttons (~line 216)

```vue
<!-- BEFORE -->
<div class="hud-tab" :class="{ active: selectedInventoryTab === 'frames' }"
     @click="selectedInventoryTab = 'frames'">FRAMES</div>
<div class="hud-tab" :class="{ active: selectedInventoryTab === 'parts' }"
     @click="selectedInventoryTab = 'parts'">PARTS</div>
<div class="hud-tab" :class="{ active: selectedInventoryTab === 'weapons' }"
     @click="selectedInventoryTab = 'weapons'">WEAPONS</div>

<!-- AFTER -->
<div class="hud-tab" :class="{ active: selectedInventoryTab === 'frames' }"
     @click="selectedInventoryTab = 'frames'">
    FRAMES ({{ state.player.inventory.frames.length }})
</div>
<div class="hud-tab" :class="{ active: selectedInventoryTab === 'parts' }"
     @click="selectedInventoryTab = 'parts'">
    PARTS ({{ state.player.partsInventory?.length || 0 }})
</div>
<div class="hud-tab" :class="{ active: selectedInventoryTab === 'weapons' }"
     @click="selectedInventoryTab = 'weapons'">
    WEAPONS ({{ state.player.inventory.weapons.length }})
</div>
```

---

## Change 2 — Dismantle Confirmation

**File:** `MechaPanel.vue`
**Location:** `data()` + template PARTS tab + `dismantlePart` method

Add a `_dismantleTarget` data field:
```js
data() {
    return {
        renderTick: 0,
        selectedInventoryTab: 'frames',
        _pauseRenderTick: false,
        _dismantleTarget: null,   // ADD THIS
    };
},
```

Replace the dismantle button in the PARTS tab (~line 269):
```vue
<!-- BEFORE -->
<button class="hud-btn small" @click="dismantlePart(part)">DISMANTLE</button>

<!-- AFTER: two-step confirmation -->
<template v-if="_dismantleTarget === part.id">
    <span class="dismantle-confirm-label">CONFIRM?</span>
    <button class="hud-btn small danger" @click="confirmDismantle(part)">YES</button>
    <button class="hud-btn small" @click="_dismantleTarget = null">NO</button>
</template>
<button v-else class="hud-btn small" @click="_dismantleTarget = part.id">DISMANTLE</button>
```

Add `confirmDismantle` method:
```js
confirmDismantle(part) {
    this.dismantlePart(part);
    this._dismantleTarget = null;
},
```

Add to scoped CSS:
```css
.dismantle-confirm-label {
    font-size: 10px;
    color: var(--error);
    letter-spacing: 1px;
    margin-right: 4px;
}
.hud-btn.small.danger {
    border-color: var(--error);
    color: var(--error);
}
.hud-btn.small.danger:hover {
    background: var(--error);
    color: #000;
}
```

---

## Change 3 — Add COR Stat to Chassis Overview

**File:** `MechaPanel.vue`
**Location:** Chassis Overview stat boxes (~line 143)

```vue
<!-- ADD after the ENR stat-box -->
<div class="stat-box">
    <span class="stat-label">COR</span>
    <span class="stat-val text-corruption">{{ frame.attributes.cor || 0 }}</span>
</div>
```

Add to scoped CSS (corruption = purple/magenta):
```css
.text-corruption { color: #c070ff; }
```

---

## Change 4 — Energy Tooltip / Hint

**File:** `MechaPanel.vue`

This is not strictly a Mecha panel change, but the energy resource is most confusing
in the context of missions (which cost energy). Add a `title` tooltip to the energy
display wherever it appears, or add it as an inline note in the chassis overview:

```vue
<!-- In chassis overview, add after stat boxes, visible only early game -->
<div
    class="energy-hint"
    v-if="(state.items.energy?.val || 0) < 20"
    title="Energy regenerates over time. Increase your cap by building base upgrades."
>
    ⚡ ENR: {{ Math.floor(state.items.energy?.val || 0) }}/{{ state.items.energy?.max || 0 }}
    <span class="hint-text">[ regenerates passively ]</span>
</div>
```

Alternatively, add the `title` attribute to the energy resource row in `ResourceMonitor.vue`
so it's always accessible. Either approach is valid.

---

## Test Checklist

- [ ] Frames/Parts/Weapons tab buttons show counts in parentheses
- [ ] With 0 items in a tab, count shows `(0)` not `(undefined)` or missing
- [ ] Clicking DISMANTLE shows CONFIRM/NO buttons — does NOT immediately dismantle
- [ ] Clicking YES on confirm dismantles the part
- [ ] Clicking NO cancels with no action
- [ ] COR stat box is visible in chassis overview (shows 0 if no corruption)
- [ ] Energy tooltip or hint is visible when energy is low
- [ ] `npm run build` passes

---

## Commit Message

```
feat(mecha/p1): add inventory tab counts, dismantle confirmation, COR stat, energy hint
```
