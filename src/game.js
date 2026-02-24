import { reactive } from 'vue';
import { clamp } from '@/util/format';
import GameState from '@/gameState';
import BipolarStat from '@/values/BipolarStat';
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
 * Reactive mirror of CombatRunner state.
 * Declared outside Game to avoid Vue proxy wrapping the Game object itself.
 */
const _combatState = reactive({
    active: false,
    result: null,
    turnNumber: 0,
    combatLog: [],
    enemies: [],
    mission: null,
    equippedManeuvers: [],
    stance: 'balanced',
    targeting: 'auto',
});

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

    /** Reactive mirror of combatRunner — set after declaration below */
    combatState: null,

    /** @type {Timer} */
    timer: null,

    /** @type {number|null} */
    _interval: null,

    /** @type {number|null} */
    _autosaveInterval: null,

    loaded: false,
    paused: false,

    /** @type {Set<string>} */
    _completedMilestones: new Set(),

    /** @type {number} */
    _milestoneTimer: 0,

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
        // Wire the module-level reactive object so the UI can access it via Game.combatState
        this.combatState = _combatState;

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
        this._loadWeapons(rawData.weapons || []);
        this._loadFrames(rawData.frames || []);
        this._loadParts(rawData.parts || []);
        this._setCombatConfig(rawData.combat_config || null);
        this._loadManufacturers(rawData.manufacturers || []);
        this._loadFactions(rawData.factions || []);
        this._loadBlueprints(rawData.blueprints || []);
        this._loadJobs(rawData.jobs || []);
        this._loadZones(rawData.zones || []);

        // Calculate initial frame state
        this.state.recalculateFrameStats();

        // Events
        Events.on('COMBAT_END', (data) => this._onCombatEnd(data));
        Events.on('FACTION_REP_AWARD_REQUEST', ({ repId, amount, source }) => {
            const faction = this._getFactionByRepId(repId);
            if (faction) {
                this.awardFactionRep(faction.id, amount, source || 'event');
            } else {
                this.state.award({ [repId]: amount });
            }
        });

        // Restore save
        if (saveData) {
            this.state.fromJSON(saveData.state);
            this.runner.fromJSON(saveData.runner, this.state.items);
            if (saveData.combatRunner) this.combatRunner.fromJSON(saveData.combatRunner);
            this.timer.fromJSON(saveData.timer);
            Log.fromJSON(saveData.log);
            this._completedMilestones = new Set(saveData.completedMilestones || []);
        } else {
            // New game
            Log.add('SYS> Initialization sequence complete', 'system');
            Log.add('SYS> Location: Scrapyard District, New Tokyo outskirts', 'system');
            Log.add('Welcome to the Scrapyard, kid.', 'story');
            Log.add('Grandpa: "Start by collecting some scrap. Use the Scavenge action."', 'story');
            Log.add('TIP: Hover over anything for details.', 'tip');

            // Default weapon
            if (this.state.items['mech_fist']) {
                this.state.items['mech_fist'].owned = 1;
            }
        }

        // Initial unlock check
        this.techTree.recheck(Object.values(this.state.items));

        this.loaded = true;

        // Attach Game to window for Developer/Debugger purposes
        if (typeof window !== 'undefined') {
            window.Game = this;
        }

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

        // --- Android Automation ---
        const android = this.state.android;
        if (android && android.active) {
            // Energy regen (always, even unassigned)
            android.energy = Math.min(android.maxEnergy, android.energy + android.energyRate * dt);

            if (android.assignment) {
                const task = this.state.items[android.assignment];
                if (task && task.perpetual && !task.locked) {
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
                        // XP: 1 per 10 seconds of full work
                        android.xp += 0.1 * dt;
                        if (android.xp >= android.xpToNext) this._levelUpAndroid();
                    }
                }
            }
        }

        // 3. Update combat runner
        if (this.combatRunner.active) {
            this.combatRunner.update(dt);
        }
        // Sync reactive combat state for Vue UI
        this._syncCombatState();

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
                    // Pass free=true so the task-triggered mission doesn't charge energy again
                    this.startMission(mid, true);
                } else {
                    Log.add(`[ERROR] trigger_combat: mission '${mid}' not found.`, 'error');
                }
            }
        }

        // 5. Sync morality display resource
        const moralRes = this.state.get('morality');
        if (moralRes) {
            moralRes.val = this.state.morality.value;
        }

        // 5b. Pragmatist timer — track time spent in neutral zone
        const absM = Math.abs(this.state.morality.value);
        if (absM < 40) {
            this.state.pragmatistTimer += dt;
        } else {
            this.state.pragmatistTimer = Math.max(0, this.state.pragmatistTimer - dt * 2);
        }

        const unlocked = this.techTree.check();

        // --- Zone Discovery ---
        for (const item of unlocked) {
            if (item.type === 'zone' && !item.discovered) {
                item.discovered = true;
                Log.add(`🗺 New zone discovered: ${item.name}`, 'story');
                this.showDialogue('system', [
                    `ZONE UNLOCKED: ${item.name}`,
                    item.desc,
                    item.narrativeHook
                ]);
            }
        }
        this._checkHomeTransitions();

        // --- Job Passive Income ---
        const activeJob = this.getActiveJob();
        if (activeJob && activeJob.currentTier > 0) {
            const tierData = this._getJobTierData(activeJob);
            if (tierData && tierData.passiveIncome) {
                for (const [resId, rate] of Object.entries(tierData.passiveIncome)) {
                    const res = this.state.items[resId];
                    if (res && res.val !== undefined) {
                        const max = res.max || Infinity;
                        res.val = Math.min(max, res.val + rate * dt);
                    }
                }
            }
        }

        // 7. Narrative Milestones
        this._milestoneTimer += dt;
        if (this._milestoneTimer >= 2) { // Check every 2 seconds
            this.milestoneCheck();
            this._milestoneTimer = 0;
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

        // Passive Stress Recovery (§4.1)
        if (!this.combatRunner.active) {
            const frame = this.state.player.frame;
            const grit = this.state.items['grit']?.val || 1;
            if (frame.stress > 0) {
                const recoveryRate = grit * 0.1;
                frame.stress = Math.max(0, frame.stress - recoveryRate * dt);
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

        if (upg.tags && upg.tags.includes('t_android')) {
            this._applyAndroidUpgrade(upg.id);
        }

        // Check unlocks
        this.techTree.check();

        return true;
    },

    // ── Android Companion Methods ─────────────────────────

    _initAndroid() {
        this.state.android.active = true;
        this.state.android.level = 1;
        this.state.android.energy = 50;
        Log.add('🤖 K.I.T.A. online. Assign a task in the SCRAPYARD tab.', 'story');
    },

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
            completedMilestones: Array.from(this._completedMilestones || []),
            version: __VERSION
        };
    },

    /**
     * Start a combat mission.
     * @param {string} missionId - ID from missions.json
     * @param {boolean} free - If true, skip energy cost (e.g. task-triggered)
     */
    startMission(missionId, free = false) {
        const mission = this.state.get(missionId);
        if (!mission) {
            Log.add(`[ERROR] startMission: mission '${missionId}' not found.`, 'error');
            return;
        }
        if (mission.locked) {
            Log.add(`[ERROR] startMission: mission '${missionId}' is locked.`, 'error');
            return;
        }

        // Check energy cost (skip if triggered for free by a task)
        if (!free && mission.cost && !this.state.payCost(mission.cost)) {
            Log.add('✗ Insufficient resources for mission.', 'error');
            return;
        }

        // Check if this is a narrative-only mission (no combat)
        const isNarrativeOnly = mission.encounter && mission.encounter.mode === 'none';

        if (isNarrativeOnly) {
            this._handleNarrativeMission(mission);
            return;
        }

        // Show mission briefing dialogue (condensed if previously seen)
        const briefingPages = this._getMissionBriefing(mission);
        if (briefingPages.length > 0) {
            const speaker = mission.narrative?.speaker || 'system';
            this.showDialogue(speaker, briefingPages, () => {
                this._launchCombat(mission);
            });
        } else {
            this._launchCombat(mission);
        }
    },

    /**
     * Get briefing pages for a mission — full on first view, condensed on replay.
     * Marks the mission as seen in prestige.seenBriefings.
     * Future: extend with storyLayer-based dialogue variants (Option C).
     */
    _getMissionBriefing(mission) {
        const narrative = mission.narrative;
        if (!narrative?.briefing?.length) return [];

        const seen = this.state.prestige.seenBriefings;
        const key = mission.id;

        if (seen.includes(key)) {
            // Condensed replay version — 1 line from desc
            return [`[You remember this mission: ${mission.desc || mission.name}]`];
        }

        // First time seeing this briefing — mark as seen
        seen.push(key);
        return [...narrative.briefing];
    },

    /**
     * Handle a narrative-only mission (no combat, just dialogue + rewards).
     */
    _handleNarrativeMission(mission) {
        const narrative = mission.narrative;
        const speaker = narrative?.speaker || 'system';

        // Briefing: condensed if seen before
        const briefingPages = this._getMissionBriefing(mission);

        // Debriefing: always shows in full (contains reward/story info)
        const debriefing = narrative?.debriefing || narrative?.debriefing_victory || [];
        const allPages = [...briefingPages, ...debriefing];

        if (allPages.length > 0) {
            this.showDialogue(speaker, allPages, () => {
                this._completeNarrativeMission(mission);
            });
        } else {
            this._completeNarrativeMission(mission);
        }
    },

    /**
     * Complete a narrative-only mission (award rewards, set flags).
     */
    _completeNarrativeMission(mission) {
        // Award rewards
        if (mission.rewards) {
            this._routeFactionRepFromRewards(mission.rewards, `mission:${mission.id}:rewards`);
        }
        if ((mission.completed || 0) === 0 && mission.firstClearBonus) {
            this._routeFactionRepFromRewards(mission.firstClearBonus, `mission:${mission.id}:first_clear`);
        }
        mission.completed = (mission.completed || 0) + 1;

        Log.add(`★ Mission Complete: ${mission.name}`, 'story');

        // Special: Scrapyard Siege sets the grandpa_dead flag AND unlocks prestige gate
        if (mission.id === 'msn_scrapyard_siege') {
            this._onGrandpaDeath();
            if (!this.state.prestige.gateCompleted) {
                this.state.prestige.gateCompleted = true;
                Log.add('', 'system');
                Log.add('[SYSTEM] ▶ GLORY RESET AVAILABLE. A new cycle awaits.', 'story');
                Log.add('[SYSTEM] Open the Prestige panel when you are ready.', 'system');
            }
        }

        // Trigger unlock checks
        this.techTree.check();
        this._checkRepTierTransitions();

        // Fire combat end event for consistency
        Events.emit('COMBAT_END', { result: 'victory', reason: 'narrative', mission: mission.id });
    },

    _getFactionByRepId(repId) {
        return Object.values(this.state.items).find(i => i.type === 'faction' && i.repId === repId) || null;
    },

    _getMoralityRepMod(faction, amount) {
        if (amount <= 0) return 1;
        const morality = this.state.morality?.value || 0;
        const lawAlignments = new Set(['lawful', 'authoritarian', 'corporate']);
        const criminalAlignments = new Set(['revolutionary']);

        if (lawAlignments.has(faction.alignment)) {
            if (morality >= 30) return 1.2;
            if (morality <= -30) return 0.8;
        }
        if (criminalAlignments.has(faction.alignment)) {
            if (morality <= -30) return 1.2;
            if (morality >= 30) return 0.8;
        }
        return 1;
    },

    /**
     * Award faction rep with rivalry spillover and morality modifiers.
     * @param {string} factionId
     * @param {number} amount
     * @param {string} source
     * @param {boolean} skipTierCheck
     */
    awardFactionRep(factionId, amount, source = 'generic', skipTierCheck = false) {
        const faction = this.state.items[factionId];
        if (!faction || faction.type !== 'faction' || !faction.repId) return false;

        const repRes = this.state.items[faction.repId];
        if (!repRes) return false;

        const rawAmount = Number(amount) || 0;
        if (rawAmount === 0) return false;

        if (repRes.locked && rawAmount > 0) repRes.locked = false;
        if (repRes.locked) return false;

        const moralMod = this._getMoralityRepMod(faction, rawAmount);
        const adjustedAmount = rawAmount > 0 ? Math.round(rawAmount * moralMod) : Math.round(rawAmount);
        const min = repRes.min ?? 0;
        const max = repRes.max ?? 100;
        const before = repRes.val || 0;
        repRes.val = clamp(before + adjustedAmount, min, max);
        const primaryDelta = Math.round((repRes.val || 0) - before);

        if (primaryDelta !== 0) {
            const dir = primaryDelta > 0 ? '+' : '';
            const modNote = (rawAmount > 0 && moralMod !== 1) ? ` (morale x${moralMod.toFixed(1)})` : '';
            Log.add(`◈ ${faction.shortName} rep ${dir}${primaryDelta}${modNote} [${source}]`, 'faction');
        }

        if (adjustedAmount > 0 && faction.rivalries) {
            for (const [rivalId, ratio] of Object.entries(faction.rivalries)) {
                const rivalFaction = this.state.items[rivalId];
                if (!rivalFaction || rivalFaction.type !== 'faction' || !rivalFaction.repId) continue;
                const rivalRep = this.state.items[rivalFaction.repId];
                if (!rivalRep || rivalRep.locked) continue;

                const rivalryLoss = Math.round(Math.abs(adjustedAmount * ratio));
                if (rivalryLoss <= 0) continue;

                const rMin = rivalRep.min ?? 0;
                const rMax = rivalRep.max ?? 100;
                const rivalBefore = rivalRep.val || 0;
                rivalRep.val = clamp(rivalBefore - rivalryLoss, rMin, rMax);
                const rivalDelta = Math.round((rivalRep.val || 0) - rivalBefore);
                if (rivalDelta !== 0) {
                    Log.add(`  ↳ ${rivalFaction.shortName} rep ${rivalDelta} (rivalry)`, 'faction');
                }
            }
        }

        if (!skipTierCheck) this._checkRepTierTransitions();
        return true;
    },

    /**
     * Route rep_* rewards through awardFactionRep while keeping normal rewards on state.award.
     * @param {Object} rewards
     * @param {string} source
     */
    _routeFactionRepFromRewards(rewards, source = 'generic') {
        if (!rewards) return;
        const regularRewards = {};
        let hasFactionRep = false;

        for (const [key, val] of Object.entries(rewards)) {
            if (!key.startsWith('rep_')) {
                regularRewards[key] = val;
                continue;
            }

            const faction = this._getFactionByRepId(key);
            if (faction) {
                this.awardFactionRep(faction.id, val, source, true);
                hasFactionRep = true;
            } else {
                regularRewards[key] = val;
            }
        }

        if (Object.keys(regularRewards).length > 0) {
            this.state.award(regularRewards);
        }
        if (hasFactionRep) {
            this._checkRepTierTransitions();
        }
    },

    getFactionVendor(factionId) {
        const emptyCatalog = { parts: [], weapons: [], blueprints: [], backpacks: [] };
        const faction = this.state.items[factionId];
        if (!faction || faction.type !== 'faction' || !faction.vendorCatalog) return emptyCatalog;

        const repRes = this.state.items[faction.repId];
        if (!repRes || repRes.locked) return emptyCatalog;

        const currentRep = repRes.val || 0;
        const result = { parts: [], weapons: [], blueprints: [], backpacks: [] };

        for (const [tierKey, tierCatalog] of Object.entries(faction.vendorCatalog)) {
            const tier = Number(tierKey);
            if (Number.isNaN(tier) || currentRep < tier) continue;

            for (const category of Object.keys(result)) {
                const ids = tierCatalog?.[category] || [];
                for (const id of ids) {
                    if (this.state.items[id]) result[category].push(id);
                }
            }
        }

        for (const category of Object.keys(result)) {
            result[category] = [...new Set(result[category])];
        }
        return result;
    },

    getVendorItemCost(itemId) {
        const item = this.state.items[itemId];
        if (!item) return null;
        if (typeof item.vendorPrice === 'number') return Math.max(1, Math.floor(item.vendorPrice));
        if (typeof item.cost?.creds === 'number') return Math.max(1, Math.floor(item.cost.creds));
        if (typeof item.materials?.creds === 'number') return Math.max(1, Math.floor(item.materials.creds));
        if (typeof item.value === 'number') return Math.max(1, Math.floor(item.value));
        return 50;
    },

    buyFromVendor(itemId, factionId) {
        const item = this.state.items[itemId];
        if (!item) {
            Log.add(`✗ Vendor item not found: ${itemId}`, 'error');
            return false;
        }

        const vendor = this.getFactionVendor(factionId);
        const listed = ['parts', 'weapons', 'blueprints', 'backpacks'].some(cat => vendor[cat].includes(itemId));
        if (!listed) {
            Log.add(`✗ Item not available in this vendor tier.`, 'error');
            return false;
        }

        if (item.type === 'blueprint' && !item.locked) {
            Log.add(`✗ Blueprint already known: ${item.name}.`, 'error');
            return false;
        }

        if (item.owned !== undefined && item.max !== undefined && (item.owned || 0) >= item.max) {
            Log.add(`✗ ${item.name} is already at max ownership.`, 'error');
            return false;
        }

        const cost = this.getVendorItemCost(itemId);
        if (cost == null || !this.state.payCost({ creds: cost })) {
            Log.add(`✗ Not enough Creds for ${item.name}.`, 'error');
            return false;
        }

        if (item.type === 'blueprint') {
            item.locked = false;
        } else if (item.type === 'frame_part') {
            const purchasedPart = {
                id: `${item.id}_vendor_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                templateId: item.id,
                name: item.name,
                slot: item.slot,
                hp: item.hp || item.maxHp || 50,
                maxHp: item.maxHp || item.hp || 50,
                integrity: item.integrity || 1,
                condition: 1,
                status: 'operational',
                category: item.category || 'light',
                manufacturer: item.mfr || item.manufacturer || 'unknown'
            };
            this.state.player.partsInventory.push(purchasedPart);
        } else if (item.owned !== undefined) {
            item.owned = (item.owned || 0) + 1;
        } else if (item.val !== undefined) {
            item.val = (item.val || 0) + 1;
        }

        const faction = this.state.items[factionId];
        const factionName = faction?.shortName || 'Vendor';
        Log.add(`$ Bought ${item.name} from ${factionName} vendor for ${cost} Creds.`, 'action');
        this.techTree.check();
        return true;
    },

    /**
     * Handle Grandpa's death after Scrapyard Siege.
     * Sets a permanent flag. Grandpa never speaks again.
     */
    _onGrandpaDeath() {
        // Set permanent flag
        if (!this.state.items['grandpa_dead']) {
            this.state.items['grandpa_dead'] = { id: 'grandpa_dead', val: 1, type: 'flag' };
        } else {
            this.state.items['grandpa_dead'].val = 1;
        }

        Log.add('', 'system');
        Log.add('The seat in the back row is empty.', 'story');
        Log.add('', 'system');
    },

    // ── Prestige System (GDD §2+§3+§6+§8) ───────────────────────

    /**
     * Calculate Glory earned this cycle based on accomplishments.
     * Returns a breakdown object for the Summary UI.
     */
    _calculatePrestigeGlory() {
        const items = this.state.items;
        const prestige = this.state.prestige;

        // Phase bonus: highest owned home/phase
        const phaseValues = { phase_1: 5, phase_2: 15, phase_3: 30, phase_4: 50, phase_5: 80 };
        let phaseBonus = 0;
        for (const [key, pts] of Object.entries(phaseValues)) {
            const home = Object.values(items).find(i => i.type === 'home' && i.id.includes(key.replace('phase_', '')) && i.owned > 0);
            if (home) phaseBonus = Math.max(phaseBonus, pts);
        }
        // Fallback: count owned homes
        if (phaseBonus === 0) {
            const ownedHomes = Object.values(items).filter(i => i.type === 'home' && i.owned > 0).length;
            phaseBonus = ownedHomes * 5;
        }

        // Mission bonus
        let missionBonus = 0;
        for (const item of Object.values(items)) {
            if (item.type !== 'mission' || !item.completed) continue;
            const isStory = item.tags?.includes('story') || item.encounter === 'none' || item.narrative;
            missionBonus += isStory ? 5 : 2;
        }

        // Combat bonus (completed combat missions × 3)
        let combatBonus = 0;
        for (const item of Object.values(items)) {
            if (item.type === 'mission' && item.completed && item.encounter && item.encounter !== 'none') {
                combatBonus += Math.min(item.completed, 3) * 3; // diminishing for repeats
            }
        }

        // Economy bonus (total resource values, very small coefficient)
        let totalResources = 0;
        for (const item of Object.values(items)) {
            if (item.type === 'resource' && typeof item.val === 'number') {
                totalResources += item.val;
            }
        }
        const economyBonus = Math.min(30, Math.floor(totalResources * 0.01));

        const baseGlory = phaseBonus + missionBonus + combatBonus + economyBonus;

        // Alignment multiplier
        const morale = this.state.morality?.value || 0;
        let alignmentName = 'Pragmatist';
        let alignmentMultiplier = 1.05;
        if (morale >= 40) { alignmentName = 'Paragon'; alignmentMultiplier = 1.10; }
        else if (morale <= -40) { alignmentName = 'Shadow'; alignmentMultiplier = 1.10; }

        // Consistency bonus (simplified: check if morale sign stayed consistent)
        const consistencyBonus = 1.15; // Placeholder — full tracking deferred

        // First prestige bonus
        const firstBonus = prestige.cycleCount === 0 ? 1.50 : 1.00;

        const totalGlory = Math.floor(baseGlory * alignmentMultiplier * consistencyBonus * firstBonus);

        return {
            phaseBonus,
            missionBonus,
            combatBonus,
            economyBonus,
            baseGlory,
            alignmentName,
            alignmentMultiplier,
            consistencyBonus,
            firstBonus,
            totalGlory,
            morale: Math.floor(morale),
        };
    },

    /**
     * Execute a full prestige reset.
     * @param {Object} gloryBreakdown - from _calculatePrestigeGlory()
     */
    performPrestige(gloryBreakdown) {
        if (!gloryBreakdown) gloryBreakdown = this._calculatePrestigeGlory();
        const prestige = this.state.prestige;
        const earned = gloryBreakdown.totalGlory;

        // 1. Award Glory
        prestige.gloryPool += earned;
        prestige.lifetimeGlory += earned;

        // 2. Snapshot alignment
        prestige.alignmentHistory.push({
            alignment: gloryBreakdown.alignmentName,
            morale: gloryBreakdown.morale,
            cycle: prestige.cycleCount,
            glory: earned,
        });

        // 3. Advance cycle + story layer
        prestige.cycleCount++;
        if (prestige.storyLayer < 2) prestige.storyLayer = 2; // At least layer 2 after first prestige
        prestige.gateCompleted = false;

        // 4. Persist known blueprints
        for (const item of Object.values(this.state.items)) {
            if (item.type === 'blueprint' && item.owned > 0) {
                if (!prestige.knownBlueprints.includes(item.id)) {
                    prestige.knownBlueprints.push(item.id);
                }
            }
        }

        // 5. Reset all items
        for (const item of Object.values(this.state.items)) {
            // Resources → 0
            if (item.type === 'resource') {
                item.val = 0;
            }
            // Upgrades, furniture, homes → unowned
            if (['upgrade', 'furniture', 'home'].includes(item.type)) {
                item.owned = 0;
            }
            // Missions → uncompleted
            if (item.type === 'mission') {
                item.completed = 0;
            }
            // Stats → reset to base (but keep type/config)
            if (item.type === 'player_stat') {
                item.val = item.baseVal || 1;
            }
            // Skills → reset
            if (item.type === 'skill') {
                item.val = 0;
            }
            // Blueprints → mark unowned (knowledge restored below)
            if (item.type === 'blueprint') {
                item.owned = 0;
            }
            // Maneuvers → unowned
            if (item.type === 'maneuver') {
                item.owned = 0;
            }
            // Weapons → unowned (starter restored below)
            if (item.type === 'weapon') {
                item.owned = 0;
            }
        }

        // 6. Reset player frame to Hayabusa defaults
        const frame = this.state.player.frame;
        frame.chassisId = 'frame_hayabusa_mk1';
        frame.installedParts = {
            torso: 'torso_hayabusa_mk1',
            left_arm: 'arm_hayabusa_mk1_l',
            right_arm: 'arm_hayabusa_mk1_r',
            legs: 'legs_hayabusa_mk1'
        };
        frame.installedEquip = {
            left_hand: null,
            right_hand: 'mech_fist',
            backpack: null,
            left_shoulder: null,
            right_shoulder: null
        };
        frame.parts = {
            torso: { id: 'torso', name: 'Torso', integrity: 3, hp: 100, maxHp: 100, status: 'operational', condition: 1.0 },
            left_arm: { id: 'left_arm', name: 'Left Arm', integrity: 2, hp: 50, maxHp: 50, status: 'operational', condition: 1.0 },
            right_arm: { id: 'right_arm', name: 'Right Arm', integrity: 2, hp: 50, maxHp: 50, status: 'operational', condition: 1.0 },
            legs: { id: 'legs', name: 'Legs', integrity: 2, hp: 60, maxHp: 60, status: 'operational', condition: 1.0 }
        };
        frame.heat = 0;
        frame.stress = 0;
        frame.maneuvers = [];
        frame.tokens = [];

        // 7. Reset morality + pragmatistTimer
        this.state.morality = new BipolarStat(0);
        this.state.pragmatistTimer = 0;
        const moralityRes = this.state.get('morality');
        if (moralityRes) moralityRes.val = 0;
        Object.defineProperty(this.state.g, 'morality', {
            get: () => this.state.morality.value,
            configurable: true,
        });
        Object.defineProperty(this.state.g, 'moral_alignment', {
            get: () => this.state.morality.alignmentBase,
            configurable: true,
        });

        // 7b. Reset jobs
        for (const item of Object.values(this.state.items)) {
            if (item.type === 'job') {
                item.enrolled = false;
                item.currentTier = 0;
                item.currentPath = null;
            }
        }

        // 8. Reset K.I.T.A. (preserve personality)
        const savedPersonality = this.state.android.personality;
        Object.assign(this.state.android, {
            active: false,
            level: 1,
            xp: 0,
            xpToNext: 100,
            energy: 50,
            maxEnergy: 50,
            energyRate: 0.2,
            assignment: null,
            efficiency: 1.0,
            modules: [],
            personality: savedPersonality, // Persists!
        });

        // 9. Reset inventory (new + legacy alias)
        if (!this.state.player.inventory) {
            this.state.player.inventory = { frames: [], parts: [], weapons: [] };
        }
        this.state.player.inventory.frames = ['frame_hayabusa_mk1'];
        this.state.player.inventory.parts = [];
        this.state.player.inventory.weapons = ['mech_fist'];
        this.state.player.partsInventory = this.state.player.inventory.parts;

        // 10. Reset milestones (so narrative triggers replay)
        this._completedMilestones.clear();

        // 11. Stop combat
        if (this.combatRunner.active) {
            this.combatRunner.forceEnd('prestige');
        }

        // 12. Restore known blueprints (unlock but not owned)
        for (const bpId of prestige.knownBlueprints) {
            const bp = this.state.items[bpId];
            if (bp) bp.locked = false;
        }

        // 13. Restore default weapon
        if (this.state.items['mech_fist']) {
            this.state.items['mech_fist'].owned = 1;
        }

        // 14. Re-lock gated items and recalculate
        this.techTree.recheck(Object.values(this.state.items));
        this.state.recalculateFrameStats();

        // 15. Welcome back
        Log.clear();
        Log.add('═══════════════════════════════════════', 'system');
        Log.add(`GLORY RESET COMPLETE — Cycle ${prestige.cycleCount}`, 'story');
        Log.add(`Story Layer: ${prestige.storyLayer} | Glory Pool: ${prestige.gloryPool}`, 'system');
        Log.add('═══════════════════════════════════════', 'system');
        Log.add('', 'system');
        Log.add('The scrapyard is quiet again.', 'story');
        Log.add('But you remember everything.', 'story');
        Log.add('', 'system');

        // Auto-save
        Persist.save(this);
    },

    /**
     * Actually launch combat after briefing dialogue completes.
     * @param {Object} mission
     */
    _launchCombat(mission) {
        // Build enemies list
        let enemyRefs = [];
        if (mission.encounter && mission.encounter.enemies) {
            enemyRefs = mission.encounter.enemies;
        } else if (mission.enemies) {
            enemyRefs = mission.enemies.map(eid => ({ archetype: eid }));
        }

        const enemies = enemyRefs.map(eDef => {
            const eid = eDef.id || eDef.archetype;
            const template = this.state.get(eid);
            if (!template) {
                // Fallback to searching all enemies if ID is bad
                const allEnemies = this.state.getByGroup('enemy');
                if (allEnemies.length > 0) return JSON.parse(JSON.stringify(allEnemies[0]));
                return null;
            }

            const e = JSON.parse(JSON.stringify(template));

            // Generate boss loadout if fixed loadout exists
            if (e.loadout) {
                this._generateBossLoadout(e);
            }

            return e;
        }).filter(Boolean);

        const boss = enemies.find(e => e.isBoss);
        if (boss && boss.narrative && boss.narrative.intro) {
            this.showDialogue(boss.name, boss.narrative.intro, () => {
                this.combatRunner.startMission(mission, enemies);
            });
        } else {
            this.combatRunner.startMission(mission, enemies);
        }
    },

    /**
     * Set up a boss enemy with their fixed loadout and stats.
     */
    _generateBossLoadout(enemy) {
        enemy.isBoss = true;
        enemy.parts = {};

        // Resolve frame chassis
        if (enemy.loadout.frame) {
            const chassis = this.state.get(enemy.loadout.frame);
            if (chassis) {
                // Base HP and armor can be pulled from chassis if needed
                enemy.chassisId = chassis.id;
            }
        }

        // Resolve parts
        if (enemy.loadout.parts) {
            for (const [slot, partId] of Object.entries(enemy.loadout.parts)) {
                const partTemplate = this.state.get(partId);
                if (partTemplate) {
                    enemy.parts[slot] = {
                        id: slot,
                        templateId: partId,
                        name: partTemplate.name,
                        hp: partTemplate.hp || partTemplate.maxHp || 100,
                        maxHp: partTemplate.maxHp || partTemplate.hp || 100,
                        integrity: partTemplate.integrity || 3,
                        status: 'operational'
                    };
                } else {
                    // Fallback generic part
                    enemy.parts[slot] = { id: slot, name: 'Armored ' + slot, hp: 100, maxHp: 100, integrity: 3, status: 'operational' };
                }
            }
        }

        // Resolve weapons
        enemy.weapons = [];
        if (enemy.loadout.weapons) {
            const weps = Array.isArray(enemy.loadout.weapons) ? enemy.loadout.weapons : Object.values(enemy.loadout.weapons);
            for (const wId of weps) {
                const w = this.state.get(wId);
                if (w) enemy.weapons.push(JSON.parse(JSON.stringify(w)));
            }
        }

        // Apply pilot stats
        enemy.attributes = enemy.attributes || { atk: 0, def: 0 };
        if (enemy.pilotStats) {
            enemy.attributes.atk = enemy.pilotStats.REF || enemy.pilotStats.MUS || 2;
            enemy.attributes.def = enemy.pilotStats.REF || 2;
        }

        // Phase tracking
        if (enemy.bossPhases && enemy.bossPhases.length > 0) {
            enemy.currentPhase = 1;
        }
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

    /**
     * Standard repair using scrap and parts.
     */
    repairFrame() {
        const cost = { scrap: 15, parts: 2 };
        if (!this.state.payCost(cost)) {
            Log.add('✗ Insufficient resources for repairs. Need 15 Scrap + 2 Parts.', 'error');
            return;
        }

        const frameParts = this.state.player.frame.parts;
        let repaired = 0;
        Object.values(frameParts).forEach(p => {
            if (p.status === 'destroyed') {
                p.status = 'operational';
                p.hp = Math.floor(p.maxHp * 0.5);
                p.integrity = 1;
                repaired++;
                Log.add(`🛠️ ${p.name} RESTORED to operational status.`, 'success');
            } else if (p.hp < p.maxHp) {
                p.hp = p.maxHp;
                repaired++;
                Log.add(`🛠️ ${p.name} repaired to full HP.`, 'success');
            }
        });

        if (repaired === 0) {
            // Refund if nothing needed repair
            this.state.award(cost);
            Log.add('Frame is already in good condition.', 'system');
        }
    },

    _onCombatEnd({ result, mission, reason }) {
        // Narrative-only missions handle their own completion — skip combat end processing
        if (reason === 'narrative') return;

        const missionData = this.state.get(mission);
        const boss = (this.combatRunner.enemies || []).find(e => e.isBoss);

        if (result === 'victory') {
            // Boss defeat narrative
            if (boss && boss.narrative && boss.narrative.defeat) {
                this.showDialogue(boss.name, boss.narrative.defeat);
            }
            // Boss unique drop
            if (boss && boss.uniqueDrop) {
                const dropId = boss.uniqueDrop.id;
                const dropItem = this.state.get(dropId);
                if (dropItem) {
                    if ((dropItem.owned === 0 || dropItem.owned === undefined) && (dropItem.val === 0 || dropItem.val === undefined)) {
                        if (['blueprint', 'event', 'home', 'upgrade'].includes(dropItem.type)) dropItem.owned = 1;
                        else dropItem.val = 1;
                        Log.add(`✦ UNIQUE DROP: ${dropItem.name || dropId}`, 'loot');
                    }
                } else if (!this.state.items[dropId]) {
                    this.state.items[dropId] = { id: dropId, val: 1, type: 'flag' };
                    Log.add(`✦ UNIQUE DROP: ${boss.uniqueDrop.name || dropId}`, 'loot');
                }
            }
        } else if (result === 'defeat') {
            // Boss player_defeat narrative
            if (boss && boss.narrative && boss.narrative.player_defeat) {
                this.showDialogue(boss.name, boss.narrative.player_defeat);
            }
        }

        // --- Mission Debriefing ---
        if (missionData && missionData.narrative) {
            const n = missionData.narrative;
            const speaker = n.speaker || 'system';
            let pages = null;

            if (result === 'victory') {
                pages = n.debriefing_victory || n.debriefing;
            } else {
                pages = n.debriefing_defeat || n.debriefing;
            }

            if (pages && Array.isArray(pages) && pages.length > 0) {
                // Delay slightly so boss narrative plays first
                const delay = (boss && boss.narrative) ? 500 : 0;
                setTimeout(() => {
                    this.showDialogue(speaker, pages);
                }, delay);
            }
        }

        // --- Check for faction rep tier transitions ---
        this._checkRepTierTransitions();

        // Recovery (§3.2)
        const frame = this.state.player.frame;
        frame.heat = 0;

        // Dissipate half stress
        frame.stress = (frame.stress || 0) * 0.5;

        Log.add(`[RECOVERY] Heat normalized. Stress reduced to ${Math.floor(frame.stress)}.`, 'system');
    },

    /**
     * Check if any faction rep crossed a tier threshold and notify.
     */
    _checkRepTierTransitions() {
        const factions = Object.values(this.state.items).filter(i => i.type === 'faction');
        for (const fac of factions) {
            const repItem = this.state.get(fac.repId);
            if (!repItem || repItem.locked) continue;

            const repVal = Math.floor(repItem.val || 0);
            const lastTier = fac._lastKnownTier || 0;

            // Find current tier
            const thresholds = Object.keys(fac.repTiers).map(Number).sort((a, b) => a - b);
            let currentTierMin = 0;
            let currentTierName = 'Unknown';
            for (const t of thresholds) {
                if (repVal >= t) {
                    currentTierMin = t;
                    currentTierName = fac.repTiers[String(t)]?.name || 'Unknown';
                }
            }

            if (currentTierMin > lastTier) {
                fac._lastKnownTier = currentTierMin;
                Log.add(`✦ REPUTATION: ${fac.name} — ${currentTierName.toUpperCase()} [${repVal}]`, 'story');

                // Unlock blueprints for ALL tiers up to current (handles multi-tier jumps)
                for (const t of thresholds) {
                    if (t > lastTier && t <= currentTierMin) {
                        const tierData = fac.repTiers[String(t)];
                        // Extract blueprint IDs from 'unlocks' array (items starting with 'bp_')
                        const unlockList = tierData?.unlocksBlueprints || tierData?.unlocks || [];
                        const blueprintIds = unlockList.filter(u => typeof u === 'string' && u.startsWith('bp_'));
                        for (const bpId of blueprintIds) {
                            const bp = this.state.get(bpId);
                            if (bp && bp.locked) {
                                bp.locked = false;
                                Log.add(`✦ BLUEPRINT UNLOCKED: ${bp.name}`, 'loot');
                            }
                        }
                    }
                }

                this.techTree.check();
            }
        }
    },

    /**
     * Sync the non-reactive CombatRunner into the reactive combatState object.
     * Called every tick so Vue can detect changes and re-render the CombatPanel.
     */
    _syncCombatState() {
        const cr = this.combatRunner;
        // Use the module-level _combatState directly to avoid any proxy indirection
        _combatState.active = cr.active;
        _combatState.result = cr.result;
        _combatState.turnNumber = cr.turnNumber;
        _combatState.mission = cr.mission;
        _combatState.equippedManeuvers = cr.equippedManeuvers;
        _combatState.stance = cr.stance;
        _combatState.targeting = cr.targeting;
        if (_combatState.combatLog !== cr.combatLog) {
            _combatState.combatLog = cr.combatLog;
        }
        if (_combatState.enemies !== cr.enemies) {
            _combatState.enemies = cr.enemies;
        }
    },

    _handleTaskSpecialEffects(task) {
        if (!task) return;
        // ... handled via special property elsewhere
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

    craftBlueprint(bp) {
        if (!bp || bp.locked) return false;

        // Check materials
        if (bp.materials && !this.state.payCost(bp.materials)) {
            Log.add(`✗ Insufficient materials to craft ${bp.name}.`, 'error');
            return false;
        }

        Log.add(`[⚙] Assembled/Modified: ${bp.name}`, 'system');

        // Apply result based on type
        if (bp.type === 'part_mod') {
            const frame = this.state.player.frame;
            for (const [slot, partId] of Object.entries(frame.installedParts)) {
                let match = false;
                if (bp.targetSlot) {
                    if (Array.isArray(bp.targetSlot) && bp.targetSlot.includes(slot)) match = true;
                    if (bp.targetSlot === slot) match = true;
                }
                const template = this.state.get(partId);
                if (bp.targetCategory && template && template.category === bp.targetCategory) match = true;
                if (bp.targetMfr && template && template.manufacturer === bp.targetMfr) match = true;

                if (match && template) {
                    if (bp.result.armorBonus) template.armor = (template.armor || 0) + bp.result.armorBonus;
                    if (bp.result.hpBonus) {
                        template.hp = (template.hp || 0) + bp.result.hpBonus;
                        template.maxHp = (template.maxHp || template.hp || 0) + bp.result.hpBonus;
                    }
                    if (bp.result.integrityBonus) template.integrity = Math.min((template.integrity || 1) + bp.result.integrityBonus, 5);
                    if (bp.result.heatMod) template.heatMod = (template.heatMod || 0) + bp.result.heatMod;
                    if (bp.result.enemyAccuracyMod) template.enemyAccuracyMod = (template.enemyAccuracyMod || 0) + bp.result.enemyAccuracyMod;
                    if (bp.result.accuracyBonus) template.accuracyBonus = (template.accuracyBonus || 0) + bp.result.accuracyBonus;
                    if (bp.result.errorTokenChance) template.errorTokenChance = (template.errorTokenChance || 0) + bp.result.errorTokenChance;
                }
            }
            this.state.recalculateFrameStats();
        } else if (bp.type === 'craft_item') {
            const item = this.state.get(bp.craftedItem);
            if (item) {
                item.owned = (item.owned || 0) + 1;
                item.locked = false;
            }
        } else if (bp.type === 'weapon_mod') {
            const frame = this.state.player.frame;
            for (const [slot, wpnId] of Object.entries(frame.installedEquip || {})) {
                if (!wpnId) continue;
                let match = false;
                if (bp.targetSlot) {
                    if (Array.isArray(bp.targetSlot) && bp.targetSlot.includes(slot)) match = true;
                    if (bp.targetSlot === slot) match = true;
                }
                const template = this.state.get(wpnId);
                if (bp.targetCategory && template && template.category === bp.targetCategory) match = true;
                if (match && template) {
                    if (bp.result.damageMod) template.damage = Math.floor((template.damage || 0) * bp.result.damageMod);
                    if (bp.result.heatGenReduce) template.heatGen = Math.max((template.heatGen || 0) - bp.result.heatGenReduce, 0);
                    if (bp.result.heatPerHitIncrease) template.heatGen = (template.heatGen || 0) + bp.result.heatPerHitIncrease;
                }
            }
        } else if (bp.type === 'frame_mod') {
            const frame = this.state.get(this.state.player.frame.chassisId);
            if (frame) {
                if (bp.result.heatGenMod) frame.heatGenMod = bp.result.heatGenMod;
                if (bp.result.supplyEfficiencyMod) frame.supplyEfficiencyMod = bp.result.supplyEfficiencyMod;
                if (bp.result.statMods) {
                    for (const [k, v] of Object.entries(bp.result.statMods)) {
                        frame.baseStats[k] = (frame.baseStats[k] || 0) + v;
                    }
                    this.state.recalculateFrameStats();
                }
                if (bp.result.heatCapBonus) {
                    frame.heatCap = (frame.heatCap || 100) + bp.result.heatCapBonus;
                }
            }
        } else if (bp.type === 'craft_frame') {
            const frameTemplate = this.state.get(bp.craftedItem);
            if (frameTemplate) {
                frameTemplate.owned = 1;
                frameTemplate.locked = false;
                Log.add(`✦ NEW FRAME ACQUIRED: ${frameTemplate.name}!`, 'story');
                if (bp.craftedItem === 'frame_hayabusa_mk2') {
                    Log.add('Grandpa would be proud. The design is finally complete.', 'story');
                }
            }
        } else if (bp.type === 'recycle') {
            const newPart = {
                id: 'salvage_' + Date.now(),
                name: 'Scrap-Recycled Part',
                slot: ['torso', 'left_arm', 'right_arm', 'legs'][Math.floor(Math.random() * 4)],
                hp: 50,
                maxHp: 50,
                integrity: 2,
                condition: 0.8,
                status: 'operational',
                category: 'light',
                manufacturer: 'underground'
            };
            this.state.player.partsInventory.push(newPart);
            Log.add(`✓ Obtained recycled part for ${newPart.slot.toUpperCase()}`, 'system');
        }

        // Mark blueprint as owned / completed so it disappears from the menu (preventing infinite stacking exploits)
        if (bp.type !== 'recycle' && !bp.repeatable) {
            bp.owned = (bp.owned || 0) + 1;
        }

        return true;
    },

    dismantlePart(part) {
        const inventory = this.state.player.partsInventory;
        if (!inventory) return;
        const index = inventory.findIndex(p => p.id === part.id);
        if (index > -1) {
            inventory.splice(index, 1);

            const isElectronic = ['backpack', 'sensor'].includes(part.slot);
            const scrapType = isElectronic ? 'electronic_scrap' : 'ferrous_scrap';
            const amount = Math.floor(5 + ((part.condition || 1) * 10));

            this.state.award({
                [scrapType]: amount,
                'parts': 1
            });
            Log.add(`✓ Dismantled ${part.name.toUpperCase()} for +${amount} ${scrapType.replace('_', ' ').toUpperCase()} and 1 PART.`, 'inventory');
        }
    },

    equipManeuvers(ids) {
        this.combatRunner.setManeuvers(ids);
    },

    /**
     * Show a dialogue modal. Initialized by TerminalUI.vue.
     */
    showDialogue(speakerId, pages, onComplete) {
        // This is a stub that gets overwritten by TerminalUI.vue
        console.warn('showDialogue called before initialization', speakerId, pages);
    },

    /**
     * Show a choice dialogue modal. Initialized by TerminalUI.vue.
     * @param {string} speakerId
     * @param {string[]} pages - Text pages to show before choices
     * @param {Object[]} choices - Array of choice objects
     * @param {Function} onChoice - Callback with selected choice
     */
    showChoiceDialogue(speakerId, pages, choices, onChoice) {
        console.warn('showChoiceDialogue called before initialization', speakerId);
    },

    /**
     * Present a moral choice event to the player.
     * @param {Object} event - Event data with choices array
     */
    presentChoice(event) {
        if (!event || !event.choices || !event.choices.length) return;
        if (event.completed) return; // Already resolved

        const pages = [event.desc];
        const speaker = event.speaker || 'narrator';

        this.showChoiceDialogue(speaker, pages, event.choices, (chosen) => {
            this._resolveChoice(event, chosen);
        });
    },

    /**
     * Resolve a player's moral choice.
     * @param {Object} event - The event
     * @param {Object} chosen - The selected choice object
     */
    _resolveChoice(event, chosen) {
        // Capture alignment before shift
        const oldAlignment = this.state.g.moral_alignment;

        // Apply morality shift
        if (chosen.morality) {
            this.state.morality.shift(chosen.morality);
            const dir = chosen.morality > 0 ? 'Paragon' : 'Shadow';
            const abs = Math.abs(chosen.morality);
            Log.add(`⚖ Morale shifted: ${dir} +${abs}`, 'story');

            // Alignment change detection
            const newAlignment = this.state.g.moral_alignment;
            if (oldAlignment !== newAlignment) {
                Log.add(`⚖ Alignment changed: ${newAlignment.toUpperCase()}`, 'story');
                if (newAlignment === 'paragon') {
                    this.showDialogue('system', [
                        'Your actions speak louder than words.',
                        'The community notices.'
                    ]);
                } else if (newAlignment === 'shadow') {
                    this.showDialogue('system', [
                        'The shadows welcome practical people.',
                        'New doors open in dark places.'
                    ]);
                } else {
                    this.showDialogue('system', [
                        'You walk the middle path.',
                        'Both sides watch. Neither trusts — but both deal.'
                    ]);
                }
            }
        }

        // Apply resource effects
        if (chosen.effect) {
            for (const [resId, amount] of Object.entries(chosen.effect)) {
                const res = this.state.items[resId];
                if (res && res.val !== undefined) {
                    res.val = Math.max(res.min || 0, res.val + amount);
                }
            }
        }

        // Apply permanent mods
        if (chosen.mod) {
            this.state.applyMod(chosen.mod);
        }

        // Log result
        if (chosen.log) {
            Log.add(chosen.log, 'story');
        }

        if (event.id === 'evt_android_discovery') {
            if (chosen.id !== 'strip_for_parts') {
                this._initAndroid();
            } else {
                this.state.g.android_destroyed = 1;
            }
        }

        // Mark event as completed
        event.completed = (event.completed || 0) + 1;
        event.locked = true;
    },

    /**
     * Check for narrative milestones and trigger dialogue.
     */
    milestoneCheck() {
        const g = this.state.items; // shorthand

        const milestones = [
            {
                id: 'welcome',
                condition: () => this.timer.totalTime < 10,
                action: () => this.showDialogue('grandpa', [
                    "So... you've come to see the old scrapyard.",
                    "It's not much. But it's ours. Your father grew up here.",
                    "Start by scavenging what you can. There's still good metal in those piles."
                ])
            },
            {
                id: 'first_moral_hook',
                condition: () => (g.scrap?.val || 0) >= 10,
                delay: 3000,
                action: () => this.presentChoice(this.state.items.evt_moral_first_find)
            },
            {
                id: 'scrap_progress_hint',
                condition: () => (g.scrap?.val || 0) >= 15 && (this.state.get('sorting_station')?.owned || 0) === 0,
                action: () => {
                    Log.add("💬 Grandpa: 'Keep going. Once you've got enough, we'll set up proper sorting.'", 'story');
                }
            },
            {
                id: 'first_creds_earned',
                condition: () => (g.creds?.val || 0) >= 8,
                action: () => {
                    Log.add("💬 Grandpa: 'First creds. Don't spend them all in one place.'", 'story');
                }
            },
            {
                id: 'first_sorting',
                condition: () => (this.state.get('sorting_station')?.owned || 0) > 0,
                action: () => this.showDialogue('grandpa', [
                    "A sorting station. Smart.",
                    "Now you'll see what's really in that scrap — ferrous, polymer, electronic. Each one has its uses.",
                    "Your father was methodical like this too."
                ])
            },
            {
                id: 'workshop_restored',
                condition: () => (this.state.get('workshop_lv2')?.owned || 0) > 0,
                action: () => this.showDialogue('grandpa', [
                    "The workshop hums again. Haven't heard that sound in years.",
                    "Your father used to work right here. He was building something... I never understood what.",
                    "There's a locked garage out back. We'll get to it. When you're ready."
                ])
            },
            {
                id: 'refinery_online',
                condition: () => (this.state.get('refinery')?.owned || 0) > 0,
                action: () => this.showDialogue('system', [
                    "REFINERY ONLINE. Material processing capabilities restored.",
                    "Raw scrap can now be refined into Nano Infra — the universal fabrication substrate.",
                    "Check the MARKET tab for available schematics."
                ])
            },
            {
                id: 'garage_discovery',
                condition: () => (this.state.get('garage')?.owned || 0) > 0,
                action: () => this.showDialogue('grandpa', [
                    "...",
                    "There it is. Your father's Frame.",
                    "The Hayabusa Mk.I. Light class. Fast, fragile, beautiful.",
                    "He never got to finish it. But you... you could.",
                    "This changes everything, kid."
                ])
            },
            {
                id: 'first_combat_available',
                condition: () => (this.state.get('garage')?.owned || 0) > 0 && !this.combatRunner?.active,
                delay: 5000,
                action: () => this.showDialogue('system', [
                    "FRAME DETECTED: Hayabusa Mk.I — Status: Damaged but operational.",
                    "Basic weapons and sensors are functional.",
                    "A rogue scrap drone has been harassing the neighborhood. This could be a good first test.",
                    "Select a MISSION when ready."
                ])
            },
            {
                id: 'first_victory',
                condition: () => (g.msn_rogue_drone_patrol?.completed || 0) > 0,
                action: () => this.showDialogue('grandpa', [
                    "You did it. You actually did it.",
                    "That Frame... it responded to you. Just like it did for your father.",
                    "This is just the beginning. There are people out there who need help. And worse — people who'll come for us.",
                    "Keep building. Keep fighting. Keep the legacy alive."
                ])
            },
            {
                id: 'research_bench',
                condition: () => (this.state.get('research_bench')?.owned || 0) > 0,
                action: () => this.showDialogue('grandpa', [
                    "A research bench. Now we're getting somewhere.",
                    "Your father used to pore over schematics for hours. Never slept.",
                    "Now you can study what you find out there. Break it down. Understand it.",
                    "Knowledge is the one thing they can't take from you."
                ])
            },
            {
                id: 'hangar_restored',
                condition: () => (g.hangar_basic?.owned || 0) > 0,
                action: () => this.showDialogue('grandpa', [
                    "A hangar. A real hangar.",
                    "I drew plans for this forty years ago. Never had the resources.",
                    "Your father would have loved this."
                ])
            },
            {
                id: 'security_online',
                condition: () => (g.security_perimeter?.owned || 0) > 0,
                action: () => this.showDialogue('grandpa', [
                    "Turrets, sensors, reinforced fencing.",
                    "This scrapyard isn't an easy target anymore.",
                    "...Should have built this years ago."
                ])
            },
            {
                id: 'hangar_operational',
                condition: () => (g.hangar_operational?.owned || 0) > 0,
                action: () => this.showDialogue('system', [
                    "HANGAR STATUS: Fully operational.",
                    "Medium and Heavy class frames can now be assembled and maintained.",
                    "Faction contacts have begun requesting meetings at the scrapyard gate."
                ])
            },
            {
                id: 'cybernetic_bench',
                condition: () => (g.cybernetic_bench?.owned || 0) > 0,
                action: () => this.showDialogue('system', [
                    "CYBERNETIC INTERFACE INITIALIZED.",
                    "Neural bridge calibration available. Pilot augmentation protocols loaded.",
                    "Warning: modifications are permanent. Choose carefully."
                ])
            },
            {
                id: 'hangar_massive',
                condition: () => (g.hangar_massive?.owned || 0) > 0,
                action: () => this.showDialogue('system', [
                    "HANGAR EXPANSION COMPLETE. Maximum capacity achieved.",
                    "Multiple full-size frames can be stored and maintained simultaneously.",
                    "Integrated AI diagnostics are now available for all stored units."
                ])
            },
            {
                id: 'secret_lab_discovery',
                condition: () => (g.msn_dads_secret?.completed || 0) > 0 && (g.secret_lab?.owned || 0) === 0,
                action: () => {
                    const lab = g.secret_lab;
                    if (lab) {
                        lab.owned = 1;
                        lab.locked = false;
                        this.state.applyMod(lab.mod);
                        this.techTree.check();
                    }
                    this.showDialogue('system', [
                        "SYSTEM OVERRIDE DETECTED.",
                        "The floor opens. A staircase descends into pristine white light.",
                        "A workshop untouched by time. Tools arranged with surgical precision.",
                        "On the wall — a photograph. Three Hayashis, laughing."
                    ]);
                }
            },
            // --- First faction contact milestones ---
            {
                id: 'first_faction_contact',
                condition: () => {
                    const reps = ['rep_police', 'rep_corporate', 'rep_underground', 'rep_exile', 'rep_military'];
                    return reps.some(r => g[r] && !g[r].locked && (g[r].val || 0) > 0);
                },
                action: () => this.showDialogue('grandpa', [
                    "People are starting to notice you. Factions. Organizations.",
                    "Be careful who you trust. Everyone in this city wants something.",
                    "Your father learned that the hard way."
                ])
            },
            // --- Arena progression ---
            {
                id: 'arena_debut',
                condition: () => (g.msn_arena_registration?.completed || 0) > 0,
                action: () => this.showDialogue('grandpa', [
                    "The arena. I hoped you wouldn't go there.",
                    "...But I understand. Glory opens doors that creds can't.",
                    "Just don't lose yourself in it."
                ])
            },
            // --- Phase 4-5: Escalation ---
            {
                id: 'corporate_warning',
                condition: () => (g.msn_corporate_warning?.completed || 0) > 0,
                action: () => this.showDialogue('grandpa', [
                    "Aegis Technologies. They 'warned' you?",
                    "Your father got the same kind of warnings. Right before things got bad.",
                    "Be careful. These people don't warn twice."
                ])
            },
            {
                id: 'bounty_reveal',
                condition: () => (g.msn_bounty_on_player?.completed || 0) > 0,
                action: () => {
                    // Check grandpa_dead flag — post-siege, no grandpa voice
                    if (this.state.items['grandpa_dead']?.val) return;
                    this.showDialogue('grandpa', [
                        "A bounty. On MY grandchild.",
                        "Listen to me carefully. Your father wasn't taking bribes. He was investigating them.",
                        "Taeyang was shipping illegal weapons through the Docklands. He found the manifests.",
                        "They fabricated the corruption charges to silence him. Before it went to trial... he disappeared.",
                        "I should have told you sooner."
                    ]);
                }
            },
            {
                id: 'phantom_contact',
                condition: () => (g.msn_phantom_signal?.completed || 0) > 0,
                action: () => {
                    if (this.state.items['grandpa_dead']?.val) return;
                    this.showDialogue('grandpa', [
                        "The Phantom Collective. So that's who he was working with.",
                        "A police officer working with exiled engineers...",
                        "He was building something for them. Something they couldn't build alone.",
                        "I don't know if that makes it better or worse."
                    ]);
                }
            },
            // --- Scrapyard Siege aftermath ---
            {
                id: 'post_siege_silence',
                condition: () => (g.msn_scrapyard_siege?.completed || 0) > 0,
                delay: 8000,
                action: () => this.showDialogue('system', [
                    "SCRAPYARD STATUS: Structural damage detected. Workshop: 60% integrity.",
                    "Perimeter: Breached. Security systems: offline.",
                    "Personnel scan: ...",
                    "Personnel scan: 1 life sign detected.",
                    "Just you."
                ])
            },
            // --- Dad's Secret auto-trigger if lab not yet discovered ---
            {
                id: 'dads_lab_hint',
                condition: () => (g.msn_scrapyard_siege?.completed || 0) > 0 && (g.msn_dads_secret?.completed || 0) === 0,
                delay: 15000,
                action: () => this.showDialogue('system', [
                    "ANOMALY: Subsurface power signature detected beneath workshop floor.",
                    "Biometric lock identified. DNA authorization required.",
                    "Mission available: Dad's Secret."
                ])
            },
            // ── Moral Choice Events ──────────────────────────────
            {
                id: 'choice_scrap_thief',
                condition: () => (this.state.get('sorting_station')?.owned || 0) > 0,
                delay: 8000,
                action: () => this.presentChoice(this.state.items.evt_moral_scrap_thief)
            },
            {
                id: 'choice_injured_pilot',
                condition: () => (g.msn_rogue_drone_patrol?.completed || 0) > 0,
                delay: 5000,
                action: () => this.presentChoice(this.state.items.evt_moral_injured_pilot)
            },
            {
                id: 'choice_corporate_bribe',
                condition: () => (this.state.get('workshop_lv2')?.owned || 0) > 0 && (g.creds?.val || 0) >= 50,
                delay: 10000,
                action: () => this.presentChoice(this.state.items.evt_moral_corporate_bribe)
            },
            {
                id: 'android_discovery',
                condition: () => (this.state.get('sorting_station')?.owned || 0) > 0 && (this.state.get('workshop_lv2')?.owned || 0) > 0,
                delay: 5000,
                action: () => this.presentChoice(this.state.items.evt_android_discovery)
            },
        ];

        for (const m of milestones) {
            if (this._completedMilestones.has(m.id)) continue;
            if (m.condition()) {
                this._completedMilestones.add(m.id);
                if (m.delay) {
                    setTimeout(() => m.action(), m.delay);
                } else {
                    m.action();
                }
                break; // Only fire one milestone per check
            }
        }
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

    // ── JOB SYSTEM ──────────────────────────────────────────

    _loadJobs(data) {
        if (!data) return;
        const items = Array.isArray(data) ? data : Object.values(data);
        for (const item of items) {
            item.type = 'job';
            item.locked = item.locked ?? (item.require ? true : false);
            item.enrolled = item.enrolled || false;
            item.currentTier = item.currentTier || 0;
            item.currentPath = item.currentPath || null;

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);

            // Expose job state to g. namespace: g.job_police = currentTier (0 if not enrolled)
            Object.defineProperty(this.state.g, item.id, {
                get: () => rItem.enrolled ? rItem.currentTier : 0,
                configurable: true,
            });
        }
    },

    _loadZones(data) {
        if (!data) return;
        const items = Array.isArray(data) ? data : Object.values(data);
        for (const item of items) {
            item.type = 'zone';
            item.locked = item.locked ?? (item.require ? true : false);
            item.discovered = item.discovered || false;
            item.explored = item.explored || 0;

            const rItem = reactive(item);

            // Expose to g. namespace: g.zone_scrapyard = 1 if discovered
            Object.defineProperty(this.state.g, item.id, {
                get: () => rItem.discovered ? 1 : 0,
                configurable: true,
            });

            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    /**
     * Enroll in a job. Player can only have one active job.
     * Path determined by morality at ±30 threshold.
     */
    enrollJob(jobId) {
        const job = this.state.items[jobId];
        if (!job || job.locked || job.type !== 'job') return false;

        const currentJob = this.getActiveJob();
        if (currentJob && currentJob.id !== jobId) {
            Log.add(`✗ Already employed as ${this._getJobTitle(currentJob)}. Quit first.`, 'error');
            return false;
        }

        if (job.enrolled) {
            Log.add(`Already enrolled in ${job.name}.`, 'info');
            return false;
        }

        const morality = this.state.morality.value;
        job.currentPath = morality >= 30 ? 'high' : morality <= -30 ? 'low' : (morality >= 0 ? 'high' : 'low');
        job.currentTier = 1;
        job.enrolled = true;

        const tierData = job.tiers[0][job.currentPath];
        Log.add(`✦ Career started: ${tierData.title}`, 'story');
        Log.add(`  ${tierData.flavor}`, 'flavor');
        this._unlockJobMissions(tierData.unlocks || []);

        return true;
    },

    quitJob() {
        const job = this.getActiveJob();
        if (!job) return false;

        job.enrolled = false;
        Log.add(`■ Quit: ${job.name}. Career paused.`, 'action');
        return true;
    },

    /**
     * Attempt to promote in current job.
     * Path re-evaluated at ±30 — can switch on promotion.
     */
    promoteJob() {
        const job = this.getActiveJob();
        if (!job || job.currentTier >= 3) return false;

        const nextTierIndex = job.currentTier; // 0-indexed
        const nextTierData = job.tiers[nextTierIndex];
        if (!nextTierData) return false;

        const morality = this.state.morality.value;
        const path = morality >= 30 ? 'high' : morality <= -30 ? 'low' : (morality >= 0 ? 'high' : 'low');
        const tierInfo = nextTierData[path];

        if (tierInfo.require && !this.techTree.evaluate(tierInfo.require)) {
            Log.add(`✗ Promotion requirements not met for ${tierInfo.title}.`, 'error');
            return false;
        }
        if (tierInfo.moralityMin !== undefined && morality < tierInfo.moralityMin) {
            Log.add(`✗ Morale too low for ${tierInfo.title}. Need ≥${tierInfo.moralityMin}.`, 'error');
            return false;
        }
        if (tierInfo.moralityMax !== undefined && morality > tierInfo.moralityMax) {
            Log.add(`✗ Morale too high for ${tierInfo.title}. Need ≤${tierInfo.moralityMax}.`, 'error');
            return false;
        }

        const oldPath = job.currentPath;
        job.currentTier += 1;
        job.currentPath = path;

        if (oldPath !== path) {
            Log.add(`⚖ Your path has shifted. The city changes everyone.`, 'story');
        }

        Log.add(`★ Promoted: ${tierInfo.title}`, 'story');
        Log.add(`  ${tierInfo.flavor}`, 'flavor');
        this._unlockJobMissions(tierInfo.unlocks || []);

        return true;
    },

    getActiveJob() {
        return Object.values(this.state.items).find(i => i.type === 'job' && i.enrolled) || null;
    },

    _getJobTierData(job) {
        if (!job || !job.currentTier || !job.currentPath) return null;
        const tierIndex = job.currentTier - 1;
        return job.tiers[tierIndex]?.[job.currentPath] || null;
    },

    _getJobTitle(job) {
        const tier = this._getJobTierData(job);
        return tier ? tier.title : job.name;
    },

    _unlockJobMissions(missionIds) {
        for (const mId of missionIds) {
            const mission = this.state.items[mId];
            if (mission) {
                mission.locked = false;
                Log.add(`  → New mission available: ${mission.name || mId}`, 'info');
            }
        }
    },

    _loadEnemies(data) {
        let enemiesList = Array.isArray(data) ? data : (data.archetypes || []);
        if (!Array.isArray(data)) {
            if (data.bosses) enemiesList = enemiesList.concat(data.bosses);
        }
        for (const item of enemiesList) {
            item.type = 'enemy';
            item.group = 'enemy';
            item.name = item.name || 'Unknown Unit';
            const rItem = reactive(item);
            this.state.register(rItem);
        }

        // Also register encounter pools and modifiers if they exist
        if (!Array.isArray(data)) {
            if (data.encounterPools) {
                for (const item of data.encounterPools) {
                    item.type = 'encounter_pool';
                    item.group = 'encounter_pool';
                    const rItem = reactive(item);
                    this.state.register(rItem);
                }
            }
            if (data.modifiers) {
                for (const item of data.modifiers) {
                    item.type = 'enemy_modifier';
                    item.group = 'enemy_modifier';
                    const rItem = reactive(item);
                    this.state.register(rItem);
                }
            }
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

    _loadWeapons(data) {
        for (const item of data) {
            item.locked = item.locked ?? (item.require ? true : false);
            item.owned = item.owned ?? 0;
            item.type = item.type || 'weapon';

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _setCombatConfig(data) {
        if (!data) return;
        const rItem = reactive(data);
        this.state.register(rItem);
    },

    _loadFrames(data) {
        for (const item of data) {
            item.locked = item.locked ?? (item.require ? true : false);
            item.type = 'frame';
            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    _loadParts(data) {
        for (const item of data) {
            item.type = 'frame_part';
            const rItem = reactive(item);
            this.state.register(rItem);
        }
    },

    _loadManufacturers(data) {
        for (const item of data) {
            item.type = 'manufacturer';
            item.group = 'manufacturer';
            const rItem = reactive(item);
            this.state.register(rItem);
        }
    },

    _loadFactions(data) {
        for (const item of data) {
            item.type = 'faction';
            item.group = 'faction';
            item._lastKnownTier = 0; // Track tier transitions
            const rItem = reactive(item);
            this.state.register(rItem);
        }
    },

    _loadBlueprints(data) {
        for (const item of data) {
            item.type = 'blueprint';
            item.group = 'blueprint';
            item.locked = item.locked ?? true;

            // Auto-generate require string based on faction and repRequired
            if (item.faction && item.repRequired !== undefined && !item.require) {
                const factionData = this.state.get(item.faction);
                if (factionData && factionData.repId) {
                    item.require = `g.${factionData.repId} >= ${item.repRequired}`;
                }
            }

            const rItem = reactive(item);
            this.state.register(rItem);
            this.techTree.register(rItem);
        }
    },

    equipFrame(frameId) {
        const frame = this.state.player.frame;
        const newChassis = this.state.get(frameId);

        if (!newChassis || newChassis.type !== 'frame') return;

        // Remove incompatible installed parts
        for (const slot of Object.keys(frame.installedParts)) {
            const partId = frame.installedParts[slot];
            if (!partId) continue;

            const partTemplate = this.state.get(partId);
            if (partTemplate && partTemplate.category_compat) {
                if (!partTemplate.category_compat.includes(newChassis.category)) {
                    // Unequip this part
                    const livePart = frame.parts[slot];
                    this.state.player.partsInventory.push({
                        id: 'part_' + Date.now() + '_' + Math.floor(Math.random() * 1000), // Unique identifier
                        partId: partId,
                        name: partTemplate.name,
                        slot: partTemplate.slot,
                        condition: livePart ? livePart.condition : 1.0,
                        hp: livePart ? livePart.hp : partTemplate.maxHp
                    });

                    frame.installedParts[slot] = null;
                    if (frame.parts[slot]) {
                        frame.parts[slot].condition = 0;
                    }
                    Log.add(`[SYSTEM] Unequipped ${partTemplate.name} (Incompatible with ${newChassis.category} chassis).`, 'system');
                }
            }
        }

        frame.chassisId = frameId;
        Log.add(`[SYSTEM] Core Chassis changed to ${newChassis.name}.`, 'system');

        this.syncFrameSlots();
        this.state.recalculateFrameStats();
    },

    equipPart(slotId, inventoryPartId) {
        const frame = this.state.player.frame;
        const chassis = this.state.get(frame.chassisId);

        // Find the part in inventory
        const invIndex = this.state.player.partsInventory.findIndex(p => p.id === inventoryPartId);
        if (invIndex === -1) return;

        const invPart = this.state.player.partsInventory[invIndex];
        const partTemplate = this.state.get(invPart.partId);

        if (!partTemplate) return;

        // Check category compatibility
        if (partTemplate.category_compat && !partTemplate.category_compat.includes(chassis.category)) {
            Log.add(`[ERROR] ${partTemplate.name} is incompatible with ${chassis.category} frames.`, 'error');
            return;
        }

        // Check weight limits for logging
        const expectedWeight = chassis.weightRange && chassis.weightRange[slotId] ? chassis.weightRange[slotId] : [0, 999];
        const isWeightMismatch = partTemplate.weight < expectedWeight[0] || partTemplate.weight > expectedWeight[1];
        if (isWeightMismatch) {
            Log.add(`[WARNING] ${partTemplate.name} weight is outside optimal range. Efficiency reduced by 5%.`, 'warning');
        }

        // Unequip current part
        const currentPartId = frame.installedParts[slotId];
        if (currentPartId) {
            const currentTemplate = this.state.get(currentPartId);
            const livePart = frame.parts[slotId];
            if (currentTemplate) {
                this.state.player.partsInventory.push({
                    id: 'part_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                    partId: currentPartId,
                    name: currentTemplate.name,
                    slot: currentTemplate.slot,
                    condition: livePart ? livePart.condition : 1.0,
                    hp: livePart ? livePart.hp : currentTemplate.maxHp
                });
                Log.add(`[SYSTEM] Unequipped ${currentTemplate.name} from slot [${slotId.toUpperCase()}].`, 'system');
            }
        }

        // Equip new part
        frame.installedParts[slotId] = invPart.partId;
        frame.parts[slotId] = {
            id: slotId,
            name: partTemplate.name,
            hp: invPart.hp ?? partTemplate.maxHp,
            maxHp: partTemplate.maxHp,
            integrity: partTemplate.integrity,
            status: 'operational',
            condition: invPart.condition ?? 1.0
        };

        // Remove from inventory
        this.state.player.partsInventory.splice(invIndex, 1);

        Log.add(`[SYSTEM] Installed ${partTemplate.name} in slot [${slotId.toUpperCase()}].`, 'system');
        this.state.recalculateFrameStats();
    },

    equipItem(slotId, itemId) {
        const frame = this.state.player.frame;
        if (!frame.installedEquip) frame.installedEquip = {};
        const chassis = this.state.get(frame.chassisId);

        if (itemId && chassis && chassis.equipSlots && chassis.equipSlots[slotId]) {
            const slotRules = chassis.equipSlots[slotId];
            const newItem = this.state.get(itemId);

            if (newItem && slotRules.maxTier && newItem.tier > slotRules.maxTier) {
                Log.add(`[ERROR] ${chassis.name} cannot support Tier ${newItem.tier} equipment in ${slotId.toUpperCase()}.`, 'error');
                return;
            }
        }

        // Unequip current
        if (frame.installedEquip[slotId]) {
            const oldItem = this.state.get(frame.installedEquip[slotId]);
            if (oldItem) oldItem.equipped = false;
        }

        if (itemId) {
            frame.installedEquip[slotId] = itemId;
            const newItem = this.state.get(itemId);
            if (newItem) newItem.equipped = true;
            Log.add(`[SYSTEM] Installed ${newItem.name || itemId} in slot [${slotId.toUpperCase()}].`, 'system');
        } else {
            frame.installedEquip[slotId] = null;
            Log.add(`[SYSTEM] Cleared slot [${slotId.toUpperCase()}].`, 'system');
        }
    },

    syncFrameSlots() {
        const frame = this.state.player.frame;
        const chassis = this.state.get(frame.chassisId);
        if (!chassis || !chassis.equipSlots) return;

        if (!frame.installedEquip) frame.installedEquip = {};

        // Keep existing equipment if the slot still exists, delete if it doesn't
        for (const existingSlot of Object.keys(frame.installedEquip)) {
            if (!chassis.equipSlots[existingSlot]) {
                const oldItemId = frame.installedEquip[existingSlot];
                if (oldItemId) {
                    const oldItem = this.state.get(oldItemId);
                    if (oldItem) oldItem.equipped = false;
                }
                delete frame.installedEquip[existingSlot];
            }
        }

        // Initialize new slots to null
        for (const slotId of Object.keys(chassis.equipSlots)) {
            if (frame.installedEquip[slotId] === undefined) {
                frame.installedEquip[slotId] = null;
            }
        }

        // Recalculate frame stats to apply changes
        this.state.recalculateFrameStats();
    },

    /**
     * Development Cheat: Unlock all available content instantly
     * Extremely useful for debugging late-game UI or content
     */
    devUnlockAll() {
        Log.add('SYS> EXECUTING PROTOCOL OMEGA: DEVELOPER OVERRIDE', 'system');

        if (!this.state || !this.state.items) return;

        const items = Object.values(this.state.items);

        // 1. Give massive resources
        items.filter(i => i.type === 'resource').forEach(r => {
            if (r.id === 'space') {
                r.val = 0;
                r.max = 999; // Give infinite space for dev testing
            } else {
                r.max = 999999;
                r.val = 999999;
            }
        });

        // 2. Unlock all tasks & upgrades
        items.forEach(i => {
            if (i.locked) i.locked = false;
        });

        // 3. Activate K.I.T.A. max level
        this.state.android.active = true;
        this.state.android.level = 10;
        this.state.android.energy = 500;
        this.state.android.maxEnergy = 500;
        this.state.android.efficiency = 2.0;

        // 4. Give all Blueprints & parts
        items.filter(i => i.type === 'blueprint' || i.type === 'part' || i.type === 'weapon').forEach(i => {
            if (i.max !== undefined && i.owned !== undefined) i.owned = i.max;
            else if (i.owned !== undefined) i.owned = 10;
        });

        // 5. Max all skills
        items.filter(i => i.type === 'skill').forEach(i => {
            i.val = i.max || 10;
        });

        // 6. Max all faction reputation (set on underlying items, not g. proxy)
        const repKeys = ['rep_scavengers', 'rep_corporation', 'rep_underground', 'rep_military', 'rep_exile', 'rep_corporate'];
        for (const key of repKeys) {
            const res = this.state.items[key];
            if (res) { res.val = 1000; if (res.max !== undefined) res.max = 9999; }
        }

        // Add Mecha frames
        if (this.state.items.chassis_light) this.state.items.chassis_light.owned = 1;
        if (this.state.items.frame_light_r1) this.state.items.frame_light_r1.owned = 1;

        // Apply tech tree again just in case
        this.techTree.recheck(items);

        // 7. Complete all missions (so g.msn_xxx>0 require gates pass)
        items.filter(i => i.type === 'mission').forEach(m => {
            if (!m.completed) m.completed = 1;
        });

        // 8. Activate prestige gate for testing
        this.state.prestige.gateCompleted = true;
        this._onGrandpaDeath();

        // Re-run unlock check after mission completion flags are set
        this.techTree.recheck(items);

        console.log("Developer Unlock executed.");
    }
};

export default Game;
