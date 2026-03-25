# MechaScrapyard — Claude Context

## Project

**Mecha Scrapyard** is an idle RPG built in Vue 3 + Vite. The player restores their father's mecha in a cyberpunk scrapyard in New Tokyo, uncovering a narrative across prestige cycles. No external design libraries — fully custom CSS via design tokens in `css/mecha_terminal.css`.

**Author**: Charles (SB Studio)
**Stack**: Vue 3 (Options API), Vite, VT323 + Atkinson Hyperlegible fonts, custom CSS design tokens

---

## Design Context

### Users

Idle/incremental game fans who engage with narrative. Players who appreciate mechanical depth (prestige cycles, alignment, glory, street cred, faction reputation) and want to feel like they're operating a real terminal system — not playing a casual browser game. The UI must reward patient exploration without confusing first-time visitors.

### Brand Personality

**Gritty. Systemic. Atmospheric.**

The scrapyard has history and loss in it — the father's mecha, the mystery. The UI should feel like a real operating system from a near-future that went wrong. Every upgrade is earned; every piece of information is a readout from a live system.

Emotional goal: **gritty determination** — the player is a survivor running their own terminal, fighting for every scrap in a city that doesn't care.

### Aesthetic Direction

**Reference hierarchy (most → least influential):**

1. **Hacknet** — Primary reference. Everything feels like a real OS terminal. Minimal chrome, maximum authenticity. Text IS the UI. Bracket notation `[LABEL]`, monospace grids, sparse color.
2. **XCOM / tactical** — Secondary reference. Data-dense panels with clear military/industrial hierarchy. Grid-based information layout. Stats are readable at a glance.
3. **Cyberpunk 2077** — Accent layer only. Aggressive typography, glitch effects, bright accent colors cutting through darkness. Applied sparingly for emphasis — not as the base layer.

**Existing palette** (do not change without reason):
- `--primary: #ffb000` — amber/gold, industrial warmth
- `--color-success: #00ff41` — phosphor green, CRT status
- `--secondary: #c36a2d` — rust orange, sub-navigation
- Backgrounds: near-black `#050505` → `#0a0a0c` → `#0d0d0f`
- Text: `#e0d8c8` warm off-white, `#a8a295` dim
- Radius: `0px` HUD-level, `2px` micro-arounding (labeled "Geometry Extremism: Brutalist 0px")

**Dark mode only.** Never introduce light mode.

**Anti-references** — what this should NOT look like:
- Clean SaaS dashboards (Notion, Linear, Vercel UI)
- Soft rounded cards with pastel colors
- Material Design / iOS-style gradients
- Neon-heavy "generic cyberpunk" (everything glowing all the time)

### Design Principles

1. **Terminal authenticity first** — Every UI element should feel like it could exist in a real OS readout. If it looks like a website widget, rethink it.

2. **Information density over decoration** — Stats, rates, costs, and status should be visible without clicking. Decorative elements exist only to reinforce hierarchy, not for their own sake.

3. **Earned legibility** — The aesthetic is intentionally dense and dark. Use Atkinson Hyperlegible and sufficient contrast for body text. VT323 is for labels, headers, and terminal flavor — not long-form reading.

4. **Cyberpunk as accent, not foundation** — Glitch effects, glow, and animation are reserved for meaningful moments (critical HP, prestige, new unlocks). Overuse destroys impact.

5. **Mechanical clarity surfaces story** — Phase 4 systems (prestige, glory, street cred, alignment, faction rep) are invisible to new players. UI improvements should make these legible without breaking the terminal aesthetic — think XCOM stat panels, not tutorial popups.
