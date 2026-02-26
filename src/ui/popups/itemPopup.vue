<script>
import { reactive } from 'vue';
import Game from '@/game';

const state = reactive({
    visible: false,
    item: null,
    compare: null,
    x: 0,
    y: 0
});

export function RollOver(e, item, opts) {
    if (!item) return;
    state.item = item;
    state.compare = opts?.compare || null;
    state.visible = true;
    
    let cx = 0;
    let cy = 0;
    if (e && typeof e.clientX === 'number') {
        cx = e.clientX;
        cy = e.clientY;
    } else {
        cx = window.innerWidth / 2;
        cy = window.innerHeight / 2;
    }
    
    // Keep tooltip compact and always on-screen.
    const popupWidth = 260;
    const assumedMaxHeight = 360;
    const edgePadding = 10;

    let nextX = cx + 12;
    let nextY = cy + 12;

    if ((nextX + popupWidth) > (window.innerWidth - edgePadding)) {
        nextX = cx - popupWidth - 12;
    }
    if ((nextY + assumedMaxHeight) > (window.innerHeight - edgePadding)) {
        nextY = cy - assumedMaxHeight - 12;
    }

    nextX = Math.max(edgePadding, Math.min(nextX, window.innerWidth - popupWidth - edgePadding));
    nextY = Math.max(edgePadding, Math.min(nextY, window.innerHeight - assumedMaxHeight - edgePadding));

    state.x = nextX;
    state.y = nextY;
}

export function ItemOut() {
    state.visible = false;
    state.item = null;
    state.compare = null;
}

export default {
    setup() {
        const fmtRate = (val) => {
            if (Math.abs(val) < 0.01) return "";
            const sign = val >= 0 ? "+" : "-";
            const v = Math.abs(val);
            if (v >= 100) return sign + Math.floor(v);
            if (v >= 10) return sign + v.toFixed(1);
            return sign + v.toFixed(2);
        };

        const getNetRate = (res) => {
            let rate = res.rate || 0;
            if (rate > 0) {
                const focus = Game.state.get('focus')?.val || 0;
                rate *= (1 + focus * 0.05);
            }
            const activeTask = Game.runner.activeTask;
            if (activeTask) {
                if (activeTask.effect && activeTask.effect[res.id]) rate += activeTask.effect[res.id];
                if (activeTask.run && activeTask.run[res.id]) rate -= activeTask.run[res.id];
            }
            return rate;
        };

        const resourceIcon = (id) => {
            const ICONS = { scrap: '⚙', creds: '¢', energy: '⚡', nano_infra: '◈', ceramite: '◆', nanofiber: '≋' };
            return ICONS[id] || '•';
        };

        const fmtDelta = (a, b) => {
            const d = (a || 0) - (b || 0);
            if (d === 0) return '—';
            return (d > 0 ? '+' : '') + Math.round(d);
        };
        const deltaClass = (a, b) => (a || 0) >= (b || 0) ? 'delta-pos' : 'delta-neg';

        return { state, fmtRate, getNetRate, resourceIcon, fmtDelta, deltaClass, Game };
    }
}
</script>

<template>
    <div v-if="state.visible && state.item" 
         class="hud-popup" 
         :style="{ left: state.x + 'px', top: state.y + 'px' }">
        
        <!-- MANUFACTURER BANNER -->
        <div v-if="state.item.mfr && Game.state.items[state.item.mfr]" 
             class="popup-mfr-banner"
             :style="{ 
                 backgroundColor: Game.state.items[state.item.mfr].color + '22',
                 borderBottom: '1px solid ' + Game.state.items[state.item.mfr].color,
                 color: Game.state.items[state.item.mfr].color
             }">
            <span class="mfr-icon">{{ Game.state.items[state.item.mfr].icon }}</span>
            <span class="mfr-name">{{ Game.state.items[state.item.mfr].name.toUpperCase() }}</span>
        </div>

        <div class="popup-header" :style="{ color: (state.item.mfr && Game.state.items[state.item.mfr]) ? Game.state.items[state.item.mfr].colorAlt : (state.item.color || 'var(--primary)') }">
            {{ state.item.name.toUpperCase() }}
        </div>
        <div class="popup-desc">{{ state.item.desc }}</div>
        
        <div v-if="state.item.cost" class="popup-section">
            <div class="section-label">REQUIREMENTS:</div>
            <div v-for="(v, k) in state.item.cost" :key="k" class="cost-row">
                <span>{{ k.toUpperCase() }}</span>
                <span>{{ v }}</span>
            </div>
        </div>

        <div v-if="state.item.run || state.item.effect || state.item.result" class="popup-section">
            <div v-if="state.item.run" class="section-label">CONSUMES (per second):</div>
            <div v-for="(v, k) in state.item.run" :key="k" class="cost-row neg">
                <span>{{ k.toUpperCase() }}</span>
                <span>-{{ v.toFixed(2) }}/s</span>
            </div>
            
            <div v-if="state.item.effect" class="section-label">PRODUCES (per second):</div>
            <div v-for="(v, k) in state.item.effect" :key="k" class="cost-row pos">
                <span>{{ k.toUpperCase() }}</span>
                <span>+{{ v.toFixed(2) }}/s</span>
            </div>

            <div v-if="state.item.result" class="section-label">ON COMPLETION:</div>
            <div v-for="(v, k) in state.item.result" :key="k" class="cost-row pos">
                <span>{{ k.toUpperCase() }}</span>
                <span>+{{ v }}</span>
            </div>
        </div>

        <div v-if="state.item.type === 'resource'" class="popup-section">
            <div class="cost-row">
                <span>CURRENT:</span>
                <span>{{ Math.floor(state.item.val) }} / {{ Math.floor(state.item.max) }}</span>
            </div>
            <div class="cost-row" :class="getNetRate(state.item) > 0 ? 'pos' : 'neg'">
                <span>NET RATE:</span>
                <span>{{ fmtRate(getNetRate(state.item)) }}/s</span>
            </div>
        </div>

        <!-- STAT DIFF vs installed part (only shown when compare context is provided) -->
        <div v-if="state.compare" class="popup-section compare-section">
            <div class="section-label">VS INSTALLED: {{ state.compare.name?.toUpperCase() }}</div>
            <div class="cost-row">
                <span>MAX HP</span>
                <span>{{ state.item.maxHp || '—' }}
                    <span :class="deltaClass(state.item.maxHp, state.compare.maxHp)">
                        ({{ fmtDelta(state.item.maxHp, state.compare.maxHp) }})
                    </span>
                </span>
            </div>
            <div class="cost-row">
                <span>CONDITION</span>
                <span>{{ Math.round((state.item.condition || 0) * 100) }}%
                    <span :class="deltaClass(state.item.condition, state.compare.condition)">
                        ({{ fmtDelta((state.item.condition || 0) * 100, (state.compare.condition || 0) * 100) }}%)
                    </span>
                </span>
            </div>
        </div>
        <div v-else-if="state.item.slot && state.item.maxHp" class="popup-section compare-section">
            <div class="section-label compare-hint">HOVER SHOWS DIFF VS INSTALLED</div>
        </div>

        <div v-if="state.item.flavor" class="popup-flavor">
            "{{ state.item.flavor }}"
        </div>
    </div>
</template>

<style scoped>
.hud-popup {
    position: fixed;
    z-index: 10001;
    background: rgba(8, 10, 12, 0.95);
    border: 1px solid var(--border);
    padding: 0;
    width: 260px;
    max-height: calc(100vh - 24px);
    overflow-y: auto;
    pointer-events: none;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(0, 255, 65, 0.05);
}

/* Custom scrollbar for the popup */
.hud-popup::-webkit-scrollbar {
    width: 4px;
}
.hud-popup::-webkit-scrollbar-track {
    background: transparent;
}
.hud-popup::-webkit-scrollbar-thumb {
    background: var(--primary);
}

.popup-mfr-banner {
    padding: 5px 12px;
    font-size: 0.7rem;
    font-weight: bold;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
}

.mfr-icon {
    font-size: 0.9rem;
}

.popup-header {
    font-weight: bold;
    font-size: 0.95rem;
    padding: 8px 12px 4px 12px;
    letter-spacing: 1px;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.popup-desc {
    font-size: 0.8rem;
    color: var(--text-muted);
    padding: 0 12px 8px 12px;
    margin-bottom: 6px;
    border-bottom: 1px solid var(--border);
    line-height: 1.4;
}

.popup-section {
    margin-top: 4px;
    border-top: 1px dashed var(--border-dim);
    padding: 6px 12px 0;
}

.section-label {
    font-size: 0.72rem;
    color: var(--secondary);
    margin-bottom: 4px;
}

.cost-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--text-dim);
    margin-bottom: 3px;
    gap: 10px;
}

.cost-row.pos { color: #4f8; }
.cost-row.neg { color: #f44; }

.popup-flavor {
    margin-top: 6px;
    font-size: 0.78rem;
    font-style: italic;
    color: var(--text-faint);
    padding: 0 12px 10px;
}

.compare-section { border-top-color: rgba(0, 255, 170, 0.2); }
.compare-hint { color: var(--text-dim); opacity: 0.5; font-size: 0.68rem; }
.delta-pos { color: #4f8; font-size: 0.75rem; }
.delta-neg { color: #f44; font-size: 0.75rem; }
</style>
