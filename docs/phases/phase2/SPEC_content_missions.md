# SPEC: Content — Missions — Phase 2 / Rank 7

**Type:** `content(missions/p2)`
**Effort:** Low-Medium — ~2 hours, JSON data only + minor combatRunner adjustments
**Depends on:** Phase 1 SPEC_data_blockers (mission IDs must be correct before adding more)
**Blocks:** Phase 3 SPEC_phase3_missions (harder missions build on this roster)

---

## Why This Matters

The game currently ships with only 2 missions. The second mission (`mission_scrap_drone`)
uses a placeholder difficulty-3 enemy and is unrewarding. New players burn through all
available content in under 5 minutes, then have nothing to fight.

---

## Files Changed

- `data/mecha/missions.json`
- `data/mecha/enemies.json` (or wherever enemy definitions live)

---

## Target Mission Roster (Phase 2)

Add 4 new missions covering the early-mid scrapyard narrative arc:

| ID | Name | Difficulty | Gate | New enemy? |
|----|------|-----------|------|-----------|
| `msn_salvage_run_01` | Salvage Run: Sector 7 | 1 | none | no |
| `msn_rogue_drone_patrol` | Rogue Drone Patrol | 2 | scrap≥50 | no (scrap_drone) |
| `msn_rival_gang_01` | Rival Gang — First Contact | 3 | glory≥1 | YES: rival_grunt |
| `msn_corrupted_sentinel` | Corrupted Sentinel | 4 | glory≥5 | YES: corrupted_sentinel |

---

## Mission Data Shapes

### msn_salvage_run_01
```json
{
    "id": "msn_salvage_run_01",
    "name": "Salvage Run: Sector 7",
    "description": "Standard sweep through the outer ring. Drones, debris, and opportunity.",
    "difficulty": 1,
    "energyCost": 5,
    "enemies": ["scrap_drone"],
    "rewards": {
        "scrap": 20,
        "credits": 10,
        "xp": 5
    }
}
```

### msn_rogue_drone_patrol
```json
{
    "id": "msn_rogue_drone_patrol",
    "name": "Rogue Drone Patrol",
    "description": "A cluster of corrupted drones has taken up permanent residence near the water reclamation plant. Clear them.",
    "difficulty": 2,
    "energyCost": 10,
    "require": "g.scrap>=50",
    "enemies": ["scrap_drone", "scrap_drone"],
    "rewards": {
        "scrap": 35,
        "credits": 20,
        "glory": 1,
        "xp": 12
    }
}
```

### msn_rival_gang_01
```json
{
    "id": "msn_rival_gang_01",
    "name": "Rival Gang — First Contact",
    "description": "The Ironjaw crew has been raiding your usual spots. Time for an introduction.",
    "difficulty": 3,
    "energyCost": 15,
    "require": "g.glory>=1",
    "enemies": ["rival_grunt"],
    "rewards": {
        "scrap": 40,
        "credits": 35,
        "glory": 2,
        "intel": 5,
        "xp": 20
    }
}
```

### msn_corrupted_sentinel
```json
{
    "id": "msn_corrupted_sentinel",
    "name": "Corrupted Sentinel",
    "description": "Something ancient is waking up in the deep scrapyard. It doesn't like visitors.",
    "difficulty": 4,
    "energyCost": 20,
    "require": "g.glory>=5",
    "enemies": ["corrupted_sentinel"],
    "rewards": {
        "scrap": 60,
        "credits": 50,
        "glory": 5,
        "intel": 10,
        "xp": 40
    }
}
```

---

## New Enemy Definitions

### rival_grunt
```json
{
    "id": "rival_grunt",
    "name": "Ironjaw Grunt",
    "level": 3,
    "hp": 80,
    "atk": 22,
    "def": 8,
    "speed": 45,
    "loot": [
        { "id": "scrap", "amount": 15, "chance": 1.0 },
        { "id": "credits", "amount": 10, "chance": 0.8 }
    ]
}
```

### corrupted_sentinel
```json
{
    "id": "corrupted_sentinel",
    "name": "Corrupted Sentinel",
    "level": 5,
    "hp": 180,
    "atk": 35,
    "def": 20,
    "speed": 30,
    "abilities": ["suppress"],
    "loot": [
        { "id": "scrap", "amount": 30, "chance": 1.0 },
        { "id": "credits", "amount": 25, "chance": 1.0 },
        { "id": "intel", "amount": 5, "chance": 0.6 }
    ]
}
```

> Note: Check the actual shape of enemy entries in `data/mecha/enemies.json` before inserting.
> The `abilities` field is aspirational — if CombatRunner doesn't support per-enemy abilities yet,
> omit it and add as a Phase 3 enhancement.

---

## zones.json Update

Add the new missions to `zone_scrapyard.availableMissions`:
```json
"availableMissions": [
    "msn_salvage_run_01",
    "msn_rogue_drone_patrol",
    "msn_rival_gang_01",
    "msn_corrupted_sentinel"
]
```

---

## Test Checklist

- [ ] All 4 new missions appear in the MISSIONS tab
- [ ] Gated missions (`msn_rogue_drone_patrol`, `msn_rival_gang_01`, `msn_corrupted_sentinel`) are hidden until their `require` condition is met
- [ ] Running `msn_salvage_run_01` completes without error
- [ ] Enemy stats are reasonable — player should not one-shot difficulty-4 at game start
- [ ] Rewards are credited to the correct resource pools
- [ ] `npm run build` passes

---

## Commit Message

```
content(missions/p2): add 4 early-game missions and 2 enemy types
```
