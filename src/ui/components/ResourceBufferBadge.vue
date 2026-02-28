<template>
  <div class="resource-buffer-indicator">
    <span class="resource-buffer-label">{{ label }}</span>
    <span class="resource-buffer-value">{{ value }}/{{ max }}</span>
  </div>
</template>

<script>
export default {
    props: {
        label: { type: String, required: true },
        value: { type: Number, required: true },
        max: { type: Number, required: true },
    },
};
</script>

<style scoped>
.resource-buffer-indicator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(0, 255, 170, 0.35);
    background: rgba(0, 255, 170, 0.06);
    padding: 8px 12px;
    margin-bottom: 14px;
}

.resource-buffer-label {
    font-size: var(--font-size-xxs);
    letter-spacing: 1px;
    color: var(--text-dim);
}

.resource-buffer-value {
    font-family: var(--font-mono);
    color: var(--secondary);
    font-weight: bold;
}
</style>
