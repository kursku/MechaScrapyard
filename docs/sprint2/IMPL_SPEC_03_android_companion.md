# MECHA SCRAPYARD — Implementation Spec: Android Companion
## Sprint: Reclaim-03 — K.I.T.A. (Kinetic Industrial Task Automaton)

**From:** Design (Claude)
**To:** Implementation (Antigravity)
**Priority:** 🟡 HIGH — Transforms idle loop from abstract numbers into character progression
**Estimated effort:** ~5-7 hours
**Prerequisites:** None (standalone), but best after Reclaim-01 (Morale) is functional

---

## WHY AN ANDROID

Currently, auto-gathering is an invisible background number. Scrap accumulates because the code says so. The Android turns automation into a CHARACTER the player builds, upgrades, and bonds with — Medabots meets a Roomba with personality.

- **Idle mechanic with a face:** Instead of "+0.3 scrap/s" the player sees K.I.T.A. working
- **Upgrade sink:** Parts, creds, and data chips feed into Android improvements
- **Narrative anchor:** Found during scrapyard exploration, not given at start — a discovery
- **Skill tie-in:** Android efficiency scales with player's Focus stat and Crafting skill

---

## PART 1: DISCOVERY EVENT

### 1.1 Android is NOT available at start

Triggered after Sorting Station AND Workshop are built.

**Add to `data/mecha/events.json`:**

```json
{
  "id": "evt_android_discovery",
  "name": "Something in the Pile",
  "require": "g.triagem>0&&g.oficina_nivel2>0",
  "desc": "While sorting a deep pile of electronic scrap, you find something unusual — a humanoid frame, half-buried in circuit boards. It's small. Industrial design. Old but functional.",
  "result": { "title": "Scrapyard Companion" },
  "choices": [
    {
      "id": "repair_now",
      "label": "Bring it to the workshop and power it up",
      "desc": "It's in rough shape, but the workshop has what you need.",
      "morality": 5,
      "effect": { "electronic_scrap": -10, "scrap": -15 },
      "log": "It boots. One eye flickers. 'TASK... ASSIGN... TASK...'"
    },
    {
      "id": "repair_careful",
      "label": "Study it first, then repair carefully",
      "desc": "Rushing repairs on unknown tech is how people lose fingers.",
      "morality": 0,
      "effect": { "electronic_scrap": -5, "energy": -15, "data_chips": -3 },
      "log": "'Kinetic Industrial Task Automaton, designation K.I.T.A. Ready for assignment.'"
    },
    {
      "id": "strip_for_parts",
      "label": "Strip it for components",
      "desc": "An intact android frame is worth more as parts than as a helper.",
      "morality": -15,
      "effect": { "electronic_scrap": 25, "nano_infra": 5 },
      "log": "The android is dismantled. Grandpa watches in silence."
    }
  ]
}
```

**If `strip_for_parts` chosen:** No android. Set `g.android_destroyed = 1`. A second unit can be found later at 3x cost through a quest.

### 1.2 Milestone trigger in `game.js milestoneCheck()`:

```js
{
    id: 'android_discovery',
    condition: () => (g.triagem?.owned || 0) > 0 && (g.oficina_nivel2?.owned || 0) > 0,
    action: () => this.presentChoice(this.state.items.evt_android_discovery)
},
```

After choice resolves in `_resolveChoice`:

```js
if (event.id === 'evt_android_discovery' && chosen.id !== 'strip_for_parts') {
    this._initAndroid();
}
if (event.id === 'evt_android_discovery' && chosen.id === 'strip_for_parts') {
    this.state.g.android_destroyed = 1;
}
```

---

## PART 2: ANDROID DATA STRUCTURE

### 2.1 Add to `gameState.js` constructor:

```js
this.android = reactive({
    active: false,
    name: 'K.I.T.A.',
    level: 1,
    xp: 0,
    xpToNext: 100,
    energy: 50,
    maxEnergy: 50,
    energyRate: 0.2,
    assignment: null,       // Current task ID
    efficiency: 1.0,        // Output multiplier
    modules: [],            // Installed upgrade IDs
    personality: 0,         // Evolves with usage
});
```

### 2.2 Expose to g. namespace:

```js
Object.defineProperty(this.g, 'android_active', {
    get: () => this.android.active ? 1 : 0,
    configurable: true,
});
Object.defineProperty(this.g, 'android_level', {
    get: () => this.android.level,
    configurable: true,
});
```

### 2.3 Init method in `game.js`:

```js
_initAndroid() {
    this.state.android.active = true;
    this.state.android.level = 1;
    this.state.android.energy = 50;
    Log.add('🤖 K.I.T.A. online. Assign a task in the SCRAPYARD tab.', 'story');
},
```

---

## PART 3: ANDROID TASK SYSTEM

### 3.1 Assignment methods in `game.js`:

```js
assignAndroid(taskId) {
    const android = this.state.android;
    if (!android.active) return false;
    const task = this.state.items[taskId];
    if (!task || !task.perpetual || task.locked) {
        Log.add('✗ K.I.T.A. can only run perpetual tasks.', 'error');
        return false;
    }
    android.assignment = taskId;
    Log.add(`🤖 K.I.T.A. assigned: ${task.name}`, 'action');
    return true;
},

unassignAndroid() {
    const android = this.state.android;
    if (!android.active || !android.assignment) return false;
    Log.add(`🤖 K.I.T.A. standing by.`, 'action');
    android.assignment = null;
    return true;
},
```

### 3.2 Android tick in `game.js update(dt)`:

Add AFTER runner update and job income:

```js
// --- Android Automation ---
const android = this.state.android;
if (android.active) {
    // Energy regen (always, even unassigned)
    android.energy = Math.min(android.maxEnergy, android.energy + android.energyRate * dt);

    if (android.assignment) {
        const task = this.state.items[android.assignment];
        if (task && task.perpetual) {
            // Pay energy cost from android's pool (NOT player energy)
            let canRun = true;
            const energyCost = task.run?.energy || 0;
            if (energyCost > 0) {
                if (android.energy < energyCost * dt) {
                    canRun = false;
                } else {
                    android.energy -= energyCost * dt;
                }
            }

            if (canRun) {
                // Apply effects × efficiency × Focus bonus
                const focusBonus = 1 + ((this.state.items.focus?.val || 1) * 0.05);
                const eff = android.efficiency * focusBonus;
                if (task.effect) {
                    for (const [resId, rate] of Object.entries(task.effect)) {
                        const res = this.state.items[resId];
                        if (res && res.val !== undefined) {
                            res.val = Math.min(res.max || Infinity, res.val + rate * eff * dt);
                        }
                    }
                }
                // XP: 1 per 10 seconds of work
                android.xp += 0.1 * dt;
                if (android.xp >= android.xpToNext) this._levelUpAndroid();
            }
        }
    }
}
```

### 3.3 Leveling:

```js
_levelUpAndroid() {
    const android = this.state.android;
    if (android.level >= 10) return;
    android.level += 1;
    android.xp = 0;
    android.xpToNext = Math.floor(100 * Math.pow(1.5, android.level - 1));
    android.efficiency += 0.1;
    android.maxEnergy += 10;
    android.energyRate += 0.02;
    Log.add(`🤖 K.I.T.A. Level ${android.level}! Efficiency: ${(android.efficiency * 100).toFixed(0)}%`, 'story');

    const quips = {
        2: "K.I.T.A.: 'EFFICIENCY... IMPROVED.'",
        3: "K.I.T.A.: 'I have cataloged 47 types of rust. Satisfying.'",
        5: "K.I.T.A.: 'I experience something when sorting. Is this... preference?'",
        7: "K.I.T.A.: 'I have a favorite scrap pile. Don't judge me.'",
        10: "K.I.T.A.: 'I am K.I.T.A. I sort. I collect. I am... content.'"
    };
    if (quips[android.level]) this.showDialogue('kita', [quips[android.level]]);
},
```

---

## PART 4: ANDROID UPGRADES

Add to `data/mecha/upgrades.json`:

```json
{
  "id": "android_battery",
  "name": "K.I.T.A. Battery Pack",
  "desc": "Extended battery. +30 max energy, +0.1 regen.",
  "flavor": "It runs longer. Seems happier too.",
  "tags": "t_android",
  "locked": true,
  "require": "g.android_active>0",
  "max": 3,
  "cost": { "electronic_scrap": 15, "nano_infra": 5, "creds": 30 },
  "mod": {},
  "log": { "name": "Battery Installed", "desc": "K.I.T.A. energy capacity increased." }
},
{
  "id": "android_sorting_arm",
  "name": "K.I.T.A. Precision Arm",
  "desc": "Upgraded manipulator. +15% task efficiency.",
  "flavor": "Faster hands. Fewer dropped circuits.",
  "tags": "t_android",
  "locked": true,
  "require": "g.android_active>0&&g.oficina_nivel2>0",
  "max": 1,
  "cost": { "ferrous_scrap": 20, "polymer_scrap": 10, "nano_infra": 8 },
  "mod": {},
  "log": { "name": "Arm Installed", "desc": "Scrapyard efficiency improved." }
},
{
  "id": "android_neural_chip",
  "name": "K.I.T.A. Neural Processor",
  "desc": "Adaptive learning. +20% efficiency. Unlocks multi-task.",
  "flavor": "It's thinking. Actually thinking.",
  "tags": "t_android",
  "locked": true,
  "require": "g.android_active>0&&g.mesa_pesquisa>0&&g.android_level>=5",
  "max": 1,
  "cost": { "quantum_circuits": 3, "data_chips": 10, "nano_infra": 15 },
  "mod": {},
  "log": { "name": "Neural Chip Installed", "desc": "K.I.T.A. can now learn from experience." }
}
```

Hook in upgrade purchase handler:

```js
if (upgrade.tags === 't_android') {
    this._applyAndroidUpgrade(upgrade.id);
}
```

```js
_applyAndroidUpgrade(upgradeId) {
    const a = this.state.android;
    switch (upgradeId) {
        case 'android_battery': a.maxEnergy += 30; a.energyRate += 0.1; break;
        case 'android_sorting_arm': a.efficiency += 0.15; break;
        case 'android_neural_chip': a.efficiency += 0.2; break;
    }
    a.modules.push(upgradeId);
    Log.add(`🤖 K.I.T.A.: 'NEW MODULE... INTEGRATED.'`, 'story');
},
```

---

## PART 5: UI — ANDROID PANEL

In Scrapyard tab, when android is active:

```vue
<div v-if="android.active" class="android-panel">
  <div class="android-header">
    🤖 {{ android.name }}
    <span class="android-level">Lv.{{ android.level }}</span>
  </div>
  <div class="android-energy">
    ⚡ {{ Math.floor(android.energy) }}/{{ android.maxEnergy }}
  </div>
  <div class="android-xp">
    XP: {{ Math.floor(android.xp) }}/{{ android.xpToNext }}
  </div>
  <div class="android-task">
    <span v-if="android.assignment">
      Working: {{ getTaskName(android.assignment) }}
      ({{ (android.efficiency * 100).toFixed(0) }}% eff.)
      <button @click="unassignAndroid">■</button>
    </span>
    <span v-else class="idle">Standing by. Assign a task below.</span>
  </div>
</div>
```

On each perpetual task, add assign button:

```vue
<button
  v-if="android.active && task.perpetual && !task.locked"
  @click="assignAndroid(task.id)"
  :disabled="android.assignment === task.id"
>
  🤖 {{ android.assignment === task.id ? 'Assigned' : 'K.I.T.A.' }}
</button>
```

---

## PART 6: SAVE/LOAD

```js
// Serialize:
android: this.game.state.android,

// Restore:
if (saveData.android) Object.assign(this.game.state.android, saveData.android);
```

---

## VERIFICATION CRITERIA

- [ ] Discovery fires after Sorting Station + Workshop
- [ ] "Strip for parts" = no android, flag set, resources gained
- [ ] Android panel appears in Scrapyard tab
- [ ] Assigning K.I.T.A. produces resources independently of player task
- [ ] Android uses its OWN energy pool
- [ ] Android levels up with efficiency/energy improvements
- [ ] Level-up quips display
- [ ] Upgrades purchasable and apply
- [ ] Focus stat affects efficiency (+5% per point)
- [ ] State persists across save/load
- [ ] `g.android_active>0` works in require strings

---

## FILE REFERENCE

| File | Action |
|------|--------|
| `src/gameState.js` | MODIFY — add android reactive, expose to g. |
| `src/game.js` | MODIFY — init, assign, tick, level, upgrades |
| `data/mecha/events.json` | MODIFY — add discovery choice |
| `data/mecha/upgrades.json` | MODIFY — add 3 android modules |
| `modules/persist.js` | MODIFY — save/load android |
| `src/ui/TerminalUI.vue` | MODIFY — android panel + assign buttons |

---

*Standalone. Enhances: Reclaim-06 (Focus → android eff.), Reclaim-02 (android can run job tasks).*
