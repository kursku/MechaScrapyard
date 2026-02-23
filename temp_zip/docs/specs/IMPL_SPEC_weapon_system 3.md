# MECHA SCRAPYARD — Implementation Spec: Sistema de Armas
## Sprint 2C — Pacote 3 de N

**Objetivo:** Implementar o sistema de armas com 3 categorias (Fight/Short/Long), 4 slots de equipamento, consumo de supply, geração de heat por arma, e `tokenOnHit` via arma — substituindo as fontes temporárias do Pacote 2.  
**Pré-requisito:** Pacotes 1 (Stances + Targeting) e 2 (BREACH + BURN) implementados.  
**Escopo:** Armas + slots + integração no combate. NÃO implementar escudos, loot de armas, ou decomposição de dados neste pacote.  
**Referência:** `combat_design_document.md` §3.3 slots, §5.4 supply, §6 armas / `combat_implementation_plan.md`

---

## CONTEXTO: POR QUE ARMAS AGORA

Sem armas, o combate é "piloto A bate em piloto B com stats base". Armas transformam cada decisão pré-combate:

- **Fight vs Short vs Long** = atributo base diferente (MUS / REF / FOC) → builds distintos
- **Supply cost por dado** = tensão entre poder e sustentabilidade → economia idle
- **Heat por arma** = heat blade gera mais heat que machine gun → sinergia com stance Cautelosa
- **tokenOnHit por arma** = flamethrower aplica BURN, perfurante aplica BREACH → fonte oficial de tokens (substitui fontes temporárias do Pacote 2)
- **Part destruction = perda de arma** = consequência real de dano localizado

---

## PARTE 1: DADOS DE ARMAS

### 1.1 Novo arquivo `data/mecha/weapons.json`

Criar o arquivo e adicionar ao array `core[]` em `modules.json`.

```json
[
  {
    "id": "mech_fist",
    "name": "Mech Fist",
    "desc": "Basic hydraulic fist. Crude but effective.",
    "flavor": "When all else fails, punch it.",
    "type": "weapon",
    "category": "fight",
    "dice": "d4",
    "slot": "hand",
    "baseDamage": 2,
    "accuracyMod": 10,
    "heatGen": 2,
    "supplyCost": 0,
    "avaria": 0.5,
    "tokenOnHit": [],
    "require": "",
    "tier": 1,
    "value": 5
  },
  {
    "id": "machine_gun_d6",
    "name": "MG-206 'Rattler'",
    "desc": "Standard-issue 20mm autocannon. Reliable and ammo-hungry.",
    "flavor": "Reliable, loud, and always hungry for ammo.",
    "type": "weapon",
    "category": "short",
    "dice": "d6",
    "slot": "hand",
    "baseDamage": 4,
    "accuracyMod": 5,
    "heatGen": 5,
    "supplyCost": 1,
    "avaria": 1,
    "tokenOnHit": [],
    "require": "",
    "tier": 1,
    "value": 15
  },
  {
    "id": "heat_blade_d6",
    "name": "ThermoEdge Mk.I",
    "desc": "Superheated melee blade. Burns through armor and your coolant.",
    "flavor": "Fire solves everything. Except overheating.",
    "type": "weapon",
    "category": "fight",
    "dice": "d6",
    "slot": "hand",
    "baseDamage": 3,
    "accuracyMod": -5,
    "heatGen": 12,
    "supplyCost": 1,
    "avaria": 0.5,
    "tokenOnHit": [
      { "type": "BURN", "chance": 0.30, "stacks": 1 }
    ],
    "require": "",
    "tier": 2,
    "value": 30
  },
  {
    "id": "shotgun_d6",
    "name": "Scatterblast SG-4",
    "desc": "Close-range spread weapon. Devastating up close.",
    "flavor": "Subtlety is overrated.",
    "type": "weapon",
    "category": "short",
    "dice": "d6",
    "slot": "hand",
    "baseDamage": 5,
    "accuracyMod": -10,
    "heatGen": 4,
    "supplyCost": 1,
    "avaria": 1,
    "tokenOnHit": [
      { "type": "BREACH", "chance": 0.20, "stacks": 1 }
    ],
    "require": "",
    "tier": 2,
    "value": 25
  },
  {
    "id": "missile_pod_d8",
    "name": "Valkyr Mk.I Salvo",
    "desc": "Shoulder-mounted guided missile pod. Heavy ordinance.",
    "flavor": "One pod, three problems solved.",
    "type": "weapon",
    "category": "long",
    "dice": "d8",
    "slot": "shoulder",
    "baseDamage": 6,
    "accuracyMod": 0,
    "heatGen": 15,
    "supplyCost": 2,
    "avaria": 1,
    "tokenOnHit": [],
    "require": "g.skill_combat>=3",
    "tier": 2,
    "value": 50
  },
  {
    "id": "piercing_lance_d8",
    "name": "AP Lance 'Puncture'",
    "desc": "Armor-piercing melee weapon. Designed to crack open heavy frames.",
    "flavor": "The can opener of the scrapyard.",
    "type": "weapon",
    "category": "fight",
    "dice": "d8",
    "slot": "hand",
    "baseDamage": 5,
    "accuracyMod": -15,
    "heatGen": 6,
    "supplyCost": 1,
    "avaria": 1,
    "tokenOnHit": [
      { "type": "BREACH", "chance": 0.40, "stacks": 1 }
    ],
    "require": "g.skill_combat>=2",
    "tier": 2,
    "value": 40
  }
]
```

### 1.2 Data contract para armas

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | Único. Prefixo livre (snake_case) |
| `type` | string | sim | Sempre `"weapon"` |
| `category` | string | sim | `"fight"` / `"short"` / `"long"` |
| `dice` | string | sim | `"d4"` / `"d6"` / `"d8"` / `"d10"` / `"d12"` — determina bonus roll |
| `slot` | string | sim | `"hand"` / `"shoulder"` |
| `baseDamage` | number | sim | Dano base antes de rolls e mods |
| `accuracyMod` | number | sim | Bônus/penalidade ao targetPercent |
| `heatGen` | number | sim | Heat gerado por uso da arma |
| `supplyCost` | number | sim | Supply consumido por ataque (0 = grátis, ex: Mech Fist) |
| `avaria` | number | sim | Multiplicador de avaria (§3.2): 0.5 para Fight, 1 para Short/Long |
| `tokenOnHit` | array | sim | `[{ type, chance, stacks }]` — tokens aplicados ao acertar. Array vazio se nenhum |
| `require` | string | não | TechTree condition para desbloquear no inventário |
| `tier` | number | sim | 1-5, para filtrar por progressão |
| `value` | number | sim | Valor em creds (para compra/venda futura) |

### 1.3 Constante DICE_VALUES

**Arquivo:** `src/modules/combatRunner.js` (ou um novo `src/util/weapons.js`)

```js
const DICE_VALUES = {
  d4:  { sides: 4,  supplyPerUse: 0.33 },  // 1 supply → 3 usos
  d6:  { sides: 6,  supplyPerUse: 0.5 },   // 1 supply → 2 usos
  d8:  { sides: 8,  supplyPerUse: 1 },     // 1 supply → 1 uso
  d10: { sides: 10, supplyPerUse: 2 },     // 2 supply → 1 uso
  d12: { sides: 12, supplyPerUse: 3 },     // 3 supply → 1 uso
};
```

> **NOTA:** `supplyCost` no JSON da arma é o custo declarado. `supplyPerUse` no DICE_VALUES é a tabela de referência do §5.4. Se os dois estiverem presentes, usar `supplyCost` do JSON (permite override por arma). Se `supplyCost` for omitido, calcular via DICE_VALUES.

### 1.4 Constante CATEGORY_ATTR

Cada categoria usa um atributo base diferente para calcular o bônus de ataque:

```js
const CATEGORY_ATTR = {
  fight: 'mus',   // Muscle → melee
  short: 'ref',   // Reflexes → firearms
  long:  'foc',   // Focus → artillery (se 'foc' não existir nos stats, usar 'ref')
};
```

### 1.5 Registrar weapons no `modules.json`

```json
{
  "core": [
    "tags", "resources", "upgrades", "tasks", "homes", "furniture",
    "skills", "player", "events", "sections", "equipslots",
    "enemies", "missions", "maneuvers",
    "weapons"
  ],
  "modules": []
}
```

### 1.6 Loader em `game.js`

Seguir o padrão existente de `_loadTasks`:

```js
_loadWeapons(data) {
  for (const item of data) {
    item.locked = item.locked ?? (item.require ? true : false);
    item.owned = item.owned ?? 0; // 0 = não possui, 1 = possui
    item.type = item.type || 'weapon';

    const rItem = reactive(item);
    this.state.register(rItem);
    this.techTree.register(rItem);
  }
}
```

---

## PARTE 2: SLOTS DE EQUIPAMENTO DO FRAME

### 2.1 Estrutura de equip no player frame

O player frame precisa de um objeto `equip` com 4 slots. Adicionar na inicialização do frame (provavelmente em `player.json` ou onde o frame base é definido):

```js
// Dentro de state.player.frame (ou equivalente):
equip: {
  left_hand:     null, // weapon ID ou null
  right_hand:    null, // weapon ID ou null
  left_shoulder: null, // weapon ID ou null
  right_shoulder: null, // weapon ID ou null
}
```

### 2.2 Regras de slot

```js
const EQUIP_SLOTS = {
  left_hand:     { label: 'Mão Esq.',  accepts: 'hand',     linkedPart: 'left_arm' },
  right_hand:    { label: 'Mão Dir.',  accepts: 'hand',     linkedPart: 'right_arm' },
  left_shoulder: { label: 'Ombro Esq.', accepts: 'shoulder', linkedPart: 'torso' },
  right_shoulder:{ label: 'Ombro Dir.', accepts: 'shoulder', linkedPart: 'torso' },
};
```

**Regras:**
- Arma com `slot: "hand"` só entra em `left_hand` ou `right_hand`
- Arma com `slot: "shoulder"` só entra em `left_shoulder` ou `right_shoulder`
- Mesma arma NÃO pode ocupar dois slots (cada unidade de arma é única)
- Slot vazio = sem arma naquele ponto (usa unarmed / não ataca com esse slot)

### 2.3 Métodos de equipar/desequipar

**No game.js ou num módulo dedicado:**

```js
equipWeapon(slotId, weaponId) {
  const slot = EQUIP_SLOTS[slotId];
  if (!slot) return false;

  const weapon = this.state.items[weaponId];
  if (!weapon || weapon.type !== 'weapon') return false;
  if (!weapon.owned) return false;

  // Verificar compatibilidade de slot
  if (weapon.slot !== slot.accepts) return false;

  // Verificar se a peça linkada não está destruída
  const linkedPart = this.state.player.frame.parts[slot.linkedPart];
  if (linkedPart && linkedPart.status === 'destroyed') return false;

  // Verificar se o combate está ativo
  if (this.combatRunner.active) return false;

  // Desequipar arma atual do slot (se houver)
  const currentWeaponId = this.state.player.frame.equip[slotId];
  if (currentWeaponId) {
    // Arma volta pro inventário (já está lá, só desvincula)
  }

  // Verificar se a arma está equipada em outro slot e remover
  for (const [sid, wid] of Object.entries(this.state.player.frame.equip)) {
    if (wid === weaponId) {
      this.state.player.frame.equip[sid] = null;
    }
  }

  this.state.player.frame.equip[slotId] = weaponId;
  return true;
}

unequipWeapon(slotId) {
  if (this.combatRunner.active) return false;
  this.state.player.frame.equip[slotId] = null;
  return true;
}
```

### 2.4 Arma inicial do jogador

Quando o jogador restaura a garagem e encontra o mecha do pai, o frame já vem com uma arma default:

**Na narrativa de desbloqueio da garagem** (ou no init do frame), setar:
```js
// Dar ao jogador o Mech Fist como arma inicial (owned)
this.state.items['mech_fist'].owned = 1;

// Equipar automaticamente na mão direita
this.state.player.frame.equip.right_hand = 'mech_fist';
```

> **Alternativa:** Se o sistema de owned não for binário (pode ter mais de uma unidade), ajustar conforme. Para este pacote, `owned: 0/1` é suficiente.

### 2.5 Dar segunda arma logo depois

Para que o jogador sinta a diferença entre armas rapidamente, a primeira missão (Scrap Drone) deve dropar a MG-206 como **first clear bonus**:

```json
// Em missions.json, mission_scrap_drone:
"firstClearBonus": {
  "glory": 3,
  "reputation": 1,
  "weapons": ["machine_gun_d6"]
}
```

**No handler de endCombat/rewards**, se `weapons` existir no firstClearBonus:
```js
if (mission.firstClearBonus?.weapons && mission.completed === 0) {
  for (const wid of mission.firstClearBonus.weapons) {
    const weapon = this.state.items[wid];
    if (weapon) {
      weapon.owned = 1;
      this.logCombat(`⚔ ACQUIRED: ${weapon.name}!`, 'loot');
    }
  }
}
```

---

## PARTE 3: INTEGRAÇÃO NO COMBATE

### 3.1 Resolver qual arma o jogador usa por ataque

O jogador tem até 4 armas equipadas. Em cada turno de ataque, o CombatRunner decide qual arma usa.

**Estratégia idle simplificada:**
- O jogador ataca UMA VEZ por turno com a **melhor arma disponível** (maior baseDamage entre as equipadas e operacionais)
- "Operacional" = a peça linkada ao slot não está destruída
- Se nenhuma arma está equipada/operacional, usa **unarmed** (dano 1, sem bônus, sem supply cost)

```js
getActiveWeapon() {
  const frame = this.state.player.frame;
  let bestWeapon = null;
  let bestDamage = 0;

  for (const [slotId, weaponId] of Object.entries(frame.equip)) {
    if (!weaponId) continue;

    const slot = EQUIP_SLOTS[slotId];
    const part = frame.parts[slot.linkedPart];

    // Peça destruída = arma inutilizada
    if (part && part.status === 'destroyed') continue;

    const weapon = this.state.items[weaponId];
    if (!weapon) continue;

    // Verificar se tem supply suficiente (se supplyCost > 0)
    if (weapon.supplyCost > 0) {
      const supply = this.state.items['supply'];
      if (!supply || supply.val < weapon.supplyCost) continue; // Sem munição
    }

    if (weapon.baseDamage > bestDamage) {
      bestDamage = weapon.baseDamage;
      bestWeapon = weapon;
    }
  }

  return bestWeapon; // null = unarmed
}
```

### 3.2 Arma no cálculo de ataque do jogador

**Modificar `resolvePlayerAttack` / `_executeAttack`:**

```js
const weapon = this.getActiveWeapon();

// --- TARGET PERCENT ---
const categoryAttr = weapon ? CATEGORY_ATTR[weapon.category] : 'mus';
const attrBonus = this.getPlayerStat(categoryAttr) || 0; // MUS, REF, ou FOC
const weaponAccuracy = weapon ? weapon.accuracyMod : 0;
const stanceAtkBonus = STANCES[this.stance].atkMod * 100;

const targetPercent = clamp(
  50 + (attrBonus * 2) - (defenderDEF * 1.5) + weaponAccuracy + stanceAtkBonus,
  5, 95
);

// --- DANO ---
const weaponBaseDamage = weapon ? weapon.baseDamage : 1; // unarmed = 1
const weaponDiceBonus = weapon ? this.rollWeaponDice(weapon.dice) : 0;
const breachBonus = this.getTokenStacks(targetFrame, 'BREACH');
const finalDamage = weaponBaseDamage + weaponDiceBonus + breachBonus;

// --- HEAT ---
const weaponHeat = weapon ? weapon.heatGen : 1; // unarmed gera 1 heat
// Adicionar ao heat do frame (sistema existente)

// --- SUPPLY ---
if (weapon && weapon.supplyCost > 0) {
  const supply = this.state.items['supply'];
  if (supply) {
    supply.val = Math.max(0, supply.val - weapon.supplyCost);
  }
}

// --- TOKEN ON HIT ---
// SUBSTITUI a fonte temporária do Pacote 2 (critical → BREACH)
if (hit && weapon && weapon.tokenOnHit) {
  for (const { type, chance, stacks } of weapon.tokenOnHit) {
    if (Math.random() < chance) {
      const applied = this.applyToken(targetEnemy, type, stacks || 1);
      if (applied > 0) {
        const def = TOKEN_DEFS[type];
        this.logCombat(`  ${def.icon} ${def.name}! [${this.getTokenStacks(targetEnemy, type)} stacks]`, 'debuff');
      }
    }
  }
}

// --- CRITICAL HIT BONUS ---
// Manter: critical (d100 ≤ 5) ainda aplica BREACH como bônus universal
// MAS agora é ALÉM do tokenOnHit da arma, não a fonte principal
if (hit && result.critical) {
  const applied = this.applyToken(targetEnemy, 'BREACH', 1);
  if (applied > 0) {
    this.logCombat(`  🔓 Critical BREACH! [${this.getTokenStacks(targetEnemy, 'BREACH')} stacks]`, 'debuff');
  }
}
```

### 3.3 Função rollWeaponDice

```js
rollWeaponDice(diceType) {
  const dice = DICE_VALUES[diceType];
  if (!dice) return 0;
  return Math.floor(Math.random() * dice.sides) + 1;
}
```

### 3.4 Avaria (dano a integridade)

**O campo `avaria` da arma determina quanto dano à integridade o hit causa (§3.2):**

```js
// Após aplicar dano HP normal:
// Se o HP da peça chegar a 0, a integridade é reduzida
// O QUANTO a integridade reduz depende da avaria da arma

// Na função applyDamage, quando HP da peça chega a 0 e integrity deve cair:
const avariaAmount = weapon ? weapon.avaria : 0.5; // unarmed = 0.5 (como Fight)
// avariaAmount 0.5 = precisa de 2 hits para reduzir 1 nível de integridade
// avariaAmount 1.0 = cada hit que zera HP reduz 1 nível de integridade
```

> **IMPLEMENTAÇÃO SIMPLIFICADA:** Se o sistema de integridade por níveis já funciona com "HP da barra atual → quando zera, desce nível", a `avaria` pode ser um multiplicador no dano que atravessa para a próxima barra. Adaptar conforme a implementação existente.

### 3.5 Heat por arma

**Substituir a geração de heat fixa por turno pela heat da arma:**

```js
// ANTES (provavelmente):
// this.addHeat(FIXED_HEAT_PER_ATTACK);

// DEPOIS:
const heatFromWeapon = weapon ? weapon.heatGen : 1;
this.addHeat(heatFromWeapon);
```

Isso faz heat blade (12 heat) ser perigoso comparado a machine gun (5 heat), criando trade-off real com stance Cautelosa.

### 3.6 Log de arma no combate

```js
// Após resolver ataque:
const weaponName = weapon ? weapon.name : 'Unarmed';
this.logCombat(`⚔ ${weaponName} → ${partDisplayName}: ${finalDamage} dano`, 'player');
```

Se sem munição:
```js
if (!weapon && hasEquippedWeapons) {
  this.logCombat(`▸ Supply esgotado! Atacando desarmado.`, 'warning');
}
```

### 3.7 Destruição de peça → perda de arma

**Na função que marca uma peça como `destroyed`**, verificar se algum slot está linkado:

```js
onPartDestroyed(partId) {
  // ... lógica existente de destruição ...

  // Inutilizar armas vinculadas
  for (const [slotId, slotDef] of Object.entries(EQUIP_SLOTS)) {
    if (slotDef.linkedPart === partId) {
      const weaponId = this.state.player.frame.equip[slotId];
      if (weaponId) {
        const weapon = this.state.items[weaponId];
        this.logCombat(`✗ ${weapon?.name || 'Weapon'} perdida! ${slotDef.label} inutilizado.`, 'critical');
        // NÃO remover do slot — manter referência para reparo futuro
        // Marcar slot como inoperante via peça destruída
      }
    }
  }
}
```

> **NOTA:** A arma não é "removida" — ela continua no slot, mas `getActiveWeapon()` já ignora slots com peça destruída. Quando a peça for reparada (futuro), a arma volta a funcionar.

---

## PARTE 4: ARMAS DOS INIMIGOS

### 4.1 Atualizar `enemies.json`

Inimigos precisam de um campo `weapon` (singular — inimigos usam uma arma por simplificação):

```json
{
  "id": "scrap_drone",
  // ... campos existentes ...
  "weapon": {
    "name": "Cutting Laser",
    "category": "short",
    "dice": "d4",
    "baseDamage": 2,
    "accuracyMod": 0,
    "heatGen": 3,
    "avaria": 0.5
  }
}
```

```json
{
  "id": "rogue_labor",
  // ... campos existentes ...
  "weapon": {
    "name": "Hydraulic Press",
    "category": "fight",
    "dice": "d6",
    "baseDamage": 4,
    "accuracyMod": -5,
    "heatGen": 4,
    "avaria": 1
  },
  "tokenOnHit": [
    { "type": "BREACH", "chance": 0.20, "stacks": 1 }
  ]
}
```

```json
{
  "id": "junkyard_furnace",
  // ... se criado no Pacote 2 ...
  "weapon": {
    "name": "Smelter Claw",
    "category": "fight",
    "dice": "d6",
    "baseDamage": 3,
    "accuracyMod": 0,
    "heatGen": 8,
    "avaria": 0.5
  },
  "tokenOnHit": [
    { "type": "BURN", "chance": 0.35, "stacks": 1 },
    { "type": "BREACH", "chance": 0.15, "stacks": 1 }
  ]
}
```

> **NOTA:** `tokenOnHit` permanece no nível do inimigo (não na arma do inimigo) para manter simplicidade. No futuro, pode migrar para `enemy.weapon.tokenOnHit`.

### 4.2 Integrar no ataque do inimigo

**Modificar `resolveEnemyAttack`:**

```js
const enemyWeapon = enemy.weapon || { name: 'Unarmed', baseDamage: 1, dice: 'd4', accuracyMod: 0, heatGen: 1, avaria: 0.5 };

// Usar enemyWeapon.baseDamage, enemyWeapon.accuracyMod, etc.
// Mesma lógica de resolução do jogador, mas sem consultar slots/supply
```

---

## PARTE 5: UI — EQUIPAMENTO PRÉ-COMBATE

### 5.1 Localização

**Arquivo:** `CombatPanel.vue`

A seção de equipamento fica ENTRE a configuração de stance/targeting (Pacote 1) e o botão de launch:

```
╔══════════════════════════════════════╗
║  COMBAT CONFIGURATION                ║
╠══════════════════════════════════════╣
║  STANCE    [⚔ OFE] [⚖ BAL] ...     ║
║  TARGETING [◎ AUTO] [☠ AGRE] ...    ║
║                                      ║
║  LOADOUT                             ║
║  ┌─────────────────────────────────┐ ║
║  │ R.HAND  ⚔ MG-206 'Rattler'    │ ║
║  │         Short d6 | DMG 4 | +5% │ ║
║  │ L.HAND  ⚔ Mech Fist           │ ║
║  │         Fight d4 | DMG 2 |+10% │ ║
║  │ R.SHLDR [empty]                │ ║
║  │ L.SHLDR [empty]                │ ║
║  └─────────────────────────────────┘ ║
║  SUPPLY: ▸▸▸▸▸▸▸▸░░ 8/10           ║
║                                      ║
║  [ ▶ LAUNCH MISSION ]               ║
╚══════════════════════════════════════╝
```

### 5.2 Implementação Vue

```html
<!-- Loadout Section (pré-combate) -->
<div class="loadout-config" v-if="!combatRunner.active">
  <div class="config-label">LOADOUT</div>
  <div class="equip-slots">
    <div
      v-for="(slotDef, slotId) in equipSlots"
      :key="slotId"
      class="equip-slot"
      :class="{ disabled: isSlotDisabled(slotId) }"
      @click="openWeaponSelect(slotId)"
    >
      <span class="slot-label">{{ slotDef.label }}</span>
      <template v-if="getEquippedWeapon(slotId)">
        <span class="weapon-name">⚔ {{ getEquippedWeapon(slotId).name }}</span>
        <span class="weapon-stats">
          {{ getEquippedWeapon(slotId).category }} {{ getEquippedWeapon(slotId).dice }}
          | DMG {{ getEquippedWeapon(slotId).baseDamage }}
          | {{ formatMod(getEquippedWeapon(slotId).accuracyMod / 100) }}
        </span>
      </template>
      <template v-else>
        <span class="slot-empty">[empty]</span>
      </template>
    </div>
  </div>

  <!-- Supply bar -->
  <div class="supply-bar" v-if="supplyResource">
    <span class="supply-label">SUPPLY:</span>
    <span class="supply-fill">
      {{ '▸'.repeat(supplyResource.val) }}{{ '░'.repeat(supplyResource.max - supplyResource.val) }}
    </span>
    <span class="supply-count">{{ supplyResource.val }}/{{ supplyResource.max }}</span>
  </div>
</div>
```

### 5.3 Seletor de arma (dropdown/modal simples)

Quando o jogador clica num slot, mostrar lista de armas compatíveis:

```html
<!-- Weapon select overlay -->
<div class="weapon-select" v-if="selectingSlot">
  <div class="config-label">SELECT WEAPON — {{ equipSlots[selectingSlot].label }}</div>
  <button
    v-for="w in compatibleWeapons(selectingSlot)"
    :key="w.id"
    class="weapon-option"
    @click="doEquip(selectingSlot, w.id)"
  >
    <span>⚔ {{ w.name }}</span>
    <span class="weapon-stats">
      {{ w.category }} {{ w.dice }} | DMG {{ w.baseDamage }} | HEAT +{{ w.heatGen }}
      <span v-if="w.tokenOnHit.length"> | {{ tokenSummary(w) }}</span>
    </span>
  </button>
  <button class="weapon-option unequip" @click="doUnequip(selectingSlot)">
    ✕ Unequip
  </button>
  <button class="weapon-option cancel" @click="selectingSlot = null">
    ← Cancel
  </button>
</div>
```

```js
// methods:
compatibleWeapons(slotId) {
  const slot = EQUIP_SLOTS[slotId];
  return Object.values(this.state.items)
    .filter(i => i.type === 'weapon' && i.owned && i.slot === slot.accepts && !i.locked)
    // Excluir armas já equipadas em OUTRO slot
    .filter(i => {
      for (const [sid, wid] of Object.entries(this.state.player.frame.equip)) {
        if (sid !== slotId && wid === i.id) return false;
      }
      return true;
    });
},

tokenSummary(weapon) {
  return weapon.tokenOnHit
    .map(t => `${TOKEN_DEFS[t.type]?.icon || '?'} ${Math.round(t.chance * 100)}%`)
    .join(' ');
},
```

### 5.4 Indicador durante combate

Quando em combate, mostrar o loadout como read-only:

```
LOADOUT: ⚔ MG-206 (R) | ⚔ Mech Fist (L) | SUPPLY 6/10
```

### 5.5 CSS mínimo

```css
.loadout-config { margin: 8px 0; }
.equip-slots { display: flex; flex-direction: column; gap: 2px; }
.equip-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: rgba(0, 255, 170, 0.03);
  border: 1px solid rgba(0, 255, 170, 0.1);
  cursor: pointer;
  font-size: 11px;
  transition: border-color 0.2s;
}
.equip-slot:hover { border-color: rgba(0, 255, 170, 0.4); }
.equip-slot.disabled { opacity: 0.4; pointer-events: none; }
.slot-label { color: rgba(0, 255, 170, 0.5); width: 70px; font-size: 9px; letter-spacing: 1px; }
.weapon-name { color: #0fa; font-weight: bold; }
.weapon-stats { color: rgba(0, 255, 170, 0.5); font-size: 9px; }
.slot-empty { color: rgba(255, 255, 255, 0.2); font-style: italic; }

.supply-bar { margin-top: 4px; font-size: 11px; display: flex; align-items: center; gap: 6px; }
.supply-label { color: rgba(255, 170, 85, 0.6); font-size: 9px; letter-spacing: 1px; }
.supply-fill { color: #fa5; letter-spacing: 1px; }
.supply-count { color: rgba(255, 170, 85, 0.5); font-size: 10px; }

.weapon-select { padding: 6px; border: 1px solid #0fa; background: rgba(0, 0, 0, 0.9); }
.weapon-option {
  display: block; width: 100%; text-align: left;
  background: transparent; border: 1px solid rgba(0, 255, 170, 0.1);
  color: #0fa; padding: 6px 8px; margin: 2px 0; cursor: pointer; font-family: inherit; font-size: 11px;
}
.weapon-option:hover { border-color: #0fa; background: rgba(0, 255, 170, 0.1); }
.weapon-option.unequip { color: #f55; border-color: rgba(255, 85, 85, 0.2); }
.weapon-option.cancel { color: #888; border-color: rgba(255, 255, 255, 0.1); }
```

---

## PARTE 6: SUPPLY ENTRE MISSÕES

### 6.1 Regeneração de Supply

Supply **regenera entre missões** (não durante combate). Na lógica idle existente:

```js
// No tick loop, quando NÃO está em combate:
const supply = this.state.items['supply'];
if (supply && supply.val < supply.max && !this.combatRunner.active) {
  // Regenerar 1 supply a cada ~30 segundos idle
  supply.val = Math.min(supply.max, supply.val + TICK_S * 0.033);
}
```

> **Se supply não existe ainda como recurso**, verificar que foi adicionado na Phase 1 do implementation_plan (seção recursos). Se não, adicionar ao `resources.json` conforme a spec existente.

### 6.2 Supply check antes de missão

Na seleção de missão, mostrar aviso se supply está baixo:

```html
<span v-if="supplyResource && supplyResource.val < 3" class="supply-warning">
  ⚠ Low supply — stronger weapons may run out of ammo
</span>
```

---

## PARTE 7: SERIALIZAÇÃO

### 7.1 Frame equip

O objeto `equip` do frame já deve ser serializado junto com o frame. Verificar que o `toJSON` do player inclui:

```js
// Em serialize do frame:
equip: frame.equip  // { left_hand: 'machine_gun_d6', right_hand: 'mech_fist', ... }
```

### 7.2 Weapon owned state

Armas são items no `state.items`, então `owned` já é serializado pelo sistema genérico de save. **Verificar** que o save/load existente persiste `owned` para items de type `weapon`.

---

## PARTE 8: VERIFICAÇÃO

### 8.1 Dados e carregamento

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 1 | Game init com weapons.json | Armas carregadas em state.items, tipo 'weapon' |
| 2 | TechTree avalia `require` de armas | Armas tier 2 com require ficam locked até condição |
| 3 | Mech Fist owned=1 após desbloquear garagem | Jogador começa com arma básica |

### 8.2 Equipamento

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 4 | Equipar MG-206 (hand) em right_hand | Slot atualizado, arma aparece na UI |
| 5 | Equipar MG-206 (hand) em left_shoulder | Rejeitado — slot incompatível |
| 6 | Equipar mesma arma em dois slots | Remove do slot anterior, coloca no novo |
| 7 | Equipar durante combate | Rejeitado — travado |
| 8 | Peça left_arm destruída | left_hand slot aparece desabilitado |
| 9 | Unequip arma | Slot volta a [empty] |

### 8.3 Combate com armas

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 10 | Ataque com MG-206 equipada | Log: "⚔ MG-206 'Rattler' → TORSO: X dano"; supply decrementado |
| 11 | Ataque sem arma equipada | Log: "⚔ Unarmed → TORSO: 1 dano" |
| 12 | Supply chega a 0 mid-combat | Arma com supplyCost ignorada; usa próxima arma ou unarmed |
| 13 | Heat Blade gera 12 heat por ataque | Heat acumula significativamente mais rápido que com MG |
| 14 | Heat Blade com tokenOnHit BURN 30% | ~30% dos hits aplicam BURN no inimigo |
| 15 | Shotgun com tokenOnHit BREACH 20% | ~20% dos hits aplicam BREACH no inimigo |
| 16 | Critical hit (d100 ≤ 5) | Aplica BREACH via critical + TAMBÉM processa tokenOnHit da arma |
| 17 | Braço direito destruído mid-combat | Arma da mão direita para de funcionar; getActiveWeapon pula para outra |

### 8.4 Armas dos inimigos

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 18 | Scrap Drone ataca | Log mostra "Cutting Laser → PEÇA: X dano" |
| 19 | Rogue Labor ataca | Log mostra "Hydraulic Press" + chance de BREACH |
| 20 | Inimigo sem campo weapon | Usa unarmed fallback (dano 1, d4) |

### 8.5 UI

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 21 | Tela pré-combate mostra LOADOUT | 4 slots visíveis com arma ou [empty] |
| 22 | Clicar em slot abre seletor | Lista armas compatíveis owned e unlocked |
| 23 | Supply bar visível | Mostra supply atual com fill visual |
| 24 | Durante combate, loadout read-only | Mostra armas equipadas sem interação |

### 8.6 Serialização

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 25 | Salvar com 2 armas equipadas, recarregar | Slots restaurados com as mesmas armas |
| 26 | Salvar com MG owned=1, recarregar | weapon.owned persiste |

---

## ARQUIVOS TOCADOS (resumo)

| Arquivo | Ação | Mudanças |
|---------|------|----------|
| `data/mecha/weapons.json` | NEW | 6 armas iniciais |
| `data/mecha/modules.json` | MODIFY | Adicionar `"weapons"` ao core[] |
| `data/mecha/enemies.json` | MODIFY | Adicionar campo `weapon` a cada inimigo |
| `data/mecha/missions.json` | MODIFY | firstClearBonus com weapons[] na missão drone |
| `src/game.js` | MODIFY | _loadWeapons(), equipWeapon(), unequipWeapon(), supply regen, weapon reward handler |
| `src/modules/combatRunner.js` | MODIFY | DICE_VALUES, CATEGORY_ATTR, EQUIP_SLOTS (exportar), getActiveWeapon(), rollWeaponDice(), integrar arma no ataque, heat por arma, supply consumption, onPartDestroyed |
| `CombatPanel.vue` | MODIFY | Loadout section, weapon selector, supply bar, combat loadout indicator |
| CSS do terminal | MODIFY | .loadout-config, .equip-slot, .weapon-select, .supply-bar |

---

## O QUE NÃO FAZER NESTE PACOTE

- ❌ NÃO implementar escudos (Riot Shield, Reactive Armor, etc.) — pacote separado
- ❌ NÃO implementar decomposição de dados (d12 = 2×d6) — complexidade desnecessária agora
- ❌ NÃO implementar loja/mercado de armas — jogador ganha armas por missões e loot por agora
- ❌ NÃO implementar loot drop de armas aleatório — usar firstClearBonus por missão
- ❌ NÃO adicionar mais de 6 armas — manter catálogo pequeno para testar, expandir depois
- ❌ NÃO fazer inimigos escolherem entre múltiplas armas — 1 arma por inimigo, simples
- ❌ NÃO tocar em Stances ou Targeting — já funcionais dos Pacotes 1-2
- ❌ NÃO remover tokenOnHit dos inimigos — manter fonte dupla (inimigo + arma do jogador) até Sprint 3
