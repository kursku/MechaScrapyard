import { clamp } from '@/util/format';
import Log from '@/log';

/**
 * Runner — manages the active task and recipe.
 * Follows Arcanum's runner pattern.
 */
export default class Runner {

    constructor(state) {
        this.state = state;
        this.activeTask = null;
        this.taskProgress = 0;
        this.activeRecipe = null;
        this.recipeProgress = 0;
        this.androidSlot = null; // { taskId, progress }
    }

    /** Exposes both operator slots for template access. */
    get slots() {
        return {
            kenji: this.activeTask
                ? { taskId: this.activeTask.id, progress: this.taskProgress }
                : null,
            android: this.androidSlot,
        };
    }

    startAndroidTask(taskId) {
        const task = this.state.items[taskId];
        if (!task || task.locked) return false;
        if (this.androidSlot) this.stopAndroidTask();
        this.androidSlot = { taskId, progress: 0 };
        Log.add(`[ANDROID] Started: ${task.name}`, 'action');
        return true;
    }

    stopAndroidTask() {
        if (!this.androidSlot) return;
        const name = this.state.items[this.androidSlot.taskId]?.name || this.androidSlot.taskId;
        Log.add(`[ANDROID] Halted: ${name}`, 'action');
        this.androidSlot = null;
    }

    /**
     * Start a task.
     * @param {Object} task - Task data object
     * @returns {boolean}
     */
    startTask(task) {
        if (!task || task.locked) return false;

        // Pay upfront cost
        if (task.cost) {
            if (!this.state.payCost(task.cost)) {
                Log.add(`✗ Insufficient resources for ${task.name}.`, 'error');
                return false;
            }
        }

        this.activeTask = task;
        this.taskProgress = 0;
        this._waitingForChoice = false;
        Log.add(`▶ Started: ${task.name}`, 'action');
        return true;
    }

    /**
     * Stop the active task.
     */
    stopTask() {
        if (this.activeTask) {
            Log.add(`■ Stopped: ${this.activeTask.name}`, 'action');
        }
        this.activeTask = null;
        this.taskProgress = 0;
        this._waitingForChoice = false;
    }

    /**
     * Start a recipe in the refinery.
     */
    startRecipe(recipe) {
        if (!recipe || recipe.locked || this.activeRecipe) return false;
        if (!this.state.payCost(recipe.cost)) return false;

        this.activeRecipe = recipe;
        this.recipeProgress = 0;
        Log.add(`▶ Refining: ${recipe.name.replace('Refine: ', '')}`, 'action');
        return true;
    }

    /**
     * Gets the speed multiplier for a task.
     * Future-proofing for action-speed upgrades.
     */
    getTaskSpeed(task) {
        let speed = 1.0;
        if (task.tags) {
            const tagArray = Array.isArray(task.tags) ? task.tags : [task.tags];
            tagArray.forEach(tag => {
                const statName = tag.replace('t_', '') + '_speed';
                if (this.state.items[statName]) {
                    speed += this.state.items[statName].val || 0;
                }
            });
        }
        return Math.max(0.1, speed);
    }

    /**
     * Update runner for one tick.
     * @param {number} dt - Delta time in seconds
     * @returns {{ taskCompleted: boolean, recipeCompleted: boolean, lootDrops: string[] }}
     */
    update(dt) {
        const result = { taskCompleted: false, recipeCompleted: false, lootDrops: [] };

        // --- Active Task ---
        if (this.activeTask) {
            const task = this.activeTask;

            // Pay run costs
            if (task.run) {
                let canPay = true;
                for (const [k, v] of Object.entries(task.run)) {
                    const res = this.state.items[k];
                    if (!res || res.val < v * dt) { canPay = false; break; }
                }

                if (canPay) {
                    for (const [k, v] of Object.entries(task.run)) {
                        const res = this.state.items[k];
                        if (res) res.val = clamp(res.val - v * dt, 0, res.max);
                    }
                    // Apply effects
                    if (task.effect) {
                        for (const [k, v] of Object.entries(task.effect)) {
                            const res = this.state.items[k];
                            if (res && !res.locked) res.val = clamp(res.val + v * dt, 0, res.max);
                        }
                    }
                } else {
                    Log.add('⚡ Energy depleted — task stopped.', 'error');
                    this.stopTask();
                    return result;
                }
            }

            // Progress timed tasks
            if (!task.perpetual && task.length) {
                const speed = this.getTaskSpeed(task);
                this.taskProgress += dt * speed;
                if (this.taskProgress >= task.length) {
                    // If it has choices and NO choice has been made yet, we PAUSE completion?
                    // For simplified mecha, let's assume choices are made UPFRONT or it's a "Wait for choice" state.
                    // Actually, let's keep it simple: if it has choices, the UI will handle the choice which then calls award().
                    if (task.choices) {
                        // Task stays at 100% until choice is made.
                        this.taskProgress = task.length;

                        // Fire external UI hook to pop the modal
                        if (!this._waitingForChoice) {
                            this._waitingForChoice = true;
                            if (this.state.showChoiceDialogue) {
                                this.state.showChoiceDialogue(
                                    'unknown',
                                    [task.desc],
                                    task.choices,
                                    (choice) => {
                                        this._waitingForChoice = false;
                                        this.fulfillChoice(task, choice);
                                    }
                                );
                            } else {
                                Log.add('✗ Missing UI hook for dialogue.', 'error');
                            }
                        }
                    } else {
                        this.completeTask(task, result);
                    }
                }
            }

            // Automated skill exp (for perpetual tasks or during timed tasks)
            this._handleSkillExp(task, dt);
        }

        // --- Android Slot ---
        if (this.androidSlot) {
            const aSlot = this.androidSlot;
            const aTask = this.state.items[aSlot.taskId];
            if (!aTask) {
                this.androidSlot = null;
            } else {
                // Pay run costs from the shared energy pool
                if (aTask.run) {
                    let canPay = true;
                    for (const [k, v] of Object.entries(aTask.run)) {
                        const res = this.state.items[k];
                        if (!res || res.val < v * dt) { canPay = false; break; }
                    }
                    if (canPay) {
                        for (const [k, v] of Object.entries(aTask.run)) {
                            const res = this.state.items[k];
                            if (res) res.val = clamp(res.val - v * dt, 0, res.max);
                        }
                        if (aTask.effect) {
                            for (const [k, v] of Object.entries(aTask.effect)) {
                                const res = this.state.items[k];
                                if (res && !res.locked) res.val = clamp(res.val + v * dt, 0, res.max);
                            }
                        }
                    } else {
                        Log.add('[ANDROID] Energy depleted — task halted.', 'error');
                        this.androidSlot = null;
                    }
                }
                // Progress timed tasks; perpetual tasks run indefinitely
                if (this.androidSlot && !aTask.perpetual && aTask.length) {
                    const speed = this.getTaskSpeed(aTask);
                    aSlot.progress += dt * speed;
                    if (aSlot.progress >= aTask.length) {
                        this.state.award(aTask.result);
                        Log.add(`[ANDROID] Task complete: ${aTask.name}`, 'success');
                        result.taskCompleted = true;
                        this.androidSlot = null;
                    }
                }
            }
        }

        // --- Active Recipe ---
        if (this.activeRecipe) {
            const recipe = this.activeRecipe;
            const recipeSpeed = 1 + (this.state.items['recipe_speed']?.val || 0);
            this.recipeProgress += dt * recipeSpeed;
            if (this.recipeProgress >= recipe.length) {
                this.state.award(recipe.result);
                Log.add(`✓ Refined: ${recipe.name.replace('Refine: ', '')}`, 'success');
                result.recipeCompleted = true;
                this.activeRecipe = null;
                this.recipeProgress = 0;
            }
        }

        return result;
    }

    completeTask(task, result) {
        this.state.award(task.result);

        // Roll loot
        if (task.loot) {
            for (const [bpId, chance] of Object.entries(task.loot)) {
                if (Math.random() < chance) {
                    result.lootDrops.push(bpId);
                }
            }
        }

        if (task.onComplete) {
            result.onComplete = task.onComplete;
        }

        Log.add(`✓ ${task.name} complete.`, 'success');
        result.taskCompleted = true;
        this.activeTask = null;
        this.taskProgress = 0;
    }

    fulfillChoice(task, choice) {
        Log.add(`◈ DECISION: ${choice.name}`, 'story');
        if (choice.desc) Log.add(choice.desc, 'story');
        this.state.award(choice.result);

        this.activeTask = null;
        this.taskProgress = 0;
    }

    _handleSkillExp(task, dt) {
        if (!task.tags) return;

        // Mapping tags to skills (tag → primary skill trained)
        const tagMap = {
            't_scrapyard':   'skill_gathering',
            't_income':      'skill_social',
            't_exploration': 'skill_investigation',
            't_recipe':      'skill_crafting',
            // Secondary mappings: scrapyard repair builds mecha tech; exploration builds hacking
            // Additional entries below are handled separately to allow multi-skill from one tag
        };
        // Secondary skill training (same tag, different skill, half rate)
        const tagMapSecondary = {
            't_scrapyard':   'skill_mecha_tech',
            't_exploration': 'skill_hacking',
        };

        const trainSpeed = 1 + (this.state.items['skill_train_speed']?.val || 0);
        for (const [tag, skillId] of Object.entries(tagMap)) {
            if (task.tags.includes(tag)) {
                const skill = this.state.items[skillId];
                if (skill && !skill.locked) {
                    const oldVal = skill.val;
                    // Skills grow slowly. 0.01 per second, boosted by pilot_sim (skill_train_speed).
                    skill.val = clamp(skill.val + 0.01 * trainSpeed * dt, 0, skill.max);
                    this._checkSkillPointThresholds(skill, oldVal);
                }
            }
        }
        // Secondary skills train at half rate from the same tags
        for (const [tag, skillId] of Object.entries(tagMapSecondary)) {
            if (task.tags.includes(tag)) {
                const skill = this.state.items[skillId];
                if (skill && !skill.locked) {
                    const oldVal = skill.val;
                    skill.val = clamp(skill.val + 0.005 * trainSpeed * dt, 0, skill.max);
                    this._checkSkillPointThresholds(skill, oldVal);
                }
            }
        }

        // Pilot stat growth from task activity (slow, logarithmic scaling)
        // These stats are otherwise unreachable outside combat, giving every
        // play style a path to the T4 sub-skills that gate on them.
        const statTrainMap = {
            't_income':      'charisma',  // Dealmaking builds social aptitude
            't_recipe':      'focus',     // Crafting precision builds focus
            't_exploration': 'neuro',     // Exploration rewards lateral thinking
        };
        for (const [tag, statId] of Object.entries(statTrainMap)) {
            if (task.tags.includes(tag)) {
                const stat = this.state.items[statId];
                if (stat && stat.type === 'player_stat') {
                    const scale = 1 / (1 + stat.val / 50);
                    stat.val = Math.min(stat.max || 100, stat.val + 0.001 * trainSpeed * dt * scale);
                }
            }
        }
    }

    /**
     * Award skill points when a parent skill crosses a threshold value.
     * Thresholds at 4, 8, 12, 16, 20 (5 points per skill, 35 total across 7 skills).
     * @param {Object} skill - The skill item whose val just changed
     * @param {number} oldVal - Value before the increment
     */
    _checkSkillPointThresholds(skill, oldVal) {
        const thresholds = [4, 8, 12, 16, 20];
        const sp = this.state.items['skill_points'];
        if (!sp) return;
        for (const t of thresholds) {
            if (oldVal < t && skill.val >= t) {
                sp.val = Math.min(sp.max || 99, sp.val + 1);
                Log.add(`★ Skill Point earned! (${skill.name} reached ${t})`, 'reward');
            }
        }
    }

    toJSON() {
        return {
            activeTask: this.activeTask?.id || null,
            taskProgress: this.taskProgress,
            activeRecipe: this.activeRecipe?.id || null,
            recipeProgress: this.recipeProgress,
            androidSlot: this.androidSlot
                ? { taskId: this.androidSlot.taskId, progress: this.androidSlot.progress }
                : null,
        };
    }

    fromJSON(data, items) {
        if (!data) return;
        if (data.activeTask && items[data.activeTask]) {
            this.activeTask = items[data.activeTask];
            this.taskProgress = data.taskProgress || 0;
        }
        if (data.activeRecipe && items[data.activeRecipe]) {
            this.activeRecipe = items[data.activeRecipe];
            this.recipeProgress = data.recipeProgress || 0;
        }
        if (data.androidSlot && items[data.androidSlot.taskId]) {
            this.androidSlot = { taskId: data.androidSlot.taskId, progress: data.androidSlot.progress || 0 };
        }
    }
}
