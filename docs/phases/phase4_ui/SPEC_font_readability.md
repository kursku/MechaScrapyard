# SPEC — Font Readability System

**Phase:** 4-UI — Spec 5 of 7
**Area:** Global Typography / CSS Variables
**Priority:** 🔴 CRITICAL — Small fonts rendered unreadable across all panels
**Status:** ✅ COMPLETE

---

## PROBLEM

100+ hardcoded `font-size` values (8px–11px) were scattered across 12 Vue components. Many were below 10px, making text unreadable on standard displays. No consistent sizing system existed — each component picked arbitrary pixel values.

## SOLUTION

### 5.1 CSS Variable Floor Bumps (`main.vue`)

| Variable | Before | After |
|----------|--------|-------|
| `--font-size-xxs` | 10px | 12px |
| `--font-size-xs` | 12px | 13px |

### 5.2 Global Replacement

Replaced all hardcoded `font-size` values with CSS variable references across 12 components:

| File | Replacements |
|------|-------------|
| `TerminalUI.vue` | 15+ instances |
| `CombatPanel.vue` | 10+ instances |
| `HudOverlay.vue` | 8+ instances |
| `ListCard.vue` | 5+ instances |
| `ResourceBufferBadge.vue` | 3+ instances |
| `DialogueModal.vue` | 6+ instances |
| `itemPopup.vue` | 8+ instances |
| `OperationsPanel.vue` | 10+ instances |
| `PilotPanel.vue` | 12+ instances |
| `ScrapyardPanel.vue` | 15+ instances |
| `ZonesPanel.vue` | 5+ instances |
| `main.vue` | Variable definitions |

### 5.3 Variable Reference Table

```
--font-size-xxs: 12px  → labels, badges, sub-text
--font-size-xs:  13px  → card content, descriptions
--font-size-sm:  14px  → body text
--font-size-base: 15px → primary content
--font-size-lg:  17px  → section titles
```

## VERIFICATION CRITERIA

- [x] No hardcoded font-size values below 12px remain
- [x] All components use `var(--font-size-*)` references
- [x] Text remains readable at default zoom on 1080p+ displays
- [x] No visual regressions in any panel

## FILE REFERENCE

| File | Action |
|------|--------|
| `src/ui/main.vue` | MODIFY CSS variable definitions (bump floors) |
| `src/ui/TerminalUI.vue` | MODIFY 15+ font-size → var() |
| `src/ui/HudOverlay.vue` | MODIFY 8+ font-size → var() |
| `src/ui/components/CombatPanel.vue` | MODIFY 10+ font-size → var() |
| `src/ui/components/ListCard.vue` | MODIFY font-size → var() |
| `src/ui/components/ResourceBufferBadge.vue` | MODIFY font-size → var() |
| `src/ui/popups/DialogueModal.vue` | MODIFY font-size → var() |
| `src/ui/popups/itemPopup.vue` | MODIFY font-size → var() |
| `src/ui/sections/OperationsPanel.vue` | MODIFY font-size → var() |
| `src/ui/sections/PilotPanel.vue` | MODIFY font-size → var() |
| `src/ui/sections/ScrapyardPanel.vue` | MODIFY font-size → var() |
| `src/ui/sections/ZonesPanel.vue` | MODIFY font-size → var() |
| `css/mecha_terminal.css` | MODIFY global font-size references |
