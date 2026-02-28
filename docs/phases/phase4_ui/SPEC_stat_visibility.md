# SPEC — Phase 4 Stat Visibility

**Phase:** 4-UI — Spec 2 of 4
**Area:** HUD / Player Stats
**Priority:** 🟠 HIGH — Three Phase 4 mechanics are invisible to the player
**Estimated effort:** ~2–3 hours
**Prerequisites:** SPEC 9 (missions add grandpa_trust/intel_tokens), SPEC 11 (DTL), SPEC 12 (street cred)

---

## WHY THIS MATTERS

Phase 4 introduced three player stats (`grandpa_trust`, `intel_tokens`, `rep_refugee`) that are modified by mission choices and events — but none are displayed anywhere in the UI. Players also can't see the DTL passive bleed rate or whether their street cred is reducing it. And the negotiation tier from street cred is invisible at job enrollment time.

Three invisible mechanics:
1. Story stats that change and the player never sees
2. A DTL rate the player can't feel or measure
3. A negotiation outcome the player can't predict before committing to a job

---

## PART 1: PHASE 4 STORY STATS IN PILOTPANEL

### 1.1 Surface `grandpa_trust`, `intel_tokens`, `rep_refugee`

In `PilotPanel.vue`, after the street cred widget, add a collapsible "PHASE 4 INTEL" row showing the three stats if they exist:

```vue
<div v-if="hasPhase4Stats" class="intel-deck">
    <div class="hud-section-title" style="margin-top: 10px; font-size: 9px; opacity: 0.5;">
        &gt; PHASE 4 INTEL
    </div>
    <div class="intel-row" v-if="state.items['grandpa_trust']">
        <span class="intel-label">GRANDPA TRUST</span>
        <span class="intel-val">{{ Math.floor(state.g.grandpa_trust || 0) }}</span>
    </div>
    <div class="intel-row" v-if="state.items['intel_tokens']">
        <span class="intel-label">INTEL TOKENS</span>
        <span class="intel-val">{{ Math.floor(state.g.intel_tokens || 0) }}</span>
    </div>
    <div class="intel-row" v-if="state.items['rep_refugee']">
        <span class="intel-label">REFUGEE REP</span>
        <span class="intel-val">{{ Math.floor(state.g.rep_refugee || 0) }}</span>
    </div>
</div>
```

```js
hasPhase4Stats() {
    return this.state.items['grandpa_trust'] ||
           this.state.items['intel_tokens'] ||
           this.state.items['rep_refugee'];
},
```

```css
.intel-deck { margin-top: 6px; }
.intel-row {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--text-dim);
    letter-spacing: 0.06em;
    padding: 2px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.intel-label { opacity: 0.6; }
.intel-val { color: var(--primary); }
```

---

## PART 2: DTL BLEED RATE INDICATOR

### 2.1 Show rate and cred modifier in DTL HUD

In `ScrapyardPanel.vue`, update the `dtl-points-text` to show the current bleed rate:

```vue
<span class="dtl-points-text">
    ({{ dtlPoints }}/100 · {{ dtlBleedLabel }})
</span>
```

```js
dtlBleedRate() {
    this.renderTick;
    if (!this.dtlLevel) return 0;
    const credMod = (this.state.g.street_cred || 0) >= 40 ? 0.75 : 1.0;
    return (this.dtlLevel * 0.002 * credMod * 60).toFixed(1); // per minute
},
dtlBleedLabel() {
    const rate = this.dtlBleedRate;
    const cred = (this.state.g.street_cred || 0) >= 40;
    return cred ? `+${rate}/min ▼cred` : `+${rate}/min`;
},
```

The `▼cred` suffix makes the 25% reduction from street cred player-visible.

---

## PART 3: NEGOTIATION TIER IN CAREERANEL

### 3.1 Show tier before enrolling

In `CareerPanel.vue`, add a small negotiation badge near the "Available Jobs" header:

```vue
<div class="negotiation-tier-badge" :class="'neg-' + negotiationTier">
    NEGOTIATION: {{ negotiationTier.toUpperCase() }}
</div>
```

```js
negotiationTier() {
    const c = this.state.g.street_cred || 0;
    if (c >= 60) return 'high';
    if (c >= 30) return 'mid';
    return 'low';
},
```

```css
.negotiation-tier-badge {
    font-size: 8px;
    font-family: var(--font-mono);
    letter-spacing: 0.1em;
    padding: 2px 6px;
    border: 1px solid currentColor;
    display: inline-block;
    margin-bottom: 8px;
}
.neg-high { color: #4f4; }
.neg-mid  { color: #fa0; }
.neg-low  { color: #888; }
```

---

## VERIFICATION CRITERIA

- [ ] `grandpa_trust`, `intel_tokens`, `rep_refugee` visible in PilotPanel when non-zero
- [ ] DTL HUD shows bleed rate per minute
- [ ] DTL HUD shows `▼cred` modifier when street cred >= 40
- [ ] CareerPanel shows negotiation tier badge before job list

---

## FILE REFERENCE

| File | Action |
| --- | --- |
| `src/ui/sections/PilotPanel.vue` | ADD intel-deck section with 3 phase 4 stats |
| `src/ui/sections/ScrapyardPanel.vue` | ADD dtlBleedRate computed + update dtl-points-text |
| `src/ui/sections/CareerPanel.vue` | ADD negotiation tier badge above job list |
