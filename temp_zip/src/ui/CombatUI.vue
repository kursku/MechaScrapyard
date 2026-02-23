<script>
import Game from "@/game";
import { fmt, pct } from '@/util/format';
import { TOKEN_DEFS } from '@/modules/combatRunner';

export default {
    name: 'CombatUI',
    props: ['state'],
    computed: {
        combat() {
            return this.state.activeCombat;
        },
        player() {
            return this.state.player;
        },
        enemy() {
            return this.combat.enemy;
        },
        playerFrame() {
            return this.player.frame;
        },
        enemyParts() {
            return this.enemy ? Object.values(this.enemy.parts) : [];
        },
        playerParts() {
            return Object.values(this.playerFrame.parts);
        },
        activeManeuvers() {
            return (this.playerFrame.maneuvers || []).filter(m => m.category === 'Active');
        }
    },
    methods: {
        fmt, pct,
        tokenDef(type) {
            return TOKEN_DEFS[type] || { icon: '?', color: '#fff', desc: '' };
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
            return {
                width: p + '%',
                backgroundColor: p > 50 ? '#ff3333' : '#00afff'
            };
        },
        attack(partId) {
            if (this.combat.phase !== 'player_turn') return;
            Game.combat.resolveAttack(this.playerFrame, this.enemy, partId);
            // After attack, if enemy still alive, move to enemy turn
            if (this.enemy.parts.torso.hp > 0) {
                this.combat.phase = 'enemy_turn';
                setTimeout(() => this.enemyTurn(), 1000);
            } else {
                this.combat.phase = 'win';
                Game.combat.resolveEndCombat(this.playerFrame, this.enemy);
            }
        },
        enemyTurn() {
            // Simplified enemy turn
            Game.combat.resolveAttack(this.enemy, this.playerFrame, 'auto');
            Game.combat.maintenancePhase(this.enemy);
            Game.combat.maintenancePhase(this.playerFrame);
            
            if (this.playerFrame.parts.torso.hp <= 0) {
                this.combat.phase = 'lose';
            } else {
                this.combat.phase = 'player_turn';
                this.combat.turn++;
            }
        },
        closeCombat() {
            this.combat.active = false;
            this.combat.phase = 'idle';
        },
        useManeuver(m) {
            if (this.combat.phase !== 'player_turn' || (m.cooldown > 0)) return;
            Game.combat.executeManeuver(this.playerFrame, m);
        }
    }
};
</script>

<template>
    <div class="combat-overlay" v-if="combat.active">
        <div class="combat-grid">
            <!-- ENEMY PANEL -->
            <div class="combat-panel enemy-side">
                <div class="panel-header flex-between">
                    <span>TARGET: {{ enemy.name.toUpperCase() }}</span>
                    <div class="tokens-row">
                        <template v-for="t in (enemy.tokens || [])" :key="t.type">
                            <span class="token-tag" 
                                  :style="{ color: tokenDef(t.type).color, borderColor: tokenDef(t.type).color }" 
                                  :title="tokenDef(t.type).desc">
                                {{ tokenDef(t.type).icon }} {{ t.stacks }}
                            </span>
                        </template>
                    </div>
                </div>
                <div class="parts-grid">
                    <div v-for="part in enemyParts" :key="part.id" 
                         class="part-card" 
                         :class="{ 'targetable': combat.phase === 'player_turn', 'destroyed': part.hp <= 0 }"
                         @click="attack(part.id)">
                        <div class="part-info">
                            <span class="part-name">{{ part.name }}</span>
                            <span class="part-hp">{{ Math.floor(part.hp) }}/{{ part.maxHp }}</span>
                        </div>
                        <div class="hp-bar-bg">
                            <div class="hp-bar-fill" :style="renderHPBar(part)"></div>
                        </div>
                        <div class="integrity-dots">
                             <span v-for="i in part.integrity" :key="i" class="dot"></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PLAYER PANEL -->
            <div class="combat-panel player-side">
                <div class="panel-header flex-between">
                    <span>PILOT: {{ player.name.toUpperCase() }}</span>
                    <div class="tokens-row">
                        <template v-for="t in (playerFrame.tokens || [])" :key="t.type">
                            <span class="token-tag" 
                                  :style="{ color: tokenDef(t.type).color, borderColor: tokenDef(t.type).color }" 
                                  :title="tokenDef(t.type).desc">
                                {{ tokenDef(t.type).icon }} {{ t.stacks }}
                            </span>
                        </template>
                    </div>
                </div>
                
                <!-- MANEUVERS DECK -->
                <div class="maneuvers-deck">
                    <div class="deck-label">ACTIVE_MANEUVERS</div>
                    <div class="maneuver-list">
                        <div v-for="m in activeManeuvers" :key="m.id" 
                             class="maneuver-btn" 
                             :class="{ 'disabled': m.cooldown > 0 }"
                             @click="useManeuver(m)">
                            <div class="m-info">
                                <span class="m-name">{{ m.name.toUpperCase() }}</span>
                                <span class="m-cost" v-if="m.heat_cost">{{ m.heat_cost }}% HEAT</span>
                                <span class="m-cost" v-if="m.stress_cost">{{ m.stress_cost }}% STRESS</span>
                            </div>
                            <div class="m-desc">{{ m.desc }}</div>
                            <div v-if="m.cooldown > 0" class="m-cooldown">CD: {{ m.cooldown }}</div>
                        </div>
                    </div>
                </div>

                <div class="stats-row">
                    <div class="stat-group">
                        <label>HEAT</label>
                        <div class="stat-bar-bg"><div class="stat-bar-fill" :style="renderHeatBar()"></div></div>
                        <span class="stat-val">{{ Math.floor(playerFrame.heat) }}%</span>
                    </div>
                    <div class="stat-group">
                        <label>STRESS</label>
                        <div class="stat-bar-bg"><div class="stat-bar-fill" :style="renderStressBar()"></div></div>
                        <span class="stat-val">{{ Math.floor(playerFrame.stress) }}%</span>
                    </div>
                </div>
                <div class="parts-grid">
                    <div v-for="part in playerParts" :key="part.id" class="part-card" :class="{ 'destroyed': part.hp <= 0 }">
                        <div class="part-info">
                            <span class="part-name">{{ part.name }}</span>
                            <span class="part-hp">{{ Math.floor(part.hp) }}/{{ part.maxHp }}</span>
                        </div>
                        <div class="hp-bar-bg">
                            <div class="hp-bar-fill" :style="renderHPBar(part)"></div>
                        </div>
                         <div class="integrity-dots">
                             <span v-for="i in part.integrity" :key="i" class="dot dot-player"></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CONTROLS / MSG -->
            <div class="combat-footer">
                <div class="phase-indicator" :class="combat.phase">
                    {{ combat.phase.replace('_', ' ').toUpperCase() }}
                </div>
                <div v-if="combat.phase === 'player_turn'" class="hint-text">
                    CLICK ON ENEMY PART TO ATTACK
                </div>
                <div v-if="combat.phase === 'win' || combat.phase === 'lose'" class="post-combat">
                    <button class="btn-action" @click="closeCombat">RETURN TO BASE</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.combat-overlay {
    position: fixed;
    inset: 0;
    background: rgba(8, 10, 12, 0.95);
    z-index: 9000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
}

.combat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr auto;
    gap: 20px;
    width: 90%;
    max-width: 1000px;
    height: 80vh;
}

.combat-panel {
    background: rgba(13, 17, 23, 0.8);
    border: 1px solid var(--border-dim);
    padding: 20px;
    display: flex;
    flex-direction: column;
}

.panel-header {
    font-size: 14px;
    color: var(--secondary);
    border-bottom: 1px solid var(--border-dim);
    padding-bottom: 10px;
    margin-bottom: 15px;
    letter-spacing: 2px;
}

.maneuvers-deck {
    margin-bottom: 20px;
    background: rgba(0, 255, 65, 0.02);
    border: 1px solid rgba(0, 255, 65, 0.1);
    padding: 10px;
}

.deck-label {
    font-size: 10px;
    color: var(--secondary);
    margin-bottom: 8px;
    letter-spacing: 1px;
}

.maneuver-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.maneuver-btn {
    background: rgba(13, 17, 23, 0.6);
    border: 1px solid var(--border-dim);
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
}

.maneuver-btn:hover:not(.disabled) {
    border-color: var(--primary);
    background: rgba(0, 255, 65, 0.05);
}

.maneuver-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-style: dotted;
}

.m-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.m-name { font-size: 11px; font-weight: bold; color: var(--primary); }
.m-cost { font-size: 9px; color: var(--cta); font-weight: bold; }
.m-desc { font-size: 10px; color: var(--text-dim); line-height: 1.2; }
.m-cooldown {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--cta);
    color: #fff;
    font-size: 9px;
    padding: 1px 4px;
}

.parts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
}

.part-card {
    background: rgba(18, 24, 31, 0.6);
    border: 1px solid var(--border-dim);
    padding: 10px;
    position: relative;
    transition: all 0.2s;
}

.part-card.targetable:hover {
    border-color: var(--primary);
    background: rgba(0, 255, 65, 0.05);
    cursor: crosshair;
}

.part-info {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin-bottom: 8px;
}

.hp-bar-bg { height: 4px; background: #000; margin-bottom: 5px; }
.hp-bar-fill { height: 100%; transition: width 0.3s; }

.integrity-dots { display: flex; gap: 3px; }
.dot { width: 5px; height: 5px; background: var(--secondary); border-radius: 50%; }
.dot-player { background: var(--story); }

.flex-between { display: flex; justify-content: space-between; align-items: center; }

.tokens-row { display: flex; gap: 5px; }
.token-tag {
    font-size: 10px;
    background: rgba(0,0,0,0.4);
    border: 1px solid var(--border-dim);
    padding: 1px 4px;
    border-radius: 2px;
}

.hint-text {
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 1px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
}

.stats-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}

.stat-group {
    flex: 1;
}

.stat-group label { font-size: 10px; color: var(--text-dim); display: block; margin-bottom: 4px; }
.stat-bar-bg { height: 6px; background: #000; margin-bottom: 4px; }
.stat-bar-fill { height: 100%; transition: width 0.3s; }
.stat-val { font-size: 10px; color: #fff; }

.combat-footer {
    grid-column: span 2;
    background: rgba(13, 17, 23, 0.9);
    border: 1px solid var(--border-dim);
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.phase-indicator {
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 4px;
}

.player_turn { color: var(--primary); }
.enemy_turn { color: var(--error); }
.win { color: var(--primary); text-shadow: 0 0 10px var(--primary); }
.lose { color: var(--error); text-shadow: 0 0 10px var(--error); }

.btn-action {
    background: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);
    padding: 10px 20px;
    font-family: var(--font-mono);
    cursor: pointer;
    font-weight: bold;
}

.btn-action:hover {
    background: var(--primary);
    color: #000;
}

.destroyed {
    opacity: 0.4;
    filter: grayscale(1);
    border-style: dashed;
}
</style>
