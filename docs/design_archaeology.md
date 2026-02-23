# Mecha Scrapyard — Design Archaeology
## What Was Built With Zero, What Survived, and What's Waiting to Be Reclaimed

---

## Executive Summary

Across 17 splits (~15,000 lines) of ChatGPT sessions with "Zero," you designed a remarkably complete game. The current project captures maybe **40% of that original vision** — the combat core, frame assembly, economy, basic narrative, and pilot progression are solid. But entire systems that made the original design rich and distinctive were simplified away during the transition to implementation.

This document maps what exists, what was lost, and what's worth reclaiming — prioritized by how much each element would enrich the player experience within the idle/incremental framework.

---

## 1. SYSTEMS THAT SURVIVED (Current Project ✅)

These made it from Zero sessions into the GDDs and JSONs:

### Core Resources
| Zero Design | Current State | Notes |
|-------------|--------------|-------|
| Scrap Metal (Raw Salvage) | ✅ In resource_catalog | Renamed but same concept |
| Nano Infra | ✅ In resource_catalog | Kept |
| Ceramite Plating | ✅ In resource_catalog | Kept |
| Fusion Cells | ✅ In resource_catalog | Kept |
| Quantum Circuitry | ✅ In resource_catalog | Kept |
| Nanofiber Fabric | ✅ In resource_catalog | Kept |
| Creds (currency) | ✅ In economy GDD | Kept |
| Glory (prestige) | ✅ In economy GDD | Evolved from "Prestige Points" → "Respect" → Glory |

### Combat System
| Zero Design | Current State | Notes |
|-------------|--------------|-------|
| Turn-based combat | ✅ combat_design_document | Implemented |
| Heat mechanic | ✅ In combat system | Core mechanic preserved |
| Individual part damage | ✅ Part HP in combat | Working |
| Part targeting | ✅ IMPL_SPEC_stances_targeting | Implemented |
| Overheating consequences | ✅ In combat design | Preserved |
| Distance/range mechanics | ✅ Range bands in combat | Evolved from X/Y grid to abstract range bands |

### Mecha Assembly
| Zero Design | Current State | Notes |
|-------------|--------------|-------|
| 5 body sections (Head/Torso/Arms/Legs/Core) | ✅ parts.json + GDD 3.4 | Expanded to include weapon hardpoints |
| Modular swap system | ✅ Frame + Parts model | Core philosophy preserved |
| Armored Core-inspired parts catalog | ✅ parts.json, weapons.json | Adapted with original manufacturers |

### Narrative Foundation
| Zero Design | Current State | Notes |
|-------------|--------------|-------|
| Father accused of corruption, vanished | ✅ narrative_bible | Fully developed |
| Grandfather + scrapyard inheritance | ✅ narrative_bible | Deeply fleshed out |
| Father's first mecha as starter | ✅ Hayabusa Mk.I | Named and detailed |
| Corporate conspiracy | ✅ Taeyang Forge plot | Specific and integrated |
| 5-phase story progression | ✅ missions.json | 23 missions across phases |

### Skill System
| Zero Design | Current State | Notes |
|-------------|--------------|-------|
| 7 skill categories (R/M/C/H/I/Cr/D) | ✅ skills.json has 7 skills | Categories match original |
| 6 pilot stats | ✅ player.json (Muscle/Reflex/Focus/Grit/Neuro/Charisma) | Evolved from generic to Cyberpunk 2077-inspired |
| Level + XP system | ✅ player.json | Cap at 30 |

---

## 2. SYSTEMS THAT WERE LOST 🔴 (High Reclaim Value)

These were designed in detail but don't appear anywhere in the current project:

### 2A. JOB PROGRESSION SYSTEM (Split 12, 16-17)
**What it was:** A complete career system with 6 job paths, each with 3 tiers and moral branching:

1. **Join the Force** (Law Enforcement) — Rookie → Detective → Captain
2. **Tradesman** (Scrapyard & Merchant) — Apprentice → Shop Owner → Industrial Trader
3. **Netrunner** (Hacker) — Script Kiddie → Data Broker → Digital Ghost
4. **Arena Fighter** (Combat) — Street Brawler → Ranked Fighter → Champion
5. **Info-Broker / Investigator** — Street Informant → Shadow Reporter → Master of Secrets
6. **Corporate Mercenary** — Gun-for-Hire → Security Contractor → Ghost Operative

Each job had:
- **High Morale path** (justice, community, honor)
- **Low Morale path** (exploitation, profit, ruthlessness)
- Passive income per tick
- Unique side quests
- Skill tree intersections
- Narrative branches

**Why it matters for idle gameplay:** Jobs = passive income + background progression + moral arc + replay variety. This is CORE idle loop content that generates creds/resources while the player is away. Without it, the idle half of "idle/incremental" is weaker.

**Reclaim priority: 🔴 CRITICAL**

---

### 2B. MORALE SYSTEM (Splits 3, 12, 16-17)
**What it was:** A moral compass that tracked player choices across a spectrum:
- NOT good vs. evil — specifically designed as "high morale" (idealism, justice) vs "low morale" (pragmatism, survival)
- Affected: NPC relationships, faction access, story branches, job progressions, available upgrades, game endings
- Could be mixed/neutral — players could pivot between approaches

**Current state:** The narrative_bible mentions morality ("Idealist path" vs "Pragmatist path") but there's no mechanical system, no morale meter, no consequences tied to choices.

**Why it matters:** Without a morale system, all the narrative branching is just flavor text. WITH it, every decision creates a different game state, driving replayability — which feeds directly into the prestige/Glory loop.

**Reclaim priority: 🔴 CRITICAL**

---

### 2C. CITY ZONES & EXPLORATION (Splits 7-10, 14-15)
**What it was:** 8 fully designed zones with descriptions, sub-areas, NPCs, and quest hooks:

1. **Scrapyard** (Starting Zone) — ✅ Partially in gdd_6
2. **Downtown District** — Corporate towers, police department, neon streets
   - Police HQ (with father's case files)
   - Merchant Row, Data Bazaar, Neon Strip
3. **Slums & Black Market** — Rat's Nest, Underground Clinic, Shadow Exchange
4. **High-Tech Corporate Zone** — Boardroom politics, espionage, clean labs
5. **Industrial Wasteland** — Toxic factories, scavenger camps, Echo Station
   - "The Crucible" (mecha graveyard), "Rust River", "Iron Market"
6. **Cybernetic Research Facility** — Augmentation labs, AI experiments
   - Recovery Ward, Neural Interface Room, Archive Vault
   - Quest: "Ghost in the System" (sentient AI)
7. **Underworld Arena** — Mecha fighting ring, betting, underground fame
8. **City's Nexus** — Central hub, political convergence, endgame area

Each zone had:
- Detailed William Gibson-style prose descriptions
- Multiple sub-areas with gameplay function
- Quest hooks tied to the main story
- Unique NPCs and factions
- Resource availability differences

**Current state:** Only the Scrapyard exists as a GDD. The rest is absent — missions reference "dockyard" and "arena" but without the rich zone framework.

**Why it matters:** Zones = content gates = reason to progress. In an idle game, unlocking a new zone is one of the most satisfying moments. The 8-zone structure creates a natural "map" that visual progression can be built around.

**Reclaim priority: 🔴 CRITICAL**

---

### 2D. ANDROID COMPANION / AUTOMATION (Split 3-5)
**What it was:** A buildable android (Medabots-inspired) that automates scrapyard tasks:
- Found during scrapyard foraging (not given at start)
- Programmable: assign to gathering, refining, researching
- Customizable appearance and capabilities
- Energy management system
- Maintenance and upgrades required
- Narrative integration (companion bond)

**Why it matters for idle gameplay:** This IS the idle mechanic. The android is what collects resources while you're away. Currently the game has auto-gathering conceptually, but no character or progression tied to it. The android turns a background number into a character the player cares about upgrading.

**Reclaim priority: 🟡 HIGH**

---

### 2E. FACTION ALLIANCE SYSTEM (Splits 3-4)
**What it was:** 3 factions + police force:
1. **NeoTech Solutions** — Corporate conglomerate ("Progress Through Technology")
   - Benefits: cutting-edge upgrades, corporate missions, cybernetic enhancements
2. **The Freeborn** — Rebel resistance ("Freedom Through Unity")
   - Benefits: guerrilla tactics, black market, protest/uprising mechanics
3. **The Shadow Syndicate** — Criminal underworld ("Power in Shadows")
   - Benefits: black market resources, covert missions, spy network

Plus the **NTPD** (police) as a fourth alignment option.

Each faction had: reputation tracking, exclusive quests, unique rewards, rivalry dynamics, and story impact.

**Current state:** Manufacturers exist (Kuroda, Taeyang, etc.) but they're equipment brands, not faction allegiances. No faction reputation, no alliance system, no factional consequences.

**Why it matters:** Factions + morale = exponential narrative branches. "High morale + Freeborn" plays completely differently from "Low morale + Shadow Syndicate." This is where replayability lives.

**Reclaim priority: 🟡 HIGH**

---

### 2F. SKILL TREE DEPTH (Splits 4-5, 11-13)
**What it was:** Each of the 7 skill categories had 4 tiers with exponentially expanding choices:
- Tier 1: 1 skill
- Tier 2: 2 skills
- Tier 3: 3 skills
- Tier 4: 4 skills (mastery)

Example — **Combat Skills:**
- C1: Basic Combat Training (1 skill)
- C2: Advanced Techniques — C2.1 Precision Strike, C2.2 Defensive Maneuver
- C3: Elite Warrior — C3.1 Area Assault, C3.2 Counter Mastery, C3.3 Heat Management
- C4: Mecha Combat Mastery — C4.1-C4.4 Ultimate abilities

Same structure for all 7 categories = 70 individual skills with descriptions.

**Current state:** skills.json has 7 top-level skills. maneuvers.json has combat abilities. But the deep skill tree with branching choices and prerequisites is missing.

**Why it matters:** Skill trees are incremental game CRACK. Each point invested is a micro-reward. The exponential branching creates meaningful build diversity. Without it, progression feels flat.

**Reclaim priority: 🟡 HIGH**

---

### 2G. SCRAPYARD BUILDINGS & UPGRADE PROGRESSION (Splits 5, 12, 16)
**What it was:** Named buildings within the scrapyard, each with upgrade tiers:
- Mecha Workshop (customization)
- Research Lab (blueprints)
- Resource Refinery (material processing)
- Rest Area (recovery, NPC dialogue)
- Grandfather's Workshop (story, missions)
- Resource Collectors (automated gathering stations)
- Tool upgrades (early game efficiency boosts)

Each building had specific upgrade costs, visual progression, and new unlocks per tier.

**Current state:** gdd_6 has the scrapyard structure concept, but building upgrade progression with specific costs and tiers isn't fully detailed.

**Reclaim priority: 🟢 MEDIUM** (partially covered by existing GDD)

---

### 2H. PERSONAL EQUIPMENT / ON-FOOT GAMEPLAY (Split 11)
**What it was:** Player inventory for when NOT in the mecha:
- Equipment slots for footwork jobs
- Stealth mechanics using dice/roll chances
- Hacking minigames
- Investigation puzzles

**Current state:** Not in the project. All gameplay is currently mecha-centric.

**Reclaim priority: 🟢 MEDIUM** (adds depth but not core to idle loop)

---

### 2I. MINI-GAMES (Split 5)
**What it was:** Supplementary activities:
- Hacking puzzles
- Resource combination experiments
- Trading/market speculation

**Reclaim priority: 🔵 LOW** (nice to have, not core)

---

## 3. DESIGN DNA THAT EVOLVED

Some original ideas survived but changed form:

| Zero Original | Current Evolution | Assessment |
|--------------|-------------------|------------|
| "Respect" (prestige reset) | Glory system | ✅ Better name, same concept |
| Pokemon-style combat UI | Browser-based React UI | ✅ Natural platform evolution |
| Armored Core parts tables (copy-paste from wiki) | Original manufacturers + parts | ✅ More original, less derivative |
| C# Unity codebase | React/JSX web app | ✅ Better for AI-assisted dev |
| ASCII art interfaces | Modern web UI components | ✅ Appropriate evolution |
| "Raw Salvage" base resource → refine into 5 | Scrap → tiered resources | ✅ Same concept, cleaner |
| d20 roll system (split 16) | Deterministic + modifier combat | ✅ Better for idle game |
| Shadowrun-inspired cybernetics | Simplified to equipment | ⚠️ Lost some flavor |
| Patlabor/Gundam/Medabots/Neuromancer tone blend | Focused cyberpunk noir | ⚠️ Tighter but narrower |

---

## 4. RECOMMENDED RECLAIM ROADMAP

### Phase A: Systems That Complete the Idle Loop
1. **Job System** — Passive income + moral arc + content variety
2. **Morale System** — Mechanical teeth for narrative choices
3. **Android Companion** — Character-driven automation mechanic

### Phase B: Content That Creates the World
4. **City Zones** — 8 zones as progression gates + exploration content
5. **Faction Alliances** — Reputation + exclusive content + replay value

### Phase C: Depth That Creates Builds
6. **Deep Skill Trees** — 70 skills with branching prerequisites
7. **Scrapyard Building Upgrades** — Specific tier costs and unlocks

### Phase D: Polish & Variety
8. **On-Foot Equipment** — Personal inventory beyond mecha
9. **Mini-Games** — Hacking puzzles, market speculation

---

## 5. THE BIGGEST INSIGHT

Reading through all 17 splits, the original vision was always an **idle RPG with narrative soul.** The current project has strong mechanical bones — combat is detailed, parts are cataloged, economy is designed. But the *soul* systems are the ones that got simplified away:

- **Jobs** give the player identity beyond "mecha pilot"
- **Morale** gives choices consequence
- **Factions** give the world political texture
- **Zones** give progression spatial meaning
- **The Android** gives automation a face

These aren't "nice to have" features. They're what makes Mecha Scrapyard different from every other idle combat game. The TTRPG roots are in the branching, the choices, the world — not just the stat math. Reclaiming them is what turns a good combat engine into the game you originally imagined.
