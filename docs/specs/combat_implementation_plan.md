# MECHA SCRAPYARD — Combat System Full Implementation Plan

**Status:** Sprint 2A → 2B → 2C (sequential, each step depends on the previous)
**Reference:** `combat_design_document.md` §1–§15
**Codebase:** Vue 3 + Vite, Arcanum engine patterns

---

## CRITICAL CONTEXT FOR THE AI

Before touching any code, understand these existing patterns:

1. **All game items live in `GameState.items`** — a flat `{ id: reactiveObject }` map. Resources, upgrades, tasks, enemies — everything is an item with an `id`.
2. **The `g` namespace** exposes items for `require` expressions. Items with `val` expose the full object; items with `owned` expose the owned count. TechTree evaluates strings like `"g.garagem>0"` via `new Function('g', 'return (expr)')`.
3. **Data is loaded from JSON files** listed in `data/mecha/modules.json` → `core[]` array. Each file name maps to a `_load{Name}()` method in `game.js`.
4. **The Runner pattern** manages active tasks. A new `CombatRunner` should follow the same pattern: owned by `Game`, updated each tick, serializable.
5. **The TerminalUI.vue** is the main UI (the `isMecha` check routes there). New combat UI goes here as a new category/section, NOT as a separate page.
6. **Events bus** exists (`src/events.js` using eventemitter3) but is underused. Combat events should use it: `COMBAT_START`, `COMBAT_END`, `TURN_RESOLVED`, `MISSION_COMPLETE`.
7. **`space` and `parts` resources are referenced by mods but missing from `resources.json`.** These must be added as part of this plan.

---

## PHASE 1: FOUNDATION — CombatRunner + Turn Loop

**Goal:** A working combat engine that resolves turns automatically inside the game tick, using the existing d100 + d6 pool systems.

### [NEW] `src/modules/combatRunner.js`

This is the core new file. It manages an active combat encounter: initiative, turns, attack resolution, victory/defeat. It follows the `Runner` pattern.

**Class signature:**

```js
import { rollD100, rollBonusPool, resolveBonusDice } from '@/util/dice';
import Log from '@/log';
import Events from '@/events';

export default class CombatRunner {
    constructor(state) {
        this.state = state;

        // Active encounter state
        this.active = false;         // Is combat happening?
        this.mission = null;         // Current mission data object
        this.enemies = [];           // Array of deep-cloned enemy frame objects
        this.turnNumber = 0;
        this.turnTimer = 0;          // Accumulator for tick-to-turn conversion
        this.combatLog = [];         // Combat-specific log (separate from main Log)
        this.result = null;          // 'victory' | 'defeat' | null

        // Configurable before combat
        this.stance = 'balanced';    // 'offensive' | 'balanced' | 'defensive' | 'cautious'
        this.targeting = 'auto';     // 'auto' | 'torso' | 'arms' | 'legs'
    }
}
```

**Key methods to implement:**

| Method | Purpose | Reference |
|--------|---------|-----------|
| `startMission(mission, enemyTemplates)` | Clone enemies from templates, reset state, set `active = true`, emit `COMBAT_START` | §4.1 |
| `update(dt)` | Called every game tick (200ms). Accumulates `turnTimer`. When `turnTimer >= TURN_INTERVAL` (2.5s for easy, configurable), calls `resolveTurn()` | §4.1 |
| `resolveTurn()` | Initiative phase → action phase (player frame attacks → each enemy attacks) → maintenance phase → check end conditions | §4.1 full turn structure |
| `resolvePlayerAttack(enemy)` | Calculate targetPercent (§5.1), roll d100, roll bonus d6 pool, select target part, apply damage via `applyDamage()` | §5.1 + §5.2 |
| `resolveEnemyAttack(enemy)` | Same as player attack but enemy → player frame. Uses `state.player.frame` | §5.1 |
| `applyDamage(frame, partId, amount)` | Reduce part HP. If HP <= 0, reduce integrity. If integrity <= 0, set status = 'destroyed'. Log everything. | §3.1 + §3.2 (already partially in `combat.js`) |
| `selectTargetPart(policy)` | Weighted random based on targeting policy | §3.2 (already in `combat.js`, reuse) |
| `calculateTargetPercent(attacker, defender)` | `50 + (ATK × 2) - (DEF × 1.5) + stanceMod + skillBonus` | §5.1 (already in `combat.js`, extend) |
| `checkEndConditions()` | Victory: all enemies have torso destroyed. Defeat: player torso destroyed. Return `'victory'` / `'defeat'` / `null` | §4.1 |
| `endCombat(result)` | Set `active = false`, calculate rewards (glory, loot, XP), apply to state, emit `COMBAT_END` | §12.1 + §12.2 |
| `toJSON()` / `fromJSON()` | Serialize active combat for save/load | existing pattern |

**Turn interval calculation (§14.1):**

```js
// 1 turn = ~2.5 seconds real time for easy missions
// TURN_INTERVAL = 2.5 (seconds), accumulated via dt in update()
const TURN_INTERVAL = 2.5;
```

**Stance modifiers (§4.3):**

```js
const STANCES = {
    offensive:  { atkMod: 0.15, defMod: -0.10, heatDissipMod: 0 },
    balanced:   { atkMod: 0,    defMod: 0,     heatDissipMod: 0 },
    defensive:  { atkMod: -0.10, defMod: 0.15, heatDissipMod: 0 },
    cautious:   { atkMod: -0.20, defMod: 0.10, heatDissipMod: 0.25 }
};
```

**Critical: reuse existing code from `combat.js`.** The methods `calculateTargetPercent`, `selectTargetPart`, and `applyDamage` already exist in `src/modules/combat.js`. Migrate them into `CombatRunner` or import from `combat.js`. Do NOT duplicate logic.

---

### [MODIFY] `src/modules/combat.js`

Refactor to be a **utility library** of pure functions, not a class. CombatRunner will import these:

```js
// combat.js becomes stateless utility functions:
export function calculateTargetPercent(attacker, defender, stanceMod = 0) { ... }
export function selectTargetPart(policy) { ... }
export function applyDamage(frame, partId, amount) { ... }
export function isFrameDestroyed(frame) { return frame.parts.torso.status === 'destroyed'; }
export function getOperationalParts(frame) { ... }
```

Remove the `CombatEngine` class. The CombatRunner replaces it entirely.

---

### [MODIFY] `src/game.js`

Add CombatRunner integration:

```js
import CombatRunner from 'modules/combatRunner';

// In init():
this.combatRunner = new CombatRunner(this.state);

// In tick():
if (this.combatRunner.active) {
    this.combatRunner.update(dt);
}

// In serialize():
combatRunner: this.combatRunner.toJSON(),

// In init() restore section:
if (saveData) {
    this.combatRunner.fromJSON(saveData.combatRunner);
}
```

Add a new public method for starting missions:

```js
/**
 * Start a combat mission.
 * @param {string} missionId - ID from missions.json
 */
startMission(missionId) {
    const mission = this.state.items[missionId];
    if (!mission || mission.locked) return;

    // Check energy cost
    if (mission.cost && !this.state.payCost(mission.cost)) {
        Log.add('✗ Insufficient resources for mission.', 'error');
        return;
    }

    // Clone enemy templates
    const enemies = (mission.enemies || []).map(eid => {
        const template = this.state.items[eid];
        return template ? JSON.parse(JSON.stringify(template)) : null;
    }).filter(Boolean);

    this.combatRunner.startMission(mission, enemies);
}
```

Also add `_loadMissions(rawData.missions || [])` in the `init()` method, following the exact pattern of `_loadTasks`:

```js
_loadMissions(data) {
    for (const item of data) {
        item.locked = item.locked ?? (item.require ? true : false);
        item.completed = item.completed ?? 0;
        item.type = item.type || 'mission';

        const rItem = reactive(item);
        this.state.register(rItem);
        this.techTree.register(rItem);
    }
}
```

**Add `'missions'` to `data/mecha/modules.json` → `core[]` array.**

---

### [NEW] `data/mecha/missions.json`

First batch of missions. These follow the data-driven pattern — everything is in JSON, the engine is generic.

```json
[
    {
        "id": "mission_scrap_drone",
        "name": "Rogue Drone Patrol",
        "desc": "A malfunctioning scrap drone is harassing the neighborhood. Take it out.",
        "flavor": "It's been stealing parts from Grandpa's sorting station for weeks.",
        "group": "combat",
        "type": "mission",
        "missionType": "survey",
        "difficulty": 1,
        "require": "g.garagem>0",
        "cost": { "energy": 15 },
        "enemies": ["scrap_drone"],
        "turnLimit": 15,
        "rewards": {
            "glory": 3,
            "creds": 15,
            "scrap": 25
        },
        "firstClearBonus": {
            "glory": 3,
            "reputation": 1
        },
        "loot": {
            "parts": { "chance": 0.3, "amount": 2 },
            "scrap": { "chance": 0.6, "amount": 10 }
        },
        "failRewards": {
            "glory": 1,
            "scrap": 5
        },
        "log": {
            "start": "Deploying frame... Target: Scrap Drone. Engaging.",
            "victory": "Drone neutralized. Salvageable parts recovered.",
            "defeat": "Frame sustained critical damage. Retreating to base."
        }
    },
    {
        "id": "mission_rogue_labor",
        "name": "Rogue Labor Containment",
        "desc": "An industrial Labor has gone haywire near the docks. Corporate wants it stopped — quietly.",
        "flavor": "Whoever corrupted its BIOS knew what they were doing.",
        "group": "combat",
        "type": "mission",
        "missionType": "secure",
        "difficulty": 3,
        "require": "g.mission_scrap_drone>=1",
        "cost": { "energy": 25 },
        "enemies": ["rogue_labor"],
        "turnLimit": 30,
        "rewards": {
            "glory": 5,
            "creds": 40,
            "scrap": 15
        },
        "firstClearBonus": {
            "glory": 3,
            "reputation": 2
        },
        "loot": {
            "parts": { "chance": 0.4, "amount": 3 },
            "ceramite": { "chance": 0.2, "amount": 1 }
        },
        "failRewards": {
            "glory": 2,
            "creds": 10
        },
        "log": {
            "start": "Approaching target zone. Contact imminent.",
            "victory": "Labor contained. Corporate sends their thanks — and payment.",
            "defeat": "Labor overpowered us. Frame needs serious repairs."
        }
    },
    {
        "id": "mission_security_unit",
        "name": "Corporate Incursion",
        "desc": "A corporate security unit was spotted scouting the scrapyard perimeter. Defend your territory.",
        "flavor": "They're not just scouting. They're sizing you up.",
        "group": "combat",
        "type": "mission",
        "missionType": "secure",
        "difficulty": 5,
        "require": "g.mission_rogue_labor>=1&&g.skill_combat>=2",
        "cost": { "energy": 35 },
        "enemies": ["security_unit"],
        "turnLimit": 40,
        "rewards": {
            "glory": 8,
            "creds": 80,
            "nano_infra": 3
        },
        "firstClearBonus": {
            "glory": 5,
            "reputation": 5
        },
        "loot": {
            "parts": { "chance": 0.5, "amount": 5 },
            "data_chips": { "chance": 0.3, "amount": 2 }
        },
        "failRewards": {
            "glory": 3,
            "creds": 15
        },
        "log": {
            "start": "Corporate mecha detected. This is personal. Engaging.",
            "victory": "Security Unit down. They'll think twice before coming back.",
            "defeat": "Corporate firepower is no joke. We barely made it back."
        }
    }
]
```

**Data contract for missions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique ID, prefix `mission_` |
| `type` | string | yes | Always `"mission"` |
| `missionType` | string | yes | `"survey"` / `"secure"` / `"raid"` / `"arena"` (§11.1) |
| `difficulty` | number | yes | 1-10, affects turn interval and targetPercent bonuses for enemies |
| `require` | string | no | TechTree condition for unlock |
| `cost` | object | no | Resources consumed to start (`{ energy: N }`) |
| `enemies` | string[] | yes | Array of enemy IDs from `enemies.json` |
| `turnLimit` | number | yes | Max turns before auto-retreat (defeat) |
| `rewards` | object | yes | Resources awarded on victory |
| `firstClearBonus` | object | no | One-time bonus on first completion |
| `failRewards` | object | yes | Fail Forward — always get something (§14.4) |
| `loot` | object | no | Per-enemy loot table with `chance` and `amount` |
| `completed` | number | runtime | How many times completed (set at runtime, saved) |

---

### [MODIFY] `data/mecha/modules.json`

Add `"missions"` to the `core` array:

```json
{
    "core": [
        "tags",
        "resources",
        "upgrades",
        "tasks",
        "homes",
        "furniture",
        "skills",
        "player",
        "events",
        "sections",
        "equipslots",
        "enemies",
        "missions"
    ],
    "modules": []
}
```

---

### [MODIFY] `data/mecha/resources.json`

Add missing resources that are referenced by mods and the combat system:

```json
{
    "id": "glory",
    "name": "Glory",
    "desc": "Combat experience and prestige currency. Earned in battle, spent on advancement.",
    "flavor": "Every scar tells a story. Every story earns respect.",
    "group": "combat",
    "icon": "⚔",
    "color": "#f5c542",
    "max": 500,
    "sortOrder": 200,
    "require": "g.garagem>0"
},
{
    "id": "parts",
    "name": "Mecha Parts",
    "desc": "Salvaged mecha components. Used for repairs and upgrades.",
    "flavor": "One frame's trash is another frame's arm.",
    "group": "combat",
    "icon": "⊞",
    "color": "#8cf",
    "max": 30,
    "sortOrder": 210,
    "require": "g.garagem>0"
},
{
    "id": "data_chips",
    "name": "Data Chips",
    "desc": "Encrypted data modules. Used for research and schematics.",
    "flavor": "Information is the most expensive commodity in New Tokyo.",
    "group": "refined",
    "icon": "◇",
    "color": "#bf8",
    "max": 20,
    "sortOrder": 120,
    "require": "g.mesa_pesquisa>0"
},
{
    "id": "space",
    "name": "Space",
    "desc": "Available space in your scrapyard for structures.",
    "flavor": "Real estate in the junkyard.",
    "group": "base",
    "icon": "▣",
    "color": "#aaa",
    "val": 0,
    "max": 5,
    "sortOrder": 50,
    "hide": true
},
{
    "id": "supply",
    "name": "Supply",
    "desc": "Ammunition and consumables for combat. Replenished between missions.",
    "flavor": "You can never have enough bullets.",
    "group": "combat",
    "icon": "▸",
    "color": "#fa5",
    "val": 10,
    "max": 20,
    "sortOrder": 220,
    "require": "g.garagem>0"
}
```

**IMPORTANT:** `space` gets `hide: true` because it's a meta-resource tracked by furniture mods, not displayed in the resource bar. `glory` and `supply` are player-facing combat resources.

---

### [MODIFY] `data/mecha/sections.json`

The `sect_combat` entry already exists with `"require": "g.garagem>0"`. No changes needed. But verify the TerminalUI reads sections to show/hide the combat category tab. Currently `TerminalUI.vue` categories are derived from task groups, not sections. The combat tab needs to appear in the category list when `sect_combat` is unlocked.

**Fix needed in `TerminalUI.vue` `categories` computed:**

```js
categories() {
    const allTasks = Object.values(this.state.items).filter(i => i.type === 'task');
    const groups = new Set(allTasks.filter(t => !t.locked).map(t => t.group).filter(g => g !== 'pilot'));

    // Add combat if section is unlocked
    const combatSect = this.state.get('sect_combat');
    if (combatSect && !combatSect.locked) {
        groups.add('combat');
    }

    const list = Array.from(groups);
    list.unshift('pilot');
    return list;
}
```

---

### [MODIFY] `data/mecha/enemies.json`

Add `name` field to the frame wrapper for log display (currently enemies have `name` at top level but not inside their `parts` parent — add a frame-level name):

The existing enemy data is fine for Phase 1. No structural changes needed. The `CombatRunner` will deep-clone enemies for each combat so the originals stay pristine.

---

### Verification — Phase 1

After Phase 1 is complete, verify:

1. `Game.startMission('mission_scrap_drone')` initiates combat, `combatRunner.active === true`
2. The game tick calls `combatRunner.update(dt)` and turns resolve automatically
3. The combat log (`combatRunner.combatLog`) fills with attack/damage/miss entries
4. Victory awards `glory`, `creds`, `scrap` to `state.items`
5. Defeat still awards `failRewards` (Fail Forward)
6. `state.player.frame.parts` has damage persisting after combat
7. Save/load preserves mid-combat state
8. TechTree unlocks `mission_rogue_labor` after first drone victory (`g.mission_scrap_drone>=1`)

---

## PHASE 2: COMBAT UI

**Goal:** The player can see and interact with combat in the TerminalUI. Missions appear as cards, combat shows a live battle log with frame status.

### [NEW] `src/ui/components/CombatPanel.vue`

A new Vue component rendered inside `TerminalUI.vue` when `selectedCategory === 'combat'`.

**Structure:**

```
CombatPanel
├── Mission List (when not in combat)
│   ├── Available missions as hud-task-cards
│   └── Each shows: name, difficulty stars, enemy count, cost, rewards preview
├── Combat View (when combatRunner.active)
│   ├── Player Frame Status
│   │   ├── 4 part bars (Torso, L.Arm, R.Arm, Legs) with HP + integrity
│   │   ├── Heat bar (0-100)
│   │   └── Stress bar (0-cap)
│   ├── Enemy Frame Status (same layout, simplified)
│   ├── Turn counter + turn timer progress bar
│   ├── Combat log (scrolling, auto-scroll, last 20 entries)
│   └── Controls: [RETREAT] button, stance selector (pre-combat only)
└── Post-Combat Summary (when result !== null)
    ├── Victory/Defeat banner
    ├── Rewards breakdown
    ├── Damage report (parts damaged, integrity lost)
    └── [CONTINUE] button to dismiss
```

**Props:** `state` (GameState), `combatRunner` (CombatRunner ref from Game)

**Key computed properties:**

```js
computed: {
    missions() {
        return Object.values(this.state.items)
            .filter(i => i.type === 'mission' && !i.locked)
            .sort((a, b) => a.difficulty - b.difficulty);
    },
    playerFrame() {
        return this.state.player.frame;
    },
    currentEnemies() {
        return this.combatRunner.enemies;
    },
    isInCombat() {
        return this.combatRunner.active;
    },
    combatResult() {
        return this.combatRunner.result;
    }
}
```

**ASCII frame display (matches terminal aesthetic):**

```
PLAYER FRAME                    ENEMY: SCRAP DRONE
─────────────                   ──────────────────
TORSO  [|||......] 45/100 ×3   CORE   [||||||...] 22/30 ×1
L.ARM  [||||||...] 38/50  ×2   MANIP  [|||||||||] 15/15 ×1
R.ARM  [||||.....] 20/50  ×2   SAW    [|||......] 8/20  ×1
LEGS   [|||||||||] 58/60  ×2   THRST  [||||||...] 14/20 ×1

HEAT [░░░░░░░░░░] 12/100       TURN 5/15
STRESS [░░........] 8/40        ▶ BALANCED STANCE
```

---

### [MODIFY] `src/ui/TerminalUI.vue`

Add the CombatPanel component:

1. Import and register `CombatPanel`
2. In the template, add a new `<section>` block for combat:

```html
<!-- COMBAT AREA -->
<section v-if="selectedCategory === 'combat'">
    <CombatPanel
        :state="state"
        :combatRunner="combatRunner"
        @start-mission="startMission"
        @retreat="retreat"
    />
</section>
```

3. Add computed property for `combatRunner`:

```js
combatRunner() {
    return Game.combatRunner;
}
```

4. Add methods:

```js
startMission(missionId) {
    Game.startMission(missionId);
},
retreat() {
    Game.combatRunner.retreat(); // ends combat as defeat
}
```

5. **Update the categories computed** to include 'combat' when sect_combat is unlocked (see Phase 1 section above).

---

### [MODIFY] `css/mecha_terminal.css`

Add combat-specific styles matching the existing terminal aesthetic:

```css
/* ── COMBAT PANEL ────────────────────────── */
.combat-frame-display { ... }
.combat-part-row { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
.part-label { width: 50px; font-size: 11px; color: var(--text-dim); }
.part-bar { flex: 1; font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px; }
.part-bar--critical { color: var(--cta); animation: blink 0.5s infinite; }
.part-bar--destroyed { color: var(--text-faint); text-decoration: line-through; }

.combat-log { max-height: 200px; overflow-y: auto; font-size: 11px; border: 1px solid var(--border-dim); padding: 8px; }
.combat-log-entry { margin-bottom: 2px; }
.combat-log-entry--hit { color: var(--primary); }
.combat-log-entry--miss { color: var(--text-faint); }
.combat-log-entry--critical { color: var(--cta); font-weight: bold; }
.combat-log-entry--system { color: var(--secondary); }

.heat-bar { color: #f80; }
.heat-bar--hot { color: #f44; animation: pulse 1s infinite alternate; }
.stress-bar { color: #f5f; }

.mission-card { cursor: pointer; border: 1px solid var(--border-dim); padding: 12px; margin-bottom: 8px; }
.mission-card:hover { border-color: var(--secondary); background: rgba(0,255,65,0.02); }
.mission-card--locked { opacity: 0.4; pointer-events: none; }
.difficulty-stars { color: #f5c542; font-size: 10px; }
```

---

### Verification — Phase 2

1. Navigate to COMBAT tab (only visible when `g.garagem>0`)
2. See available missions listed as cards with name, difficulty, cost
3. Click a mission → combat starts, view switches to live battle display
4. See frame parts updating in real-time as turns resolve
5. See combat log scrolling with hit/miss/damage messages
6. After combat ends, see reward summary
7. Click CONTINUE → return to mission list

---

## PHASE 3: HEAT & STRESS SYSTEMS

**Goal:** Implement the dual reverse-resource system that creates the idle cycle tension: combat → stress accumulates → must rest → while resting, produce resources → combat again.

### [MODIFY] `src/modules/combatRunner.js`

Add heat and stress processing to `resolveTurn()`:

**Heat (§7.1):**

```js
// In maintenance phase of each turn:
processHeat(playerFrame) {
    // Base dissipation: ENR / 20 per turn
    const dissipation = (playerFrame.attributes.enr / 20) * (1 + STANCES[this.stance].heatDissipMod);
    playerFrame.heat = Math.max(0, playerFrame.heat - dissipation);

    // Heat penalties
    if (playerFrame.heat >= 100) {
        // SHUTDOWN — combat ends as defeat
        this.combatLog.push({ text: 'CRITICAL: Frame overheated! Emergency shutdown!', type: 'critical' });
        this.endCombat('defeat');
    } else if (playerFrame.heat >= 76) {
        // -15% accuracy applied in calculateTargetPercent
        // +50% energy cost (if energy system is in use)
    }
}

// Each attack generates heat:
// Fight (melee): +3 heat
// Short (guns): +5 heat
// Long (artillery): +8 heat
// Special abilities: +10-15 heat (defined per ability)
const BASE_HEAT_GEN = { fight: 3, short: 5, long: 8 };
```

**Stress (§7.2):**

```js
processStress(playerFrame) {
    // Base stress per turn: +0.5
    playerFrame.stress += 0.5;

    // Stress from being hit when critical:
    // Applied in applyDamage when integrity <= 1

    // Stress cap based on GRT
    const grt = this.state.items['grit']?.val || 1;
    const stressCap = 20 + (grt * 2);

    if (playerFrame.stress >= stressCap) {
        // COLLAPSE — combat ends as defeat
        this.combatLog.push({ text: 'PILOT COLLAPSE: Stress overload! Ejecting!', type: 'critical' });
        this.endCombat('defeat');
    } else if (playerFrame.stress >= stressCap * 0.76) {
        // PANIC condition: -50% ATK, may try to flee
    }
}
```

**Between-mission recovery:** This happens in the main game loop (`game.js` `_doResources`), not in combatRunner:

```js
// In game.js _doResources or a new _doRecovery method:
// Only when NOT in combat:
if (!this.combatRunner.active) {
    const frame = this.state.player.frame;
    const grt = this.state.items['grit']?.val || 1;

    // Stress recovery: GRT × 0.1 per second
    if (frame.stress > 0) {
        frame.stress = Math.max(0, frame.stress - grt * 0.1 * dt);
    }

    // Heat always resets to 0 between missions (§14.3)
    frame.heat = 0;

    // Note: Integrity does NOT recover passively — requires repair action/glory
}
```

---

### [NEW] Repair system

Add a repair task to `data/mecha/tasks.json`:

```json
{
    "id": "repair_frame",
    "name": "Repair Frame",
    "verb": "repairing",
    "desc": "Patch up your mecha's damaged parts using salvaged components.",
    "flavor": "Duct tape and determination.",
    "group": "scrapyard",
    "tags": "t_scrapyard",
    "require": "g.garagem>0",
    "cost": { "parts": 3, "scrap": 10 },
    "length": 15,
    "special": "repair_frame"
}
```

In `Runner.completeTask()`, add a special handler:

```js
if (task.special === 'repair_frame') {
    const frame = this.state.player.frame;
    for (const part of Object.values(frame.parts)) {
        if (part.status !== 'destroyed') {
            part.hp = part.maxHp; // Restore HP within current integrity level
        }
    }
    Log.add('✓ Frame repairs complete. All operational parts restored.', 'success');
}
```

Add a Glory-based full restore option (§12.1): in `game.js`:

```js
repairAllWithGlory() {
    const glory = this.state.items['glory'];
    if (!glory || glory.val < 1) {
        Log.add('✗ Need 1 Glory to perform full restoration.', 'error');
        return;
    }
    glory.val -= 1;
    const frame = this.state.player.frame;
    for (const part of Object.values(frame.parts)) {
        part.hp = part.maxHp;
        part.status = 'operational';
        // Note: integrity is NOT restored by this — only HP within remaining integrity
    }
    Log.add('★ Glory spent: Full frame restoration complete.', 'upgrade');
}
```

---

### Verification — Phase 3

1. During combat, heat increases each turn and dissipates
2. At heat >= 100, frame shuts down (defeat)
3. Stress increases each turn + on critical hits
4. At stress cap, pilot collapses (defeat)
5. After combat, stress recovers passively over time (visible in pilot profile)
6. Heat resets to 0 immediately after combat ends
7. Integrity damage persists until repaired
8. "Repair Frame" task restores HP but not destroyed parts
9. Glory repair restores HP on all non-destroyed parts

---

## PHASE 4: GLORY ECONOMY + COMBAT PROGRESSION

**Goal:** Glory functions as dual XP/currency. Combat skill levels up. Positions (classes) exist with ranks. This is what the Antigravity plan was trying to do, but now with the foundation in place.

### [MODIFY] `data/mecha/resources.json`

`glory` was already added in Phase 1. No changes needed.

### [MODIFY] `src/modules/combatRunner.js` — Reward Calculation

In `endCombat()`:

```js
endCombat(result) {
    this.active = false;
    this.result = result;

    const mission = this.mission;
    const rewards = {};

    if (result === 'victory') {
        // Base rewards
        Object.assign(rewards, mission.rewards || {});

        // First clear bonus
        if (mission.completed === 0 && mission.firstClearBonus) {
            for (const [k, v] of Object.entries(mission.firstClearBonus)) {
                rewards[k] = (rewards[k] || 0) + v;
            }
            Log.add('✦ FIRST CLEAR BONUS!', 'loot');
        }

        // Tactical bonus: no parts destroyed + stress < 25% (§12.1)
        const frame = this.state.player.frame;
        const grt = this.state.items['grit']?.val || 1;
        const stressCap = 20 + (grt * 2);
        const allPartsOk = Object.values(frame.parts).every(p => p.status === 'operational');
        if (allPartsOk && frame.stress < stressCap * 0.25) {
            rewards.glory = (rewards.glory || 0) + 2;
            Log.add('✦ TACTICAL BONUS: +2 Glory (clean victory)', 'loot');
        }

        // Per-enemy glory: +2 per frame destroyed, +1 per drone (§12.1)
        const enemiesDestroyed = this.enemies.filter(e => e.parts.torso.status === 'destroyed').length;
        rewards.glory = (rewards.glory || 0) + (enemiesDestroyed * 2);

        // Roll loot per enemy (§12.2)
        this._rollLoot(mission, rewards);

        mission.completed = (mission.completed || 0) + 1;
        Log.add(`✓ Mission Complete: ${mission.name}`, 'success');

    } else {
        // Fail Forward (§14.4)
        Object.assign(rewards, mission.failRewards || {});
        Log.add(`✗ Mission Failed: ${mission.name}. Partial salvage recovered.`, 'error');
    }

    // Apply all rewards
    this.state.award(rewards);

    // Combat skill XP
    const combatSkill = this.state.items['skill_combat'];
    if (combatSkill && !combatSkill.locked) {
        const xpGain = result === 'victory' ? 0.5 : 0.15;
        combatSkill.val = Math.min(combatSkill.val + xpGain, combatSkill.max);
    }

    Events.emit('COMBAT_END', { result, rewards, mission: mission.id });
}
```

---

### [NEW] `data/mecha/maneuvers.json`

Maneuvers are conditional abilities (§9). They are items registered in the TechTree, unlocked by skill_combat level and glory spent.

```json
[
    {
        "id": "mnvr_mech_brawl",
        "name": "Mech Brawl",
        "desc": "Counter-attack when an enemy engages in melee range.",
        "type": "maneuver",
        "maneuverType": "reaction",
        "trigger": "on_hit_received",
        "position": "fighter",
        "rank": 1,
        "locked": false,
        "owned": 0,
        "effect": {
            "counterAttack": true,
            "damageMod": 0.5,
            "heatGen": 3
        },
        "flavor": "You hit me, I hit back. Simple math."
    },
    {
        "id": "mnvr_berserker",
        "name": "Berserker Protocol",
        "desc": "When Stress > 60%: +20% ATK, -15% DEF.",
        "type": "maneuver",
        "maneuverType": "instinct",
        "trigger": "turn_start",
        "triggerCondition": "stress>60%",
        "position": "fighter",
        "rank": 3,
        "locked": true,
        "owned": 0,
        "require": "g.skill_combat>=3&&g.glory>=9",
        "cost": { "glory": 5 },
        "effect": {
            "atkMod": 0.20,
            "defMod": -0.15
        },
        "flavor": "Pain is just fuel for the machine."
    },
    {
        "id": "mnvr_pile_bunker",
        "name": "Pile Bunker Strike",
        "desc": "Single devastating melee attack. +100% damage, +15 Heat.",
        "type": "maneuver",
        "maneuverType": "maneuver",
        "trigger": "action_replace",
        "position": "fighter",
        "rank": 5,
        "locked": true,
        "owned": 0,
        "require": "g.skill_combat>=5&&g.glory>=26",
        "cost": { "glory": 10 },
        "effect": {
            "damageMod": 1.0,
            "heatGen": 15,
            "replaceAttack": true
        },
        "flavor": "One shot. One kill. One very hot cockpit."
    },
    {
        "id": "mnvr_evasive",
        "name": "Evasive Maneuver",
        "desc": "35% chance to completely dodge an incoming attack.",
        "type": "maneuver",
        "maneuverType": "reaction",
        "trigger": "on_hit_received",
        "position": "scout",
        "rank": 1,
        "locked": true,
        "owned": 0,
        "require": "g.garagem>0",
        "cost": { "glory": 3 },
        "effect": {
            "dodgeChance": 0.35
        },
        "flavor": "Can't hit what you can't catch."
    },
    {
        "id": "mnvr_lock_and_load",
        "name": "Lock & Load",
        "desc": "If the frame didn't move last turn: +25% accuracy on next attack.",
        "type": "maneuver",
        "maneuverType": "instinct",
        "trigger": "turn_start",
        "triggerCondition": "no_move_last_turn",
        "position": "gunner",
        "rank": 1,
        "locked": true,
        "owned": 0,
        "require": "g.garagem>0",
        "cost": { "glory": 3 },
        "effect": {
            "accuracyMod": 0.25
        },
        "flavor": "Patience. Breath. Squeeze."
    },
    {
        "id": "mnvr_mark_target",
        "name": "Mark Target",
        "desc": "Applies 2 TARGET LOCK + 1 BREACH tokens to an enemy.",
        "type": "maneuver",
        "maneuverType": "maneuver",
        "trigger": "action_replace",
        "position": "scout",
        "rank": 3,
        "locked": true,
        "owned": 0,
        "require": "g.skill_combat>=3&&g.glory>=9",
        "cost": { "glory": 5 },
        "effect": {
            "applyTokens": { "TARGET_LOCK": 2, "BREACH": 1 },
            "replaceAttack": true
        },
        "flavor": "Painting the target. Everyone else does the rest."
    }
]
```

**Data contract for maneuvers:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique ID, prefix `mnvr_` |
| `type` | string | yes | Always `"maneuver"` |
| `maneuverType` | string | yes | `"reaction"` / `"instinct"` / `"maneuver"` (§9.2) |
| `trigger` | string | yes | When it activates: `"on_hit_received"` / `"turn_start"` / `"action_replace"` |
| `triggerCondition` | string | no | Extra condition expression (e.g. `"stress>60%"`) |
| `position` | string | yes | `"fighter"` / `"leader"` / `"gunner"` / `"scout"` (§10.1) |
| `rank` | number | yes | Minimum rank needed in that position |
| `require` | string | no | TechTree condition |
| `cost` | object | no | Purchase cost in glory to unlock |
| `owned` | number | runtime | 0 = not bought, 1 = owned |
| `effect` | object | yes | Mechanical effect (parsed by CombatRunner) |

---

### [MODIFY] `src/game.js` — Load Maneuvers

Add the data loader:

```js
_loadManeuvers(data) {
    for (const item of data) {
        item.owned = item.owned ?? 0;
        item.locked = item.locked ?? (item.require ? true : false);
        item.type = item.type || 'maneuver';

        const rItem = reactive(item);
        this.state.register(rItem);
        this.techTree.register(rItem);
    }
}
```

Call in `init()`:

```js
this._loadManeuvers(rawData.maneuvers || []);
```

Add `"maneuvers"` to `data/mecha/modules.json` → `core[]` array.

Add a purchase method:

```js
buyManeuver(id) {
    const mnvr = this.state.items[id];
    if (!mnvr || mnvr.locked || mnvr.owned > 0) return false;
    if (mnvr.cost && !this.state.payCost(mnvr.cost)) {
        Log.add(`✗ Can't afford ${mnvr.name}.`, 'error');
        return false;
    }
    mnvr.owned = 1;
    Log.add(`★ Maneuver Unlocked: ${mnvr.name}`, 'upgrade');
    this.techTree.check();
    return true;
}
```

---

### [MODIFY] `src/modules/combatRunner.js` — Maneuver Execution

Add an `equippedManeuvers` array (max 3, §9.4) and process them during turns:

```js
// In constructor:
this.equippedManeuvers = []; // Array of maneuver item IDs (max 3)

// Before combat, player selects up to 3 owned maneuvers
setManeuvers(ids) {
    this.equippedManeuvers = ids.slice(0, 3);
}

// In resolveTurn(), during action phase:
processManeuvers(phase, context) {
    for (const id of this.equippedManeuvers) {
        const mnvr = this.state.items[id];
        if (!mnvr || mnvr.owned === 0) continue;

        if (phase === 'turn_start' && mnvr.trigger === 'turn_start') {
            this._executeInstinct(mnvr, context);
        }
        if (phase === 'on_hit_received' && mnvr.trigger === 'on_hit_received') {
            this._executeReaction(mnvr, context);
        }
        if (phase === 'action' && mnvr.trigger === 'action_replace') {
            // Replace normal attack with maneuver
            return this._executeManeuver(mnvr, context);
        }
    }
    return false; // No maneuver replaced the action
}
```

---

### [MODIFY] `src/ui/components/CombatPanel.vue`

Add maneuver management UI:

1. **Pre-combat:** Show owned maneuvers in a "LOADOUT" section. Allow selecting up to 3. Show locked maneuvers with their unlock requirements and a "Purchase" button if conditions are met.

2. **In combat:** Show active maneuver triggers in the log (e.g., "⚡ MECH BRAWL activated! Counter-attack!")

3. **Post-combat:** Show glory earned, with a link to the maneuver shop.

---

### [MODIFY] `data/mecha/modules.json` — Final

```json
{
    "core": [
        "tags",
        "resources",
        "upgrades",
        "tasks",
        "homes",
        "furniture",
        "skills",
        "player",
        "events",
        "sections",
        "equipslots",
        "enemies",
        "missions",
        "maneuvers"
    ],
    "modules": []
}
```

---

### Verification — Phase 4

1. Glory appears as a resource after garage is built
2. Winning missions awards glory (visible in resource bar)
3. `skill_combat` increases after each mission
4. Maneuvers unlock in TechTree when `require` conditions are met (skill + glory thresholds)
5. Player can buy maneuvers with glory cost
6. Player can equip up to 3 maneuvers before combat
7. Maneuvers activate during combat at the correct triggers
8. Combat log shows maneuver activations

---

## PHASE 5: DEBUFF TOKENS (Optional — Sprint 2B territory)

**Goal:** Add the 6 token types from §8 for deeper tactical combat. This is lower priority than Phases 1-4.

### [NEW] Token system in CombatRunner

```js
// Each combatant (player frame + each enemy) gets a tokens array:
// tokens: [{ type: 'BREACH', stacks: 2 }, { type: 'BURN', stacks: 1 }]
// Max 6 tokens per unit (§8)

applyToken(frame, tokenType, stacks = 1) {
    if (!frame.tokens) frame.tokens = [];
    const existing = frame.tokens.find(t => t.type === tokenType);
    if (existing) {
        existing.stacks += stacks;
    } else {
        if (frame.tokens.length >= 6) return; // Max reached
        frame.tokens.push({ type: tokenType, stacks });
    }
}

processTokens(frame) {
    // During maintenance phase:
    for (const token of frame.tokens) {
        switch (token.type) {
            case 'BURN': // d6 per token; 4+ = 1 damage, removes tokens <= 3
                // ...
                break;
            case 'ERROR': // d6; 4+ = lose action, +1 stress, remove 1
                // ...
                break;
            // etc.
        }
    }
    // Remove expired tokens
    frame.tokens = frame.tokens.filter(t => t.stacks > 0);
}
```

Token effects on attack resolution:
- `BREACH` on defender: +1 damage per stack
- `TARGET_LOCK` on defender: +1 bonus d6 per stack
- `SUPPRESS` on attacker: -1 damage per stack

---

## IMPLEMENTATION ORDER SUMMARY

| Step | Phase | Files | Depends On |
|------|-------|-------|------------|
| 1 | P1 | Refactor `combat.js` → utility functions | Nothing |
| 2 | P1 | Create `combatRunner.js` | Step 1 |
| 3 | P1 | Add resources to `resources.json` (glory, parts, data_chips, space, supply) | Nothing |
| 4 | P1 | Create `missions.json` | Nothing |
| 5 | P1 | Update `modules.json` core array | Steps 3, 4 |
| 6 | P1 | Modify `game.js` (load missions, integrate combatRunner, startMission method) | Steps 2, 4, 5 |
| 7 | P1 | **TEST: combat runs to completion via console** | Steps 1-6 |
| 8 | P2 | Create `CombatPanel.vue` | Step 7 |
| 9 | P2 | Modify `TerminalUI.vue` (add combat category + CombatPanel) | Step 8 |
| 10 | P2 | Add combat CSS to `mecha_terminal.css` | Step 8 |
| 11 | P2 | **TEST: combat is playable via UI** | Steps 8-10 |
| 12 | P3 | Add heat/stress processing to `combatRunner.js` | Step 7 |
| 13 | P3 | Add between-mission recovery to `game.js` | Step 12 |
| 14 | P3 | Add repair task to `tasks.json` + handler in `runner.js` | Step 7 |
| 15 | P3 | Add glory repair method to `game.js` | Step 3 |
| 16 | P3 | **TEST: heat/stress affect combat, recovery works** | Steps 12-15 |
| 17 | P4 | Create `maneuvers.json` | Step 3 (glory exists) |
| 18 | P4 | Add `_loadManeuvers` + `buyManeuver` to `game.js` | Step 17 |
| 19 | P4 | Add maneuver execution to `combatRunner.js` | Steps 17, 18 |
| 20 | P4 | Update `CombatPanel.vue` with loadout + maneuver shop | Steps 18, 19 |
| 21 | P4 | **TEST: maneuvers unlock, purchase, equip, activate** | Steps 17-20 |
| 22 | P5 | Add token system to `combatRunner.js` (optional) | Step 7 |

---

## PATTERNS TO FOLLOW (for the AI)

**When creating a new data type (missions, maneuvers):**
1. Create the JSON file in `data/mecha/`
2. Add the filename to `modules.json` → `core[]`
3. Add a `_load{Type}(data)` method in `game.js` following the exact pattern of `_loadTasks`
4. Call it in `game.js` `init()` after other loads
5. Use `reactive()` to wrap each item
6. Call `this.state.register(rItem)` and `this.techTree.register(rItem)`

**When adding a require-gated item:**
- Set `"locked": true` in JSON (or omit; the loader defaults `locked` to true when `require` is present)
- Add a `"require"` string referencing the `g` namespace
- The TechTree automatically watches and unlocks it

**When adding a new resource:**
- Add to `resources.json` with `id`, `name`, `max`, `group`, `sortOrder`
- It's automatically available via `g.{id}` in require expressions
- Mods can target it (e.g., `"glory.max": 100`)

**When modifying the game loop:**
- All per-tick logic goes in `game.js` `tick()` or in a module's `update(dt)` called from `tick()`
- `dt` is always `TICK_MS / 1000` (0.2 seconds)
- Never use `setInterval` inside modules — use the game tick

**When adding UI to TerminalUI:**
- Follow existing component patterns: `hud-task-card`, `hud-section-title`, `hud-ascii-bar`
- Use `@mouseover="itemOver($event, item)"` + `@mouseleave="itemOut"` for popups
- Use `Game.{method}()` to call game actions
- ASCII bar render: `renderBar(val, max, width)` already exists
