# SPEC: Phase 3 Story Missions — Phase 3 / Rank 1

**Type:** `content(missions/p3)`
**Effort:** Medium — ~3 hours, JSON data + light narrative writing
**Depends on:** Phase 2 SPEC_content_missions (base roster must be in place)
**Blocks:** Nothing (self-contained content layer)

---

## Why This Matters

Phase 2 missions establish the mechanical loop. Phase 3 missions advance the Hayashi
family story arc from the narrative bible. Players must feel Kenji's personal stakes —
his father's debts, the factions that orbited Grandpa's workshop, and the looming threat
of permanent base loss.

---

## Files Changed

- `data/mecha/missions.json`
- `data/mecha/events.json` (narrative triggers on mission complete)

---

## Target Story Mission Roster

| ID | Name | Arc Beat | Gate | Event Trigger |
|----|------|---------|------|--------------|
| `msn_fathers_debt_01` | Father's Debt — Notice | Ironjaw threatens the base | glory≥10 | `evt_debt_notice` |
| `msn_steel_covenant_intro` | Steel Covenant Envoy | First faction approach | glory≥15 | `evt_covenant_approach` |
| `msn_nephilim_salvage` | Nephilim Salvage Team | Nephilim antagonist intro | intel≥20 | `evt_nephilim_spotted` |

---

## Mission Data

### msn_fathers_debt_01
```json
{
    "id": "msn_fathers_debt_01",
    "name": "Father's Debt — Notice",
    "description": "An Ironjaw enforcer left a calling card at the workshop. Kenji's father owes more than scrap.",
    "difficulty": 4,
    "energyCost": 20,
    "require": "g.glory>=10",
    "enemies": ["rival_grunt", "ironjaw_enforcer"],
    "onComplete": { "event": "evt_debt_notice" },
    "rewards": {
        "scrap": 50,
        "credits": 60,
        "glory": 3,
        "intel": 8,
        "xp": 35
    }
}
```

### msn_steel_covenant_intro
```json
{
    "id": "msn_steel_covenant_intro",
    "name": "Steel Covenant Envoy",
    "description": "A Steel Covenant representative wants to talk — but first, a proof of strength.",
    "difficulty": 5,
    "energyCost": 25,
    "require": "g.glory>=15",
    "enemies": ["covenant_test_unit"],
    "onComplete": { "event": "evt_covenant_approach" },
    "rewards": {
        "glory": 5,
        "credits": 80,
        "intel": 15,
        "xp": 50,
        "faction": { "id": "steel_covenant", "rep": 10 }
    }
}
```

### msn_nephilim_salvage
```json
{
    "id": "msn_nephilim_salvage",
    "name": "Nephilim Salvage Team",
    "description": "Nephilim Corp has a team stripping your zone. They won't stop unless you make them.",
    "difficulty": 6,
    "energyCost": 30,
    "require": "g.intel>=20",
    "enemies": ["nephilim_operator", "nephilim_operator"],
    "onComplete": { "event": "evt_nephilim_spotted" },
    "rewards": {
        "scrap": 80,
        "credits": 100,
        "glory": 8,
        "intel": 20,
        "xp": 60
    }
}
```

---

## New Enemy Definitions

### ironjaw_enforcer
```json
{
    "id": "ironjaw_enforcer",
    "name": "Ironjaw Enforcer",
    "level": 5,
    "hp": 140,
    "atk": 40,
    "def": 15,
    "speed": 40,
    "loot": [
        { "id": "credits", "amount": 30, "chance": 1.0 },
        { "id": "scrap", "amount": 20, "chance": 0.9 }
    ]
}
```

### covenant_test_unit
```json
{
    "id": "covenant_test_unit",
    "name": "Covenant Test Unit",
    "level": 6,
    "hp": 200,
    "atk": 45,
    "def": 25,
    "speed": 35,
    "loot": [
        { "id": "credits", "amount": 40, "chance": 1.0 },
        { "id": "intel", "amount": 10, "chance": 0.7 }
    ]
}
```

### nephilim_operator
```json
{
    "id": "nephilim_operator",
    "name": "Nephilim Operator",
    "level": 7,
    "hp": 160,
    "atk": 50,
    "def": 20,
    "speed": 55,
    "loot": [
        { "id": "intel", "amount": 15, "chance": 1.0 },
        { "id": "credits", "amount": 35, "chance": 0.8 }
    ]
}
```

---

## Event Stubs (events.json additions)

```json
{
    "id": "evt_debt_notice",
    "title": "Father's Debt",
    "speaker": "Ironjaw Enforcer",
    "text": "\"Your old man borrowed from us. You're his blood. Figure it out.\" The enforcer drops a dataslate and walks.",
    "choices": [
        { "label": "I'll handle it.", "effect": null },
        { "label": "I'll find another way.", "effect": null }
    ]
},
{
    "id": "evt_covenant_approach",
    "title": "The Covenant Extends a Hand",
    "speaker": "Covenant Liaison",
    "text": "\"We've watched your work. The Steel Covenant has resources. You have potential. This doesn't have to be difficult.\"",
    "choices": [
        { "label": "What do you want from me?", "effect": { "faction": { "id": "steel_covenant", "rep": 5 } } },
        { "label": "I work alone.", "effect": null }
    ]
},
{
    "id": "evt_nephilim_spotted",
    "title": "Nephilim in the Yard",
    "speaker": "Kenji",
    "text": "They weren't just salvaging. Someone hired them to look for something specific. Something Grandpa left behind.",
    "choices": [
        { "label": "...", "effect": null }
    ]
}
```

---

## Test Checklist

- [ ] Story missions appear in mission list when gate conditions are met
- [ ] `onComplete.event` fires the correct event modal after combat resolves
- [ ] Faction rep reward in `msn_steel_covenant_intro` is credited to steel_covenant
- [ ] New enemy types load without errors in combat
- [ ] `npm run build` passes

---

## Commit Message

```
content(missions/p3): add Hayashi story arc missions and narrative events
```
