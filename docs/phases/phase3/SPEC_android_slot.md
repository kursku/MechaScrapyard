# SPEC: Android Second Task Slot — Phase 3 / Rank 4

**Type:** `feat(android/p3)`
**Effort:** Medium — ~3 hours, runner.js + game.js + ScrapyardPanel.vue
**Depends on:** Phase 1 complete (clean runner baseline)
**Blocks:** Nothing (self-contained feature)

---

## Why This Matters

The Android companion is a core MechaScrapyard character — Kenji's cobbled-together
assistant who runs errands while he fights. Currently, the Android shows up in the UI
as a control element but operates on the same single task slot as Kenji. The Arcanum
reference demonstrates a `actives` map (multi-task runner) that makes true parallel
tasking trivial to add.

---

## Files Changed

- `src/modules/runner.js`
- `src/game.js`
- `src/ui/sections/ScrapyardPanel.vue`

---

## Change 1 — Dual-Slot Runner

**Current model:** `runner.active` — one task, no queue context.
**Target model:** `runner.slots` — keyed by operator ID (`'kenji'`, `'android'`).

```js
// runner.js — replace active with slots map
this.slots = {
    kenji: null,
    android: null,
};

startTask(taskId, operator = 'kenji') {
    if (this.slots[operator]) this.stopTask(operator);
    const task = this.state.items[taskId];
    if (!task) return false;
    this.slots[operator] = {
        taskId,
        startTime: Date.now(),
        progress: 0,
        operator,
    };
    // apply runmod if task has mods
    this._applyRunmod(task, true);
    return true;
},

stopTask(operator = 'kenji') {
    const slot = this.slots[operator];
    if (!slot) return;
    const task = this.state.items[slot.taskId];
    if (task) this._applyRunmod(task, false);
    this.slots[operator] = null;
},

tick(dt) {
    for (const [op, slot] of Object.entries(this.slots)) {
        if (!slot) continue;
        const task = this.state.items[slot.taskId];
        if (!task) { this.slots[op] = null; continue; }
        slot.progress += dt / (task.duration * 1000);
        if (slot.progress >= 1) {
            this._completeTask(slot);
            this.slots[op] = null;
        }
    }
},
```

> **Backwards compatibility:** Expose `get active()` as `this.slots.kenji` so existing
> template references don't break immediately.

---

## Change 2 — Android Unlock Gate

The Android slot is locked by default. It unlocks when the player builds the
`android_station` home upgrade (Phase 4 furniture item — use a placeholder gate for now):

```js
// game.js
get androidUnlocked() {
    return !!(this.state.g.android_station > 0);
},
```

For Phase 3 testing, temporarily lower the gate or set it to always unlocked:
```js
get androidUnlocked() { return true; } // TEMP — replace with furniture gate
```

---

## Change 3 — ScrapyardPanel Android Section

Add a second task control block for the Android, shown only when `androidUnlocked`:

```vue
<!-- Android Task Slot -->
<div v-if="androidUnlocked" class="android-task-section">
    <div class="hud-section-title">> ANDROID_UNIT: [ {{ androidStatus }} ]</div>

    <div v-if="runner.slots.android" class="active-task-row">
        <span class="task-label">{{ runner.slots.android.taskId.toUpperCase().replace(/_/g, ' ') }}</span>
        <div class="hud-progress-bar">
            <div class="hud-progress-fill" :style="{ width: (runner.slots.android.progress * 100) + '%' }"></div>
        </div>
        <button class="hud-btn small" @click="stopAndroid">HALT</button>
    </div>
    <div v-else class="task-assign-row">
        <select class="hud-select" v-model="selectedAndroidTask">
            <option value="">[ SELECT_TASK ]</option>
            <option v-for="task in androidEligibleTasks" :key="task.id" :value="task.id">
                {{ task.name.toUpperCase() }}
            </option>
        </select>
        <button class="hud-btn small" :disabled="!selectedAndroidTask"
                @click="startAndroid">DEPLOY</button>
    </div>
</div>
```

```js
data() {
    return {
        selectedAndroidTask: '',
    };
},
computed: {
    androidUnlocked() { return this.state.g.android_station > 0; },
    androidStatus() { return this.runner.slots.android ? 'ACTIVE' : 'STANDBY'; },
    androidEligibleTasks() {
        // Android can only do simple gathering/errand tasks (not combat-prep tasks)
        return Object.values(this.state.items)
            .filter(i => i.type === 'task' && i.androidEligible && !i.locked);
    },
},
methods: {
    startAndroid() {
        if (!this.selectedAndroidTask) return;
        this.$emit('action', { type: 'startTask', taskId: this.selectedAndroidTask, operator: 'android' });
        this.selectedAndroidTask = '';
    },
    stopAndroid() {
        this.$emit('action', { type: 'stopTask', operator: 'android' });
    },
},
```

---

## Change 4 — Task Data: androidEligible Flag

Add `"androidEligible": true` to tasks the Android can perform. Start with simple ones:

```json
// data/mecha/tasks.json — add to scavenge_scrap, odd_jobs:
{ "id": "scavenge_scrap", ..., "androidEligible": true },
{ "id": "odd_jobs", ..., "androidEligible": true }
```

Training tasks should NOT be android-eligible (they require Kenji's personal presence).

---

## Android Dialog Line (Flavor)

When the Android is deployed, log a flavor message to the task log:
```js
// In runner._completeTask, if operator === 'android':
this.state.log(`[ANDROID] Task complete: ${task.name}`);
```

---

## Serialization

Add android slot state to `serialize()`:
```js
androidSlot: this.runner.slots.android
    ? { taskId: this.runner.slots.android.taskId, progress: this.runner.slots.android.progress }
    : null,
```

And `deserialize()` restores it.

---

## Test Checklist

- [ ] Android section hidden when `android_station = 0`
- [ ] Android section visible after setting `android_station = 1` in dev tools
- [ ] Android can run `scavenge_scrap` in parallel with Kenji running `odd_jobs`
- [ ] Both tasks complete independently (no interference)
- [ ] Android cannot be assigned training tasks
- [ ] HALT button stops android task without affecting Kenji
- [ ] Android slot state persists across save/reload
- [ ] `npm run build` passes

---

## Commit Message

```
feat(android/p3): dual task slots, android companion deployment UI
```
