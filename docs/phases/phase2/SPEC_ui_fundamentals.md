# SPEC: UI Fundamentals — Phase 2 / Rank 6

**Type:** `ui(core/p2)`
**Effort:** Medium — ~2–3 hours, touches HudOverlay.vue, TerminalUI.vue, ResourceMonitor.vue
**Depends on:** Phase 1 trivials (clean baseline recommended)
**Blocks:** Phase 3 SPEC_event_display (event UI builds on this foundation)

---

## Why This Matters

Three persistent UX gaps undercut the terminal aesthetic and player trust:
1. No visual save indicator — players don't know if their progress is safe
2. `ResourceMonitor.vue` hardcodes directive text; switching resources means editing Vue source
3. Maneuver SHOP tab is visible at 0 glory — confusing first-run experience

---

## Files Changed

- `src/ui/HudOverlay.vue`
- `src/ui/sections/ResourceMonitor.vue`
- `src/ui/components/CombatPanel.vue`

---

## Change 1 — Save Indicator

**File:** `HudOverlay.vue`
**Location:** Top-right corner, above existing overlay elements

Add a transient save pulse that appears for 2 seconds after each save:

```js
// In game.js or wherever autosave fires:
import { bus } from '@/bus'; // EventEmitter3 instance

// After a successful save:
bus.emit('SAVE_CONFIRM');
```

In `HudOverlay.vue`:
```js
data() {
    return {
        showSavePulse: false,
        _saveTimer: null,
    };
},
mounted() {
    this._onSave = () => {
        this.showSavePulse = true;
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => { this.showSavePulse = false; }, 2000);
    };
    bus.on('SAVE_CONFIRM', this._onSave);
},
beforeUnmount() {
    bus.off('SAVE_CONFIRM', this._onSave);
    clearTimeout(this._saveTimer);
},
```

Template addition (inside `.hud-overlay`):
```vue
<transition name="fade">
    <div v-if="showSavePulse" class="save-indicator">
        ◆ SAVED
    </div>
</transition>
```

CSS:
```css
.save-indicator {
    position: fixed;
    top: 10px;
    right: 14px;
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--primary);
    opacity: 0.8;
    z-index: 9999;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
```

Also add `beforeunload` handler in `game.js` (or `main.js`):
```js
window.addEventListener('beforeunload', () => persist.save(game));
```

---

## Change 2 — JSON-Driven Resource Directives

**File:** `ResourceMonitor.vue`

Currently, resource explanations are a hardcoded array in the component. Move to a
`data/mecha/resource_hints.json` or inline the data as a computed from `state.items`.

**Minimal approach** — keep the array but drive it from `state.items` labels:

```js
computed: {
    resourceRows() {
        // Pull from state instead of hardcoded names
        const keys = ['scrap', 'credits', 'glory', 'intel', 'energy'];
        return keys.map(k => {
            const item = this.state.items[k];
            return {
                id: k,
                label: item?.shortLabel || item?.name?.toUpperCase() || k.toUpperCase(),
                val: Math.floor(item?.val || 0),
                max: item?.max || null,
                hint: item?.hint || null,
            };
        });
    },
},
```

This requires adding optional `shortLabel` and `hint` fields to the resource item definitions
in `data/mecha/items.json` (or wherever resources are defined). No UI change needed if
the existing template already iterates a list.

---

## Change 3 — Gate the Maneuver Shop

**File:** `CombatPanel.vue`
**Location:** Pre-combat tab bar (~line 20)

The SHOP tab should only appear once the player has earned at least 1 glory:

```vue
<!-- BEFORE -->
<div class="hud-tab" :class="{ active: preCombatTab === 'shop' }"
     @click="preCombatTab = 'shop'">SHOP</div>

<!-- AFTER -->
<div v-if="(state.items.glory?.val || 0) > 0"
     class="hud-tab" :class="{ active: preCombatTab === 'shop' }"
     @click="preCombatTab = 'shop'">SHOP</div>
```

Also reset `preCombatTab` to `'missions'` if shop tab is active but glory drops to 0
(edge case — can be deferred to a watcher):
```js
watch: {
    'state.items.glory.val'(v) {
        if (v <= 0 && this.preCombatTab === 'shop') {
            this.preCombatTab = 'missions';
        }
    },
},
```

---

## Test Checklist

- [ ] Autosave triggers "◆ SAVED" indicator (top-right, 2 seconds, then fades)
- [ ] Manually saving also triggers the indicator
- [ ] Closing tab mid-session triggers `beforeunload` save (verify via DevTools Application → localStorage)
- [ ] ResourceMonitor pulls labels from state (change a label in data, see it reflected)
- [ ] SHOP tab hidden when glory = 0
- [ ] SHOP tab appears after first mission reward grants glory
- [ ] `npm run build` passes

---

## Commit Message

```
ui(core/p2): save indicator, JSON-driven resources, gate maneuver shop
```
