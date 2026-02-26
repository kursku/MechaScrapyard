# SPEC: Furniture Items — Phase 2 / Rank 2

**Type:** `feat(data/p2)`
**Effort:** Medium — ~2 hours, pure data + minor game.js mod wiring
**Depends on:** Phase 1 SPEC_data_blockers (Portuguese ID fix must be done first)
**Blocks:** Phase 4 content — `cybernetic_bench` gates the CyberLab zone

---

## Why This Matters

- `cybernetic_bench` is required by `zones.json` to unlock the CyberLab zone — it doesn't exist anywhere in data files. Phase 4 is permanently blocked without it.
- `research_desk` replaces `mesa_pesquisa` (the Portuguese ID now standardized in P1). It gates Phase 4 of the scrapyard home and must exist as a real item.
- `workbench` currently gives only `space: 2` for 50 scrap + 30 creds — it should boost crafting.
- There are no furniture items beyond `parts_shelf` (Phase 3 gate) — the scrapyard grows to 50 space but nothing fills it meaningfully in Phase 4–5.

---

## Files Changed

- `data/mecha/furniture.json`
- `data/mecha/modules.json` (if new data categories need registration)

---

## Change 1 — Fix workbench Mod

**File:** `data/mecha/furniture.json`

```json
// BEFORE
{ "id": "workbench", "mod": { "space": 2 }, ... }

// AFTER
{
    "id": "workbench",
    "name": "Reinforced Workbench",
    "desc": "A sturdy bench for assembling and repairing components. Speeds up all crafting.",
    "require": "g.workshop_lv2>0",
    "max": 1,
    "cost": { "scrap": 50, "creds": 30 },
    "mod": { "recipe_speed": 0.15, "space": 2 },
    "flavor": "Built to survive a mecha falling on it. Probably."
}
```

---

## Change 2 — Add research_desk

**File:** `data/mecha/furniture.json`

This replaces `mesa_pesquisa`. Gates Phase 4 home and CyberLab zone (indirectly via `skill_hacking`).

```json
{
    "id": "research_desk",
    "name": "Research Terminal",
    "desc": "A data terminal for studying schematics and netrunning. Unlocks advanced research paths.",
    "require": "g.workshop_lv2>0&&g.refinery>0",
    "max": 1,
    "cost": { "scrap": 60, "creds": 80, "nano_infra": 5 },
    "mod": { "space": 2 },
    "flavor": "The answers are out there. This is how you find them."
}
```

---

## Change 3 — Add cybernetic_bench

**File:** `data/mecha/furniture.json`

Required by `zones.json` line 262: `"require": "g.cybernetic_bench>0&&g.skill_hacking>=4"`.

```json
{
    "id": "cybernetic_bench",
    "name": "Cybernetic Workbench",
    "desc": "A specialized workstation for neural interface work and augmentation installation.",
    "require": "g.research_desk>0&&g.skill_hacking>=2",
    "max": 1,
    "cost": { "scrap": 80, "nano_infra": 10, "creds": 150 },
    "mod": { "space": 3 },
    "flavor": "Where flesh meets machine. Handle with care."
}
```

---

## Change 4 — Add pilot_sim (Phase 4 furniture)

A training simulator that accelerates pilot skill development. Fills Phase 4 space meaningfully.

```json
{
    "id": "pilot_sim",
    "name": "Combat Simulator",
    "desc": "A training rig that lets you practice maneuvers without field risk. Boosts all pilot skill training.",
    "require": "g.garage>0&&g.research_desk>0",
    "max": 1,
    "cost": { "scrap": 70, "creds": 120, "nano_infra": 8 },
    "mod": { "skill_train_speed": 0.20, "space": 3 },
    "flavor": "Simulated pain still teaches real lessons."
}
```

---

## Change 5 — Add repair_bay (Phase 3–4 furniture)

Auto-repairs frame condition over time. Addresses the gap between combat damage and manual repair.

```json
{
    "id": "repair_bay",
    "name": "Automated Repair Bay",
    "desc": "A robotic maintenance system that slowly restores frame condition between missions.",
    "require": "g.garage>0",
    "max": 2,
    "cost": { "scrap": 50, "creds": 60 },
    "mod": { "frame_repair_rate": 0.01, "space": 2 },
    "flavor": "It works while you sleep. Barely, but it works."
}
```

---

## Test Checklist

- [ ] `workbench` shows `recipe_speed` bonus in item tooltip
- [ ] `research_desk` appears in Scrapyard upgrades after `workshop_lv2` + `refinery`
- [ ] `cybernetic_bench` appears in upgrades after `research_desk` + `skill_hacking>=2`
- [ ] `homes.json` Phase 4 gate (`g.research_desk>0`) resolves correctly after purchasing research_desk
- [ ] `zones.json` CyberLab zone gate (`g.cybernetic_bench>0`) resolves correctly
- [ ] `npm run build` passes

---

## Commit Message

```
feat(data/p2): add research_desk, cybernetic_bench, pilot_sim, repair_bay; fix workbench mod
```
