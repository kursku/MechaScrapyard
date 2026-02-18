import { reactive } from 'vue';
import { clamp } from '@/util/format';
import GameState from '@/gameState';
import TechTree from '@/techTree';
import Runner from 'modules/runner';
import CombatEngine from 'modules/combat';
import Timer from '@/timer';
import Log from '@/log';
import Persist from 'modules/persist';

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

    /** @type {CombatEngine} */
    combat: null,

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
        this.combat = new CombatEngine(this.state);
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

        // Restore save
        if (saveData) {
            this.state.fromJSON(saveData.state);
            this.runner.fromJSON(saveData.runner, this.state.items);
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

        // 4. Check unlocks & Home Transitions
        if (result.taskCompleted || result.recipeCompleted || result.lootDrops.length > 0) {
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
            version: __VERSION,
            state: this.state.toJSON(),
            runner: this.runner.toJSON(),
            timer: this.timer.toJSON(),
            log: Log.toJSON(),
        };
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

    _loadEnemies(data) {
        for (const item of data) {
            item.type = 'enemy';
            const rItem = reactive(item);
            this.state.register(rItem);
        }
    },
};

export default Game;
