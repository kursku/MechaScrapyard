<template>
  <div
    class="list-card"
    :class="{
      'list-card--active': active,
      'list-card--disabled': disabled,
      'list-card--unaffordable': unaffordable,
    }"
    role="button"
    :tabindex="disabled ? -1 : 0"
    @click="$emit('click')"
    @keydown.enter.prevent="!disabled && $emit('click')"
    @keydown.space.prevent="!disabled && $emit('click')"
  >
    <div class="list-card__top">
      <div class="list-card__title">
        <span class="list-card__lead" v-if="lead">{{ lead }}</span>
        <span class="list-card__name">{{ name }}</span>
        <span class="list-card__badges" v-if="$slots.badges">
          <slot name="badges" />
        </span>
      </div>

      <div class="list-card__right">
        <div class="list-card__cost" v-if="cost && Object.keys(cost).length">
          <span
            v-for="(v, k) in cost"
            :key="k"
            class="list-card__cost-item"
            :class="canAffordOne && canAffordOne(k, v) ? 'cost--ok' : 'cost--no'"
          >
            <span class="cost-check" aria-hidden="true">{{ canAffordOne && canAffordOne(k, v) ? '✓' : '✗' }}</span>{{ resourceIcon ? resourceIcon(k) : '' }}{{ fmt ? fmt(v) : v }}
          </span>
        </div>

        <div class="list-card__meta" v-if="$slots.meta">
          <slot name="meta" />
        </div>

        <button v-if="actionLabel" class="btn btn--xs" :disabled="disabled" @click.stop="$emit('action')">
          {{ actionLabel }}
        </button>
      </div>
    </div>

    <div v-if="desc" class="list-card__desc">{{ desc }}</div>
    <div v-if="flavor" class="list-card__flavor">“{{ flavor }}”</div>

    <div class="list-card__bottom" v-if="$slots.bottom">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ListCard',
  props: {
    lead: { type: String, default: '' },
    name: { type: String, required: true },
    desc: { type: String, default: '' },
    flavor: { type: String, default: '' },

    cost: { type: Object, default: null },
    canAffordOne: { type: Function, default: null },
    resourceIcon: { type: Function, default: null },
    fmt: { type: Function, default: null },

    actionLabel: { type: String, default: '' },

    active: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    unaffordable: { type: Boolean, default: false },
  },
  emits: ['click', 'action'],
};
</script>

<style scoped>
.list-card {
  padding: 15px;
  border: 1px solid var(--border-dim);
  border-left: 3px solid var(--border-dim);
  background: var(--bg-panel);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 100%;
  transition: transform 0.2s, border-color 0.2s, background 0.2s;
}

.list-card:hover {
  background: var(--bg-hover);
  border-color: var(--border-light);
  border-left-color: rgba(0, 255, 65, 0.5);
  transform: translateY(-2px);
}

.list-card--active {
  border-color: var(--color-success);
  border-left-color: var(--color-success);
  background: var(--bg-surface-hover);
}

.list-card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.list-card--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.list-card--unaffordable {
  border-color: rgba(191, 54, 12, 0.2);
}

.list-card__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}

.list-card__title {
  display: flex;
  gap: 6px;
  align-items: baseline;
  min-width: 0;
}

.list-card__lead {
  color: var(--color-success);
  font-size: var(--font-size-xs);
}

.list-card__name {
  font-size: var(--font-size-xs);
  color: var(--text);
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-card__right {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.list-card__cost {
  width: 190px; /* fixed column for alignment */
  text-align: right;
  font-size: var(--font-size-xxs);
}

.list-card__cost-item {
  display: inline-block;
  margin-left: 6px;
}

.cost-check {
  font-size: var(--font-size-micro);
  opacity: 0.7;
  margin-right: 1px;
}

.list-card__meta {
  font-size: var(--font-size-xxs);
  color: var(--color-neutral);
  white-space: nowrap;
}

.list-card__desc {
  font-size: var(--font-size-xxs);
  color: var(--color-neutral);
  margin-top: 4px;
}

.list-card__flavor {
  font-size: var(--font-size-xxs);
  color: var(--tip);
  font-style: italic;
  margin-top: 2px;
}

.list-card__bottom {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed rgba(255,255,255,0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.btn--xs {
  padding: 2px 6px;
  min-height: 44px;
  font-size: var(--font-size-xxs);
  border: 1px solid rgba(0, 255, 65, 0.4);
  background: transparent;
  color: var(--color-success);
}

.btn--xs:disabled {
  opacity: 0.5;
}
</style>
