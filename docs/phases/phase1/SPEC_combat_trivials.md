# SPEC: Combat Trivials — Phase 1 / Rank 7–8, 12

**Type:** `fix(combat/p1)`
**Effort:** Trivial/Low — ~1 hour, changes to `CombatPanel.vue` only
**Depends on:** Nothing
**Blocks:** Nothing (UX improvements only)

---

## Why This Matters

Three small issues in `CombatPanel.vue` frustrate players without requiring much effort to fix:

1. The battle log is sliced to 12 lines — in a 30-turn fight, the player loses all early combat history permanently.
2. The RETREAT button has no tooltip — players don't know what retreating costs and avoid clicking it out of uncertainty.
3. The Maneuver Shop is visible to new players who have 0 Glory and can't buy anything — this confuses them about the currency system.

---

## Files Changed

- `src/ui/components/CombatPanel.vue`

---

## Change 1 — Remove Log Slice, Enable Full Scroll

**File:** `CombatPanel.vue`
**Location:** `recentLog` computed property (~line 60)

```js
// BEFORE
recentLog() {
    const log = this.combatRunner.combatLog || [];
    return log.slice(-12).reverse();
},

// AFTER
recentLog() {
    const log = this.combatRunner.combatLog || [];
    return [...log].reverse();
},
```

The `.battle-log` div already has `overflow-y: auto` and `height: 170px` — removing the slice means the CSS scroll works as intended. All turns are accessible.

**Optional:** If log performance becomes an issue with very long fights, cap at 100 instead of 12:
`return log.slice(-100).reverse()`

---

## Change 2 — Retreat Penalty Tooltip

**File:** `CombatPanel.vue`
**Location:** RETREAT button (~line 409)

```vue
<!-- BEFORE -->
<button class="btn-retreat" :disabled="!!combatResult" @click="retreat">
    ⚑ RETREAT
</button>

<!-- AFTER -->
<button
    class="btn-retreat"
    :disabled="!!combatResult"
    @click="retreat"
    title="Retreat: mission fails. Partial salvage and reduced glory recovered. Pilot survives."
>
    ⚑ RETREAT
</button>
```

One attribute. Players now understand the cost/benefit before clicking.

---

## Change 3 — Lock Maneuver Shop Behind Glory > 0

**File:** `CombatPanel.vue`
**Location:** Shop section (~line 284)

```vue
<!-- BEFORE -->
<div class="shop-section" v-if="shopManeuvers.length > 0">
    <div class="hud-section-title">> MANEUVER SHOP</div>
    ...
</div>

<!-- AFTER -->
<div class="shop-section" v-if="shopManeuvers.length > 0 && (state.items.glory?.val || 0) > 0">
    <div class="hud-section-title">> MANEUVER SHOP</div>
    ...
</div>

<!-- ADD: Teaser message when glory is 0 -->
<div
    v-else-if="shopManeuvers.length > 0 && (state.items.glory?.val || 0) === 0"
    class="shop-locked-msg"
>
    > MANEUVER SHOP LOCKED
    <span class="shop-locked-hint">Complete missions to earn GLORY and unlock tactical maneuvers.</span>
</div>
```

Add to scoped CSS:
```css
.shop-locked-msg {
    font-size: 11px;
    color: var(--text-dim);
    padding: 10px;
    border: 1px dashed rgba(0, 255, 170, 0.15);
    letter-spacing: 1px;
}
.shop-locked-hint {
    display: block;
    margin-top: 4px;
    font-size: 10px;
    opacity: 0.6;
    letter-spacing: 0;
}
```

---

## Test Checklist

- [ ] Start a combat mission with 20+ turns — verify all turns are visible in log by scrolling up
- [ ] Hover RETREAT button — tooltip text appears
- [ ] New game with 0 glory — maneuver shop section shows locked message
- [ ] After earning glory from first mission — maneuver shop becomes visible
- [ ] `npm run build` passes

---

## Commit Message

```
fix(combat/p1): full log scroll, retreat tooltip, lock maneuver shop behind glory
```
