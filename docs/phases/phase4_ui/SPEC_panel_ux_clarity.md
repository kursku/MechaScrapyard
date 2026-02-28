# SPEC — Panel UX Clarity

**Phase:** 4-UI — Spec 3 of 4
**Area:** Career, Factions, Zones panels
**Priority:** 🟠 HIGH — Empty states and hidden gates create confusion
**Estimated effort:** ~2 hours
**Prerequisites:** SPEC 5 (jobs), SPEC 6 (factions/contacts)

---

## WHY THIS MATTERS

Three panels have clarity gaps where the system silently hides information instead of guiding the player:

1. **FactionsPanel** — Contact sections render nothing when locked. No explanation of how to unlock them.
2. **CareerPanel** — Morality-gated jobs vanish entirely. Players can't tell if a job doesn't exist or if they're locked out.
3. **PilotPanel** — Street cred bar at 0% is invisible — looks like the feature is absent, not zeroed.

Each gap creates a false impression: "the game is broken" instead of "I haven't built this yet."

---

## PART 1: FACTION CONTACTS EMPTY STATE

### 1.1 Current behavior

```vue
<div v-if="contact exists">...</div>
```

If no contacts are unlocked for a faction, the section renders nothing.

### 1.2 Fix

Add a `v-else` empty state:

```vue
<div v-if="faction.contacts && faction.contacts.length" class="contacts-list">
    <!-- existing contact rendering -->
</div>
<div v-else class="contacts-empty">
    [ No contacts — build faction rep to establish connections ]
</div>
```

```css
.contacts-empty {
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--text-dim);
    opacity: 0.45;
    letter-spacing: 0.06em;
    padding: 6px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}
```

---

## PART 2: MORALITY-GATED JOBS — VISIBLE LOCKS

### 2.1 Current behavior

Jobs with morality requirements that the player doesn't meet simply don't appear in `availableJobs`. Players see nothing.

### 2.2 Fix

In `CareerPanel.vue`, compute a `lockedJobs` list alongside `availableJobs` — jobs that fail their morality requirement but exist:

```js
lockedJobs() {
    this.renderTick;
    return this.allJobs.filter(job => {
        // Failed morality gate but otherwise eligible
        const moralityOk = job.require_morality === undefined ||
            (job.require_morality === 'paragon' && (this.state.g.morality || 0) >= 30) ||
            (job.require_morality === 'shadow' && (this.state.g.morality || 0) <= -30);
        return !moralityOk;
    });
},
```

Then below the available jobs grid:

```vue
<div v-if="lockedJobs.length" class="locked-jobs-section">
    <div class="hud-section-title" style="opacity: 0.4; font-size: 9px;">
        &gt; PATH-LOCKED OPPORTUNITIES
    </div>
    <div v-for="job in lockedJobs" :key="job.id" class="locked-job-row">
        <span class="locked-job-name">{{ job.name.toUpperCase() }}</span>
        <span class="locked-job-gate">
            ⊘ REQUIRES {{ job.require_morality === 'paragon' ? 'PARAGON' : 'SHADOW' }} PATH
        </span>
    </div>
</div>
```

```css
.locked-jobs-section { margin-top: 12px; }
.locked-job-row {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--text-dim);
    opacity: 0.45;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.locked-job-gate { color: #888; font-style: italic; }
```

---

## PART 3: STREET CRED BAR MINIMUM VISUAL

### 3.1 Current behavior

At `streetCred = 0`, the bar is `width: 0%` — completely invisible. Looks like the widget failed to render.

### 3.2 Fix

Give the `.cred-bar-wrap` a faint baseline marker at 0 so the range is visually established:

```css
.cred-bar-wrap {
    height: 4px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: 4px;
    position: relative;
}

/* Baseline tick at 0 — shows range when bar is empty */
.cred-bar-wrap::before {
    content: '';
    position: absolute;
    left: 0;
    top: -2px;
    bottom: -2px;
    width: 1px;
    background: rgba(255, 255, 255, 0.2);
}
```

This adds a 1px vertical tick at the left edge (zero position), making it clear the bar exists and has a range.

---

## VERIFICATION CRITERIA

- [ ] Faction contact section shows empty state text when no contacts unlocked
- [ ] Morality-gated locked jobs appear as dim read-only rows with gate label
- [ ] Street cred bar at 0 shows baseline tick so the range is visually clear

---

## FILE REFERENCE

| File | Action |
| --- | --- |
| `src/ui/sections/FactionsPanel.vue` | ADD `v-else` contacts-empty state |
| `src/ui/sections/CareerPanel.vue` | ADD `lockedJobs` computed + locked-jobs-section template |
| `src/ui/sections/PilotPanel.vue` | ADD `::before` baseline tick to `.cred-bar-wrap` |
