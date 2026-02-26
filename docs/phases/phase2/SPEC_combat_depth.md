# SPEC: Combat Depth — Phase 2 / Rank 4

**Type:** `feat(combat/p2)`
**Effort:** Low/Medium — ~3–4 hours, changes to CombatPanel.vue + minor combatRunner.js
**Depends on:** Phase 1 SPEC_combat_trivials (log scroll should be done first)
**Blocks:** Phase 3 SPEC_token_dot_system (token display needs this foundation)

---

## Why This Matters

Combat is the most visually complete part of the game but has four gaps that reduce tactical clarity:
1. Tokens are icons with no in-view description — confusing without hover access
2. Enemies show no Heat/Stress — the player can't assess enemy state
3. Stance is locked pre-combat — no mid-combat tactical adjustment possible
4. Mission cards show star ratings with no comparison to the player's actual power

---

## Files Changed

- `src/ui/components/CombatPanel.vue`
- `src/modules/combatRunner.js` (minor — expose enemy heat/stress if not already on enemy object)

---

## Change 1 — Token Legend Strip

**File:** `CombatPanel.vue`
**Location:** Between `active-config-bar` and `battle-grid` in battle view

Add a strip that only renders when at least one token is active on either side:

```vue
<!-- Token legend — shows active token descriptions -->
<div class="token-legend" v-if="anyActiveTokens">
    <span
        v-for="tokenType in activeTokenTypes"
        :key="tokenType"
        class="token-legend-entry"
        :style="{ borderLeftColor: tokenDef(tokenType).color }"
    >
        <span class="tl-icon" :style="{ color: tokenDef(tokenType).color }">
            {{ tokenDef(tokenType).icon }}
        </span>
        <span class="tl-name">{{ tokenDef(tokenType).name.toUpperCase() }}</span>
        <span class="tl-desc">{{ tokenDef(tokenType).desc }}</span>
    </span>
</div>
```

Add computed properties:
```js
anyActiveTokens() {
    const playerTokens = this.playerFrame?.tokens?.length > 0;
    const enemyTokens = this.currentEnemies.some(e => e.tokens?.length > 0);
    return playerTokens || enemyTokens;
},
activeTokenTypes() {
    const types = new Set();
    (this.playerFrame?.tokens || []).forEach(t => types.add(t.type));
    this.currentEnemies.forEach(e => (e.tokens || []).forEach(t => types.add(t.type)));
    return Array.from(types);
},
```

Add to scoped CSS:
```css
.token-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 8px;
    background: rgba(0,0,0,0.3);
    border: 1px solid var(--border-dim);
    font-size: 10px;
}
.token-legend-entry {
    display: flex;
    align-items: center;
    gap: 5px;
    padding-left: 6px;
    border-left: 2px solid;
    line-height: 1.3;
}
.tl-icon { font-size: 12px; }
.tl-name { font-weight: bold; color: var(--text); letter-spacing: 0.5px; }
.tl-desc { color: var(--text-dim); }
```

---

## Change 2 — Enemy Heat and Stress Bars

**File:** `CombatPanel.vue`
**Location:** Inside the `enemy-side` frame-status block, after the parts-list

Copy the player's `vitals-row` structure and add it to the enemy side conditionally:

```vue
<!-- After .parts-list in enemy-side -->
<div class="vitals-row" v-if="enemy.heat !== undefined || enemy.stress !== undefined">
    <div class="vital" v-if="enemy.heat !== undefined">
        <label>HEAT</label>
        <div class="vital-bar heat">
            <div class="vital-fill" :style="renderEnemyHeatBar(enemy)"></div>
        </div>
        <span>{{ Math.floor(enemy.heat || 0) }}%</span>
    </div>
    <div class="vital" v-if="enemy.stress !== undefined">
        <label>STRESS</label>
        <div class="vital-bar stress">
            <div class="vital-fill" :style="renderEnemyStressBar(enemy)"></div>
        </div>
        <span>{{ Math.floor(enemy.stress || 0) }}</span>
    </div>
</div>
```

Add methods:
```js
renderEnemyHeatBar(enemy) {
    const p = enemy.heat || 0;
    return {
        width: p + '%',
        backgroundColor: p > 75 ? '#ff3333' : '#ff9900',
    };
},
renderEnemyStressBar(enemy) {
    const p = Math.min(100, ((enemy.stress || 0) / 30) * 100);
    return {
        width: p + '%',
        backgroundColor: p > 75 ? '#ff3333' : '#00afff',
    };
},
```

Verify that enemy objects in `combatRunner.js` expose `heat` and `stress` on their frame.
If they don't, add them to enemy initialization in `combatRunner.js`.

---

## Change 3 — Mid-Combat Stance Switching

**File:** `CombatPanel.vue`
**Location:** Battle footer, alongside RETREAT button

```vue
<!-- Replace simple config indicators with clickable stance buttons in battle -->
<div class="battle-footer">
    <div class="footer-stances">
        <span class="footer-label">STANCE:</span>
        <button
            v-for="s in stanceOptions"
            :key="s.id"
            :class="['stance-mini-btn', { active: combatRunner.stance === s.id }]"
            :title="s.desc"
            :disabled="!!combatResult"
            @click="setStance(s.id)"
        >
            {{ s.icon }} {{ s.name.toUpperCase() }}
        </button>
    </div>
    <button class="btn-retreat" :disabled="!!combatResult" @click="retreat"
            title="Retreat: mission fails. Partial salvage and reduced glory recovered.">
        ⚑ RETREAT
    </button>
</div>
```

Add to scoped CSS:
```css
.footer-stances { display: flex; align-items: center; gap: 5px; }
.footer-label { font-size: 10px; color: var(--text-dim); letter-spacing: 1px; margin-right: 3px; }
.stance-mini-btn {
    background: transparent;
    border: 1px solid var(--border-dim);
    color: var(--text-dim);
    font-family: inherit;
    font-size: 10px;
    padding: 3px 7px;
    cursor: pointer;
    transition: all 0.15s;
}
.stance-mini-btn:hover { border-color: var(--primary); color: var(--primary); }
.stance-mini-btn.active { border-color: var(--primary); color: var(--primary); background: rgba(0,255,170,0.08); }
.stance-mini-btn:disabled { opacity: 0.3; cursor: not-allowed; }
```

---

## Change 4 — Mission Power Indicator

**File:** `CombatPanel.vue`
**Location:** Mission card footer, alongside existing cost/rewards

Add a computed for player power:
```js
playerPower() {
    const frame = this.playerFrame;
    if (!frame?.attributes) return 0;
    return (frame.attributes.atk || 0) + (frame.attributes.def || 0);
},
```

Add to mission card footer template:
```vue
<div class="mission-footer">
    <span class="cost" v-if="m.encounter && m.encounter.mode !== 'none'">
        COST: {{ m.cost?.energy || 0 }} ENR
    </span>
    <!-- ADD: power indicator -->
    <span class="power-indicator" :class="powerClass(m)">
        PWR: {{ playerPower }} vs ★×{{ m.difficulty || 1 }}
    </span>
    <span class="rewards">...</span>
</div>
```

Add method:
```js
powerClass(mission) {
    const threshold = (mission.difficulty || 1) * 8;
    if (this.playerPower >= threshold * 1.2) return 'power-safe';
    if (this.playerPower >= threshold) return 'power-ok';
    return 'power-risky';
},
```

Add CSS:
```css
.power-indicator { font-size: 10px; font-weight: bold; letter-spacing: 0.5px; }
.power-safe  { color: var(--primary); }
.power-ok    { color: #f5c542; }
.power-risky { color: var(--error); }
```

---

## Test Checklist

- [ ] Start combat with tokens — legend strip appears below config bar
- [ ] Legend strip shows correct descriptions matching TOKEN_DEFS
- [ ] Enemy frame shows Heat and Stress bars if enemy has those values
- [ ] Stance buttons are visible in battle footer and functional during combat
- [ ] Stance buttons are disabled on combat result (fight over)
- [ ] Mission card shows power indicator — color changes based on player vs difficulty
- [ ] `npm run build` passes

---

## Commit Message

```
feat(combat/p2): add token legend, enemy vitals, mid-combat stance switching, power indicator
```
