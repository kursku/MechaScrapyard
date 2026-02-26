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

        // Mapping tags to skills
        const tagMap = {
            't_scrapyard': 'skill_gathering',
            't_income': 'skill_social',
            't_exploration': 'skill_investigation',
            't_recipe': 'skill_crafting'
        };

        for (const [tag, skillId] of Object.entries(tagMap)) {
            if (task.tags.includes(tag)) {
                const skill = this.state.items[skillId];
                if (skill && !skill.locked) {
                    // Skills grow slowly. 0.01 per second?
                    skill.val = clamp(skill.val + 0.01 * dt, 0, skill.max);
                }
            }
        }
    }

    toJSON() {
        return {
            activeTask: this.activeTask?.id || null,
            taskProgress: this.taskProgress,
            activeRecipe: this.activeRecipe?.id || null,
            recipeProgress: this.recipeProgress,
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
    }
}
