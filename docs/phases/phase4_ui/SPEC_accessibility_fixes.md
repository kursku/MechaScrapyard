# SPEC — Accessibility Fixes

**Phase:** 4-UI — Spec 1 of 4
**Area:** Accessibility / Reduced Motion
**Priority:** 🔴 CRITICAL — Two issues violate basic accessibility contracts
**Estimated effort:** ~1 hour
**Prerequisites:** SPEC 11 (DTL), SPEC 12 (Street Cred)

---

## WHY THIS MATTERS

Two gaps were flagged as critical in the Phase 4 UI audit:

1. The DTL pulse animation at levels 4–5 lives in a scoped `<style>` block and escapes the global `prefers-reduced-motion` rule. Users who have vestibular disorders or motion sensitivity will see an infinite pulsing animation regardless of their OS accessibility setting.

2. Negative street cred consequences (vendor price +10%, contact loyalty penalty, locked dialogue) are communicated by color alone. A colorblind user on a BURNED-cred run gets no indication that doors are closing.

---

## PART 1: DTL PULSE — REDUCED MOTION

### 1.1 The problem

In `ScrapyardPanel.vue`:

```css
.dtl-4, .dtl-5 { color: #e05; animation: dtl-pulse 1.5s ease-in-out infinite; }

@keyframes dtl-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}
```

The global rule in `mecha_terminal.css`:

```css
@media (prefers-reduced-motion: reduce) {
    body { animation: none !important; }
}
```

The `body` rule does NOT propagate into scoped Vue component styles. The pulse continues.

### 1.2 Fix

Add a reduced-motion override inside `ScrapyardPanel.vue`'s `<style scoped>` block:

```css
@media (prefers-reduced-motion: reduce) {
    .dtl-4, .dtl-5 {
        animation: none;
    }
}
```

---

## PART 2: NEGATIVE CRED — NON-COLOR INDICATOR

### 2.1 The problem

At `street_cred < 0`, `PilotPanel.vue` shows:
- Bar turns red (color-only)
- Tier label reads `BURNED`

No description of what `BURNED` means mechanically. No indication which doors are closed.

### 2.2 Fix

When `streetCred < 0`, add a warning line below the cred bar in `PilotPanel.vue`:

```vue
<div v-if="streetCred < 0" class="cred-burned-notice">
    ⚠ BURNED — vendors charge +10%, contacts build slower
</div>
```

```css
.cred-burned-notice {
    font-size: 9px;
    font-family: var(--font-mono);
    color: #f44;
    letter-spacing: 0.06em;
    margin-top: 4px;
    opacity: 0.85;
}
```

This satisfies both "color is not the only indicator" and gives the player actionable context.

---

## VERIFICATION CRITERIA

- [ ] DTL 4–5 animation stops when OS `prefers-reduced-motion: reduce` is active
- [ ] Negative street cred shows text notice (not only red color) explaining consequences
- [ ] Both fixes are scoped — no global CSS side effects

---

## FILE REFERENCE

| File | Action |
| --- | --- |
| `src/ui/sections/ScrapyardPanel.vue` | ADD `@media (prefers-reduced-motion)` block in `<style scoped>` |
| `src/ui/sections/PilotPanel.vue` | ADD `.cred-burned-notice` with `v-if="streetCred < 0"` |
