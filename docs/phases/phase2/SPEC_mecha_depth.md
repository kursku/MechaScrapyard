# SPEC: Mecha Depth — Phase 2 / Rank 5

**Type:** `feat(mecha/p2)`
**Effort:** Medium — ~2–3 hours, changes to MechaPanel.vue
**Depends on:** Phase 1 SPEC_mecha_trivials (tab counts, dismantle confirm must be done first)
**Blocks:** Phase 3 SPEC_visual_equip (builds on this foundation)

---

## Why This Matters

The Mecha panel works but lacks the tactile depth expected of an equipment management screen:
1. Parts are a flat list with no slot grouping — hard to find what fits where
2. Equipped weapons in storage look identical to unequipped ones — no visual distinction
3. Hovering a part shows stats but not how those stats compare to what's installed

---

## Files Changed

- `src/ui/sections/MechaPanel.vue`

---

## Change 1 — Parts Grouped by Slot

**File:** `MechaPanel.vue`
**Location:** PARTS tab content (~line 254)

Replace the flat `v-for` with a grouped display. Add a computed:

```js
partsBySlot() {
    const groups = {};
    const slotOrder = ['torso', 'left_arm', 'right_arm', 'legs'];
    const slotLabels = {
        torso: 'TORSO',
        left_arm: 'LEFT ARM',
        right_arm: 'RIGHT ARM',
        legs: 'LEGS',
    };

    for (const slot of slotOrder) {
        groups[slot] = {
            label: slotLabels[slot] || slot.toUpperCase(),
            parts: (this.state.player.partsInventory || []).filter(p => p.slot === slot),
        };
    }

    // Catch-all for any other slot types
    const knownSlots = new Set(slotOrder);
    const others = (this.state.player.partsInventory || []).filter(p => !knownSlots.has(p.slot));
    if (others.length > 0) groups['other'] = { label: 'OTHER', parts: others };

    return groups;
},
```

Update PARTS tab template:

```vue
<div v-else-if="selectedInventoryTab === 'parts'" class="inventory-grid">
    <div v-if="!state.player.partsInventory || state.player.partsInventory.length === 0"
         class="empty-state">NO PARTS IN STORAGE</div>

    <template v-for="(group, slotKey) in partsBySlot" :key="slotKey">
        <div v-if="group.parts.length > 0" class="slot-group-header">
            {{ group.label }} ({{ group.parts.length }})
        </div>
        <div v-for="part in group.parts" :key="part.id"
             class="hud-task-card salvage-card"
             :style="getPartMfrStyle(part)"
             @mouseover="itemOver($event, part)" @mouseleave="itemOut">
            <!-- existing part card content unchanged -->
        </div>
    </template>
</div>
```

Add to scoped CSS:
```css
.slot-group-header {
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 2px;
    padding: 4px 0 2px;
    border-bottom: 1px solid var(--border-dim);
    margin-bottom: 6px;
    margin-top: 10px;
}
.slot-group-header:first-child { margin-top: 0; }
```

---

## Change 2 — Installed Weapon Badge

**File:** `MechaPanel.vue`
**Location:** WEAPONS tab content (~line 277)

Add a computed to check which weapon IDs are currently in a slot:

```js
installedWeaponIds() {
    const equip = this.frame?.installedEquip || {};
    return new Set(Object.values(equip).filter(Boolean));
},
```

Update weapon card in WEAPONS tab:

```vue
<div v-for="weaponId in state.player.inventory.weapons" :key="weaponId"
     class="hud-task-card salvage-card"
     :class="{ 'is-installed': installedWeaponIds.has(weaponId) }"
     ...>
    <template v-if="state.items[weaponId]">
        <div class="hud-card-header">
            ...{{ state.items[weaponId].name.toUpperCase() }}
            <!-- ADD installed badge -->
            <span v-if="installedWeaponIds.has(weaponId)" class="installed-badge">INSTALLED</span>
        </div>
        <!-- Replace the hint text with context-aware message -->
        <div class="salvage-hint" v-if="!installedWeaponIds.has(weaponId)">
            EQUIP VIA RIG_CONFIG SLOT MENU ↑
        </div>
        <div class="salvage-hint installed" v-else>
            CURRENTLY INSTALLED IN RIG
        </div>
    </template>
</div>
```

Add to CSS:
```css
.installed-badge {
    font-size: 9px;
    color: var(--primary);
    border: 1px solid var(--primary);
    padding: 1px 4px;
    letter-spacing: 1px;
    margin-left: auto;
}
.salvage-card.is-installed {
    border-left-color: var(--primary);
    background: rgba(0, 255, 170, 0.03);
}
.salvage-hint.installed {
    color: var(--primary);
    opacity: 0.6;
}
```

---

## Change 3 — Stat Diff on Hover

**File:** `MechaPanel.vue`
**Location:** `itemOver()` method + PARTS tab template

When hovering a part, pass the currently installed part in the same slot as comparison context.
The `itemPopup.vue` `RollOver` function needs to accept an optional `compareWith` argument.

First, find the currently installed part for the hovered part's slot:

```js
getInstalledPartForSlot(slot) {
    const parts = this.frame?.parts || {};
    // frame.parts is keyed by slot name
    return parts[slot] || null;
},

itemOverPart(e, part) {
    const installed = this.getInstalledPartForSlot(part.slot);
    RollOver(e, part, { compare: installed });
},
```

Update PARTS tab to use the new method:
```vue
@mouseover="itemOverPart($event, part)"
```

In `itemPopup.vue`, if the popup receives a `compare` option, render delta values:
```vue
<!-- If compare part provided, show delta -->
<div v-if="compareData && compareData.hp !== undefined" class="stat-compare">
    HP: {{ part.maxHp }}
    <span :class="delta(part.maxHp, compareData.hp)">
        ({{ formatDelta(part.maxHp, compareData.hp) }})
    </span>
</div>
```

> Note: This change touches `itemPopup.vue` as well. If itemPopup is complex, a
> simpler alternative is to render the delta inline on the part card itself on hover,
> without modifying itemPopup.

---

## Test Checklist

- [ ] PARTS tab shows subheaders (TORSO, LEFT ARM, RIGHT ARM, LEGS) if parts exist for those slots
- [ ] Empty slots show no subheader (no "TORSO (0)" header)
- [ ] Weapon installed in a slot shows INSTALLED badge in inventory
- [ ] Uninstalled weapon shows normal "EQUIP VIA RIG_CONFIG" hint
- [ ] Hovering a part shows stat comparison with installed part (or baseline if none)
- [ ] `npm run build` passes

---

## Commit Message

```
feat(mecha/p2): group parts by slot, installed weapon badge, stat diff on hover
```
