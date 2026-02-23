# Implementation Plan — Mecha Scrapyard

This document outlines intended structural and feature work at a high level.

## Current focus (UI/UX)
- Standardize list cards across screens (Tasks / Upgrades / Refinery / Market)
- Improve feedback loops (button states, log clarity)
- Improve tooltip data density (net rates, affordability)

## Guardrails
- Keep all progression logic data-driven via `require` fields in `data/mecha/`
- Avoid any fantasy/magic terminology (see `AI_RULES.md`)
- Maintain terminal aesthetic (monospace, sharp borders, no border-radius)

## Next candidate milestones
1. Apply ListCard-like layout consistency to Mecha TerminalUI mode
2. Add better action feedback in system log (start/stop/complete)
3. Tooltip enrichment: show net rates and sustainability
