<script>
import Game from "@/game";
import { fmt, pct } from '@/util/format';

export default {
    name: 'CombatPanel',
    props: ['state', 'combatRunner'],
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
        },
        showBattle() {
            // IMPORTANT: after endCombat(), active becomes false immediately.
            // We still want to show the battle screen so the player can see the result banner.
            return this.isInCombat || !!this.combatResult;
        },
        allManeuvers() {
            return Object.values(this.state.items).filter(i => i.type === 'maneuver');
        },
        ownedManeuvers() {
            return this.allManeuvers.filter(i => i.owned > 0);
        },
        shopManeuvers() {
            return this.allManeuvers.filter(i => i.owned === 0 && !i.locked);
        },
        equippedIds() {
            return this.combatRunner.equippedManeuvers || [];
        }
    },
    methods: {
        fmt, pct,
        startMission(mid) {
            Game.startMission(mid);
        },
        retreat() {
            Game.combatRunner.endCombat('defeat');
        },
        continueAfterCombat() {
            // Return to mission list
            this.combatRunner.result = null;
            this.combatRunner.combatLog = [];
        },
        buyManeuver(id) {
            Game.buyManeuver(id);
        },
        toggleEquip(id) {
            let list = [...this.equippedIds];
            if (list.includes(id)) {
                list = list.filter(i => i !== id);
            } else {
                if (list.length >= 3) return;
                list.push(id);
            }
            Game.equipManeuvers(list);
        },
        renderHPBar(part) {
            const p = (part.hp / part.maxHp) * 100;
            return {
                width: p + '%',
                backgroundColor: p < 25 ? '#ff3333' : (p < 50 ? '#ffcc00' : '#00ff41')
            };
        },
        renderHeatBar() {
            const p = (this.playerFrame.heat || 0);
            return {
                width: p + '%',
                backgroundColor: p > 75 ? '#ff3333' : '#ff9900'
            };
        },
        renderStressBar() {
            const p = (this.playerFrame.stress || 0);
            const grt = this.state.items['grit']?.val || 1;
            const stressCap = 20 + (grt * 2);
            const pctVal = (p / stressCap) * 100;
            return {
                width: pctVal + '%',
                backgroundColor: pctVal > 75 ? '#ff3333' : '#00afff'
            };
        }
    }
};
</script>

<template>
    <div class="combat-panel-container">
        <!-- PRE-COMBAT INTERFACE -->
        <div v-if="!showBattle" class="pre-combat-grid">
            <!-- MISSION LIST -->
            <div class="mission-list column-panel">
                <div class="hud-section-title">> AVAILABLE MISSIONS</div>
                <div v-for="m in missions" :key="m.id" 
                     class="mission-card"
                     @click="startMission(m.id)">
                    <div class="mission-main">
                        <div class="mission-name">{{ m.name.toUpperCase() }}</div>
                        <div class="mission-difficulty">
                            <span v-for="i in (m.difficulty || 1)" :key="i">★</span>
                        </div>
                    </div>
                    <div class="mission-desc">{{ m.desc }}</div>
                    <div class="mission-footer">
                        <span class="cost">COST: {{ m.cost?.energy || 0 }} ENR</span>
                        <span class="rewards">REWARDS: {{ m.rewards?.glory || 0 }} GLORY</span>
                    </div>
                </div>
                <div v-if="missions.length === 0" class="empty-msg">
                    No missions available. Continue your exploration...
                </div>
            </div>

            <!-- LOADOUT & SHOP -->
            <div class="loadout-shop column-panel">
                <!-- LOADOUT -->
                <div class="loadout-section">
                    <div class="hud-section-title">> CURRENT LOADOUT [{{ equippedIds.length }}/3]</div>
                    <div class="maneuver-grid">
                        <div v-for="m in ownedManeuvers" :key="m.id" 
                             class="maneuver-mini-card" 
                             :class="{ 'equipped': equippedIds.includes(m.id) }"
                             @click="toggleEquip(m.id)">
                            <div class="mnvr-header">
                                <span class="mnvr-name">{{ m.name.toUpperCase() }}</span>
                                <span class="mnvr-type">{{ m.maneuverType.toUpperCase() }}</span>
                            </div>
                            <div class="mnvr-desc">{{ m.desc }}</div>
                        </div>
                    </div>
                </div>

                <!-- SHOP -->
                <div class="shop-section" v-if="shopManeuvers.length > 0">
                    <div class="hud-section-title">> MANEUVER SHOP</div>
                    <div class="maneuver-grid">
                        <div v-for="m in shopManeuvers" :key="m.id" class="maneuver-mini-card shop-item">
                            <div class="mnvr-header">
                                <span class="mnvr-name">{{ m.name.toUpperCase() }}</span>
                                <span class="cost">{{ m.cost?.glory || 0 }} GLORY</span>
                            </div>
                            <div class="mnvr-desc">{{ m.desc }}</div>
                            <button class="btn-buy" @click="buyManeuver(m.id)">UNLOCK</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BATTLE VIEW (stays visible on result) -->
        <div v-else class="battle-view">
            <div class="battle-grid">
                <!-- PLAYER FRAME -->
                <div class="frame-status player-side">
                    <div class="frame-header">PILOT: {{ state.player.name.toUpperCase() }}</div>
                    <div class="parts-list">
                        <div v-for="part in Object.values(playerFrame.parts)" :key="part.id" 
                             class="part-row" :class="{ 'destroyed': part.status === 'destroyed' }">
                            <div class="part-label">{{ part.name.toUpperCase() }}</div>
                            <div class="part-integrity">
                                <span v-for="i in part.integrity" :key="i" class="dot"></span>
                            </div>
                            <div class="part-hp-bar">
                                <div class="hp-fill" :style="renderHPBar(part)"></div>
                            </div>
                            <div class="part-val">{{ Math.floor(part.hp) }}/{{ part.maxHp }}</div>
                        </div>
                    </div>
                    <div class="vitals-row">
                        <div class="vital">
                            <label>HEAT</label>
                            <div class="vital-bar heat"><div class="vital-fill" :style="renderHeatBar()"></div></div>
                            <span>{{ Math.floor(playerFrame.heat || 0) }}%</span>
                        </div>
                        <div class="vital">
                            <label>STRESS</label>
                            <div class="vital-bar stress"><div class="vital-fill" :style="renderStressBar()"></div></div>
                            <span>{{ Math.floor(playerFrame.stress || 0) }}</span>
                        </div>
                    </div>
                </div>

                <!-- ENEMIES -->
                <div
                    class="frame-status enemy-side"
                    v-for="(enemy, idx) in currentEnemies"
                    :key="enemy.id || enemy.name || idx"
                >
                    <div class="frame-header">TARGET: {{ (enemy.name || 'UNKNOWN').toUpperCase() }}</div>
                    <div class="parts-list">
                        <div v-for="part in Object.values(enemy.parts || {})" :key="part.id" 
                             class="part-row" :class="{ 'destroyed': part.status === 'destroyed' }">
                            <div class="part-label">{{ part.name.toUpperCase() }}</div>
                            <div class="part-integrity">
                                <span v-for="i in part.integrity" :key="i" class="dot"></span>
                            </div>
                            <div class="part-hp-bar">
                                <div class="hp-fill" :style="renderHPBar(part)"></div>
                            </div>
                            <div class="part-val">{{ Math.floor(part.hp) }}/{{ part.maxHp }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- BATTLE LOG -->
            <div class="battle-log">
                <div v-for="(log, idx) in combatRunner.combatLog.slice(-10)" :key="idx" class="log-entry">
                    > {{ log }}
                </div>
            </div>

            <div class="battle-footer">
                <div class="turn-info">TURN {{ combatRunner.turnNumber }}</div>
                <button class="btn-retreat" :disabled="!!combatResult" @click="retreat">
                    RETREAT
                </button>
            </div>

            <!-- RESULT BANNER OVERLAY -->
            <div v-if="combatResult" class="result-overlay" :class="combatResult">
                <div class="result-title">{{ combatResult.toUpperCase() }}</div>
                <div class="result-sub">
                    <span v-if="combatResult === 'victory'">Mission objectives completed. Salvage recovered.</span>
                    <span v-else>Mission failed. Partial salvage recovered.</span>
                </div>
                <button class="hud-btn" @click="continueAfterCombat">CONTINUE</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.combat-panel-container {
    padding: 10px;
    font-family: var(--font-mono);
    position: relative;
}

.mission-card {
    border: 1px solid var(--border-dim);
    padding: 12px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.mission-card:hover {
    border-color: var(--primary);
    background: rgba(0, 255, 65, 0.05);
}

.mission-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.mission-name { font-weight: bold; color: var(--secondary); font-size: 14px; }
.mission-difficulty { color: #f5c542; letter-spacing: 2px; }
.mission-desc { font-size: 11px; color: var(--text-dim); margin-bottom: 8px; line-height: 1.2; }
.mission-footer { display: flex; gap: 20px; font-size: 10px; font-weight: bold; }
.cost { color: var(--error); }
.rewards { color: var(--primary); }

.battle-view {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
}

.battle-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.frame-status {
    background: rgba(13, 17, 23, 0.6);
    border: 1px solid var(--border-dim);
    padding: 10px;
}

.frame-header {
    font-size: 12px;
    color: var(--secondary);
    border-bottom: 1px solid var(--border-dim);
    padding-bottom: 5px;
    margin-bottom: 10px;
    letter-spacing: 1px;
}

.part-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 11px; }
.part-label { width: 70px; }
.part-integrity { display: flex; gap: 2px; width: 30px; }
.dot { width: 5px; height: 5px; background: var(--primary); border-radius: 50%; }
.part-hp-bar { flex: 1; height: 6px; background: #000; border: 1px solid #333; }
.hp-fill { height: 100%; transition: width 0.3s; }
.part-val { width: 50px; text-align: right; font-size: 10px; }

.vitals-row {
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px dashed var(--border-dim);
    display: flex;
    gap: 20px;
}

.vital { flex: 1; font-size: 10px; }
.vital label { display: block; margin-bottom: 3px; color: var(--text-dim); }
.vital-bar { height: 4px; background: #000; margin-bottom: 3px; }
.vital-fill { height: 100%; }
.heat .vital-fill { background: #f90; }
.stress .vital-fill { background: #f5f; }

.battle-log {
    height: 120px;
    border: 1px solid var(--border-dim);
    background: #000;
    padding: 8px;
    font-size: 11px;
    color: var(--primary);
    overflow-y: hidden;
}

.log-entry { margin-bottom: 2px; }

.battle-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.turn-info { font-size: 14px; font-weight: bold; border: 1px solid var(--primary); padding: 4px 10px; }

.btn-retreat {
    background: transparent;
    border: 1px solid var(--error);
    color: var(--error);
    padding: 5px 15px;
    font-family: inherit;
    cursor: pointer;
}

.btn-retreat:hover { background: var(--error); color: #000; }

.btn-retreat:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pre-combat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.column-panel {
    background: rgba(13, 17, 23, 0.4);
    border: 1px solid var(--border-dim);
    padding: 15px;
}

.maneuver-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
}

.maneuver-mini-card {
    border: 1px solid var(--border-dim);
    padding: 8px 12px;
    background: rgba(30, 40, 50, 0.3);
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}

.maneuver-mini-card:hover { border-color: var(--secondary); }

.maneuver-mini-card.equipped {
    border-color: var(--primary);
    background: rgba(0, 255, 65, 0.05);
}

.maneuver-mini-card.equipped::after {
    content: "EQUIPPED";
    position: absolute;
    top: 5px;
    right: 8px;
    font-size: 8px;
    color: var(--primary);
    font-weight: bold;
}

.mnvr-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.mnvr-name { font-size: 11px; font-weight: bold; color: var(--text); }
.mnvr-type { font-size: 9px; color: var(--text-dim); }
.mnvr-desc { font-size: 10px; color: var(--text-dim); line-height: 1.2; }

.shop-item { border-style: dashed; }
.btn-buy {
    margin-top: 8px;
    width: 100%;
    background: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);
    font-size: 10px;
    padding: 2px;
    cursor: pointer;
}
.btn-buy:hover { background: var(--primary); color: #000; }

.loadout-section { margin-bottom: 25px; }

.destroyed { opacity: 0.4; filter: grayscale(1); }

/* Result overlay */
.result-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.82);
    border: 1px solid var(--border-dim);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 18px;
}

.result-overlay.victory {
    border-color: var(--primary);
}

.result-overlay.defeat {
    border-color: var(--error);
}

.result-title {
    font-size: 26px;
    letter-spacing: 6px;
    font-weight: 900;
    color: var(--primary);
}

.result-overlay.defeat .result-title {
    color: var(--error);
}

.result-sub {
    font-size: 12px;
    color: var(--text-dim);
    text-align: center;
    max-width: 520px;
}
</style>