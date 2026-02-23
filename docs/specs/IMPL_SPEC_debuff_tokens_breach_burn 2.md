# MECHA SCRAPYARD — Implementation Spec: Debuff Tokens (BREACH + BURN)
## Sprint 2B — Pacote 2 de 3

**Objetivo:** Adicionar o sistema base de tokens stackáveis com os 2 primeiros tipos: BREACH e BURN.  
**Pré-requisito:** Pacote 1 (Stances + Targeting) implementado e funcional.  
**Escopo:** Infraestrutura de tokens + BREACH + BURN. NÃO implementar ERROR, SLOW, TARGET_LOCK, SUPPRESS neste pacote.  
**Referência:** `combat_design_document.md` §8 / `combat_implementation_plan.md` Phase 5

---

## CONTEXTO IMPORTANTE

O sistema de armas (Fight/Short/Long) ainda NÃO existe (Sprint 2C). Tokens precisam de um mecanismo de aplicação temporário que funcione agora e transite naturalmente quando armas chegarem.

**Solução:** Duas fontes de aplicação de tokens neste pacote:
1. **Enemy templates** — campo `tokenOnHit` no JSON do inimigo (alguns inimigos aplicam tokens naturalmente)
2. **Chance fixa em critical hits** — qualquer critical hit (d100 ≤ 5) do jogador aplica 1 BREACH

Quando o sistema de armas for implementado no Sprint 2C, a fonte de tokens passará a ser a arma equipada (`weapon.tokenOnHit`), e estas fontes temporárias podem ser removidas ou mantidas como bônus.

---

## PARTE 1: INFRAESTRUTURA DE TOKENS

### 1.1 Constante TOKEN_DEFS

**Arquivo:** `src/modules/combatRunner.js`

Adicionar no topo, junto com STANCES e TARGETING_POLICIES:

```js
const TOKEN_DEFS = {
  BREACH: {
    id: 'BREACH',
    name: 'Breach',
    icon: '🔓',
    color: '#f55',
    desc: 'Armadura comprometida. +1 dano recebido por stack.',
    maxStacks: 5,
    // Efeito: aplicado durante resolução de dano (passivo)
    // Remoção: ação de reparo (futuro) ou fim do combate
  },
  BURN: {
    id: 'BURN',
    name: 'Burn',
    icon: '🔥',
    color: '#f80',
    desc: 'Em chamas. Início do turno: d6 por stack; 4+ = 1 dano.',
    maxStacks: 4,
    // Efeito: processado na maintenance phase (ativo)
    // Remoção: auto-resolve (roll ≤ 3) ou Vent action (futuro)
  },
};

export { STANCES, TARGETING_POLICIES, TOKEN_DEFS };
```

### 1.2 Array de tokens no frame

Cada combatente (player frame + cada inimigo clonado) precisa de um array `tokens`.

**Em `startMission()`**, após clonar inimigos:
```js
// Inicializar tokens no frame do jogador
if (!this.state.player.frame.tokens) {
  this.state.player.frame.tokens = [];
}

// Inicializar tokens em cada inimigo clonado
for (const enemy of this.enemies) {
  enemy.tokens = [];
}
```

**Em `endCombat()`**, limpar tokens do jogador:
```js
this.state.player.frame.tokens = [];
```

### 1.3 Métodos base no CombatRunner

```js
/**
 * Aplica stacks de um token a um frame.
 * Respeita maxStacks e limite de 6 tipos diferentes por unidade.
 * @returns {number} Stacks efetivamente aplicados
 */
applyToken(frame, tokenType, stacks = 1) {
  const def = TOKEN_DEFS[tokenType];
  if (!def) return 0;

  if (!frame.tokens) frame.tokens = [];

  const existing = frame.tokens.find(t => t.type === tokenType);
  if (existing) {
    const before = existing.stacks;
    existing.stacks = Math.min(existing.stacks + stacks, def.maxStacks);
    return existing.stacks - before;
  }

  // Limite de 6 tipos diferentes por unidade (§8)
  if (frame.tokens.length >= 6) return 0;

  const applied = Math.min(stacks, def.maxStacks);
  frame.tokens.push({ type: tokenType, stacks: applied });
  return applied;
}

/**
 * Remove stacks de um token. Se stacks chega a 0, remove o token.
 * @returns {number} Stacks efetivamente removidos
 */
removeToken(frame, tokenType, stacks = 1) {
  if (!frame.tokens) return 0;

  const existing = frame.tokens.find(t => t.type === tokenType);
  if (!existing) return 0;

  const removed = Math.min(stacks, existing.stacks);
  existing.stacks -= removed;

  if (existing.stacks <= 0) {
    frame.tokens = frame.tokens.filter(t => t.type !== tokenType);
  }

  return removed;
}

/**
 * Retorna total de stacks de um tipo específico.
 */
getTokenStacks(frame, tokenType) {
  if (!frame.tokens) return 0;
  const token = frame.tokens.find(t => t.type === tokenType);
  return token ? token.stacks : 0;
}

/**
 * Limpa todos os tokens de um frame.
 */
clearTokens(frame) {
  frame.tokens = [];
}
```

---

## PARTE 2: BREACH — DANO AMPLIFICADO

### 2.1 Mecânica (§8.1)

> Ataques contra o alvo causam **+1 dano por stack de BREACH**.

BREACH é um modificador **passivo** — não processa na maintenance phase, mas amplifica dano recebido.

### 2.2 Aplicação de BREACH

**Fonte 1 — Critical hit do jogador:**

Na função de ataque do jogador (`resolvePlayerAttack` ou `_executeAttack`), **após** um hit confirmado:

```js
// Após calcular que o ataque acertou (hit === true):
if (result.critical) { // d100 ≤ 5
  const applied = this.applyToken(targetEnemy, 'BREACH', 1);
  if (applied > 0) {
    this.logCombat(`🔓 BREACH! Armadura comprometida. [${this.getTokenStacks(targetEnemy, 'BREACH')} stacks]`, 'debuff');
  }
}
```

**Fonte 2 — Inimigos com `tokenOnHit`:**

Na função de ataque do inimigo (`resolveEnemyAttack`), **após** um hit confirmado:

```js
// Após calcular que o ataque do inimigo acertou:
if (enemy.tokenOnHit) {
  for (const { type, chance, stacks } of enemy.tokenOnHit) {
    if (Math.random() < chance) {
      const applied = this.applyToken(this.state.player.frame, type, stacks || 1);
      if (applied > 0) {
        const def = TOKEN_DEFS[type];
        this.logCombat(`${def.icon} ${enemy.name} aplica ${def.name}! [${this.getTokenStacks(this.state.player.frame, type)} stacks]`, 'debuff');
      }
    }
  }
}
```

### 2.3 Efeito de BREACH no dano

**Localizar** onde o dano final é calculado (dentro de `_executeAttack` ou `applyDamage`).

**Modificar** o cálculo de dano quando o DEFENSOR tem BREACH:

```js
// ANTES de aplicar dano ao frame alvo:
const breachStacks = this.getTokenStacks(targetFrame, 'BREACH');
const finalDamage = baseDamage + breachStacks; // +1 por stack

if (breachStacks > 0) {
  this.logCombat(`  🔓 BREACH ×${breachStacks}: +${breachStacks} dano`, 'debuff');
}
```

> **ATENÇÃO:** Isso vale em AMBAS as direções. Se o player frame tem BREACH, inimigos causam +dano. Se o inimigo tem BREACH, jogador causa +dano. A função é a mesma.

### 2.4 Remoção de BREACH

Neste pacote, BREACH só é removido quando:
- O combate termina (`endCombat` já limpa todos os tokens)
- Futuramente: ação de reparo (Sprint 2C)

NÃO decai naturalmente. Isso é intencional — BREACH é uma condição que requer ação para resolver.

---

## PARTE 3: BURN — DANO POR TURNO

### 3.1 Mecânica (§8.1)

> Início do turno: rola d6 **por stack**. Resultado 4+ = 1 dano. Resultado ≤ 3 = remove aquele stack.

BURN é um token **ativo** — processa na maintenance phase de cada turno.

### 3.2 Aplicação de BURN

**Fonte — Inimigos com `tokenOnHit`:**

Mesma mecânica da Fonte 2 de BREACH (seção 2.2). Inimigos com armas térmicas terão `tokenOnHit: [{ type: 'BURN', chance: 0.25, stacks: 1 }]`.

**O jogador NÃO aplica BURN neste pacote** (requer arma térmica — Sprint 2C). Apenas recebe.

> Exceção futura: quando armas existirem, armas térmicas do jogador aplicarão BURN via `weapon.tokenOnHit`.

### 3.3 Processamento de BURN na Maintenance Phase

**Localizar** a maintenance phase no `resolveTurn()` (onde heat e stress já são processados).

**Adicionar ANTES do processamento de heat** (BURN pode gerar dano que afeta stress):

```js
processTokenEffects(frame, frameName) {
  if (!frame.tokens || frame.tokens.length === 0) return;

  // --- BURN ---
  const burnToken = frame.tokens.find(t => t.type === 'BURN');
  if (burnToken) {
    let totalBurnDamage = 0;
    let stacksRemoved = 0;

    // Rolar d6 POR STACK (não por token)
    for (let i = burnToken.stacks; i > 0; i--) {
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll >= 4) {
        totalBurnDamage += 1;
      } else {
        // Roll ≤ 3: esse stack se extingue
        stacksRemoved++;
      }
    }

    // Aplicar dano de BURN
    if (totalBurnDamage > 0) {
      // Dano de BURN atinge peça aleatória (ponderação Auto)
      const targetPart = this.selectTargetPart(frame, 'auto');
      this.applyDamage(frame, targetPart, totalBurnDamage);
      this.logCombat(`  🔥 ${frameName} queima! ${totalBurnDamage} dano → ${this.partDisplayName(targetPart)}`, 'burn');
    }

    // Remover stacks que se extinguiram
    if (stacksRemoved > 0) {
      this.removeToken(frame, 'BURN', stacksRemoved);
      if (this.getTokenStacks(frame, 'BURN') === 0) {
        this.logCombat(`  🔥 ${frameName}: chamas extinguiram.`, 'info');
      } else {
        this.logCombat(`  🔥 ${frameName}: ${stacksRemoved} stack(s) de BURN extinguiram. [${this.getTokenStacks(frame, 'BURN')} restante(s)]`, 'debuff');
      }
    }
  }

  // Limpar tokens com 0 stacks (safety)
  frame.tokens = frame.tokens.filter(t => t.stacks > 0);
}
```

**Chamar para AMBOS os lados na maintenance phase:**
```js
// Dentro de resolveTurn(), na maintenance phase:
this.processTokenEffects(this.state.player.frame, 'Seu Frame');
for (const enemy of this.enemies) {
  if (!this.isFrameDestroyed(enemy)) {
    this.processTokenEffects(enemy, enemy.name);
  }
}
```

### 3.4 Interação BREACH + BURN

Este é o primeiro combo tático do jogo (§8.2). Quando BURN causa dano a um alvo com BREACH:

> O dano de BURN **também** é amplificado por BREACH.

Isso já funciona automaticamente se o dano de BURN passar por `applyDamage` que consulta BREACH (seção 2.3). **Verificar** que o caminho de dano é o mesmo:

```
BURN processa → gera dano → chama applyDamage → applyDamage consulta BREACH → dano final amplificado
```

Se `applyDamage` não consulta BREACH internamente (ou seja, BREACH é aplicado antes de chamar `applyDamage`), então aplicar o bônus de BREACH no `processTokenEffects`:

```js
// Alternativa: aplicar BREACH dentro de processTokenEffects se não está em applyDamage
const breachStacks = this.getTokenStacks(frame, 'BREACH');
const amplifiedBurnDamage = totalBurnDamage + (breachStacks > 0 ? breachStacks : 0);
```

> **DECISÃO DE DESIGN:** Escolha UMA abordagem e seja consistente. A forma mais limpa é que `applyDamage` sempre consulte BREACH do frame receptor. Assim qualquer fonte de dano se beneficia automaticamente.

---

## PARTE 4: DADOS DE INIMIGOS

### 4.1 Atualizar `enemies.json`

Adicionar `tokenOnHit` aos inimigos existentes que fazem sentido tematicamente. **NÃO adicionar a todos** — tokens devem sentir especiais.

**Scrap Drone** — sem tokens (inimigo básico tutorial, mantém simples)
```json
// Nenhuma mudança
```

**Rogue Labor** — aplica BREACH (prensa hidráulica/impacto pesado)
```json
{
  "id": "rogue_labor",
  // ... campos existentes ...
  "tokenOnHit": [
    { "type": "BREACH", "chance": 0.20, "stacks": 1 }
  ]
}
```

**Sentry Turret** (se existir) — aplica BURN (arma térmica)
```json
{
  "id": "sentry_turret",
  // ... campos existentes ...
  "tokenOnHit": [
    { "type": "BURN", "chance": 0.25, "stacks": 1 }
  ]
}
```

> **Se só existem 3 inimigos no momento**, adicionar `tokenOnHit` ao segundo e/ou terceiro inimigo. O primeiro (Scrap Drone) deve permanecer sem tokens como baseline de dificuldade.

### 4.2 Considerar novo inimigo (opcional, recomendado)

Para mostrar o combo BREACH+BURN em ação, um inimigo que aplica ambos:

```json
{
  "id": "junkyard_furnace",
  "name": "Furnace Bot",
  "desc": "Industrial smelting drone reprogramado. Queima tudo que toca.",
  "type": "enemy",
  "parts": {
    "torso":     { "hp": 35, "maxHp": 35, "integrity": 2, "status": "ok" },
    "left_arm":  { "hp": 15, "maxHp": 15, "integrity": 1, "status": "ok" },
    "right_arm": { "hp": 15, "maxHp": 15, "integrity": 1, "status": "ok" },
    "legs":      { "hp": 20, "maxHp": 20, "integrity": 1, "status": "ok" }
  },
  "stats": { "atk": 4, "def": 2, "ref": 3, "mus": 5, "grt": 2, "cor": 1 },
  "tokenOnHit": [
    { "type": "BURN", "chance": 0.35, "stacks": 1 },
    { "type": "BREACH", "chance": 0.15, "stacks": 1 }
  ],
  "lootTable": [
    { "item": "scrap", "amount": 15, "chance": 0.8 },
    { "item": "parts", "amount": 1, "chance": 0.3 }
  ]
}
```

Se adicionar o inimigo, criar também a missão correspondente:

```json
{
  "id": "mission_furnace",
  "name": "Smelter Shutdown",
  "desc": "An old furnace drone woke up in Sector 4. It's melting everything.",
  "flavor": "The heat signature is off the charts.",
  "group": "combat",
  "type": "mission",
  "missionType": "secure",
  "difficulty": 3,
  "require": "g.mission_rogue_labor>=1",
  "cost": { "energy": 25 },
  "enemies": ["junkyard_furnace"],
  "turnLimit": 25,
  "rewards": { "glory": 5, "creds": 30, "scrap": 40 },
  "failRewards": { "glory": 2, "scrap": 10 },
  "log": {
    "start": "Heat warnings spike as you enter Sector 4. Something's burning.",
    "victory": "Furnace Bot neutralized. The scrap is scorched but salvageable.",
    "defeat": "Frame temperature critical. Forced retreat. Your armor is compromised."
  }
}
```

---

## PARTE 5: UI — DISPLAY DE TOKENS

### 5.1 Indicador de tokens na barra de status do frame

**Arquivo:** `CombatPanel.vue`

Onde o status do frame é exibido (barras de HP por peça), adicionar uma linha de tokens abaixo:

```
PLAYER FRAME                     ENEMY: ROGUE LABOR
──────────────                   ──────────────────
TORSO  [|||......] 45/100 ×3    CORE   [||||||...] 22/30 ×1
L.ARM  [||||||...] 38/50  ×2    ...
R.ARM  [||||.....] 20/50  ×2
LEGS   [|||||||||] 58/60  ×2

TOKENS: 🔓×2  🔥×1              TOKENS: 🔓×1
```

### 5.2 Implementação Vue

```html
<!-- Dentro do bloco de status de cada frame -->
<div class="token-bar" v-if="frameTokens(frame).length > 0">
  <span class="token-label">TOKENS:</span>
  <span
    v-for="token in frameTokens(frame)"
    :key="token.type"
    class="token-badge"
    :style="{ color: tokenDef(token.type).color }"
    :title="tokenDef(token.type).desc"
  >
    {{ tokenDef(token.type).icon }}×{{ token.stacks }}
  </span>
</div>
```

```js
// No script do componente:
import { STANCES, TARGETING_POLICIES, TOKEN_DEFS } from '@/modules/combatRunner';

// methods:
frameTokens(frame) {
  return frame.tokens || [];
},
tokenDef(type) {
  return TOKEN_DEFS[type] || { icon: '?', color: '#fff', desc: '' };
},
```

### 5.3 Log entries com cor distinta

O combat log já tem sistema de cores (jogador = verde, inimigo = vermelho, crit = amarelo).

**Adicionar tipo `'debuff'` e `'burn'`:**

```js
// No switch/map de cores do log:
'debuff': '#f55',  // vermelho para aplicação de debuff
'burn': '#f80',    // laranja para dano de BURN
```

### 5.4 CSS mínimo

```css
.token-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: 11px;
}
.token-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 9px;
  letter-spacing: 1px;
}
.token-badge {
  font-size: 12px;
  cursor: help; /* tooltip via title */
}
```

---

## PARTE 6: SERIALIZAÇÃO

### 6.1 Salvar tokens ativos

**Em `toJSON()`** do CombatRunner:
```js
toJSON() {
  return {
    // ... campos existentes (active, mission, enemies, turnNumber, stance, targeting) ...
    playerTokens: this.state.player.frame.tokens || [],
    enemies: this.enemies.map(e => ({
      ...e,
      tokens: e.tokens || [],
    })),
  };
}
```

**Em `fromJSON(data)`:**
```js
fromJSON(data) {
  // ... restaurar campos existentes ...
  if (data.playerTokens) {
    this.state.player.frame.tokens = data.playerTokens;
  }
  if (data.enemies) {
    this.enemies = data.enemies; // tokens já estão dentro de cada enemy
  }
}
```

> **NOTA:** Se `enemies` já é serializado como array de objetos completos, os tokens vêm junto automaticamente. Verificar que a serialização existente não faz cherry-pick de fields (excluindo `tokens`).

---

## PARTE 7: VERIFICAÇÃO

### 7.1 Testes de infraestrutura

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 1 | `applyToken(frame, 'BREACH', 1)` em frame sem tokens | `frame.tokens = [{ type: 'BREACH', stacks: 1 }]` |
| 2 | `applyToken(frame, 'BREACH', 1)` quando já tem BREACH ×2 | Stacks sobe para 3 |
| 3 | `applyToken(frame, 'BREACH', 10)` | Stacks capped em maxStacks (5) |
| 4 | Aplicar 7 tipos diferentes de token | 7º tipo rejeitado (max 6 tipos) |
| 5 | `removeToken(frame, 'BREACH', 1)` quando tem 2 stacks | Stacks cai para 1 |
| 6 | `removeToken(frame, 'BREACH', 5)` quando tem 2 stacks | Token removido completamente do array |
| 7 | `getTokenStacks(frame, 'BURN')` quando não tem BURN | Retorna 0 |
| 8 | `endCombat()` limpa tokens do player frame | `frame.tokens = []` |

### 7.2 Testes de BREACH

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 9 | Jogador faz critical hit (d100 ≤ 5) | Inimigo recebe 1 BREACH; log mostra 🔓 |
| 10 | Inimigo com BREACH ×2 recebe ataque de dano base 5 | Dano final = 7 (5+2) |
| 11 | Rogue Labor (tokenOnHit BREACH 20%) acerta jogador | ~20% dos hits aplicam BREACH no player |
| 12 | BREACH persiste entre turnos | Stacks não decaem na maintenance phase |
| 13 | Combate termina | Todos os BREACH são limpos |

### 7.3 Testes de BURN

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 14 | Frame com BURN ×3 na maintenance phase | 3 rolls de d6; cada 4+ = 1 dano; cada ≤3 = remove 1 stack |
| 15 | BURN ×2, ambos rolam ≤3 | Ambos stacks removidos; log: "chamas extinguiram" |
| 16 | BURN ×2, ambos rolam 4+ | 2 dano em peça aleatória; stacks mantidos |
| 17 | BURN ×1, rola 4+ | 1 dano aplicado; stack mantido (não remove em 4+) |
| 18 | Dano de BURN mata peça (HP → 0) | Peça marcada destroyed; integridade reduzida |
| 19 | Furnace Bot acerta jogador | ~35% chance de aplicar BURN |

### 7.4 Testes de interação BREACH + BURN

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 20 | Frame com BREACH ×2 e BURN ×1 | BURN rola 4+ → dano base 1 + BREACH 2 = 3 dano total |
| 21 | Furnace Bot (aplica ambos) em combate longo | Player acumula BREACH e BURN; dano escala perigosamente |

### 7.5 Testes de UI e serialização

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 22 | Frame com tokens ativos | Barra mostra "TOKENS: 🔓×2 🔥×1" abaixo das barras de HP |
| 23 | Frame sem tokens | Barra de tokens não aparece (v-if) |
| 24 | Hover/tooltip em token badge | Mostra descrição do token |
| 25 | Log de BURN aparece em laranja | Cor #f80 para entries de tipo 'burn' |
| 26 | Salvar mid-combat com tokens ativos, recarregar | Tokens restaurados corretamente em player e enemies |
| 27 | Combat log mostra a "história" de tokens | Sequência: aplicação → acúmulo → dano por turno → remoção |

---

## ARQUIVOS TOCADOS (resumo)

| Arquivo | Ação | Mudanças |
|---------|------|----------|
| `src/modules/combatRunner.js` | MODIFY | TOKEN_DEFS, applyToken(), removeToken(), getTokenStacks(), clearTokens(), processTokenEffects(), integrar BREACH em dano, integrar na maintenance phase, serialização |
| `data/mecha/enemies.json` | MODIFY | Adicionar `tokenOnHit` ao Rogue Labor e opcionalmente novo inimigo Furnace Bot |
| `data/mecha/missions.json` | MODIFY (opcional) | Adicionar mission_furnace se Furnace Bot for criado |
| `CombatPanel.vue` | MODIFY | Token bar display, cores de log para debuff/burn |
| CSS do terminal | MODIFY | .token-bar, .token-badge |

---

## O QUE NÃO FAZER NESTE PACOTE

- ❌ NÃO implementar ERROR, SLOW, TARGET_LOCK, SUPPRESS — pacote futuro
- ❌ NÃO criar sistema de armas (Fight/Short/Long) — Sprint 2C
- ❌ NÃO fazer tokens decairem entre combates — eles já são limpos no endCombat
- ❌ NÃO adicionar ação de "Reparo" ou "Vent" para remover tokens manualmente — Sprint 2C
- ❌ NÃO mudar o fluxo de Stances ou Targeting — já funcional do Pacote 1
- ❌ NÃO adicionar tokenOnHit ao Scrap Drone — manter como inimigo baseline sem tokens

---

## NOTA DE DESIGN: POR QUE SÓ BREACH + BURN

Os 4 tokens restantes (ERROR, SLOW, TARGET_LOCK, SUPPRESS) dependem de sistemas que ainda não existem:

| Token | Dependência |
|-------|------------|
| ERROR | Stress system já existe, mas a mecânica de "perder ação" precisa de refactor no turn resolution |
| SLOW | Não existe sistema de velocidade/movimento além de iniciativa |
| TARGET_LOCK | Pool de d6 bônus precisa ser extensível (atualmente fixo) |
| SUPPRESS | Requer conceito de "dano do atacante" como variável modificável — funciona melhor com sistema de armas |

BREACH e BURN são independentes: BREACH modifica dano recebido (já calculado), BURN é self-contained (rola d6, aplica dano). Ambos funcionam perfeitamente com o motor atual.
