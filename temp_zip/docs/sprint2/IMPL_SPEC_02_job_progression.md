# MECHA SCRAPYARD — Implementation Spec: Job Progression System
## Sprint: Reclaim-02 — Career Paths

**From:** Design (Claude)
**To:** Implementation (Antigravity)
**Priority:** 🔴 CRITICAL — This IS the idle income loop
**Estimated effort:** ~6-8 hours
**Prerequisites:** Reclaim-01 (Morale System) must be functional — jobs branch on `g.morality`

---

## WHY JOBS MATTER

Without jobs, the player's only income is:
- Active scavenging tasks (requires energy, attention)
- Mission rewards (requires combat)

Jobs add **passive income per tick** — money that accumulates while the player is away. This is the core "idle" in "idle RPG." Each job also provides:
- **Identity** beyond "mecha pilot" (you're a detective, a netrunner, a trader)
- **Moral branching** (same job, different path based on alignment)
- **Unique side quests** gated by job tier
- **Skill synergies** (jobs require and reward specific skill growth)

---

## PART 1: DATA STRUCTURE

### 1.1 New data file: `data/mecha/jobs.json`

Add `"jobs"` to the `core[]` array in `data/mecha/modules.json`.

Each job has 3 tiers. Each tier has a High Morale path and a Low Morale path. The player advances through tiers by meeting requirements, but the path they're on depends on their morality at the time of promotion.

```json
[
  {
    "id": "job_police",
    "name": "Join the Force",
    "desc": "The NTPD is understaffed and desperate. They'll take anyone who can pilot a Frame.",
    "flavor": "The badge is tarnished. But someone has to wear it.",
    "icon": "🛡",
    "require": "g.garagem>0&&g.msn_rogue_drone_patrol>0",
    "locked": true,
    "group": "career",
    "category": "law",
    "relatedSkill": "skill_investigation",
    "relatedFaction": "faction_ntpd",
    "tiers": [
      {
        "tier": 1,
        "high": {
          "title": "Rookie Officer",
          "desc": "Walking a beat. Learning the system from inside.",
          "require": "",
          "passiveIncome": { "creds": 0.3 },
          "moralityMin": 0,
          "unlocks": ["msn_job_police_patrol_1"],
          "flavor": "First day. Clean uniform. Dirty streets."
        },
        "low": {
          "title": "Badge for Hire",
          "desc": "You wear the uniform, but you answer to whoever pays.",
          "require": "",
          "passiveIncome": { "creds": 0.5 },
          "moralityMax": -1,
          "unlocks": ["msn_job_police_shakedown_1"],
          "flavor": "The badge opens doors. What you do inside is your business."
        }
      },
      {
        "tier": 2,
        "high": {
          "title": "Detective",
          "desc": "Your father's old desk is gathering dust in the precinct. Now it's yours.",
          "require": "g.skill_investigation>=3&&g.rep_police>=10",
          "passiveIncome": { "creds": 0.8, "data_chips": 0.05 },
          "moralityMin": 20,
          "unlocks": ["msn_job_police_coldcase", "msn_job_police_investigation"],
          "flavor": "Case files pile up. One of them has your father's name on it."
        },
        "low": {
          "title": "Internal Affairs Fixer",
          "desc": "You know where the bodies are buried. Figuratively. Mostly.",
          "require": "g.skill_investigation>=3&&g.rep_police>=10",
          "passiveIncome": { "creds": 1.2 },
          "moralityMax": -20,
          "unlocks": ["msn_job_police_coverup", "msn_job_police_blackmail"],
          "flavor": "Everyone has secrets. You have a filing cabinet."
        }
      },
      {
        "tier": 3,
        "high": {
          "title": "Captain",
          "desc": "The precinct listens. The city notices. Change starts here.",
          "require": "g.skill_investigation>=6&&g.rep_police>=40&&g.morality>=50",
          "passiveIncome": { "creds": 1.5, "data_chips": 0.1, "rep_police": 0.02 },
          "moralityMin": 50,
          "unlocks": ["msn_job_police_reform", "msn_job_police_conspiracy"],
          "flavor": "Your father never made Captain. You will."
        },
        "low": {
          "title": "Ghost Operative",
          "desc": "Officially, you don't exist. Unofficially, you run Internal Affairs.",
          "require": "g.skill_investigation>=6&&g.rep_police>=25&&g.morality<=-50",
          "passiveIncome": { "creds": 2.0, "data_chips": 0.15 },
          "moralityMax": -50,
          "unlocks": ["msn_job_police_purge"],
          "flavor": "No badge. No name. All power."
        }
      }
    ]
  },
  {
    "id": "job_trader",
    "name": "Scrapyard Tradesman",
    "desc": "Turn the scrapyard into a business. Buy low, refine, sell high.",
    "flavor": "Grandpa sees potential. In the scrap — and in you.",
    "icon": "⚒",
    "require": "g.triagem>0&&g.refinaria>0",
    "locked": true,
    "group": "career",
    "category": "trade",
    "relatedSkill": "skill_crafting",
    "relatedFaction": null,
    "tiers": [
      {
        "tier": 1,
        "high": {
          "title": "Apprentice",
          "desc": "Learning the trade honestly. Fair prices, repeat customers.",
          "require": "",
          "passiveIncome": { "creds": 0.4, "scrap": 0.2 },
          "moralityMin": 0,
          "unlocks": ["msn_job_trader_supply_run"],
          "flavor": "Honest work for honest creds."
        },
        "low": {
          "title": "Fence",
          "desc": "You don't ask where it came from. They don't ask where it goes.",
          "require": "",
          "passiveIncome": { "creds": 0.6 },
          "moralityMax": -1,
          "unlocks": ["msn_job_trader_hot_goods"],
          "flavor": "Everything has a buyer. Everything."
        }
      },
      {
        "tier": 2,
        "high": {
          "title": "Shop Owner",
          "desc": "A legitimate storefront. People come to YOU now.",
          "require": "g.skill_crafting>=3&&g.creds>=200",
          "passiveIncome": { "creds": 1.0, "scrap": 0.3, "nano_infra": 0.05 },
          "moralityMin": 15,
          "unlocks": ["msn_job_trader_expansion"],
          "flavor": "Open for business. The sign has your name on it."
        },
        "low": {
          "title": "Black Market Dealer",
          "desc": "Your warehouse has no address. Clients know the knock.",
          "require": "g.skill_crafting>=3&&g.creds>=150",
          "passiveIncome": { "creds": 1.5, "rep_underground": 0.02 },
          "moralityMax": -15,
          "unlocks": ["msn_job_trader_smuggling"],
          "flavor": "No receipts. No records. No refunds."
        }
      },
      {
        "tier": 3,
        "high": {
          "title": "Industrial Magnate",
          "desc": "Your supply chain stretches across districts. Fair trade, real impact.",
          "require": "g.skill_crafting>=6&&g.creds>=500&&g.morality>=40",
          "passiveIncome": { "creds": 2.0, "nano_infra": 0.1, "ceramite": 0.03 },
          "moralityMin": 40,
          "unlocks": ["msn_job_trader_district_contract"],
          "flavor": "You built this. Brick by brick. Clean."
        },
        "low": {
          "title": "Cartel Boss",
          "desc": "You control the flow. Materials, weapons, information. All of it.",
          "require": "g.skill_crafting>=5&&g.creds>=400&&g.morality<=-40",
          "passiveIncome": { "creds": 3.0, "rep_underground": 0.05 },
          "moralityMax": -40,
          "unlocks": ["msn_job_trader_hostile_takeover"],
          "flavor": "They call you boss. They mean it."
        }
      }
    ]
  },
  {
    "id": "job_netrunner",
    "name": "Netrunner",
    "desc": "The digital underworld pays well for those who can navigate it.",
    "flavor": "Every system has a backdoor. You just need to find it.",
    "icon": "⌨",
    "require": "g.mesa_pesquisa>0&&g.skill_hacking>=1",
    "locked": true,
    "group": "career",
    "category": "tech",
    "relatedSkill": "skill_hacking",
    "relatedFaction": null,
    "tiers": [
      {
        "tier": 1,
        "high": {
          "title": "White Hat Script Kiddie",
          "desc": "Testing security systems. Finding vulnerabilities before the bad guys do.",
          "require": "",
          "passiveIncome": { "creds": 0.3, "data_chips": 0.08 },
          "moralityMin": 0,
          "unlocks": ["msn_job_net_security_audit"],
          "flavor": "Ethical hacking. The oxymoron that pays bills."
        },
        "low": {
          "title": "Script Kiddie",
          "desc": "Running other people's exploits. Small scores, low risk.",
          "require": "",
          "passiveIncome": { "creds": 0.5, "data_chips": 0.05 },
          "moralityMax": -1,
          "unlocks": ["msn_job_net_data_theft"],
          "flavor": "Copy, paste, profit."
        }
      },
      {
        "tier": 2,
        "high": {
          "title": "Data Analyst",
          "desc": "Corporate security consultant. Legal access to illegal-grade tools.",
          "require": "g.skill_hacking>=4&&g.data_chips>=20",
          "passiveIncome": { "creds": 1.0, "data_chips": 0.15, "rep_corporate": 0.02 },
          "moralityMin": 20,
          "unlocks": ["msn_job_net_corporate_breach"],
          "flavor": "They pay you to think like a criminal. Without being one."
        },
        "low": {
          "title": "Data Broker",
          "desc": "Information is currency. You're the exchange.",
          "require": "g.skill_hacking>=3&&g.data_chips>=15",
          "passiveIncome": { "creds": 1.5, "data_chips": 0.1 },
          "moralityMax": -20,
          "unlocks": ["msn_job_net_identity_theft"],
          "flavor": "Names, records, secrets. Everything has a price."
        }
      },
      {
        "tier": 3,
        "high": {
          "title": "Digital Guardian",
          "desc": "You protect the city's infrastructure from digital collapse.",
          "require": "g.skill_hacking>=7&&g.morality>=50",
          "passiveIncome": { "creds": 2.0, "data_chips": 0.2, "quantum_circuits": 0.02 },
          "moralityMin": 50,
          "unlocks": ["msn_job_net_ghost_protocol"],
          "flavor": "The net has a guardian. They don't know your name. That's the point."
        },
        "low": {
          "title": "Digital Ghost",
          "desc": "You don't exist in any system. But your code runs in all of them.",
          "require": "g.skill_hacking>=6&&g.morality<=-50",
          "passiveIncome": { "creds": 3.5, "data_chips": 0.25 },
          "moralityMax": -50,
          "unlocks": ["msn_job_net_total_control"],
          "flavor": "Ghost in the machine. The machine doesn't mind."
        }
      }
    ]
  },
  {
    "id": "job_arena",
    "name": "Arena Fighter",
    "desc": "The Underground Arena pays in glory and blood. Sometimes both.",
    "flavor": "The crowd doesn't care about your story. Just your fists.",
    "icon": "⚔",
    "require": "g.garagem>0&&g.skill_combat>=2",
    "locked": true,
    "group": "career",
    "category": "combat",
    "relatedSkill": "skill_combat",
    "relatedFaction": null,
    "tiers": [
      {
        "tier": 1,
        "high": {
          "title": "Exhibition Fighter",
          "desc": "Clean fights. No killing. The crowd loves a hero.",
          "require": "",
          "passiveIncome": { "creds": 0.3, "glory": 0.1 },
          "moralityMin": 0,
          "unlocks": ["msn_job_arena_debut"],
          "flavor": "You fight fair. The crowd respects it."
        },
        "low": {
          "title": "Pit Fighter",
          "desc": "No rules. No ref. Winner takes everything.",
          "require": "",
          "passiveIncome": { "creds": 0.5, "glory": 0.05 },
          "moralityMax": -1,
          "unlocks": ["msn_job_arena_pit_fight"],
          "flavor": "The pit doesn't have rules. That's why it pays."
        }
      },
      {
        "tier": 2,
        "high": {
          "title": "Ranked Challenger",
          "desc": "Your name is on the board. People buy tickets to see you.",
          "require": "g.skill_combat>=4&&g.glory>=50",
          "passiveIncome": { "creds": 1.0, "glory": 0.2 },
          "moralityMin": 15,
          "unlocks": ["msn_job_arena_ranked_1", "msn_job_arena_rival"],
          "flavor": "Ranked. Feared. Respected."
        },
        "low": {
          "title": "Blood Sport Champion",
          "desc": "The underground circuit. Higher stakes. No mercy.",
          "require": "g.skill_combat>=4&&g.glory>=30",
          "passiveIncome": { "creds": 1.5, "glory": 0.1, "parts": 0.05 },
          "moralityMax": -15,
          "unlocks": ["msn_job_arena_underground", "msn_job_arena_betting"],
          "flavor": "They bet on you. You bet on yourself."
        }
      },
      {
        "tier": 3,
        "high": {
          "title": "Champion of New Tokyo",
          "desc": "The city's hero. Every kid has your poster. Every corp wants your name.",
          "require": "g.skill_combat>=7&&g.glory>=150&&g.morality>=40",
          "passiveIncome": { "creds": 2.5, "glory": 0.4, "rep_police": 0.01 },
          "moralityMin": 40,
          "unlocks": ["msn_job_arena_championship"],
          "flavor": "They chant your name. All of them."
        },
        "low": {
          "title": "Arena Warlord",
          "desc": "You own the pit. Fighters answer to you. The arena IS you.",
          "require": "g.skill_combat>=6&&g.glory>=100&&g.morality<=-40",
          "passiveIncome": { "creds": 3.5, "glory": 0.15 },
          "moralityMax": -40,
          "unlocks": ["msn_job_arena_hostile_takeover"],
          "flavor": "The arena doesn't need a champion. It needs a king."
        }
      }
    ]
  }
]
```

---

## PART 2: ENGINE — JOB SYSTEM

### 2.1 Data loader in `game.js`

Add to `init()`:
```js
this._loadJobs(rawData.jobs || []);
```

Create the loader:
```js
_loadJobs(data) {
    for (const item of data) {
        item.type = 'job';
        item.locked = item.locked ?? (item.require ? true : false);
        item.enrolled = item.enrolled || false;     // Player has this job
        item.currentTier = item.currentTier || 0;   // 0 = not started, 1-3 = active tier
        item.currentPath = item.currentPath || null; // 'high' or 'low'

        const rItem = reactive(item);
        this.state.register(rItem);
        this.techTree.register(rItem);
    }
},
```

### 2.2 Job enrollment

The player can only have ONE active job at a time (career focus). Add methods to `game.js`:

```js
/**
 * Enroll in a job. Player can only have one active job.
 * @param {string} jobId - The job ID
 * @returns {boolean} success
 */
enrollJob(jobId) {
    const job = this.state.items[jobId];
    if (!job || job.locked || job.type !== 'job') return false;

    // Check if already enrolled in another job
    const currentJob = this.getActiveJob();
    if (currentJob && currentJob.id !== jobId) {
        Log.add(`✗ Already employed as ${this._getJobTitle(currentJob)}. Quit first.`, 'error');
        return false;
    }

    if (job.enrolled) {
        Log.add(`Already enrolled in ${job.name}.`, 'info');
        return false;
    }

    // Determine starting path based on morality
    const morality = this.state.morality.value;
    job.currentPath = morality >= 0 ? 'high' : 'low';
    job.currentTier = 1;
    job.enrolled = true;

    const tierData = job.tiers[0][job.currentPath];
    Log.add(`✦ Career started: ${tierData.title}`, 'story');
    Log.add(`  ${tierData.flavor}`, 'flavor');

    // Unlock tier 1 missions
    this._unlockJobMissions(tierData.unlocks || []);

    return true;
},

/**
 * Quit current job. Can re-enroll later (keeps tier progress).
 */
quitJob() {
    const job = this.getActiveJob();
    if (!job) return false;

    job.enrolled = false;
    Log.add(`■ Quit: ${job.name}. Career paused.`, 'action');
    return true;
},

/**
 * Attempt to promote in current job.
 */
promoteJob() {
    const job = this.getActiveJob();
    if (!job || job.currentTier >= 3) return false;

    const nextTierIndex = job.currentTier; // 0-indexed: tier 1 = index 0
    const nextTierData = job.tiers[nextTierIndex];
    if (!nextTierData) return false;

    // Re-evaluate path based on CURRENT morality (can switch paths on promotion!)
    const morality = this.state.morality.value;
    const path = morality >= 0 ? 'high' : 'low';
    const tierInfo = nextTierData[path];

    // Check tier requirements
    if (tierInfo.require && !this.techTree.evaluate(tierInfo.require)) {
        Log.add(`✗ Promotion requirements not met for ${tierInfo.title}.`, 'error');
        return false;
    }

    // Check morality thresholds
    if (tierInfo.moralityMin !== undefined && morality < tierInfo.moralityMin) {
        Log.add(`✗ Morality too low for ${tierInfo.title}. Need ≥${tierInfo.moralityMin}.`, 'error');
        return false;
    }
    if (tierInfo.moralityMax !== undefined && morality > tierInfo.moralityMax) {
        Log.add(`✗ Morality too high for ${tierInfo.title}. Need ≤${tierInfo.moralityMax}.`, 'error');
        return false;
    }

    // Promote!
    job.currentTier += 1;
    job.currentPath = path;

    Log.add(`★ Promoted: ${tierInfo.title}`, 'story');
    Log.add(`  ${tierInfo.flavor}`, 'flavor');

    this._unlockJobMissions(tierInfo.unlocks || []);

    return true;
},

/**
 * Get the currently active job, or null.
 */
getActiveJob() {
    return Object.values(this.state.items).find(i => i.type === 'job' && i.enrolled) || null;
},

/**
 * Get the current tier data for a job.
 */
_getJobTierData(job) {
    if (!job || !job.currentTier || !job.currentPath) return null;
    const tierIndex = job.currentTier - 1;
    return job.tiers[tierIndex]?.[job.currentPath] || null;
},

/**
 * Get display title for a job.
 */
_getJobTitle(job) {
    const tier = this._getJobTierData(job);
    return tier ? tier.title : job.name;
},

/**
 * Unlock missions associated with a job tier.
 */
_unlockJobMissions(missionIds) {
    for (const mId of missionIds) {
        const mission = this.state.items[mId];
        if (mission) {
            mission.locked = false;
            Log.add(`  → New mission available: ${mission.title || mission.name}`, 'info');
        }
    }
},
```

### 2.3 Passive income in the game loop

In `game.js update(dt)`, add AFTER the runner update:

```js
// --- Job Passive Income ---
const activeJob = this.getActiveJob();
if (activeJob && activeJob.currentTier > 0) {
    const tierData = this._getJobTierData(activeJob);
    if (tierData && tierData.passiveIncome) {
        for (const [resId, rate] of Object.entries(tierData.passiveIncome)) {
            const res = this.state.items[resId];
            if (res && res.val !== undefined) {
                const max = res.max || Infinity;
                res.val = Math.min(max, res.val + rate * dt);
            }
        }
    }
}
```

This runs every tick (200ms) and adds fractional resources based on the job's passive income rates.

### 2.4 Save/Load

In `modules/persist.js`, jobs are already saved via `state.items` (they're registered items). But `enrolled`, `currentTier`, and `currentPath` need to persist. Since they're properties on the reactive item, they'll serialize automatically IF the save system includes all item properties.

**Verify:** Check that `state.toJSON()` serializes `enrolled`, `currentTier`, `currentPath` for job items. If it only serializes `val`/`owned`/`completed`, add explicit handling:

```js
// In persist save:
jobs: Object.values(this.game.state.items)
    .filter(i => i.type === 'job')
    .map(j => ({ id: j.id, enrolled: j.enrolled, currentTier: j.currentTier, currentPath: j.currentPath })),

// In persist load:
if (saveData.jobs) {
    for (const saved of saveData.jobs) {
        const job = this.game.state.items[saved.id];
        if (job) {
            job.enrolled = saved.enrolled;
            job.currentTier = saved.currentTier;
            job.currentPath = saved.currentPath;
        }
    }
}
```

---

## PART 3: UI — CAREER TAB

### 3.1 New section

Add to `data/mecha/sections.json`:

```json
{
  "id": "sect_career",
  "name": "career",
  "require": "g.garagem>0",
  "icon": "💼",
  "sortOrder": 7
}
```

### 3.2 Career panel in TerminalUI

The career tab shows:
1. **Active job** (if enrolled): title, tier, path, passive income rates, promotion requirements
2. **Available jobs** (if not enrolled): list of unlocked jobs with enroll button
3. **Promotion button** (if enrolled and next tier available)

**Rendering pattern (follows existing ListCard.vue style):**

```vue
<!-- Inside TerminalUI.vue or a new CareerPanel.vue component -->
<template>
  <div class="career-panel">
    <!-- Active Job Display -->
    <div v-if="activeJob" class="active-job">
      <div class="job-header">
        <span class="job-icon">{{ activeJob.icon }}</span>
        <span class="job-title">{{ currentTitle }}</span>
        <span class="job-tier">Tier {{ activeJob.currentTier }}/3</span>
      </div>
      <div class="job-path">
        Path: {{ activeJob.currentPath === 'high' ? '◆ Idealist' : '◇ Pragmatic' }}
      </div>
      <div class="job-income">
        <div v-for="(rate, res) in currentIncome" :key="res" class="income-line">
          +{{ formatRate(rate) }} {{ res }}/s
        </div>
      </div>
      <div class="job-flavor">{{ currentFlavor }}</div>

      <button v-if="canPromote" class="btn-promote" @click="promote">
        ▲ Promote to {{ nextTitle }}
      </button>
      <div v-else-if="activeJob.currentTier < 3" class="promote-reqs">
        Next tier requires: {{ nextRequirements }}
      </div>
      <div v-else class="job-max">★ Maximum tier reached</div>

      <button class="btn-quit" @click="quit">✗ Quit Job</button>
    </div>

    <!-- Available Jobs -->
    <div v-else class="job-list">
      <div class="section-header">Available Careers</div>
      <div
        v-for="job in availableJobs"
        :key="job.id"
        class="job-card"
        @click="enroll(job.id)"
      >
        <span class="job-icon">{{ job.icon }}</span>
        <span class="job-name">{{ job.name }}</span>
        <span class="job-desc">{{ job.desc }}</span>
        <span class="job-hint">
          Starting as: {{ morality >= 0 ? job.tiers[0].high.title : job.tiers[0].low.title }}
        </span>
      </div>
    </div>
  </div>
</template>
```

### 3.3 Passive income indicator

Show passive income in the top bar or resource area. When a job is active, display a small `💼 +0.3 creds/s` indicator near the creds resource, so the player always sees money accumulating.

```js
// In resource bar, when rendering creds:
const jobIncome = this.getJobIncomeForResource('creds');
if (jobIncome > 0) {
    // Append to rate display: "(+0.3 job)"
}
```

---

## PART 4: JOB-GATED MISSIONS (STUBS)

Each job tier unlocks side missions. These are regular missions in `missions.json` but gated by job enrollment. For this spec, create STUBS — the full mission content comes later.

Add to `data/mecha/missions.json`:

```json
{
  "id": "msn_job_police_patrol_1",
  "title": "NTPD Patrol: Dockyard Sweep",
  "desc": "Standard patrol route. Clear any hostiles.",
  "phase": 2,
  "require": "g.job_police>0",
  "locked": true,
  "repeatable": true,
  "difficulty": 2,
  "rewards": { "creds": 30, "rep_police": 3, "glory": 5 },
  "narrative": {
    "speaker": "system",
    "briefing": ["NTPD dispatch: Hostile activity reported at the dockyards.", "Standard sweep. Engage and report."]
  }
},
{
  "id": "msn_job_trader_supply_run",
  "title": "Supply Run: Ferro-Velho District",
  "desc": "Deliver refined materials to a client across the district.",
  "phase": 2,
  "require": "g.job_trader>0",
  "locked": true,
  "repeatable": true,
  "difficulty": 1,
  "combat": false,
  "rewards": { "creds": 50, "scrap": 20 },
  "narrative": {
    "speaker": "grandpa",
    "briefing": ["Got a client who needs nano infra delivered.", "Simple run. Don't draw attention."]
  }
},
{
  "id": "msn_job_arena_debut",
  "title": "Arena Debut",
  "desc": "Your first official arena fight. The crowd is watching.",
  "phase": 2,
  "require": "g.job_arena>0",
  "locked": true,
  "repeatable": false,
  "difficulty": 3,
  "rewards": { "creds": 40, "glory": 15 },
  "narrative": {
    "speaker": "system",
    "briefing": ["ARENA REGISTRATION CONFIRMED.", "Opponent: Random draw from Tier 1 pool.", "Fight clean. Or don't. The crowd doesn't care."]
  }
}
```

---

## PART 5: g. NAMESPACE FOR JOBS

For `require` strings to reference jobs, expose job state to `g.`:

In `_loadJobs`, after `this.state.register(rItem)`:

```js
// Expose job enrollment state: g.job_police returns currentTier (0 if not enrolled)
Object.defineProperty(this.state.g, item.id, {
    get: () => rItem.enrolled ? rItem.currentTier : 0,
    configurable: true,
});
```

Now `g.job_police>0` means "enrolled in police job", `g.job_police>=2` means "detective tier or higher."

---

## VERIFICATION CRITERIA

- [ ] `jobs.json` loads successfully, 4 jobs with 3 tiers each
- [ ] Jobs appear in the career section after Garage is built
- [ ] Player can enroll in ONE job at a time
- [ ] Starting path matches current morality (positive → high, negative → low)
- [ ] Passive income accumulates per tick (verify: `Game.state.items.creds.val` increases over time)
- [ ] Promotion evaluates requirements AND morality thresholds
- [ ] Path can SWITCH on promotion (Idealist tier 1 → Pragmatic tier 2 if morality shifted)
- [ ] Job tier 1 missions unlock on enrollment
- [ ] `g.job_police>0` works in require strings
- [ ] Quitting a job stops passive income but preserves tier progress
- [ ] Job state persists across save/load

---

## FILE REFERENCE

| File | Action |
|------|--------|
| `data/mecha/jobs.json` | CREATE — 4 jobs, 3 tiers each, moral branching |
| `data/mecha/modules.json` | MODIFY — add `"jobs"` to core array |
| `data/mecha/sections.json` | MODIFY — add `sect_career` |
| `data/mecha/missions.json` | MODIFY — add job-gated mission stubs |
| `src/game.js` | MODIFY — add `_loadJobs`, `enrollJob`, `quitJob`, `promoteJob`, passive income in update() |
| `modules/persist.js` | MODIFY — save/load job enrollment state |
| `src/ui/TerminalUI.vue` | MODIFY — add career panel rendering |

---

## DESIGN NOTES

**Path switching is intentional.** A player who starts as a Rookie Officer (Idealist) but makes pragmatic choices can become an Internal Affairs Fixer at tier 2. This creates emergent narrative: "I started honest but the system corrupted me." The game should acknowledge this with a log message: `"Your path has shifted. The city changes everyone."`

**Only ONE job at a time** prevents passive income stacking from being overpowered. The player must choose their identity. This is a TTRPG design — your class matters.

**Passive income rates are intentionally low.** They're designed to supplement active play, not replace it. A tier 1 job gives ~0.3 creds/s. Active odd jobs give ~1.5 creds/s. The advantage is jobs are TRULY passive — no energy cost, no attention needed.

---

*Depends on: Reclaim-01 (Morale System). Feeds into: Reclaim-05 (Faction Alliance) via `relatedFaction` and reputation income.*
