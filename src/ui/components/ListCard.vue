<template>
  <div
    class="list-card"
    :class="{
      'list-card--active': active,
      'list-card--disabled': disabled,
      'list-card--unaffordable': unaffordable,
    }"
    @click="$emit('click')"
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
  border: 1px solid #1a2028;
  border-left: 3px solid #1a2028;
  background: #0b0e12;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 100%; 
  transition: transform 0.2s, border-color 0.2s, background 0.2s;
}

.list-card:hover {
  background: #12181f;
  border-color: #736b58;
  border-left-color: #008f11;
  transform: translateY(-2px);
}

.list-card--active {
  border-color: #00ff41;
  border-left-color: #00ff41;
  background: rgba(0, 255, 65, 0.05);
}

.list-card--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.list-card--unaffordable {
  border-color: #3a1a1a;
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
  color: #00ff41;
  font-size: var(--font-size-xs);
}

.list-card__name {
  font-size: var(--font-size-xs);
  color: #e6edf3;
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
  color: #94a3b8;
  white-space: nowrap;
}

.list-card__desc {
  font-size: var(--font-size-xxs);
  color: #94a3b8;
  margin-top: 4px;
}

.list-card__flavor {
  font-size: var(--font-size-xxs);
  color: #6a8a6a;
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
  font-size: var(--font-size-xxs);
  border: 1px solid #008f11;
  background: transparent;
  color: #00ff41;
}

.btn--xs:disabled {
  opacity: 0.5;
}
</style>
