<script>
/**
 * TerminalPicker.vue
 * Terminal-styled modal picker to replace native <select> elements.
 * Props:
 *   title      - header string (e.g. "EQUIP // LEFT_HAND")
 *   options    - array of { value, label, tag?, icon?, iconColor?, active? }
 *   modelValue - currently selected value
 * Emits:
 *   update:modelValue - when an option is selected
 *   close             - when picker should be closed (ESC, backdrop, empty-slot)
 */
export default {
    name: 'TerminalPicker',
    props: {
        title:      { type: String,  required: true },
        options:    { type: Array,   required: true },
        modelValue: { type: String,  default: '' },
    },
    emits: ['update:modelValue', 'close'],
    mounted() {
        this._onKey = (e) => { if (e.key === 'Escape') this.$emit('close'); };
        window.addEventListener('keydown', this._onKey);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this._onKey);
    },
    methods: {
        select(opt) {
            this.$emit('update:modelValue', opt.value);
            this.$emit('close');
        },
    },
};
</script>

<template>
    <Teleport to="body">
        <div class="tp-backdrop" @click.self="$emit('close')">
            <div class="tp-modal" role="dialog" :aria-label="title">
                <div class="tp-header">&gt; {{ title }}</div>
                <div class="tp-separator">── AVAILABLE ───────────────────────────</div>
                <div class="tp-list">
                    <div
                        v-for="opt in options"
                        :key="opt.value"
                        :class="['tp-row', { 'tp-row--current': opt.value === modelValue, 'tp-row--empty': opt.value === '' }]"
                        @click="select(opt)"
                    >
                        <span class="tp-cursor">{{ opt.value === modelValue ? '▶' : '\u00a0' }}</span>
                        <span v-if="opt.icon" class="tp-icon" :style="{ color: opt.iconColor }">{{ opt.icon }}</span>
                        <span class="tp-label">{{ opt.label }}</span>
                        <span v-if="opt.tag"    class="tp-tag">{{ opt.tag }}</span>
                        <span v-if="opt.active" class="tp-active">◆</span>
                    </div>
                </div>
                <div class="tp-footer">[ ESC ] cancel</div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.tp-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.72);
    z-index: 900;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tp-modal {
    background: var(--bg-panel, #0d0d0f);
    border: 1px solid var(--primary, #ffb000);
    min-width: 320px;
    max-width: 480px;
    width: 100%;
    font-family: 'VT323', monospace;
    font-size: 14px;
    color: var(--text-primary, #e0d8c8);
}

.tp-header {
    padding: 8px 12px 6px;
    color: var(--primary, #ffb000);
    font-size: 15px;
    letter-spacing: 0.04em;
}

.tp-separator {
    padding: 0 12px 6px;
    color: var(--text-dim, #555);
    font-size: 12px;
    letter-spacing: 0.02em;
}

.tp-list {
    padding: 0 0 4px;
    max-height: 320px;
    overflow-y: auto;
}

.tp-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    cursor: pointer;
    transition: background 0.08s;
    color: var(--text-primary, #e0d8c8);
}

.tp-row:hover {
    background: rgba(255, 176, 0, 0.08);
}

.tp-row--current {
    color: var(--primary, #ffb000);
    background: rgba(255, 176, 0, 0.06);
}

.tp-row--empty {
    color: var(--text-dim, #666);
}

.tp-cursor {
    width: 10px;
    flex-shrink: 0;
    color: var(--primary, #ffb000);
}

.tp-icon {
    flex-shrink: 0;
    font-size: 11px;
}

.tp-label {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tp-tag {
    flex-shrink: 0;
    color: var(--text-dim, #666);
    font-size: 12px;
    border: 1px solid #333;
    padding: 0 4px;
    margin-left: 4px;
}

.tp-active {
    flex-shrink: 0;
    color: var(--color-success, #00ff41);
    font-size: 11px;
    margin-left: 4px;
}

.tp-footer {
    padding: 6px 12px 8px;
    border-top: 1px solid #1a1a1a;
    color: var(--text-dim, #555);
    font-size: 12px;
}
</style>
