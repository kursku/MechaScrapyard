# MECHA SCRAPYARD — Implementation Spec: Morale System
## Sprint: Reclaim-01 — The Moral Compass

**From:** Design (Claude)
**To:** Implementation (Antigravity)
**Priority:** 🔴 CRITICAL — Foundation for Jobs, Factions, and Narrative branching
**Estimated effort:** ~4-6 hours
**Prerequisites:** None — this is standalone infrastructure

---

## WHY THIS FIRST

The `BipolarStat.js` class already exists in `src/values/`. The `moralidade` resource already exists in `resources.json`. But they're not connected to anything. Without a working morale system:
- Job paths can't branch (Reclaim-02)
- Factions can't check alignment (existing `factions.json` has no moral gates)
- Narrative choices are cosmetic (milestoneCheck has no moral consequences)
- The `require` string `g.morality>=30` (documented in AI_RULES.md §2.2) doesn't work

This spec wires the existing BipolarStat into the game loop, UI, and data systems.

---

## PART 1: WIRE BipolarStat INTO GameState

### 1.1 Import and instantiate in `gameState.js`

Currently `BipolarStat` is defined but never imported anywhere.

```js
// gameState.js — add at top
import BipolarStat from '@/values/BipolarStat';
```

In the constructor, add after `this.g = reactive({})`:

```js
/** @type {BipolarStat} Morality axis: Idealist (+) ↔ Pragmatic (-) */
this.morality = new BipolarStat(0);
```

### 1.2 Expose to `g.` namespace

The `g.` namespace is what `require` strings evaluate against. Add to the constructor, after `this.morality`:

```js
// Expose morality value to require expressions as g.morality
Object.defineProperty(this.g, 'morality', {
    get: () => this.morality.value,
    configurable: true,
});

// Also expose alignment string for advanced checks
Object.defineProperty(this.g, 'moral_alignment', {
    get: () => this.morality.alignment,
    configurable: true,
});
```

**Verification:** After this, `g.morality>=30` and `g.morality<=-30` work in any `require` string across the entire data system — tasks, upgrades, missions, events.

### 1.3 Sync with `moralidade` resource

The `moralidade` resource in `resources.json` exists as a display vehicle. Sync it with BipolarStat so the UI resource bar reflects the actual value. In `game.js`, inside the `update(dt)` method (the main tick), add:

```js
// --- Sync morality display resource ---
const moralRes = this.state.items.moralidade;
if (moralRes) {
    moralRes.val = this.state.morality.value;
    moralRes.max = 100;
    moralRes.min = -100;
}
```

### 1.4 Save/Load

In `modules/persist.js`, add morality to the serialization:

**Serialize** (inside the save object):
```js
morality: this.game.state.morality.toJSON(),
```

**Restore** (inside the load function):
```js
if (saveData.morality !== undefined) {
    this.game.state.morality = BipolarStat.fromJSON(saveData.morality);
}
```

Import BipolarStat at top of persist.js:
```js
import BipolarStat from '@/values/BipolarStat';
```

---

## PART 2: MORAL CHOICE EVENTS

### 2.1 New data type: `moral_choices`

Create choices that fire at specific milestones and shift morality. These use the existing `events.json` pattern but with a `choices` array.

**Add to `data/mecha/events.json`:**

```json
{
  "id": "evt_moral_scrap_thief",
  "name": "The Scrap Thief",
  "require": "g.triagem>0",
  "desc": "A kid from the slums is caught stealing polymer scrap from the yard. Grandpa looks at you — your call.",
  "choices": [
    {
      "id": "let_go",
      "label": "Let the kid go with a warning",
      "desc": "Everyone's desperate. You know that better than most.",
      "morality": 10,
      "effect": { "polymer_scrap": -5 },
      "log": "You let the kid go. Grandpa nods slowly."
    },
    {
      "id": "hire_kid",
      "label": "Offer the kid a job sorting scrap",
      "desc": "If they're going to take it anyway, might as well make it official.",
      "morality": 15,
      "effect": { "creds": -10 },
      "mod": { "scrap.rate": 0.05 },
      "log": "The kid starts tomorrow. You've got your first employee."
    },
    {
      "id": "turn_in",
      "label": "Report them to the district patrol",
      "desc": "Law is law. Even out here.",
      "morality": -10,
      "effect": { "rep_police": 2 },
      "log": "The patrol takes the kid. You get a nod from the officer."
    },
    {
      "id": "take_their_stuff",
      "label": "Take what THEY have and send them running",
      "desc": "Steal from me? Let's see how that feels.",
      "morality": -15,
      "effect": { "scrap": 15, "electronic_scrap": 3 },
      "log": "The kid runs. You're richer. Grandpa says nothing."
    }
  ]
},
{
  "id": "evt_moral_injured_pilot",
  "name": "Downed Pilot",
  "require": "g.garagem>0&&g.msn_rogue_drone_patrol>0",
  "desc": "After a patrol, you find a rival pilot pinned under wreckage. Their mecha is totaled but the parts are salvageable. They're conscious and in pain.",
  "choices": [
    {
      "id": "rescue",
      "label": "Free them and call for help",
      "desc": "You wouldn't want to be left there either.",
      "morality": 15,
      "effect": { "energy": -10 },
      "log": "They'll remember this. People talk."
    },
    {
      "id": "rescue_and_salvage",
      "label": "Free them, then ask if you can have the parts",
      "desc": "Help them, but don't waste the opportunity.",
      "morality": 5,
      "effect": { "parts": 2 },
      "log": "Fair trade. They keep their life, you keep the scraps."
    },
    {
      "id": "strip_and_leave",
      "label": "Strip the mecha parts first, then call for help",
      "desc": "They'll live. But those servos won't wait.",
      "morality": -20,
      "effect": { "parts": 5, "ferrous_scrap": 10 },
      "log": "By the time help arrives, the frame is a skeleton. The pilot watches."
    }
  ]
},
{
  "id": "evt_moral_corporate_bribe",
  "name": "Corporate Interest",
  "require": "g.oficina_nivel2>0&&g.creds>=50",
  "desc": "A suit from Taeyang Forge visits the scrapyard. They want to buy exclusive salvage rights to the industrial zone. The offer is generous. Too generous.",
  "choices": [
    {
      "id": "refuse",
      "label": "Refuse the deal",
      "desc": "Your father investigated these people. You don't take their money.",
      "morality": 20,
      "effect": {},
      "log": "The suit leaves. Grandpa exhales. 'Good call, kid.'"
    },
    {
      "id": "negotiate",
      "label": "Counter-offer: non-exclusive, double the price",
      "desc": "If they want access, they pay YOUR rate.",
      "morality": -5,
      "effect": { "creds": 100 },
      "log": "They agree. Easy money. Grandpa looks uncomfortable."
    },
    {
      "id": "accept",
      "label": "Take the deal",
      "desc": "Money is money. The scrapyard needs it.",
      "morality": -20,
      "effect": { "creds": 200 },
      "mod": { "ferrous_scrap.rate": -0.1 },
      "log": "Cash in hand. But Taeyang trucks now roll through YOUR yard."
    }
  ]
}
```

### 2.2 Engine support for choices

The existing `_loadEvents` in `game.js` registers events but doesn't handle `choices`. Add choice handling:

**In `game.js`, create a new method:**

```js
/**
 * Present a moral choice event to the player.
 * @param {Object} event - Event data with choices array
 */
presentChoice(event) {
    if (!event.choices || !event.choices.length) return;

    // Build dialogue pages from event description
    const pages = [event.desc];

    // Show via DialogueModal with choice buttons
    this.showChoiceDialogue(event.name, pages, event.choices, (chosen) => {
        this._resolveChoice(event, chosen);
    });
},

/**
 * Resolve a player's moral choice.
 * @param {Object} event - The event
 * @param {Object} chosen - The selected choice object
 */
_resolveChoice(event, chosen) {
    // Apply morality shift
    if (chosen.morality) {
        this.state.morality.shift(chosen.morality);
        const dir = chosen.morality > 0 ? 'Idealist' : 'Pragmatic';
        const abs = Math.abs(chosen.morality);
        Log.add(`⚖ Morality shifted: ${dir} +${abs}`, 'morality');
    }

    // Apply resource effects
    if (chosen.effect) {
        for (const [resId, amount] of Object.entries(chosen.effect)) {
            const res = this.state.items[resId];
            if (res && res.val !== undefined) {
                res.val = Math.max(0, res.val + amount);
            }
        }
    }

    // Apply permanent mods
    if (chosen.mod) {
        this.state.applyMod(chosen.mod);
    }

    // Log result
    if (chosen.log) {
        Log.add(chosen.log, 'story');
    }

    // Mark event as completed
    event.completed = (event.completed || 0) + 1;
    event.locked = true; // One-time choice
},
```

### 2.3 `showChoiceDialogue` — UI Component

The existing `DialogueModal.vue` shows sequential text pages. Extend it to support a choice mode.

**Option A (Recommended — minimal change):**

Add a `choices` prop to `DialogueModal.vue`:

```vue
<!-- In DialogueModal.vue template, after the text area, before the "next" button -->
<div v-if="choices && choices.length && isLastPage" class="choice-container">
  <div
    v-for="choice in choices"
    :key="choice.id"
    class="choice-button"
    @click="$emit('choice-selected', choice)"
  >
    <span class="choice-label">▸ {{ choice.label }}</span>
    <span class="choice-desc">{{ choice.desc }}</span>
  </div>
</div>
```

```css
/* Terminal-style choice buttons */
.choice-container {
  margin-top: 12px;
  border-top: 1px solid var(--terminal-dim);
  padding-top: 8px;
}
.choice-button {
  padding: 6px 10px;
  margin: 4px 0;
  border: 1px solid var(--terminal-dim);
  cursor: pointer;
  transition: border-color 0.15s;
}
.choice-button:hover {
  border-color: var(--terminal-green);
  background: rgba(0, 255, 0, 0.05);
}
.choice-label {
  color: var(--terminal-green);
  font-weight: bold;
}
.choice-desc {
  display: block;
  font-size: 0.85em;
  opacity: 0.7;
  margin-top: 2px;
}
```

**Option B (Simpler — use existing dialogue + append choices as text):**

If modifying DialogueModal is heavy, present choices as numbered text pages, then use `prompt()`-style input. Less elegant but zero UI work.

### 2.4 Wire choice events into milestoneCheck

In `game.js milestoneCheck()`, add entries for moral choice events:

```js
// --- Moral Choice Events ---
{
    id: 'choice_scrap_thief',
    condition: () => (g.triagem?.owned || 0) > 0,
    action: () => this.presentChoice(g.evt_moral_scrap_thief || this.state.items.evt_moral_scrap_thief)
},
{
    id: 'choice_injured_pilot',
    condition: () => (g.msn_rogue_drone_patrol?.completed || 0) > 0,
    action: () => this.presentChoice(this.state.items.evt_moral_injured_pilot)
},
{
    id: 'choice_corporate_bribe',
    condition: () => (g.oficina_nivel2?.owned || 0) > 0 && (g.creds?.val || 0) >= 50,
    action: () => this.presentChoice(this.state.items.evt_moral_corporate_bribe)
},
```

---

## PART 3: MORALITY UI DISPLAY

### 3.1 Morality bar in the Pilot section

In the `sect_player` panel (Pilot tab), add a morality display. The `moralidade` resource already exists, but it needs a custom renderer since it's bipolar (-100 to +100) instead of 0 to max.

**In `TerminalUI.vue` or the relevant section renderer, add logic:**

```vue
<div v-if="item.id === 'moralidade'" class="morality-bar">
  <span class="morality-label">{{ moralityLabel }}</span>
  <div class="morality-track">
    <div class="morality-fill" :style="moralityStyle"></div>
    <div class="morality-center"></div>
  </div>
  <span class="morality-value">{{ morality }}</span>
</div>
```

```js
// Computed properties
computed: {
    morality() {
        return this.game?.state?.morality?.value || 0;
    },
    moralityLabel() {
        return this.game?.state?.morality?.label || 'Neutral';
    },
    moralityStyle() {
        const val = this.morality;
        // Map -100..+100 to 0%..100% on the bar
        const pct = (val + 100) / 200 * 100;
        const color = val >= 30 ? '#4af' : val <= -30 ? '#f44' : '#aaa';
        return {
            width: pct + '%',
            backgroundColor: color,
        };
    }
}
```

### 3.2 Morality in resource bar

Alternatively, the simplest approach: modify `moralidade` resource in `resources.json` to render properly:

```json
{
  "id": "moralidade",
  "name": "Morality",
  "desc": "Your moral compass. Idealist or Pragmatic — the city judges.",
  "flavor": "Every choice echoes.",
  "group": "meta",
  "icon": "⚖",
  "color": "#aaa",
  "val": 0,
  "min": -100,
  "max": 100,
  "rate": 0,
  "locked": false,
  "hide": true,
  "sortOrder": 90
}
```

Set `hide: true` so it doesn't show in the top bar (it'll show in the Pilot tab instead). The `min: -100` field is NEW — the resource bar renderer needs to handle negative min values. Add this check in the bar renderer:

```js
// In resource bar percentage calculation:
const range = (res.max || 100) - (res.min || 0);
const offset = (res.val || 0) - (res.min || 0);
const pct = range > 0 ? (offset / range) * 100 : 0;
```

---

## PART 4: MORALITY-GATED CONTENT

### 4.1 Example require strings

Once wired, any data item can gate on morality:

```json
{"require": "g.morality>=30", "...": "Only available to Idealists"}
{"require": "g.morality<=-30", "...": "Only available to Pragmatists"}
{"require": "g.morality>=70", "...": "Deep Idealist content"}
{"require": "g.morality<=-70", "...": "Deep Pragmatic content"}
```

### 4.2 Add morality gates to existing missions

In `data/mecha/missions.json`, tag missions with morality alternatives:

```json
{
  "id": "msn_slums_protection",
  "title": "Protect the Slums Clinic",
  "require": "g.morality>=20&&g.garagem>0",
  "narrative": {
    "speaker": "grandpa",
    "briefing": ["There's an underground clinic in the slums. They're being shaken down.", "Your father used to moonlight there. Fixing people, not mechas.", "They need help."]
  }
},
{
  "id": "msn_slums_shakedown",
  "title": "Collect the Clinic's Debt",
  "require": "g.morality<=-20&&g.garagem>0",
  "narrative": {
    "speaker": "system",
    "briefing": ["A fixer has a job. The slums clinic owes someone money.", "They won't pay willingly. A mecha at the door changes that.", "Quick creds. No questions."]
  }
}
```

This creates the pattern: same situation, different mission depending on moral alignment. One event, two paths.

---

## VERIFICATION CRITERIA

- [ ] `BipolarStat` imported and instantiated in GameState
- [ ] `g.morality` returns current morality value in require expressions
- [ ] `moralidade` resource syncs with BipolarStat every tick
- [ ] Morality persists across save/load
- [ ] At least 3 moral choice events fire at appropriate milestones
- [ ] Choosing an option shifts morality (verify with console: `Game.state.morality.value`)
- [ ] Choice effects apply correctly (resources, mods)
- [ ] Morality bar renders in Pilot tab (bipolar: -100 to +100)
- [ ] `g.morality>=30` and `g.morality<=-30` correctly gate content
- [ ] AI_RULES.md §2.2 patterns all function

---

## FILE REFERENCE

| File | Action |
|------|--------|
| `src/values/BipolarStat.js` | EXISTS — no changes needed |
| `src/gameState.js` | MODIFY — import BipolarStat, instantiate, expose to g. |
| `src/game.js` | MODIFY — sync moralidade resource, add presentChoice/resolveChoice, add milestones |
| `modules/persist.js` | MODIFY — save/load morality |
| `data/mecha/events.json` | MODIFY — add 3+ moral choice events |
| `data/mecha/resources.json` | MODIFY — update moralidade with min:-100 |
| `src/ui/popups/DialogueModal.vue` | MODIFY — add choice buttons (Option A) |
| `src/ui/TerminalUI.vue` | MODIFY — add morality bar to Pilot section |

---

*This spec is self-contained. After implementation, Reclaim-02 (Jobs) and Reclaim-05 (Factions) can reference `g.morality` in their require strings.*
