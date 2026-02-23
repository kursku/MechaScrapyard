# Frente A — Combat Polish (Independente do Prestige Redesign)

**De:** Design  
**Para:** Antigravity  
**Prioridade:** Pode avançar AGORA — zero conflito com as mudanças de Glory/Prestige  

---

## Contexto Rápido

Estamos redesenhando o Glory e Prestige por completo (story-gated, dual track pool/spend, 3 alignments). Isso afeta o Sprint 2C inteiro. MAS o combat core (2A/2B) está sólido e as duas tarefas abaixo são **combat puro** — não tocam em Glory, Ranks, nem Prestige. Podem ir agora.

---

## A1: Weapon Damage Integration

### O Problema
`combatRunner.js` linha ~625: `let damage = 20` (hardcoded). O player e inimigos dão dano fixo. `weapons.json` existe com dados reais (baseDamage, heatGen, supplyCost, accuracyMod, tokenOnHit) mas o CombatRunner não lê nada disso.

### O Objetivo
Conectar o CombatRunner ao sistema de armas. Cada ataque usa a arma equipada para determinar dano, accuracy, heat, supply cost e token application.

### Referência Completa
`IMPL_SPEC_weapon_system.md` já está no projeto com tudo detalhado. Abaixo o resumo das mudanças core:

### Mudanças no CombatRunner

**1. Resolver arma ativa por turno**

Adicionar método que verifica os 4 equip slots, filtra armas operacionais (parte linkada não destruída, supply suficiente), retorna a melhor:

```js
getActiveWeapon() {
  const frame = this.state.player.frame;
  const EQUIP_SLOTS = {
    left_hand:      { accepts: 'hand',     linkedPart: 'left_arm' },
    right_hand:     { accepts: 'hand',     linkedPart: 'right_arm' },
    left_shoulder:  { accepts: 'shoulder', linkedPart: 'torso' },
    right_shoulder: { accepts: 'shoulder', linkedPart: 'torso' },
  };

  let bestWeapon = null;
  let bestDamage = 0;

  for (const [slotId, weaponId] of Object.entries(frame.equip || {})) {
    if (!weaponId) continue;
    const slot = EQUIP_SLOTS[slotId];
    const part = frame.parts?.[slot.linkedPart];
    if (part && part.status === 'destroyed') continue;

    const weapon = this.state.items[weaponId];
    if (!weapon) continue;

    if (weapon.supplyCost > 0) {
      const supply = this.state.items['supply'];
      if (!supply || supply.val < weapon.supplyCost) continue;
    }

    if (weapon.baseDamage > bestDamage) {
      bestDamage = weapon.baseDamage;
      bestWeapon = weapon;
    }
  }
  return bestWeapon; // null = unarmed
}
```

**2. Substituir o dano hardcoded no resolvePlayerAttack**

Onde hoje tem `let damage = 20`, substituir por:

```js
const weapon = this.getActiveWeapon();

// --- ACCURACY (weapon modifica targetPercent) ---
const CATEGORY_ATTR = { fight: 'mus', short: 'ref', long: 'foc' };
const categoryAttr = weapon ? CATEGORY_ATTR[weapon.category] : 'mus';
const weaponAccuracy = weapon ? weapon.accuracyMod : 0;
// Adicionar weaponAccuracy ao cálculo de targetPercent existente

// --- DAMAGE (weapon substitui o 20 fixo) ---
const weaponBaseDamage = weapon ? weapon.baseDamage : 1;
const weaponDiceBonus = weapon ? this.rollWeaponDice(weapon.dice) : 0;
const breachBonus = this.getTokenStacks(targetFrame, 'BREACH') || 0;
const stanceDmgMod = STANCES[this.stance]?.dmgMod || 1.0;
const damage = Math.round((weaponBaseDamage + weaponDiceBonus + breachBonus) * stanceDmgMod);

// --- HEAT (weapon define quanto heat gera) ---
const weaponHeat = weapon ? weapon.heatGen : 1;
// Usar weaponHeat em vez do heat fixo atual

// --- SUPPLY (consumir munição) ---
if (weapon && weapon.supplyCost > 0) {
  const supply = this.state.items['supply'];
  if (supply) supply.val = Math.max(0, supply.val - weapon.supplyCost);
}

// --- TOKEN ON HIT (arma aplica debuffs) ---
if (hit && weapon && weapon.tokenOnHit) {
  for (const { type, chance, stacks } of weapon.tokenOnHit) {
    if (Math.random() < chance) {
      this.applyToken(targetEnemy, type, stacks || 1);
    }
  }
}
```

**3. Weapon dice roller**

Se não existir, adicionar:

```js
rollWeaponDice(diceStr) {
  // diceStr = 'd4', 'd6', 'd8', 'd10', 'd12'
  const sides = parseInt(diceStr.replace('d', ''));
  if (!sides || isNaN(sides)) return 0;
  return Math.floor(Math.random() * sides) + 1;
}
```

**4. Fazer o mesmo pros inimigos**

Inimigos em `enemies.json` têm campo `weapons` com array de weapon IDs. No `resolveEnemyAttack`, replicar a lógica:

```js
getEnemyWeapon(enemy) {
  if (!enemy.weapons || enemy.weapons.length === 0) return null;
  // Pegar a primeira arma válida (ou a mais forte)
  for (const wid of enemy.weapons) {
    const w = this.state.items[wid];
    if (w) return w;
  }
  return null;
}
```

Usar o mesmo fluxo de damage/heat/supply/tokenOnHit no ataque do inimigo.

**5. Equip slots no frame do player**

Se `state.player.frame.equip` ainda não existir, inicializar:

```js
// Na inicialização do frame (ou no load do player):
if (!frame.equip) {
  frame.equip = {
    left_hand: null,
    right_hand: 'mech_fist', // Arma default do Hayabusa Mk.I
    left_shoulder: null,
    right_shoulder: null,
  };
}
```

E dar o `mech_fist` como owned:
```js
if (this.state.items['mech_fist']) {
  this.state.items['mech_fist'].owned = 1;
}
```

**6. UI: Equip/Unequip (mínimo viável)**

No painel de combat setup ou no inventário, permitir o jogador trocar arma por slot. Pode ser simples:

```vue
<div v-for="(wId, slot) in playerFrame.equip" :key="slot" class="equip-slot">
  <span class="slot-label">{{ slotLabel(slot) }}</span>
  <span v-if="wId">{{ getWeaponName(wId) }}</span>
  <span v-else class="empty">— empty —</span>
  <select @change="equipWeapon(slot, $event.target.value)">
    <option value="">None</option>
    <option v-for="w in ownedWeaponsForSlot(slot)" :key="w.id" :value="w.id">
      {{ w.name }} (DMG:{{ w.baseDamage }} ACC:{{ w.accuracyMod }})
    </option>
  </select>
</div>
```

### Verificação A1
- [ ] Dano do player varia por arma equipada (não é mais 20 fixo)
- [ ] Arma com supplyCost consome supply por ataque
- [ ] Arma com heatGen gera heat real (heat_blade > machine_gun)
- [ ] Arma com tokenOnHit aplica BURN/BREACH por chance
- [ ] Braço destruído = arma naquele slot inutilizada
- [ ] Sem arma = unarmed (dano 1, sem supply, heat 1)
- [ ] Inimigos usam suas armas do enemies.json
- [ ] Player pode equipar/desequipar armas fora de combate
- [ ] mech_fist vem equipado por default no Mk.I
- [ ] Combat log mostra nome da arma usada

---

## A2: Stress Recovery Off-Combat

### O Problema
Stress acumula durante combate (dano recebido, glitches). Mas entre missões não recupera. O jogador fica com stress alto e não tem como resolver a não ser... nada. O idle loop combat→recovery→combat não fecha.

### O Objetivo
Stress recupera passivamente quando o CombatRunner NÃO está ativo. Rate baseado no stat Grit do piloto.

### Mudança

**No `game.js` update(dt), DEPOIS do combatRunner.update:**

```js
// --- Stress Recovery (off-combat) ---
if (!this.combatRunner.active) {
  const frame = this.state.player.frame;
  if (frame && frame.stress > 0) {
    const grit = this.state.items.grit?.val || 1;
    const recoveryRate = grit * 0.1; // 0.1 per grit point per second
    frame.stress = Math.max(0, frame.stress - recoveryRate * dt);
  }
}
```

### Verificação A2
- [ ] Stress diminui passivamente quando fora de combate
- [ ] Rate escala com stat Grit do piloto (mais Grit = recovery mais rápida)
- [ ] Stress não fica negativo (floor em 0)
- [ ] Recovery NÃO acontece durante combate ativo
- [ ] Com Grit 3: stress 30 → 0 em ~100 segundos (~1.5 min)
- [ ] UI mostra stress diminuindo em tempo real

---

## Notas

- **Supply como recurso:** se `supply` não tiver val suficiente, a arma não dispara e o combatRunner deve fallback pra unarmed ou outra arma sem supply cost. O IMPL_SPEC_weapon_system.md tem detalhes sobre o auto-reload de supply pós-combate.
- **Balanceamento:** os números de baseDamage/heatGen nas armas podem ser ajustados depois. O importante agora é que o SISTEMA funcione — dano venha da arma, não do hardcode.
- **O que NÃO fazer agora:** Shields, Positions/Ranks, Glory spending. Tudo isso vai vir em documentos revisados.
