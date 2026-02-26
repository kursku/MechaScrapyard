# SPEC: Home Phase → Event Wiring — Phase 2 / Rank 3

**Type:** `feat(narrative/p2)`
**Effort:** Medium — ~2–3 hours, changes to game.js event system
**Depends on:** Phase 1 SPEC_narrative_foundation (speaker fields must exist on events)
**Blocks:** Phase 3 SPEC_event_display (display system needs wired events to show)

---

## Why This Matters

The scrapyard's 5-phase progression is the primary narrative backbone per the narrative bible.
Each phase upgrade is meant to trigger a story moment — Grandpa noticing, Dad's garage opening,
the refinery awakening. Currently, buying upgrades has zero narrative response.
The events exist in `events.json`. The home phases exist in `homes.json`. They are not connected.

---

## Files Changed

- `src/game.js` — home phase change detection + event queueing
- `data/mecha/events.json` — ensure `seen` field exists on all events (data-only check)

---

## Wiring Map

| Home phase unlocked | Event to fire | Additional action |
|--------------------|---------------|-------------------|
| `scrapyard_phase2` | `evt_sorting` | None |
| `scrapyard_phase3` | `evt_garage_discovery` | Unlock `frame_hayabusa_mk1` in player inventory |
| `scrapyard_phase4` | `evt_refinery_online` | None |
| `scrapyard_phase5` | None (Phase 5 is post-Grandpa-death) | Handled by siege mission |
| After `msn_scrapyard_siege` | `evt_grandpa_memorial` | Swap Grandpa speaker to silent |

---

## Change 1 — Home Phase Change Detection

**File:** `src/game.js`

In the game tick or wherever upgrades are applied (likely `tryItem()` or `award()`),
add a check that fires when a home item transitions from `owned=0` to `owned>0`:

```js
// After any item is purchased/awarded, check if it's a home phase
_checkHomePhaseTrigger(itemId) {
    const phaseEventMap = {
        'scrapyard_phase2': 'evt_sorting',
        'scrapyard_phase3': 'evt_garage_discovery',
        'scrapyard_phase4': 'evt_refinery_online',
    };

    const eventId = phaseEventMap[itemId];
    if (!eventId) return;

    const event = this.state.items[eventId];
    if (!event || event.seen) return;

    this.queueEvent(eventId);

    // Special: Phase 3 also unlocks Dad's frame
    if (itemId === 'scrapyard_phase3') {
        this._unlockDadsFrame();
    }
},

_unlockDadsFrame() {
    const frame = this.state.items['frame_hayabusa_mk1'];
    if (!frame || frame.discovered) return;
    frame.discovered = true;
    frame.locked = false;
    // Add to player inventory
    if (!this.state.player.inventory.frames.includes('frame_hayabusa_mk1')) {
        this.state.player.inventory.frames.push('frame_hayabusa_mk1');
    }
    // Log the discovery
    Log.add('◆ A battered frame found in the garage. Your father\'s callsign is etched in the cockpit.', 'narrative');
},
```

---

## Change 2 — Event Queue System (Stub)

**File:** `src/game.js`

A minimal event queue that Phase 3's SPEC_event_display will fully implement.
For now, `queueEvent()` just logs to the combat log or stores for later display:

```js
queueEvent(eventId) {
    const event = this.state.items[eventId];
    if (!event || event.seen) return;

    event.seen = true;

    // Phase 2: minimal — log narrative text and show dialogue
    if (event.desc) {
        Log.add(`◆ ${event.name}: ${event.desc}`, 'narrative');
    }
    if (event.desc && this.showDialogue) {
        const speaker = event.speaker || 'system';
        this.showDialogue(speaker, [event.desc]);
    }
},
```

Phase 3 SPEC_event_display replaces this with a proper modal queue.

---

## Change 3 — Post-Siege Memorial Event

**File:** `src/game.js`

In the `COMBAT_END` handler where `msn_scrapyard_siege` is completed:

```js
// Inside combat end handling, after mission rewards are given:
if (mission.id === 'msn_scrapyard_siege') {
    this.queueEvent('evt_grandpa_memorial');
    this.queueEvent('evt_workshop_after');
    // Disable Grandpa as a dialogue speaker going forward
    this.state._grandpaSilenced = true;
}
```

---

## Change 4 — Ensure `seen` Field on All Events

**File:** `data/mecha/events.json`

Every event should have `"seen": false` as a default field so the `seen` tracking works
without code needing to add it dynamically:

```json
{ "id": "evt_sorting", "seen": false, ... }
{ "id": "evt_garage_discovery", "seen": false, ... }
// etc. for all events
```

---

## Test Checklist

- [ ] Buy `sorting_station` then `workshop_lv2` → `evt_sorting` fires once (Grandpa dialogue)
- [ ] Reach `scrapyard_phase3` → `evt_garage_discovery` fires + `frame_hayabusa_mk1` appears in frames inventory
- [ ] `evt_garage_discovery` does NOT fire again on game reload (seen=true persisted)
- [ ] `frame_hayabusa_mk1` exists in `frames.json` (verify data file has the entry)
- [ ] `npm run build` passes

---

## Commit Message

```
feat(narrative/p2): wire home phase transitions to story events and Dad's frame discovery
```
