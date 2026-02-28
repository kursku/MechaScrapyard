# SPEC — Prestige & Shop UX Polish

**Phase:** 4-UI — Spec 4 of 4
**Area:** PilotPanel / Prestige / Glory Shop / Vendor
**Priority:** 🟡 MEDIUM — Feedback gaps make systems feel unresponsive
**Estimated effort:** ~1.5 hours
**Prerequisites:** SPEC 10 (prestige), SPEC 12 (street cred)

---

## WHY THIS MATTERS

Three small but noticeable polish gaps in the prestige and vendor systems:

1. The alignment badge only appears at `gloryPool >= 50`. A paragon pilot with 40 GP gets no feedback on their alignment trajectory before the prestige gate.
2. The Glory Shop buy button fails silently if the player can't afford an item (the button is disabled, but no reason is given in the UI — the game logs it but the log pane isn't in PilotPanel).
3. The faction vendor buy button has no processing state — double-click on slow devices sends two purchase events.

---

## PART 1: ALIGNMENT — LOWER BADGE THRESHOLD

### 1.1 Current behavior

```js
showGloryShop() {
    return this.gloryPool >= 50 || this.prestigeCount > 0;
},
```

The alignment badge is inside the prestige-row which is always shown, but the prestige-row itself and the alignment data are only meaningful once the prestige path starts. The badge should show at a lower threshold to give alignment path feedback earlier.

### 1.2 Fix

Show the alignment badge and morality trajectory whenever morality is non-zero (the player is building toward a path), regardless of glory pool:

```vue
<!-- Alignment Badge + Glory Pool -->
<div class="prestige-row" v-if="moralValue !== 0 || gloryPool > 0 || prestigeCount > 0">
    <div class="alignment-badge" :style="{ color: alignmentColor, borderColor: alignmentColor }">
        {{ alignmentLabel }}
    </div>
    <div v-if="gloryPool > 0" class="glory-pool-hud">◈ {{ gloryPool }} GP</div>
</div>
```

This shows the badge as soon as the pilot has made any moral choice (morality ≠ 0), giving early path feedback.

---

## PART 2: GLORY SHOP — PURCHASE FEEDBACK

### 2.1 Current behavior

When the player can't afford a Glory Shop item, the button is `disabled`. No UI feedback — the game logs a message but the log isn't visible in PilotPanel.

### 2.2 Fix

Add a transient "insufficient GP" flash on the glory pool display when an affordance check fails. Use a `data()` flag:

```js
// In data():
gloryPurchaseError: false,

// Modified buyGloryItem:
buyGloryItem(itemId) {
    const result = Game.buyGloryShopItem(itemId);
    if (result === false) {
        this.gloryPurchaseError = true;
        setTimeout(() => { this.gloryPurchaseError = false; }, 1200);
    }
},
```

Note: `buyGloryShopItem` needs to return `false` on failure (currently returns `undefined`). Update the game method:

```js
buyGloryShopItem(itemId) {
    // ... existing validation ...
    if (item.owned >= item.max) return false;
    if (gpItem.val < item.cost_glory_pool) return false;
    // ... rest of purchase logic ...
},
```

In the template, flash the GP display red:

```vue
<div v-if="gloryPool > 0" class="glory-pool-hud" :class="{ 'gp-error': gloryPurchaseError }">
    ◈ {{ gloryPool }} GP
</div>
```

```css
.glory-pool-hud.gp-error {
    color: #f44 !important;
    animation: gp-flash 0.3s ease-in-out 2;
}
@keyframes gp-flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}
@media (prefers-reduced-motion: reduce) {
    .glory-pool-hud.gp-error { animation: none; }
}
```

---

## PART 3: VENDOR BUY BUTTON — PROCESSING STATE

### 3.1 Current behavior

`FactionsPanel.vue`'s `buyVendorItem()` call is synchronous and instant but has no visual latch — rapid clicks or double-tap could trigger multiple purchases.

### 3.2 Fix

Add a per-item purchase lock using a reactive set:

```js
// In data():
purchasingItems: new Set(),

// Modified method:
async buyVendorItem(itemId, facId) {
    if (this.purchasingItems.has(itemId)) return;
    this.purchasingItems.add(itemId);
    Game.buyVendorItem(itemId, facId);
    setTimeout(() => this.purchasingItems.delete(itemId), 400);
},
```

In the template, bind the state:

```vue
<button
    class="hud-btn small vendor-buy-btn"
    :disabled="purchasingItems.has(itemId)"
    @click="buyVendorItem(itemId, fac.id)"
>BUY</button>
```

The 400ms window prevents double-purchase while keeping the UX instant-feeling.

---

## VERIFICATION CRITERIA

- [ ] Alignment badge shows when morality ≠ 0 (not just when gloryPool >= 50)
- [ ] `buyGloryShopItem` returns `false` on failure
- [ ] Glory pool display flashes red briefly on failed purchase
- [ ] Vendor buy button disables for 400ms after click to prevent double-purchase
- [ ] All new animations respect `prefers-reduced-motion`

---

## FILE REFERENCE

| File | Action |
| --- | --- |
| `src/ui/sections/PilotPanel.vue` | MODIFY prestige-row `v-if`; ADD `gloryPurchaseError` data flag; ADD `.gp-error` CSS with flash |
| `src/game.js` — `buyGloryShopItem` | ADD `return false` on validation failures |
| `src/ui/sections/FactionsPanel.vue` | ADD `purchasingItems` set; bind `:disabled` on vendor buy button |
