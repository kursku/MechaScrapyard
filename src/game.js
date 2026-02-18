import { reactive } from 'vue';
import { clamp } from '@/util/format';
import GameState from '@/gameState';
import TechTree from '@/techTree';
import Runner from 'modules/runner';
import * as CombatUtils from 'modules/combat';
import CombatRunner from 'modules/combatRunner';
import Timer from '@/timer';
import Log from '@/log';
import Persist from 'modules/persist';
import Events from '@/events';

/**
 * TICK_MS — Game loop interval in milliseconds.
 * ~5 FPS. Matches the idle game paradigm from Arcanum (120ms → 200ms).
 */
const TICK_MS = 200;

/**
 * Game — Main game object.
 * Manages the game loop, state, systems, and data initialization.
 */
const Game = {

    /** @type {GameState} */
    state: null,

    /** @type {TechTree} */
    techTree: null,

    /** @type {Runner} */
    runner: null,

    /** @type {CombatRunner} */
    combatRunner: null,

    /** @type {Timer} */
    timer: null,

    /** @type {number|null} */
    _interval: null,

    /** @type {number|null} */
    _autosaveInterval: null,

    loaded: false,
    paused: false,

    /**
     * Initialize game with loaded data.
     * @param {Object} rawData - Data from DataLoader
     * @param {Object|null} saveData - Saved game data (or null for new game)
     */
    init(rawData, saveData = null) {
        this.state = new GameState();
        this.techTree = new TechTree(this.state);
        this.runner = new Runner(this.state);
        this.combatRunner = new CombatRunner(this.state);
        this.timer = new Timer();

        // Register all data items into state
        this._loadResources(rawData.resources || []);
        this._loadUpgrades(rawData.upgrades || []);
        this._loadTasks(rawData.tasks || []);
        this._loadPlayer(rawData.player || []);
        this._loadEvents(rawData.events || []);
        this._loadHomes(rawData.homes || []);
        this._loadFurniture(rawData.furniture || []);
        this._loadSkills(rawData.skills || []);
        this._loadSections(rawData.sections || []);
        this._loadEnemies(rawData.enemies || []);
        this._loadMissions(rawData.missions || []);
        this._loadManeuvers(rawData.maneuvers || []);
        this._setCombatConfig(rawData.combat_config || null);

        // Events
        Events.on('COMBAT_END', (data) => this._onCombatEnd(data));

        // Restore save
        if (saveData) {
            this.state.fromJSON(saveData.state);
            this.runner.fromJSON(saveData.runner, this.state.items);
            if (saveData.combatRunner) this.combatRunner.fromJSON(saveData.combatRunner);
            this.timer.fromJSON(saveData.timer);
            Log.fromJSON(saveData.log);
        } else {
            // New game
            Log.add('SYS> Boot sequence... OK', 'system');
            Log.add('SYS> Location: Ferro-Velho District, New Tokyo outskirts', 'system');
            Log.add('Welcome to the Scrapyard, kid.', 'story');
            Log.add('Grandpa: "Start by collecting some scrap. Use the Scavenge action."', 'story');
            Log.add('TIP: Hover over anything for details.', 'tip');
        }

        // Initial unlock check
        this.techTree.recheck(Object.values(this.state.items));

        this.loaded = true;
        console.log('Game initialized.', Object.keys(this.state.items).length, 'items loaded.');
    },

    /**
     * Start the game loop.
     */
    start() {
        if (this._interval) return;

        this._interval = setInterval(() => {
            if (!this.paused) this.tick();
        }, TICK_MS);

        // Autosave
        this._autosaveInterval = setInterval(() => {
            if (this.loaded) Persist.save(this);
        }, Persist.AUTOSAVE_INTERVAL);
    },

    /**
     * Stop the game loop.
     */
    stop() {
        if (this._interval) clearInterval(this._interval);
        if (this._autosaveInterval) clearInterval(this._autosaveInterval);
        this._interval = null;
        this._autosaveInterval = null;
    },

    /**
     * One game tick.
     */
    tick() {
        const dt = TICK_MS / 1000;

        // 1. Update resource rates
        this._doResources(dt);

        // 2. Update runner (active task + recipe)
        const result = this.runner.update(dt);

        // 3. Update combat runner
        if (this.combatRunner.active) {
            this.combatRunner.update(dt);
        }

        // 3. Handle loot drops
        if (result.lootDrops.length > 0) {
            for (const bpId of result.lootDrops) {
                const bp = this.state.items[bpId];
                if (bp && bp.owned === 0) {
                    bp.owned = 1;
                    if (bp.log) Log.add(`✦ RARE FIND: ${bp.name}!`, 'loot');
                    if (bp.log?.desc) Log.add(bp.log.desc, 'story');
                }
            }
        }
        // 4. Handle Special Triggers
        if (result.onComplete) {
            if (result.onComplete.trigger_combat) {
                const mid = result.onComplete.trigger_combat;
                const mission = this.state.get(mid);
                if (mission) {
                    if (mission.locked) {
                        mission.locked = false;
                        Log.add(`[SYSTEM] Mission Unlocked: ${mission.name}`, 'system');
                    }
                    this.startMission(mid);
                }
            }
        }

        // 4. Check unlocks & Home Transitions
        if (result.taskCompleted) {
            this._handleTaskSpecialEffects(this.runner.activeTask);
            this.techTree.check();
            this._checkHomeTransitions();
        } else if (result.recipeCompleted || result.lootDrops.length > 0) {
            this.techTree.check();
            this._checkHomeTransitions();
        }
    },

    /**
     * Apply resource rates.
     */
    _doResources(dt) {
        const focus = this.state.items['focus']?.val || 0;
        const multiplier = 1 + (focus * 0.05);

        for (const item of Object.values(this.state.items)) {
            if (item.locked) continue;
            if (item.rate && item.rate !== 0 && item.max !== undefined) {
                // Apply multiplier to production rates (positive), but not consumption (negative) ?
                // AI_RULES says "governs idle loop efficiency". Let's apply it to production.
                const effectiveRate = item.rate > 0 ? item.rate * multiplier : item.rate;
                item.val = clamp((item.val || 0) + effectiveRate * dt, 0, item.max);
            }
        }
    },

    /**
     * Check for automated home/phase transitions.
     */
    _checkHomeTransitions() {
        const homes = Object.values(this.state.items).filter(i => i.type === 'home');
        for (const home of homes) {
            // If and only if a phase is NOT locked and NOT owned, and it's the next in line
            if (!home.locked && home.owned === 0) {
                // Activate this phase
                home.owned = 1;
                this.state.applyMod(home.mod);
                Log.add(`✦ SECTOR UPDATED: ${home.name}`, 'story');
                if (home.flavor) Log.add(home.flavor, 'story');

                // Locked phases mentioned in "lock" field should be permanently disabled/removed
                if (home.lock) {
                    for (const oldId of home.lock) {
                        const oldHome = this.state.items[oldId];
                        if (oldHome) {
                            oldHome.locked = true;
                            oldHome.owned = 0; // Deactivate
                            // Note: We'd need to REVERSE the mods of the old home if Arcanum worked that way.
                            // For now, let's assume phases are additive or mods are handled carefully in JSON.
                        }
                    }
                }
            }
        }
    },

    /**
     * Unified entry point for player actions.
     */
    tryItem(it) {
        if (!it || it.locked) return;

        if (it.type === 'task') {
            if (it.group === 'refinery') {
                this.runner.startRecipe(it);
            } else {
                if (this.runner.activeTask === it) this.runner.stopTask();
                else this.runner.startTask(it);
            }
        } else if (it.type === 'upgrade' || it.type === 'furniture') {
            this.buyUpgrade(it.id);
        }
    },

    /**
     * Buy an upgrade or furniture.
     */
    buyUpgrade(id) {
        const upg = this.state.items[id];
        if (!upg || upg.locked || (upg.owned || 0) >= (upg.max || 1)) return false;

        // Space check
        if (upg.mod && upg.mod.space !== undefined) {
            const space = this.state.items['space'];
            if (space && space.val + upg.mod.space > space.max) {
                Log.add(`✗ Not enough Space in current sector.`, 'error');
                return false;
            }
        }

        // Calculate scaled cost
        const costs = {};
        const scale = upg.costScale || 1;
        for (const [k, v] of Object.entries(upg.cost || {})) {
            costs[k] = Math.floor(v * Math.pow(scale, upg.owned || 0));
        }

        if (!this.state.payCost(costs)) {
            Log.add(`✗ Can't afford ${upg.name}.`, 'error');
            return false;
        }

        upg.owned = (upg.owned || 0) + 1;

        // Apply mods
        this.state.applyMod(upg.mod);

        Log.add(`★ ${upg.type === 'furniture' ? 'Built' : 'Upgrade'}: ${upg.name}${(upg.max || 1) > 1 ? ` (${upg.owned}/${upg.max})` : ''}`, 'upgrade');
        if (upg.log?.desc) Log.add(upg.log.desc, 'story');

        // Check unlocks
        this.techTree.check();

        return true;
    },

    /**
     * Serialize game for saving.
     */
    serialize() {
        return {
            state: this.state.toJSON(),
            runner: this.runner.toJSON(),
            combatRunner: this.combatRunner.toJSON(),
            timer: this.timer.toJSON(),
            log: Log.toJSON(),
            version: __VERSION
        };
    },

    /**
     * Start a combat mission.
     * @param {string} missionId - ID from missions.json
     */
    startMission(missionId) {
        const mission = this.state.get(missionId);
        if (!mission || mission.locked) return;

        // Check energy cost
        if (mission.cost && !this.state.payCost(mission.cost)) {
            Log.add('✗ Insufficient resources for mission.', 'error');
            return;
        }

        // Clone enemy templates
        const enemies = (mission.enemies || []).map(eid => {
            const template = this.state.get(eid);
            return template ? JSON.parse(JSON.stringify(template)) : null;
        }).filter(Boolean);

        if (enemies.length === 0) {
            // Fallback for missions referencing IDs not in enemies.json
            const allEnemies = this.state.getByGroup('enemy');
            if (allEnemies.length > 0) {
                enemies.push(JSON.parse(JSON.stringify(allEnemies[0])));
            }
        }

        this.combatRunner.startMission(mission, enemies);
    },

    /**
     * Quick repair using glory.
     */
    quickRepairGlory() {
        if (!this.state.payCost({ 'glory': 5 })) {
            Log.add('✗ Insufficient Glory for emergency repairs.', 'error');
            return;
        }

        const parts = this.state.player.frame.parts;
        Object.values(parts).forEach(p => {
            if (p.status !== 'destroyed') {
                p.hp = p.maxHp;
                Log.add(`✦ ${p.name} restored to full HP via Glory.`, 'system');
            }
        });
    },

    _onCombatEnd({ result, mission }) {
        // Recovery (§3.2)
        const frame = this.state.player.frame;
        frame.heat = 0;

        // Dissipate half stress
        frame.stress = (frame.stress || 0) * 0.5;

        Log.add(`[RECOVERY] Heat normalized. Stress reduced to ${Math.floor(frame.stress)}.`, 'system');
    },

    _handleTaskSpecialEffects(task) {
        if (!task) return;

        if (task.id === 'repair_frame') {
            const parts = this.state.player.frame.parts;
            Object.values(parts).forEach(p => {
                if (p.status === 'destroyed') {
                    p.status = 'operational';
                    p.integrity = 1;
                    p.hp = p.maxHp;
                    Log.add(`🛠️ ${p.name} RESTORED!`, 'success');
                } else {
                    p.integrity = Math.min(p.integrity + 1, 3); // Max integrity 3 for now
                    p.hp = p.maxHp;
                    Log.add(`🛠️ ${p.name} structural integrity reinforced.`, 'success');
                }
            });
        }
    },

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
    },

    equipManeuvers(ids) {
        this.combatRunner.setManeuvers(ids);
    },
    // ── Data loaders ─────────────────────────────────

    _loadResources(data) {
        for (const item of data) {
            item.val = item.val ?? 0;
            item.max = item.max ?? 0;
            item.rate = item.rate ?? 0;
            item.locked = item.locked ?? (item.require ? true : false);
            item.type = item.type || 'resource';

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _loadUpgrades(data) {
        for (const item of data) {
            item.owned = item.owned ?? 0;
            item.max = item.max ?? 1;
            item.locked = item.locked ?? (item.require ? true : false);
            item.type = item.type || 'upgrade';

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _loadTasks(data) {
        for (const item of data) {
            item.locked = item.locked ?? (item.require ? true : false);
            item.type = item.type || 'task';

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _loadPlayer(data) {
        for (const item of data) {
            item.val = item.val ?? 0;
            item.locked = item.locked ?? false;
            item.type = item.type || 'player_stat';

            const rItem = reactive(item);
            this.state.register(rItem);
        }
    },

    _loadEvents(data) {
        for (const item of data) {
            item.triggered = item.triggered ?? false;
            item.locked = item.locked ?? (item.require ? true : false);
            item.type = item.type || 'event';

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _loadHomes(data) {
        for (const item of data) {
            item.owned = item.owned ?? 0;
            item.locked = item.locked ?? (item.require ? true : false);
            item.type = item.type || 'home';

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _loadFurniture(data) {
        for (const item of data) {
            item.owned = item.owned ?? 0;
            item.max = item.max ?? 1;
            item.locked = item.locked ?? (item.require ? true : false);
            item.type = item.type || 'furniture';

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _loadSkills(data) {
        for (const item of data) {
            item.val = item.val ?? 0;
            item.max = item.max ?? 20;
            item.locked = item.locked ?? (item.require ? true : false);
            item.type = item.type || 'skill';

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _loadSections(data) {
        for (const item of data) {
            item.locked = item.locked ?? (item.require ? true : false);
            item.type = item.type || 'section';

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _loadMissions(data) {
        for (const item of data) {
            item.locked = item.locked ?? (item.require ? true : false);
            item.completed = item.completed ?? 0;
            item.type = item.type || 'mission';
            item.group = 'combat';

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _loadEnemies(data) {
        for (const item of data) {
            item.type = 'enemy';
            item.group = 'enemy';
            item.name = item.name || 'Unknown Unit';
            const rItem = reactive(item);
            this.state.register(rItem);
        }
    },

    _loadManeuvers(data) {
        for (const item of data) {
            item.type = 'maneuver';
            item.group = 'maneuver';
            const rItem = reactive(item);
            this.state.register(rItem);
        }
    },

    _setCombatConfig(data) {
        if (!data) return;
        const rItem = reactive(data);
        this.state.register(rItem);
    }
};

export default Game;
