# ◆ Mecha Scrapyard

> Idle RPG set in a cyberpunk scrapyard — restore your father's mecha, uncover the truth.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## About

You're a teenager living with your grandfather in a rundown scrapyard on the outskirts of **New Tokyo**. Your father — a former police officer — disappeared years ago. One day, you discover his first mecha hidden in the old garage. Restore it, explore the city, and uncover what happened to him.

## Tech Stack

- **Vue 3** + **Vite** (same engine as [Arcanum](https://gitlab.com/arcanumtesting/arcanum))
- **Data-driven architecture** — all game content defined in `data/mecha/*.json`
- **Terminal/CRT aesthetic** — monospace fonts, neon green, scanlines

## Project Structure

```
├── src/              # Engine code
│   ├── game.js       # Main game loop (200ms tick)
│   ├── gameState.js  # Central state + resource management
│   ├── techTree.js   # Cascading unlock system
│   ├── dataLoader.js # JSON data loading
│   ├── modules/      # Runner, persistence
│   ├── values/       # BipolarStat (morality), Stat class
│   ├── util/         # d100 rolls, formatting
│   └── ui/           # Vue components
├── data/mecha/       # ALL game content (JSON)
│   ├── resources.json
│   ├── tasks.json
│   ├── upgrades.json
│   ├── events.json
│   └── ...
├── css/              # Terminal aesthetic stylesheet
├── AI_RULES.md       # ⚠ Read before contributing
└── package.json
```

## For AI Assistants

**Read `AI_RULES.md` before making any changes.** It contains architectural decisions, data patterns, naming conventions, the No Magic rule, and content creation checklists.

## Current Status: Sprint 1.5

- ✅ Core idle loop (scavenging, jobs, upgrades)
- ✅ Blueprint system (Earn → Learn → Produce)
- ✅ Refinery with recipes
- ✅ Terminal UI with system log
- 🔜 Sprint 2: Scrapyard phases, structures, mecha discovery

## License

MIT
