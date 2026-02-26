# SPEC: Icon Migration — Phase 3 / Rank 6

**Type:** `ui(icons/p3)`
**Effort:** Low — ~1–2 hours, CSS + template changes only
**Depends on:** Nothing
**Blocks:** Nothing (cosmetic only)

---

## Why This Matters

`design-system/mecha-scrapyard/MASTER.md` explicitly forbids emoji as functional icons:

> ❌ **Emojis as icons** — use SVG icons or CSS shapes instead

The current codebase uses emojis as UI icons (e.g., ⚡ for energy, 🔧 for tasks,
faction glyph emojis). This breaks the terminal aesthetic and causes rendering
inconsistencies across OS/browsers (emoji vary by platform).

---

## Files Changed

- `src/ui/HudOverlay.vue`
- `src/ui/sections/ResourceMonitor.vue`
- `src/ui/sections/ScrapyardPanel.vue`
- `src/ui/sections/MechaPanel.vue`
- `data/mecha/manufacturers.json` (if manufacturer icons are emoji)

---

## Audit: Current Emoji Usage

Run the following to find all emoji in source:
```bash
grep -rn '[^\x00-\x7F]' src/ui/ --include="*.vue"
```

Expected finds:
- `⚡` (energy) in ResourceMonitor, HudOverlay
- `🔧` or similar (task type) in ScrapyardPanel
- Manufacturer icons in `manufacturers.json` → rendered in MechaPanel
- `◆` (ASCII diamond — acceptable, keep)
- `→` (ASCII arrow — acceptable, keep)

---

## Replacement Strategy

### Option A — CSS-Only Shapes (Recommended)

Replace emoji with CSS pseudo-elements. No SVG files needed:

```css
/* Energy icon */
.icon-energy::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 10px;
    background: var(--warning);
    clip-path: polygon(50% 0%, 100% 50%, 60% 50%, 80% 100%, 0% 45%, 40% 45%);
    margin-right: 4px;
    vertical-align: middle;
}

/* Scrap icon */
.icon-scrap::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border: 1px solid var(--text-dim);
    transform: rotate(45deg);
    margin-right: 4px;
    vertical-align: middle;
}

/* Generic slot icon — filled square */
.icon-slot::before {
    content: '■';
    font-size: 8px;
    margin-right: 4px;
    color: var(--primary);
}
```

Usage in template:
```vue
<!-- BEFORE -->
<span>⚡ {{ energy }}</span>

<!-- AFTER -->
<span class="icon-energy">{{ energy }}</span>
```

### Option B — Letter Codes (Simpler)

Replace emoji with bracketed ASCII codes. Consistent, zero-render-risk:

```
⚡ → [ENR]
🔧 → [WRK]
⚙ → [CFG]
```

This matches the existing terminal aesthetic (e.g., `[BREACH]`, `[TORSO]`).

**Recommendation:** Use Option B for data-driven icons (manufacturer glyphs, task type
icons) and Option A CSS shapes for resource icons in the HUD.

---

## Change 1 — ResourceMonitor.vue

```vue
<!-- BEFORE -->
<span class="resource-icon">⚡</span>

<!-- AFTER -->
<span class="resource-glyph icon-energy"></span>
```

Or with letter code:
```vue
<span class="resource-glyph">[ENR]</span>
```

---

## Change 2 — Manufacturer Icons in Data

In `data/mecha/manufacturers.json`, if `icon` field contains emoji:

```json
// BEFORE
{ "id": "mfr_apex", "name": "APEX", "icon": "⚙", "color": "#ff6b35" }

// AFTER
{ "id": "mfr_apex", "name": "APEX", "glyph": "APX", "color": "#ff6b35" }
```

And in MechaPanel.vue, render `mfr.glyph` inside a styled span instead of raw emoji.

---

## Change 3 — HudOverlay Energy Hint

The Phase 1 energy hint uses `⚡` — replace per above strategy.

---

## What to Keep

These ASCII characters are NOT emoji and SHOULD be kept:
- `◆` (U+25C6 BLACK DIAMOND — ASCII-adjacent, renders mono)
- `→` (U+2192 RIGHTWARDS ARROW)
- `■` (U+25A0 BLACK SQUARE)
- `▸` (U+25B8 SMALL RIGHT-POINTING TRIANGLE)
- `[` `]` bracket decorations

---

## Test Checklist

- [ ] No emoji appear in ResourceMonitor, ScrapyardPanel, or MechaPanel
- [ ] Manufacturer glyphs render as styled text codes, not emoji
- [ ] Energy hint in chassis overview uses CSS icon or `[ENR]` code
- [ ] Icons are legible at small sizes (10–12px)
- [ ] Appearance consistent across Chrome, Firefox, Edge (no platform variation)
- [ ] `npm run build` passes

---

## Commit Message

```
ui(icons/p3): replace emoji icons with CSS shapes and ASCII codes
```
