# SPEC: Token & DOT System — Phase 3 / Rank 3

**Type:** `feat(combat/p3)`
**Effort:** High — ~4–6 hours, significant CombatRunner refactor
**Depends on:** Phase 2 SPEC_combat_depth (token foundation must exist)
**Blocks:** SPEC_phase3_missions (some enemies use token abilities)

---

## Why This Matters

`CombatRunner.js` defines 6 tokens (`BREACH`, `BURN`, `ERROR`, `SLOW`, `TARGET_LOCK`,
`SUPPRESS`) but most are visual stubs — they display on the HUD but have no per-tick
mechanical effect. The Arcanum reference implements a full `DOT` class with
`duration`, accumulator ticking, and expire/hit callbacks. Adopting this pattern gives
all tokens real weight without rebuilding the combat loop.

---

## Files Changed

- `src/modules/combatRunner.js`
- `src/modules/dot.js` (new file, ~80 lines)
- `src/ui/components/CombatPanel.vue` (token display — minor)

---

## Change 1 — DOT Class (`dot.js`)

Adapted from `ref/arcanum-master/src/chars/dot.js`:

```js
/**
 * DOT — Damage/Effect Over Time
 * Tracks a single status effect on a combat participant.
 */
export class DOT {
    constructor({ id, label, duration, tickDmg = 0, flags = {}, onExpire = null, onHit = null }) {
        this.id = id;
        this.label = label;
        this.duration = duration;     // total ticks remaining
        this.tickDmg = tickDmg;       // damage dealt each tick
        this.flags = flags;           // { NO_ATTACK, NO_DEFEND } etc.
        this.onExpire = onExpire;     // callback(target, dot)
        this.onHit = onHit;          // callback(target, dot, dmg)
        this.acc = 0;                 // sub-tick accumulator (for partial ticks)
    }

    tick(target, dt = 1) {
        this.acc += dt;
        let expired = false;
        while (this.acc >= 1 && this.duration > 0) {
            this.acc -= 1;
            this.duration--;
            if (this.tickDmg > 0) {
                const dmg = this.tickDmg;
                target.hp = Math.max(0, target.hp - dmg);
                if (this.onHit) this.onHit(target, this, dmg);
            }
            if (this.duration <= 0) {
                expired = true;
                if (this.onExpire) this.onExpire(target, this);
            }
        }
        return expired;
    }

    get isExpired() { return this.duration <= 0; }
}
```

---

## Change 2 — Token Definitions Updated

In `combatRunner.js`, replace the current stub `TOKEN_DEFS` with DOT-backed definitions:

```js
import { DOT } from './dot.js';

// Factory — creates a DOT instance for a given token type
function makeToken(type, target, log) {
    const defs = {
        BREACH: () => new DOT({
            id: 'BREACH', label: 'BREACH',
            duration: 3,
            tickDmg: 0,
            // BREACH: target's defense reduced by 30% while active
            onHit: null,
            flags: { DEFENSE_REDUCTION: 0.3 },
        }),
        BURN: () => new DOT({
            id: 'BURN', label: 'BURN',
            duration: 4,
            tickDmg: 8,
            onHit: (t, dot, dmg) => log(`${t.name} burns for ${dmg} dmg`),
        }),
        ERROR: () => new DOT({
            id: 'ERROR', label: 'ERROR',
            duration: 2,
            tickDmg: 0,
            flags: { ACCURACY_PENALTY: 20 }, // -20 accuracy while active
        }),
        SLOW: () => new DOT({
            id: 'SLOW', label: 'SLOW',
            duration: 3,
            tickDmg: 0,
            flags: { SPEED_PENALTY: 0.5 }, // half speed
        }),
        TARGET_LOCK: () => new DOT({
            id: 'TARGET_LOCK', label: 'TARGET_LOCK',
            duration: 2,
            tickDmg: 0,
            flags: { FORCED_TARGET: true }, // all attacks target this unit
        }),
        SUPPRESS: () => new DOT({
            id: 'SUPPRESS', label: 'SUPPRESS',
            duration: 2,
            tickDmg: 0,
            flags: { NO_ATTACK: true }, // unit cannot attack while suppressed
        }),
    };
    return defs[type] ? defs[type]() : null;
}
```

---

## Change 3 — CombatRunner Integration

Add a `dots` array to each combatant state object:
```js
// When initializing combatant:
combatant.dots = [];
```

Apply token effects in the per-turn resolution loop:
```js
// At start of each combatant's turn, tick all DOTs
function tickDots(combatant, log) {
    combatant.dots = combatant.dots.filter(dot => {
        const expired = dot.tick(combatant);
        return !expired;
    });
}

// When applying a token (from weapon effect, ability, etc.):
function applyToken(type, target, log) {
    // Don't stack same token — refresh duration instead
    const existing = target.dots.find(d => d.id === type);
    if (existing) {
        existing.duration = makeToken(type).duration; // reset
        return;
    }
    const dot = makeToken(type, target, log);
    if (dot) target.dots.push(dot);
}
```

Read flags during stat calculations:
```js
function getEffectiveDefense(combatant) {
    let def = combatant.def;
    for (const dot of combatant.dots) {
        if (dot.flags.DEFENSE_REDUCTION) def *= (1 - dot.flags.DEFENSE_REDUCTION);
    }
    return Math.floor(def);
}

function getEffectiveAccuracy(combatant, baseAcc) {
    let acc = baseAcc;
    for (const dot of combatant.dots) {
        if (dot.flags.ACCURACY_PENALTY) acc -= dot.flags.ACCURACY_PENALTY;
    }
    return Math.max(5, acc); // floor at 5%
}

function canAttack(combatant) {
    return !combatant.dots.some(d => d.flags.NO_ATTACK);
}
```

---

## Change 4 — CombatPanel Token Display

Update the token display in `CombatPanel.vue` to show remaining duration:

```vue
<span v-for="dot in combatant.dots" :key="dot.id"
      class="token-badge"
      :class="dot.id.toLowerCase()"
      :title="`${dot.label}: ${dot.duration} turn(s) remaining`">
    {{ dot.label }} {{ dot.duration }}
</span>
```

---

## Test Checklist

- [ ] BURN deals ~8 damage per turn for 4 turns
- [ ] SUPPRESS prevents attacker from acting for 2 turns
- [ ] BREACH reduces target defense (verify via combat log numbers)
- [ ] ERROR reduces hit chance (more misses during ERROR)
- [ ] SLOW halves combatant speed (turn order changes)
- [ ] TOKEN_LOCK forces targeting to marked unit
- [ ] Tokens expire correctly — no orphaned effects
- [ ] Same token applied twice refreshes duration, doesn't stack
- [ ] Token duration shows in badge on CombatPanel
- [ ] `npm run build` passes

---

## Commit Message

```
feat(combat/p3): DOT class, 6 functional combat tokens with per-turn effects
```
