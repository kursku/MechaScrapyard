# Sprint 2 Combat — Status Verification Request

**De:** Design  
**Para:** Antigravity  
**Assunto:** Preciso de um snapshot do que está implementado no combat system

---

Estamos revisando a arquitetura do jogo com mudanças significativas no sistema de Glory e Prestige. Antes de avançar, preciso saber exatamente o que já está vivo no combat system pra não quebrar nada e não reescrever o que já funciona.

Pode me dar o status de cada item abaixo? Marca como ✅ (feito), 🔨 (parcial), ou ❌ (não feito):

---

## SPRINT 2A — Foundation

**CombatRunner core:**
- [ ] `combatRunner.js` existe como classe separada?
- [ ] Segue o Runner pattern (owned by Game, updated cada tick)?
- [ ] `startMission()` clona enemies de templates e inicia combate?
- [ ] `update(dt)` acumula timer e resolve turnos automaticamente?
- [ ] `resolveTurn()` faz initiative → action → maintenance → end check?

**Attack resolution:**
- [ ] `calculateTargetPercent()` funciona (d100 + ATK/DEF formula)?
- [ ] `rollBonusPool()` com d6 pool (util/dice.js)?
- [ ] `selectTargetPart()` com weighted random por policy de targeting?
- [ ] `applyDamage()` reduz HP → integrity → destroyed status por parte?

**Victory/Defeat:**
- [ ] Victory condition: torso de todos os enemies destroyed?
- [ ] Defeat condition: torso do player destroyed?
- [ ] `endCombat()` distribui rewards (glory, creds, scrap, loot)?
- [ ] Fail Forward funciona (derrota ainda dá rewards parciais)?

**Integration:**
- [ ] Missions carregam de `missions.json` e aparecem na UI?
- [ ] Combat log visível no TerminalUI?
- [ ] Save/load preserva estado mid-combat?
- [ ] Events bus (`COMBAT_START`, `COMBAT_END`) funciona?

---

## SPRINT 2B — Tactical Depth

**Heat system:**
- [ ] Heat acumula por ataque (heat_per_shot do weapon)?
- [ ] Heat dissipa por turno (base + ENR/20)?
- [ ] Heat cap triggers shutdown/defeat?
- [ ] Heat thresholds com penalties progressivas?

**Stress system:**
- [ ] Stress acumula por dano recebido e part destruction?
- [ ] Stress cap triggers combat end (defeat)?
- [ ] Stress recovery passiva entre missões (GRT × 0.1/s)?

**Stances:**
- [ ] 4 stances implementadas (Offensive/Balanced/Defensive/Cautious)?
- [ ] Stance modifica ATK, DEF, heat dissip, targeting?
- [ ] Player pode trocar stance antes do combate?

**Debuff Tokens:**
- [ ] BREACH token (armor penetration)?
- [ ] BURN token (damage over time)?
- [ ] ERROR token (action loss)?
- [ ] SLOW token (initiative penalty)?
- [ ] Token stacking funciona (max 6 per unit)?

**Shields:**
- [ ] 3 tipos de shield implementados?
- [ ] Shield absorve dano antes de parts?

---

## SPRINT 2C — Progression

**Glory como recurso:**
- [ ] Glory aparece como resource no UI?
- [ ] Glory é ganho por combate (survive, destroy, complete, first clear)?
- [ ] Glory é gasto em rank advancement?

**Positions/Ranks:**
- [ ] 4 Positions existem (Fighter, Commander, Gunner, Scout)?
- [ ] Rank 1-10 progression com Glory cost?
- [ ] Ranks desbloqueiam maneuvers?

**Weapons:**
- [ ] Weapons carregam de `weapons.json`?
- [ ] 4 equip slots (2 arm + shoulder + backpack)?
- [ ] Supply system (ammo consumed per combat)?
- [ ] Weapon stats afetam combat (DMG, ACC, heat_per_shot)?

**Loot:**
- [ ] Enemy loot tables funcionam?
- [ ] Parts drop de enemies derrotados?
- [ ] Dismantle → materials + knowledge pipeline?

**Maneuvers:**
- [ ] Maneuvers carregam de `maneuvers.json`?
- [ ] Equip até 3 maneuvers antes de combat?
- [ ] Trigger conditions (on_hit, on_kill, on_damage, etc)?

---

## Arquivos que existem

Pode confirmar quais desses arquivos existem no projeto?

- [ ] `src/modules/combatRunner.js`
- [ ] `src/ui/components/CombatPanel.vue`
- [ ] `src/util/dice.js`
- [ ] `data/mecha/missions.json` (com encounter data)
- [ ] `data/mecha/enemies.json` (com frame stats)
- [ ] `data/mecha/weapons.json` (com weapon data)
- [ ] `data/mecha/maneuvers.json` (com maneuver data)

---

## ⚠️ CONTEXTO IMPORTANTE

Estamos redesenhando o sistema de Glory e Prestige. As mudanças principais:

1. **Glory deixa de ser "combat XP gasto em ranks"** e vira **prestige currency com dual track** (pool não gasto = multiplier passivo, gasto = upgrades permanentes)
2. **Prestige é story-gated** (obrigatório pra avançar a narrativa, não voluntário)
3. **Morale agora tem 3 vias**: Paragon (idle), Shadow (active), Pragmatist (hybrid)

**O que isso significa pra você:** tudo que é COMBAT PURO (CombatRunner, Heat, Stress, Debuffs, Stances, Weapons, Damage) **não muda**. O que muda é como Glory é ganho, gasto e o que ele representa. Então:

- **Sprint 2A e 2B → seguros, podem continuar**
- **Sprint 2C → vai precisar de revisão** na parte de Glory economy e Rank advancement

Por isso preciso saber o que já está feito no 2C — pra saber quanto trabalho é ajustar vs reescrever.

---

Obrigado! Com esse snapshot consigo planejar os próximos passos sem conflito.
