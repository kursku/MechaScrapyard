<script>
import { reactive } from 'vue';
import Game from '@/game';

const state = reactive({
    visible: false,
    item: null,
    x: 0,
    y: 0
});

export function RollOver(e, item) {
    if (!item) return;
    state.item = item;
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
    
    // Bounds checking
    const popupWidth = 280; 
    
    // We dynamically cap the popup height in CSS via max-height: calc(100vh - 40px);
    // So if the screen is 800px tall, it never exceeds 760px.
    // If we're hovering near the bottom, we still want to flip it up, but ONLY by the maximum possible height it could be, OR its actual height. 
    // Since we don't know the actual rendered height synchronously here, we assume a safe maximum of 400px for bounds checking.
    const assumedMaxHeight = 400; 
    
    let nextX = cx + 15;
    let nextY = cy + 15;
    
    if ((nextX + popupWidth) > window.innerWidth) {
        nextX = cx - popupWidth - 10;
    }
    
    if ((nextY + assumedMaxHeight) > window.innerHeight) {
        // Only flip up if we actually have room above us. Otherwise, pin it.
        const flippedY = cy - assumedMaxHeight - 10;
        nextY = flippedY < 10 ? 10 : flippedY;
    }

    state.x = nextX;
    state.y = nextY;
}

export function ItemOut() {
    state.visible = false;
    state.item = null;
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

        return { state, fmtRate, getNetRate, resourceIcon };
    }
}
</script>

<template>
    <div v-if="state.visible && state.item" 
         class="hud-popup" 
         :style="{ left: state.x + 'px', top: state.y + 'px' }">
        <div class="popup-header" :style="{ color: state.item.color || 'var(--primary)' }">
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
    padding: 15px;
    width: 250px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    pointer-events: auto; /* Re-enabled so we can actually scroll it with the mouse */
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

.popup-header {
    font-weight: 900;
    font-size: var(--font-size-lg);
    letter-spacing: 2px;
    border-bottom: 1px solid var(--border-dim);
    margin-bottom: 10px;
    padding-bottom: 6px;
}

.popup-desc {
    font-size: var(--font-size-base);
    color: var(--text);
    line-height: 1.5;
    margin-bottom: 12px;
}

.popup-section {
    margin-top: 8px;
    border-top: 1px dashed var(--border-dim);
    padding-top: 8px;
}

.section-label {
    font-size: var(--font-size-xs);
    color: var(--secondary);
    margin-bottom: 4px;
}

.cost-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-base);
    color: var(--text-dim);
    margin-bottom: 3px;
}

.cost-row.pos { color: #4f8; }
.cost-row.neg { color: #f44; }

.popup-flavor {
    margin-top: 10px;
    font-size: var(--font-size-sm);
    font-style: italic;
    color: var(--text-faint);
}
</style>
