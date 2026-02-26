# SPEC: Event Display — Phase 3 / Rank 5

**Type:** `ui(events/p3)`
**Effort:** Medium — ~2–3 hours, new EventModal.vue + events.json updates
**Depends on:** Phase 1 SPEC_narrative_foundation (evt_intro must be working)
**Blocks:** SPEC_phase3_missions (story events need the modal to render)

---

## Why This Matters

Events currently fire but have no dedicated display: they log to the terminal and vanish.
The narrative bible has 7+ events with dialogue, speaker names, and binary choices —
none of which are presented to the player. Without a modal, narrative beats are invisible.

---

## Files Changed

- `src/ui/EventModal.vue` (new)
- `src/ui/TerminalUI.vue` (mount EventModal, pass pending event)
- `data/mecha/events.json` (add `speaker` field to all events)

---

## Change 1 — EventModal.vue

```vue
<script>
export default {
    props: {
        event: { type: Object, default: null }, // null = hidden
    },
    emits: ['choice'],
    methods: {
        choose(choice) {
            this.$emit('choice', { eventId: this.event.id, choice });
        },
    },
};
</script>

<template>
    <transition name="modal-fade">
        <div v-if="event" class="event-overlay" @click.self="null">
            <div class="event-modal">
                <div class="event-header">
                    <span class="event-speaker" v-if="event.speaker">
                        [ {{ event.speaker.toUpperCase() }} ]
                    </span>
                    <span class="event-title">{{ event.title }}</span>
                </div>
                <div class="event-body">
                    <p class="event-text">{{ event.text }}</p>
                </div>
                <div class="event-choices">
                    <button
                        v-for="(choice, i) in event.choices"
                        :key="i"
                        class="hud-btn event-choice-btn"
                        @click="choose(choice)"
                    >
                        {{ choice.label }}
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.event-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}
.event-modal {
    background: var(--bg-panel);
    border: 1px solid var(--primary);
    padding: 24px;
    max-width: 520px;
    width: 90%;
    font-family: var(--font-mono);
}
.event-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border-dim);
    padding-bottom: 10px;
}
.event-speaker {
    font-size: 10px;
    color: var(--primary);
    letter-spacing: 2px;
}
.event-title {
    font-size: 14px;
    color: var(--text-bright);
    letter-spacing: 1px;
}
.event-text {
    font-size: 12px;
    color: var(--text-main);
    line-height: 1.7;
    white-space: pre-wrap;
    margin: 0 0 20px;
}
.event-choices {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.event-choice-btn {
    text-align: left;
    width: 100%;
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
```

---

## Change 2 — TerminalUI.vue Integration

```js
// In data():
pendingEvent: null,

// In methods or game action handler:
handleGameEvent(eventId) {
    const ev = this.state.items[eventId] || null;
    if (ev) this.pendingEvent = ev;
},

resolveEvent(payload) {
    // Apply choice effects if any
    const choice = payload.choice;
    if (choice?.effect) {
        Game.applyEventEffect(choice.effect);
    }
    this.pendingEvent = null;
},
```

Mount the modal in the root template:
```vue
<EventModal :event="pendingEvent" @choice="resolveEvent" />
```

Wire `game.js` to emit via bus when an event should fire:
```js
// In game.js, whenever an event triggers:
bus.emit('GAME_EVENT', eventId);
```

In `TerminalUI.vue mounted()`:
```js
bus.on('GAME_EVENT', this.handleGameEvent);
```

---

## Change 3 — events.json Speaker Field

Add `speaker` to all 7 current events. Examples:

```json
{ "id": "evt_intro", "speaker": "Kenji", "title": "...", "text": "..." },
{ "id": "evt_debt_notice", "speaker": "Ironjaw Enforcer", ... },
{ "id": "evt_covenant_approach", "speaker": "Covenant Liaison", ... }
```

Events without a clear speaker (e.g. inner monologue) use `"speaker": "Kenji"`.
System events (status updates) may omit `speaker` entirely.

---

## Change 4 — `game.applyEventEffect`

Minimal implementation to handle the effects used in Phase 3 events:

```js
applyEventEffect(effect) {
    if (!effect) return;
    if (effect.faction) {
        const { id, rep } = effect.faction;
        if (this.state.items[id]) this.state.items[id].rep = (this.state.items[id].rep || 0) + rep;
    }
    if (effect.scrap) this.state.items.scrap.val += effect.scrap;
    if (effect.credits) this.state.items.credits.val += effect.credits;
},
```

---

## Test Checklist

- [ ] Triggering `evt_intro` shows the modal with correct text and speaker
- [ ] Modal is centered, full-screen overlay blocks UI behind it
- [ ] Clicking a choice button dismisses the modal
- [ ] Choice with `effect.faction.rep` correctly modifies faction reputation
- [ ] Events with no `speaker` field render without the speaker line (not "undefined")
- [ ] Modal fades in and out smoothly
- [ ] `npm run build` passes

---

## Commit Message

```
ui(events/p3): EventModal with speaker display and choice resolution
```
