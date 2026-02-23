# MECHA SCRAPYARD — Implementation Spec: Stances + Targeting
## Sprint 2B — Pacote 1 de 3

**Objetivo:** Tornar `stance` e `targeting` funcionais no CombatRunner existente.  
**Pré-requisito:** CombatRunner já resolve turnos com d100 + d6 pool, heat, stress, glory e maneuvers funcionais.  
**Escopo:** Apenas lógica + UI. NÃO implementar debuff tokens, escudos, ou armas neste pacote.  
**Referência:** `combat_design_document.md` §3.2, §4.3, §5.1 / `combat_implementation_plan.md` Phase 1-2

---

## PARTE 1: STANCES FUNCIONAIS

### 1.1 Constante STANCES

**Arquivo:** `src/modules/combatRunner.js` (ou o arquivo onde CombatRunner está definido)

Adicionar no topo do arquivo, fora da classe:

```js
const STANCES = {
  offensive: {
    id: 'offensive',
    name: 'Ofensiva',
    desc: 'Foco em dano máximo. Defesa comprometida.',
    icon: '⚔',
    atkMod: 0.15,
    defMod: -0.10,
    heatDissipMod: 0,
  },
  balanced: {
    id: 'balanced',
    name: 'Balanceada',
    desc: 'Sem modificadores. Padrão.',
    icon: '⚖',
    atkMod: 0,
    defMod: 0,
    heatDissipMod: 0,
  },
  defensive: {
    id: 'defensive',
    name: 'Defensiva',
    desc: 'Prioriza sobrevivência. Dano reduzido.',
    icon: '🛡',
    atkMod: -0.10,
    defMod: 0.15,
    heatDissipMod: 0,
  },
  cautious: {
    id: 'cautious',
    name: 'Cautelosa',
    desc: 'Prolonga combate, menos risco, melhor dissipação de Heat.',
    icon: '❄',
    atkMod: -0.20,
    defMod: 0.10,
    heatDissipMod: 0.25,
  },
};
```

> **EXPORTAR** a constante para que a UI possa importá-la: `export { STANCES };`

### 1.2 Integrar Stance no cálculo de targetPercent

**Localizar** a função `calculateTargetPercent` (pode estar em `combat.js` como utility ou dentro do CombatRunner).

**Regra atual (§5.1):**
```
targetPercent = 50 + (ATK × 2) - (DEF_alvo × 1.5) + equipModifiers + skillBonus
```

**Modificação — quando o JOGADOR ataca:**
```js
// Dentro de resolvePlayerAttack ou equivalente:
const stance = STANCES[this.stance]; // this.stance já existe no constructor
const stanceAtkBonus = stance.atkMod * 100; // 0.15 → +15 pontos no targetPercent

const targetPercent = clamp(
  50 + (attackerATK * 2) - (defenderDEF * 1.5) + equipMod + skillBonus + stanceAtkBonus,
  5,  // mínimo 5% (sempre há chance de critical)
  95  // máximo 95% (sempre há chance de fumble)
);
```

**Modificação — quando o INIMIGO ataca o jogador:**
```js
// Dentro de resolveEnemyAttack ou equivalente:
const stance = STANCES[this.stance];
const stanceDefBonus = stance.defMod * 100; // 0.15 → +15 pontos na defesa do jogador

// O defMod REDUZ o targetPercent do inimigo (jogador mais difícil de acertar)
const targetPercent = clamp(
  50 + (enemyATK * 2) - (playerDEF * 1.5) + enemyEquipMod - (stanceDefBonus),
  5,
  95
);
```

> **ATENÇÃO:** `atkMod` afeta ataques DO jogador. `defMod` afeta ataques CONTRA o jogador. NÃO misturar.

### 1.3 Integrar Stance na dissipação de Heat

**Localizar** o trecho onde Heat é dissipado na fase de manutenção do turno (provavelmente em `resolveTurn()` ou `processHeat()`).

**Modificação:**
```js
// Onde quer que heat dissipation aconteça:
const stance = STANCES[this.stance];
const baseHeatDissip = /* valor atual de dissipação por turno */;
const finalHeatDissip = baseHeatDissip * (1 + stance.heatDissipMod);
// Para 'cautious': dissipação × 1.25 (25% mais eficiente)
```

### 1.4 Log de Stance no início do combate

**Localizar** `startMission()` ou equivalente.

**Adicionar após iniciar combate:**
```js
const stance = STANCES[this.stance];
this.logCombat(`▶ Stance: ${stance.name} (ATK ${stance.atkMod >= 0 ? '+' : ''}${Math.round(stance.atkMod * 100)}% / DEF ${stance.defMod >= 0 ? '+' : ''}${Math.round(stance.defMod * 100)}%)`);
```

### 1.5 Regra de travamento

**Stance SÓ pode ser alterada FORA de combate.** Verificar:
```js
setStance(stanceId) {
  if (this.active) return; // Bloqueado durante combate
  if (!STANCES[stanceId]) return; // Stance inválida
  this.stance = stanceId;
}
```

### 1.6 Serialização

**Em `toJSON()`:** incluir `stance: this.stance`  
**Em `fromJSON(data)`:** restaurar `this.stance = data.stance || 'balanced'`

---

## PARTE 2: TARGETING POR PEÇA

### 2.1 Constante TARGETING_POLICIES

**Arquivo:** mesmo de STANCES (`combatRunner.js`)

```js
const TARGETING_POLICIES = {
  auto: {
    id: 'auto',
    name: 'Automático',
    desc: 'Distribuição ponderada padrão.',
    icon: '◎',
    weights: { torso: 40, left_arm: 20, right_arm: 20, legs: 20 },
  },
  aggressive: {
    id: 'aggressive',
    name: 'Agressivo',
    desc: 'Prioriza Torso — kill rápido, mas arriscado.',
    icon: '☠',
    weights: { torso: 60, left_arm: 10, right_arm: 10, legs: 20 },
  },
  tactical: {
    id: 'tactical',
    name: 'Tático',
    desc: 'Prioriza Braços — desarmar o inimigo.',
    icon: '✂',
    weights: { torso: 10, left_arm: 35, right_arm: 35, legs: 20 },
  },
  defensive: {
    id: 'defensive',
    name: 'Defensivo',
    desc: 'Prioriza Pernas — impedir fuga e avanço.',
    icon: '⊘',
    weights: { torso: 15, left_arm: 15, right_arm: 15, legs: 55 },
  },
};
```

> **EXPORTAR:** `export { STANCES, TARGETING_POLICIES };`

### 2.2 Função selectTargetPart

**Localizar** `selectTargetPart` existente (em `combat.js` ou CombatRunner).

**Substituir/atualizar para:**
```js
selectTargetPart(targetFrame, policy = 'auto') {
  const weights = TARGETING_POLICIES[policy]?.weights || TARGETING_POLICIES.auto.weights;

  // Filtrar peças já destruídas — não atacar peça inutilizada
  const available = {};
  let totalWeight = 0;

  for (const [partId, weight] of Object.entries(weights)) {
    const part = targetFrame.parts[partId];
    if (part && part.status !== 'destroyed') {
      available[partId] = weight;
      totalWeight += weight;
    }
  }

  // Se todas as peças estão destruídas exceto torso, forçar torso
  if (totalWeight === 0) return 'torso';

  // Weighted random selection
  let roll = Math.random() * totalWeight;
  for (const [partId, weight] of Object.entries(available)) {
    roll -= weight;
    if (roll <= 0) return partId;
  }

  return 'torso'; // fallback
}
```

### 2.3 Integrar targeting no ataque do jogador

**Localizar** `resolvePlayerAttack()`.

**Onde o alvo da peça é selecionado**, substituir:
```js
// ANTES (provavelmente algo como):
// const targetPart = this.selectTargetPart(enemyFrame);

// DEPOIS:
const targetPart = this.selectTargetPart(enemyFrame, this.targeting);
```

> **IMPORTANTE:** Inimigos NÃO usam o targeting do jogador. Inimigos usam `'auto'` sempre (ou uma policy própria definida no enemy template, se existir).

### 2.4 Log contextual por targeting

**Após resolver qual peça foi atingida, adicionar flavor ao log:**
```js
// Opcional mas recomendado — dá feedback ao jogador sobre a policy funcionando
const policyName = TARGETING_POLICIES[this.targeting]?.name || 'Auto';
this.logCombat(`[${policyName}] Ataque direcionado → ${partDisplayName}`);
```

### 2.5 Regra de travamento (mesmo padrão de stance)

```js
setTargeting(policyId) {
  if (this.active) return;
  if (!TARGETING_POLICIES[policyId]) return;
  this.targeting = policyId;
}
```

### 2.6 Serialização

**Em `toJSON()`:** incluir `targeting: this.targeting`  
**Em `fromJSON(data)`:** restaurar `this.targeting = data.targeting || 'auto'`

---

## PARTE 3: UI — CONFIGURAÇÃO PRÉ-COMBATE

### 3.1 Localização na UI

**Arquivo:** `CombatPanel.vue` (ou equivalente no TerminalUI)

A configuração de stance + targeting deve aparecer **na tela de seleção de missão**, ANTES do jogador clicar para iniciar combate. Não é um painel separado — faz parte do fluxo de launch.

### 3.2 Layout esperado (estética terminal)

```
╔══════════════════════════════════════╗
║  COMBAT CONFIGURATION                ║
╠══════════════════════════════════════╣
║                                      ║
║  STANCE                              ║
║  ┌──────┐┌──────┐┌──────┐┌──────┐   ║
║  │⚔ OFE ││⚖ BAL ││🛡 DEF ││❄ CAU │   ║
║  │ +15A ││      ││ +15D ││ +10D │   ║
║  │ -10D ││  --- ││ -10A ││ -20A │   ║
║  │      ││      ││      ││+25%H │   ║
║  └──────┘└──────┘└──────┘└──────┘   ║
║     [selected = highlighted border]  ║
║                                      ║
║  TARGETING                           ║
║  ┌──────┐┌──────┐┌──────┐┌──────┐   ║
║  │◎ AUTO││☠ AGRE││✂ TATI││⊘ DEFE│   ║
║  │40/20 ││60/10 ││10/35 ││15/15 │   ║
║  │20/20 ││10/20 ││35/20 ││15/55 │   ║
║  └──────┘└──────┘└──────┘└──────┘   ║
║                                      ║
║  [ ▶ LAUNCH MISSION ]               ║
╚══════════════════════════════════════╝
```

### 3.3 Implementação Vue

```html
<!-- Stance Selector -->
<div class="combat-config" v-if="!combatRunner.active">
  <div class="config-label">STANCE</div>
  <div class="config-options">
    <button
      v-for="s in stanceOptions"
      :key="s.id"
      :class="['config-btn', { active: combatRunner.stance === s.id }]"
      @click="setStance(s.id)"
    >
      <span class="config-icon">{{ s.icon }}</span>
      <span class="config-name">{{ s.name }}</span>
      <span class="config-stat" v-if="s.atkMod">ATK {{ formatMod(s.atkMod) }}</span>
      <span class="config-stat" v-if="s.defMod">DEF {{ formatMod(s.defMod) }}</span>
      <span class="config-stat" v-if="s.heatDissipMod">HEAT {{ formatMod(s.heatDissipMod) }}</span>
    </button>
  </div>

  <!-- Targeting Selector (mesmo pattern) -->
  <div class="config-label">TARGETING</div>
  <div class="config-options">
    <button
      v-for="t in targetingOptions"
      :key="t.id"
      :class="['config-btn', { active: combatRunner.targeting === t.id }]"
      @click="setTargeting(t.id)"
    >
      <span class="config-icon">{{ t.icon }}</span>
      <span class="config-name">{{ t.name }}</span>
      <span class="config-desc">{{ t.desc }}</span>
    </button>
  </div>
</div>
```

```js
// No script do componente:
import { STANCES, TARGETING_POLICIES } from '@/modules/combatRunner';

// computed ou data:
stanceOptions() { return Object.values(STANCES); },
targetingOptions() { return Object.values(TARGETING_POLICIES); },

// methods:
setStance(id) { this.combatRunner.setStance(id); },
setTargeting(id) { this.combatRunner.setTargeting(id); },
formatMod(val) { return (val >= 0 ? '+' : '') + Math.round(val * 100) + '%'; },
```

### 3.4 Indicador durante combate

Quando o combate está ativo, mostrar a stance e targeting atuais como **indicadores read-only** (não botões):

```
▶ OFENSIVA  ◎ AUTOMÁTICO     TURN 5/15
```

### 3.5 CSS (mínimo necessário, adaptar ao tema terminal existente)

```css
.combat-config { margin: 8px 0; }
.config-label { color: #0fa; font-size: 11px; letter-spacing: 2px; margin: 6px 0 4px; }
.config-options { display: flex; gap: 4px; flex-wrap: wrap; }
.config-btn {
  background: rgba(0, 255, 170, 0.05);
  border: 1px solid rgba(0, 255, 170, 0.2);
  color: #0fa;
  padding: 6px 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
  transition: border-color 0.2s, background 0.2s;
}
.config-btn:hover { border-color: rgba(0, 255, 170, 0.5); }
.config-btn.active {
  border-color: #0fa;
  background: rgba(0, 255, 170, 0.15);
  box-shadow: 0 0 6px rgba(0, 255, 170, 0.3);
}
.config-icon { font-size: 16px; margin-bottom: 2px; }
.config-name { font-weight: bold; font-size: 10px; letter-spacing: 1px; }
.config-stat { font-size: 9px; color: rgba(0, 255, 170, 0.6); }
.config-desc { font-size: 9px; color: rgba(0, 255, 170, 0.5); text-align: center; }
```

---

## PARTE 4: VERIFICAÇÃO

Após implementar, confirmar TODOS estes cenários:

### 4.1 Testes de Stance

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 1 | Selecionar stance Ofensiva e iniciar missão | Log mostra "▶ Stance: Ofensiva (ATK +15% / DEF -10%)" |
| 2 | Em stance Ofensiva, observar combat log | targetPercent do jogador deve ser ~15 pontos maior que em Balanceada |
| 3 | Em stance Defensiva, observar inimigo atacando | targetPercent do inimigo deve ser ~15 pontos menor que em Balanceada |
| 4 | Em stance Cautelosa, observar heat por turno | Heat deve dissipar 25% mais rápido entre turnos |
| 5 | Tentar mudar stance durante combate ativo | Botões de stance devem estar desabilitados / não aparecer |
| 6 | Salvar jogo com stance Ofensiva, recarregar | Stance deve ser restaurada como Ofensiva |
| 7 | Iniciar combate sem alterar stance | Default deve ser 'balanced' |

### 4.2 Testes de Targeting

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 8 | Targeting Agressivo, rodar 20+ turnos | Torso deve ser alvo em ~60% dos ataques (±10% variância) |
| 9 | Targeting Tático, rodar 20+ turnos | Braços devem ser alvo em ~70% dos ataques combinados |
| 10 | Targeting Defensivo, rodar 20+ turnos | Pernas devem ser alvo em ~55% dos ataques |
| 11 | Targeting Auto, rodar 20+ turnos | Torso ~40%, cada braço ~20%, pernas ~20% |
| 12 | Alvo com braço esquerdo destruído | Targeting Tático deve redirecionar peso para braço direito |
| 13 | Todas peças destruídas exceto torso | Qualquer policy deve forçar torso como alvo |
| 14 | Combat log mostra peça alvo | Log deve indicar qual peça foi atingida: "→ RIGHT ARM" |
| 15 | Tentar mudar targeting durante combate | Deve estar travado |
| 16 | Salvar/carregar com targeting Tático | Deve restaurar corretamente |

### 4.3 Teste de integração

| # | Cenário | Resultado Esperado |
|---|---------|-------------------|
| 17 | Stance Ofensiva + Targeting Agressivo | Dano alto concentrado no torso — combates devem ser rápidos e fatais |
| 18 | Stance Cautelosa + Targeting Tático | Combates longos com foco em desarmar — enemy damage output deve cair quando braços são destruídos |
| 19 | UI mostra config ativa durante combate | Indicadores read-only visíveis: "▶ OFENSIVA ◎ AGRESSIVO" |
| 20 | Narrativa no combat log | Log deve contar uma "história" diferente dependendo da combinação stance+targeting |

---

## ARQUIVOS TOCADOS (resumo)

| Arquivo | Ação | Mudanças |
|---------|------|----------|
| `src/modules/combatRunner.js` | MODIFY | Adicionar STANCES, TARGETING_POLICIES, setStance(), setTargeting(), integrar em calculateTargetPercent, selectTargetPart, processHeat, toJSON/fromJSON |
| `src/modules/combat.js` | MODIFY (se selectTargetPart estiver aqui) | Atualizar selectTargetPart para aceitar policy + weights, filtrar peças destruídas |
| `CombatPanel.vue` (ou equivalente) | MODIFY | Adicionar seção de config pré-combate, indicadores durante combate |
| CSS do terminal | MODIFY | Adicionar estilos .combat-config, .config-btn, etc. |

---

## O QUE NÃO FAZER NESTE PACOTE

- ❌ NÃO implementar debuff tokens (BREACH, BURN, etc.) — pacote separado
- ❌ NÃO implementar escudos — depende de sistema de armas (Sprint 2C)
- ❌ NÃO alterar o sistema de armas ou criar categorias Fight/Short/Long
- ❌ NÃO criar novas missões — usar as existentes para testar
- ❌ NÃO refatorar o CombatRunner — apenas estender o que existe
- ❌ NÃO tocar em heat/stress EXCETO o heatDissipMod da stance Cautelosa
