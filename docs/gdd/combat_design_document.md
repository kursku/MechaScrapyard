# MECHA SCRAPYARD — Combat Design Document v1.1

## Sistema de Combate Idle Tático

**Projeto:** Mecha Scrapyard (Idle/Incremental RPG)
**Engine:** Lost Dice → Vue 3 + Vite
**Referências:** Front Mission RPG (Lost Dice), Mechanized Body (Playtest 2025), GDD Original
**Data:** Fevereiro 2026
**Revisão:** v1.2 — Inline cross-references (→) to companion GDD documents in all major sections

---

## DOCUMENTOS COMPLEMENTARES

Este documento define a mecânica de combate. Os sistemas de economia, progressão, peças e base do jogador estão detalhados em documentos dedicados. Referências cruzadas são indicadas por `→ [ARQUIVO]` ao longo do texto. Para o índice completo com ordem de leitura, ver **Apêndice C**.

| Documento | Escopo |
|-----------|--------|
| **gdd_3_4_parts_frame_assembly.md** | Categorias de Frame (Light/Medium/Heavy), peças modulares, compatibilidade, equipment slots, stats derivados |
| **gdd_8_economy.md** | Modelo de 4 tiers de moeda, Glory dual, cadeia de recursos, manutenção, prestige |
| **gdd_6_scrapyard_progression.md** | 5 fases do Scrapyard, estruturas, gates de desbloqueio, impacto de moralidade |
| **resource_catalog_unlock_logic.md** | 22 recursos com JSON specs, lógica de `require`, Supply auto-reload, reputação multi-facção |
| **combat_implementation_plan.md** | Plano em 5 fases, CombatRunner, data contracts |
| **IMPL_SPEC_stances_targeting.md** | Stances + Targeting no CombatRunner |
| **IMPL_SPEC_weapon_system.md** | Armas, slots de equip, supply em combate |
| **IMPL_SPEC_debuff_tokens_breach_burn.md** | BREACH + BURN token logic |
| **parts_implementation_flow.mermaid** | Diagrama de fluxo do ciclo de peças |

---

## ÍNDICE

1. Filosofia de Combate
2. Arquitetura Dual: Piloto × Frame
3. Sistema Estrutural (Integridade por Peça)
4. Motor de Combate Idle
5. Sistema de Rolagem Híbrido (d100 + Pool)
6. Armamento & Equipamento
7. Heat & Stress (Recursos Reversos)
8. Debuffs & Status Tokens
9. Habilidades Condicionais (Maneuver System)
10. Posições & Progressão de Combate
11. Tipos de Missão
12. Espólios & Economia de Glória
13. Esquadrão & Atributos Coletivos
14. Balanceamento Idle
15. Roadmap de Implementação
Apêndice A: Glossário de Termos
Apêndice B: Referências Cruzadas (Tabletop → Digital)
Apêndice C: Companion Document Index

---

## 1. FILOSOFIA DE COMBATE

O combate do Mecha Scrapyard opera sob três princípios fundamentais:

**Automação com Agência** — O combate é idle (automático), mas o jogador toma decisões estratégicas *antes* e *entre* combates: escolha de equipamento, prioridade de alvos, gestão de Stress/Heat, alocação de reparos. Inspirado na distinção do Mechanized Body entre preparação (deckbuilding) e execução (card play).

**Dano Localizado com Consequências** — Não existe "HP genérico". Cada parte do Frame tem integridade própria e falha de formas distintas. Perder um braço não é o mesmo que perder uma perna. Adaptado diretamente do sistema de Integridade do Front Mission RPG.

**Fail Forward** — Nenhuma ação é completamente desperdiçada. Mesmo falhas geram fragmentos de XP, dados de reconhecimento, ou progresso parcial. O jogador nunca sente que "perdeu tempo" — princípio central de qualquer idle game.

---

## 1.1 NOMENCLATURA: O QUE CHAMAMOS OS ROBÔS

Em New Tokyo, ninguém concorda em como chamar essas máquinas. O termo muda dependendo de quem fala, onde fala, e com que intenção. Isso é intencional — constrói o mundo através da linguagem.

| Termo | Contexto | Quem Usa | Tom | Exemplo |
|-------|----------|----------|-----|---------|
| **Frame** | Técnico/engenharia | Mecânicos, corporações, documentação, militares veteranos | Neutro, profissional | *"That's a Gen-2 Frame, kid. They don't make 'em like this anymore."* |
| **Labor** | Civil/industrial | Trabalhadores, docas, construção, logística | Utilitário, mundano | *"The port runs on Labors. Without them, New Tokyo starves."* |
| **Mecha** | Genérico/cotidiano | Todo mundo, noticiários, conversa casual | Coloquial, universal | *"There was a mecha fight downtown last night."* |
| **Rig** | Gíria de rua | Pilotos de arena, sucateiros, o protagonista | Orgulhoso, pessoal | *"Built this Rig from nothing. She's ugly, but she hits."* |
| **Unit** | Militar/policial | Polícia, exército, relatórios oficiais | Frio, impessoal | *"All Units, converge on sector 7."* |

**No código:** O termo interno é **Frame** (variáveis, JSON keys, data structures). `frame_integrity`, `frame_parts`, `FrameConfig`.

> **📎 See `gdd_3_4_parts_frame_assembly.md` §3.4.10** for the complete nomenclature reference table, replicated for consistency across documents.

**Na narrativa:** O texto varia por contexto:

- **System Log:** usa Frame ("Frame integrity at 60%")
- **Avô/Mecânicos:** usa Frame ("This Frame belonged to your father")
- **Diálogos de rua/Arena:** usa Rig ("Nice Rig. Shame I gotta wreck it.")
- **Notícias/Eventos:** usa Mecha ("Mecha sighting reported in Sector 4")
- **Polícia/Militar:** usa Unit ("Rogue Unit detected. Engage.")
- **Distrito Industrial:** usa Labor ("Labor malfunction at Dock 7")

---

## 2. ARQUITETURA DUAL: PILOTO × FRAME

### 2.1 Camada do Piloto

Seis atributos primários que existem independente do Frame. Fora do Frame, usam-se apenas estes (equivalente à Coragem do Front Mission RPG, que substitui todos os atributos quando o piloto está fora da máquina).

| Atributo | Abrev. | Função em Combate | Função Idle |
|----------|--------|-------------------|-------------|
| **Neuro** | NEU | Hacking, Systems, precisão de armas tech | Velocidade de pesquisa |
| **Muscle** | MUS | Melee damage, carga de equipamento | Eficiência de coleta pesada |
| **Reflex** | REF | Esquiva, iniciativa, velocidade de ataque | Tempo de reação em eventos |
| **Grit** | GRT | Absorção de Stress, resistência a debuffs | Duração de tarefas longas |
| **Charisma** | CHA | Moral de esquadrão, opções de diálogo | Preços em comércio, reputação |
| **Focus** | FOC | Precisão de armas de longo alcance, concentração | Multiplicador global de eficiência idle |

**Derivação (Front Mission RPG → Mecha Scrapyard):**

O Front Mission RPG usa 3 Qualidades (Técnica, Saúde, Atitude) com valor +0 ou +2, que refinam os 4 Atributos do Wanzer. Nossa adaptação expande para 6 atributos com escala contínua (1-20), onde cada atributo contribui para stats derivados do Frame:

```
Armamento (ATK)  = base_arma + (MUS × 0.3) + (REF × 0.2)
Blindagem (DEF)  = base_blindagem + (GRT × 0.4) + (MUS × 0.1)
Energia  (ENR)   = base_energia + (FOC × 0.3) + (NEU × 0.2)
Coragem  (COR)   = base_moral + (GRT × 0.2) + (CHA × 0.3)
```

> **📎 See `gdd_3_4_parts_frame_assembly.md` §3.4.7** for category-specific `base_*` values that feed these formulas. Key insight — the "Progression Inversion": a novice pilot in a Heavy Frame functions adequately (high base stats carry them), while the same novice in a Light Frame struggles. But a veteran pilot in a Light Frame outperforms Heavy because pilot attributes dominate base values and Light's efficiency bonuses compound. Light bookends the player's journey — from weakness to mastery.

### 2.2 Camada do Frame

Quatro atributos derivados que só existem quando o piloto está embarcado:

| Atributo Frame | Sigla | Origem (FMRPG) | Função |
|----------------|-------|-----------------|--------|
| **Armamento** | ATK | Armamento | Pool de ataque (dado base para ofensiva) |
| **Blindagem** | DEF | Blindagem | Pool de defesa (redução de dano recebido) |
| **Energia** | ENR | Energia | Recurso consumível (ações especiais, shields, boost) |
| **Coragem** | COR | Coragem | Resistência a Pânico, moral, dados bônus em crise |

**Coragem como Mecânica de Crise:** Quando o Frame está com Torso em estado crítico (≤25% integridade), Coragem adiciona dados bônus ao pool ofensivo e defensivo. Adaptado do FMRPG onde Coragem adiciona extra dice quando o Wanzer está em perigo. Isso cria momentos de "last stand" dramáticos no log de combate.

### 2.3 Fora do Frame

Se o Frame for destruído (Torso a 0), o piloto precisa ejetar. Fora do Frame, TODOS os atributos são substituídos por Coragem (exatamente como no FMRPG, onde Coragem substitui todos os atributos Wanzer). O piloto pode:

- Fugir (Reflex + Coragem para escapar)
- Pedir resgate (Charisma + Coragem para socorro do esquadrão)
- Lutar a pé (Muscle + Coragem, desvantagem massiva contra mechas)

No contexto idle, isso se traduz em: **missão falha, mas o piloto sobrevive** (com penalidade de Stress) vs **missão falha e o piloto é ferido** (Injury, custo de recuperação).

---

## 3. SISTEMA ESTRUTURAL (INTEGRIDADE POR PEÇA)

> **→ Detalhamento completo em `gdd_3_4_parts_frame_assembly.md`**
> As categorias de Frame (Light/Medium/Heavy) definem níveis de integridade diferentes por peça. Light tem 5 níveis totais (frágil, barato), Medium tem 9 (baseline), Heavy tem 11 (tanque, caro de manter). A §3.4.1 do documento de peças detalha HP por nível, custos de reparo por categoria, e a interação com o sistema econômico de manutenção.

### 3.1 As 4 Peças Estruturais

Adaptado diretamente do Front Mission RPG, cada Frame tem 4 zonas de dano com integridade independente:

| Peça | Integridade Base | Inutilização (FMRPG) | Adaptação Idle |
|------|-----------------|----------------------|----------------|
| **Braço Esquerdo** | 2 níveis | Arma/escudo destruído, slot inutilizado | Perde arma equipada no slot esquerdo; ATK -30% |
| **Braço Direito** | 2 níveis | Arma/escudo destruído, slot inutilizado | Perde arma equipada no slot direito; ATK -30% |
| **Pernas** | 2 níveis | Mobilidade cortada pela metade | Velocidade de combate -50%, não pode fugir |
| **Torso** | 3 níveis | Explosão catastrófica, piloto ejeta | Mecha destruído; teste de ejeção (REF + COR) |

**Escala de Integridade:** Cada nível de integridade funciona como uma "barra de vida" para aquela peça. Com upgrades e peças melhores, é possível ter mais níveis (até 5 por peça para builds tanque). Cada nível tem um HP pool próprio.

```
Exemplo: Braço Direito com Integridade 3
├── Nível 3: [████████] 40/40 HP — Operacional
├── Nível 2: [████████] 40/40 HP — Avariado (funcional, mas -10% eficiência)
└── Nível 1: [████████] 40/40 HP — Crítico (funcional, mas -25% eficiência)
    └── 0: INUTILIZADO — consequência aplicada
```

### 3.2 Sistema de Avarias (Damage)

Baseado no FMRPG, cada tipo de ataque causa níveis diferentes de avaria:

| Tipo de Ataque | Avaria Base | Exemplo de Arma |
|----------------|-------------|-----------------|
| Corpo-a-corpo (Fight) | ½ nível | Mech Fist, Heat Blade |
| Armas de Fogo (Short) | 1 nível | Machine Gun, Shotgun |
| Artilharia (Long) | 1 nível | Missile Pod, Rail Cannon |
| Hacking/EMP (Systems) | 0 (causa debuff) | EMP Grenade, Virus Inject |

**Dano Bônus:** Se a diferença entre o resultado de ataque e defesa exceder o valor do dado de atributo do defensor, +1 nível de avaria extra. No idle, isso se traduz em: se ATK roll - DEF roll > DEF_threshold, dano bônus.

**Ataques Direcionados:** O jogador pode configurar a prioridade de targeting:

- **Agressivo:** Prioriza Torso (kill rápido, mas arriscado)
- **Tático:** Prioriza Braços (desarmar o inimigo)
- **Defensivo:** Prioriza Pernas (impedir fuga/avanço)
- **Automático:** Distribuição aleatória ponderada (40% Torso, 20% cada Braço, 20% Pernas)

### 3.3 Escudos (Shields)

Adaptados do FMRPG, escudos são equipamentos consumíveis que protegem contra categorias específicas:

| Tipo de Escudo | Protege contra | Consumo | Slot |
|----------------|---------------|---------|------|
| Riot Shield | Fight (corpo-a-corpo) | 1 Blindagem/uso | Mão (esquerda ou direita) |
| Reactive Armor | Short (armas de fogo) | 1 Blindagem/uso | Ombro |
| Flare System | Long (artilharia/mísseis) | 2 Energia/uso | Ombro |
| Firewall | Systems (hacking/EMP) | 1 Energia/uso | Core (interno) |

Escudo ativa automaticamente quando o tipo de ataque correspondente é recebido. Consome suprimento de Blindagem ou Energia. Quando supply = 0, escudo quebra (desativado até reparo). Exatamente como no FMRPG.

---

## 4. MOTOR DE COMBATE IDLE

### 4.1 Estrutura de Turno

O combate usa o tick system do Arcanum (200ms) mas com resolução por turnos lógicos:

```
TURNO DE COMBATE (1 turno = ~2-4 segundos reais)
│
├── FASE DE INICIATIVA
│   └── Ordenar por: REF + equipamento_speed + random_factor
│
├── FASE DE AÇÃO (para cada unidade, em ordem)
│   ├── Verificar Condições (Pânico? Atordoado? Desarmado?)
│   ├── Selecionar Ação (baseado em AI/prioridades do jogador)
│   │   ├── Atacar (arma equipada vs alvo priorizado)
│   │   ├── Defender (boost defensivo até próximo turno)
│   │   ├── Especial (habilidade condicional, se disponível)
│   │   ├── Reparar (gastar Energia para restaurar integridade)
│   │   └── Mover (mudar de zona, se aplicável)
│   ├── Resolver Ação (rolagem d100)
│   └── Aplicar Resultados (dano, debuffs, status)
│
├── FASE DE MANUTENÇÃO
│   ├── Processar Debuffs (Burn, Error, etc.)
│   ├── Atualizar Heat (+acúmulo, -dissipação)
│   ├── Verificar Stress do piloto
│   └── Checar condições de vitória/derrota
│
└── GERAR LOG (texto para o terminal)
```

### 4.2 Condições de Estado

Adaptadas do FMRPG, as condições substituem a ação normal da unidade:

| Condição | Trigger | Efeito (FMRPG) | Adaptação Idle |
|----------|---------|-----------------|----------------|
| **Pânico** | Stress > 80% ou Coragem baixa | Só pode fugir | Unidade tenta recuar; -50% ATK se forçada a lutar |
| **Atordoado** | Dano massivo em um turno | Alvo aleatório, ação sem controle | Próxima ação com -40% precisão, alvo random |
| **Desarmado** | Ambos os braços inutilizados | Só pode avançar e atacar corpo-a-corpo | Apenas Brawl (d4 de dano), forçado melee |
| **Shutdown** | Heat a 100% ou Torso crítico | Ejetado do Frame | Frame inoperável; piloto a pé |
| **Overheated** | Heat > 75% | (novo) | Todas as ações custam +50% Energia |

### 4.3 Ação Tática (Turno de Preparação)

Do FMRPG: o jogador pode sacrificar a ação complexa de um turno para ganhar +2 de modificador situacional no turno seguinte. No idle, isso se traduz em configurações de combate:

**Stances (configuráveis antes do combate):**

- **Ofensiva:** +15% ATK, -10% DEF — ações focam em dano máximo
- **Balanceada:** sem modificadores — padrão
- **Defensiva:** -10% ATK, +15% DEF — prioriza escudos e esquiva
- **Cautelosa:** -20% ATK, +10% DEF, +Heat dissipação — prolonga combate, menos risco

---

## 5. SISTEMA DE ROLAGEM HÍBRIDO (d100 + POOL)

### 5.1 Rolagem Principal: d100

O sistema base é d100 (roll ≤ target = sucesso), como definido no GDD:

```javascript
function rollD100(targetPercent) {
  const roll = Math.floor(Math.random() * 100) + 1;
  return {
    roll,
    success: roll <= targetPercent,
    critical: roll <= 5,          // Sucesso Crítico: 1-5
    fumble: roll >= 96,           // Falha Crítica: 96-100
    margin: targetPercent - roll   // Positivo = sucesso, negativo = falha
  };
}
```

**Cálculo de Target Percent:**

```
targetPercent = baseAccuracy + (ATK × 2) - (DEF_alvo × 1.5) + equipModifiers + skillBonus
```

Onde:

- `baseAccuracy` = 50 (baseline) — qualquer piloto mediano acerta metade das vezes
- `ATK × 2` = atributo ofensivo contribui fortemente
- `DEF_alvo × 1.5` = defesa do alvo reduz chance de acerto
- `equipModifiers` = bônus/penalidade de armas, miras, condições
- `skillBonus` = nível na skill relevante (mecha_combat tree)

### 5.2 Pool Bônus: d6 (do Mechanized Body)

Em certas situações, o jogador ganha dados bônus d6 do sistema Mechanized Body, que adicionam efeitos extras ao ataque:

| Resultado d6 | Efeito (MB) | Adaptação |
|-------------|-------------|-----------|
| **6** | Direct Hit | +1 nível de avaria extra, +1 Stress no alvo |
| **3-5** | Glancing Hit | Efeito parcial (½ dano bônus ou debuff reduzido) |
| **1-2** | Miss | Sem efeito bônus |

**Quando se ganha dados bônus d6:**

- Habilidade ativada (+1d6 a +3d6 dependendo do nível)
- Coragem em crise (Torso crítico: +COR/4 d6 arredondando para baixo)
- Perk do piloto (gastar uso de Perk = +2d6 no próximo ataque)
- Vantagem posicional (flanqueamento, altura, etc.)

### 5.3 Batch Rolling (Otimização Idle)

Para performance no tick system, combates processam múltiplas rolagens por tick:

```javascript
function batchCombatRound(attacker, defender, numAttacks) {
  const results = [];
  for (let i = 0; i < numAttacks; i++) {
    const target = calculateTargetPercent(attacker, defender);
    const mainRoll = rollD100(target);
    const bonusDice = rollBonusPool(attacker.bonusD6);
    results.push(resolveAttack(mainRoll, bonusDice, attacker, defender));
  }
  return consolidateResults(results); // Agrupa para exibição no log
}
```

### 5.4 Escala de Suprimentos (Supply Dice)

Do FMRPG, armas e ações consomem supply que escala com o poder do dado:

| Dado | Supply por Uso | Custo de Reposição |
|------|---------------|-------------------|
| d4 | 1 supply → 3 usos | Barato |
| d6 | 1 supply → 2 usos | Moderado |
| d8 | 1 supply → 1 uso | Caro |
| d10 | 2 supply → 1 uso | Muito caro |
| d12 | 3 supply → 1 uso | Extremo |

No idle, isso se manifesta como **munição/energia** por missão. Armas mais fortes gastam mais recursos por combate, criando uma tensão entre poder e sustentabilidade — perfeito para a economia incremental.

---

## 6. ARMAMENTO & EQUIPAMENTO

> **→ Equipment slots expandidos em `gdd_3_4_parts_frame_assembly.md` §3.4.4**
> O documento de peças expande os 4 slots originais para 5 (adicionando `backpack`), define tier limits por categoria de Frame (Medium: shoulder ≤ tier 3, Heavy: all tiers), e detalha backpack utilities (Extra Coolant, Ammo Crate, Sensor Array, Stress Dampener). A linked part rule (braço destruído → arma offline) é formalizada lá.
>
> **→ Implementação em `IMPL_SPEC_weapon_system.md`**
> Contém o `weapons.json` completo com data contracts, equip system, e regras de slot.

### 6.1 Categorias de Armas

Três categorias por proficiência, exatamente como no FMRPG:

| Categoria | Alcance | Atributo Base | Exemplo de Armas |
|-----------|---------|--------------|------------------|
| **Fight** (Melee) | Adjacente | MUS + ATK | Mech Fist, Heat Blade, Chain Sword, Pile Bunker |
| **Short** (Armas de Fogo) | Curto-Médio | REF + ATK | Machine Gun, Shotgun, Flamethrower, SMG |
| **Long** (Artilharia) | Longo | FOC + ATK | Missile Pod, Rail Cannon, Mortar, Sniper Rifle |

### 6.2 Escala de Armas (Dice Scaling)

Armas escalam em poder por dado (d4 → d12), e podem ser decompostas:

```
d12 = 2 × d6    (uma arma d12 pode ser trocada por duas d6)
d10 = d6 + d4   (decomposição flexível)
d8  = 2 × d4    (downgrade para duas armas fracas)
```

Isso cria uma decisão interessante: **uma arma forte ou duas fracas?**

### 6.3 Slots de Equipamento

4 slots por mecha (adaptado do FMRPG):

| Slot | Tipo | Notas |
|------|------|-------|
| Mão Esquerda | Arma ou Escudo | Ligado ao Braço Esquerdo |
| Mão Direita | Arma ou Escudo | Ligado ao Braço Direito |
| Ombro Esquerdo | Arma pesada, Escudo ou Utility | Independente dos braços |
| Ombro Direito | Arma pesada, Escudo ou Utility | Independente dos braços |

**Vínculo com Integridade:** Se o Braço Esquerdo é inutilizado, o item da Mão Esquerda é perdido/inutilizado. Itens de ombro são independentes (só perdem se o Torso for destruído).

### 6.4 Exemplos de Armas (JSON)

```json
{
  "id": "machine_gun_d6",
  "name": "MG-206 'Rattler'",
  "category": "short",
  "dice": "d6",
  "slot": "hand",
  "avaria": 1,
  "supply_cost": 1,
  "supply_uses": 2,
  "accuracy_mod": 5,
  "special": null,
  "flavor": "Reliable, loud, and always hungry for ammo."
},
{
  "id": "heat_blade_d8",
  "name": "ThermoEdge Mk.III",
  "category": "fight",
  "dice": "d8",
  "slot": "hand",
  "avaria": 0.5,
  "supply_cost": 1,
  "supply_uses": 1,
  "accuracy_mod": -5,
  "special": "burn_1",
  "heat_gen": 10,
  "flavor": "Burns through armor like butter. Burns through your coolant too."
},
{
  "id": "missile_pod_d10",
  "name": "Valkyr Salvo System",
  "category": "long",
  "dice": "d10",
  "slot": "shoulder",
  "avaria": 1,
  "supply_cost": 2,
  "supply_uses": 1,
  "accuracy_mod": 0,
  "special": "aoe_splash",
  "heat_gen": 15,
  "flavor": "One pod, six problems solved simultaneously."
}
```

---

## 7. HEAT & STRESS (RECURSOS REVERSOS)

> **→ Perfis térmicos e de Stress por categoria em `gdd_3_4_parts_frame_assembly.md` §3.4.1**
> Cada categoria de Frame tem perfil distinto: Light (heat gen 0.8×, dissip +40%, stress/crit +2.0), Medium (baseline), Heavy (heat gen 1.2×, dissip -20%, stress/turn +0.7). A §3.4.5 detalha os combos emergentes Stance × Category (ex: Light+Cautious = "Phantom", Heavy+Offensive = "Berserker").
>
> **→ Supply como recurso global em `resource_catalog_unlock_logic.md`**
> Supply é recurso global com auto-reload pago (2 scrap/ponto). Frame category afeta supply efficiency: Light 1.2×, Heavy 0.8×. Detalhes completos no catálogo.

### 7.1 Heat (Recurso do Frame)

Heat é um recurso reverso: começa em 0, acumula com ações, e penaliza em excesso.

```
Heat Atual: 0 ──────────────────── 100
             [FRIO]  [NORMAL]  [QUENTE]  [CRÍTICO]  [SHUTDOWN]
              0-25     26-50     51-75      76-99       100
```

| Faixa | Efeito |
|-------|--------|
| 0-25 (Frio) | Nenhum |
| 26-50 (Normal) | Nenhum |
| 51-75 (Quente) | Ações especiais custam +25% Energia |
| 76-99 (Crítico) | +50% custo, -15% precisão, risco de Error a cada turno |
| 100 (Shutdown) | Mecha desliga. Piloto ejeta. |

**Geração de Heat:** Cada ação gera heat baseado na arma/ação usada. Armas Energy (lasers, heat blades) geram mais. Melee gera menos.

**Dissipação:** Automática a cada turno (baseado em Energia do Frame). Radiadores (equipamento) aumentam dissipação. Ação "Vent Heat" gasta 1 turno para dissipar 30% do heat atual.

### 7.2 Stress (Recurso do Piloto)

Adaptado diretamente do Mechanized Body, Stress é o "HP" do piloto:

```
Stress Atual: 0 ──────────────────── StressCap (baseado em GRT)
               [CALMO]  [TENSO]  [ABALADO]  [PÂNICO]  [COLAPSO]
                0-25%    26-50%    51-75%     76-99%     100%
```

| Faixa | Efeito |
|-------|--------|
| 0-25% (Calmo) | Nenhum |
| 26-50% (Tenso) | Nenhum (alerta no UI) |
| 51-75% (Abalado) | -10% precisão, -5% velocidade |
| 76-99% (Pânico) | Condição PÂNICO ativada; pode fugir involuntariamente |
| 100% (Colapso) | Piloto desmaia. Mecha em shutdown. |

**Fontes de Stress:**

- Receber dano quando Heavily Damaged (Mechanized Body: 1 Stress por hit após perder primeira barra)
- Direct Hit (resultado 6 no d6 bônus): +1 Stress
- Aliado destruído: +3 Stress
- Cada turno em combate: +0.5 Stress (tensão acumulada)
- Condição Atordoado: +2 Stress

**Redução de Stress:**

- Entre missões: descanso natural (Stress -= GRT × 2 por ciclo idle)
- Ação "Catch Your Breath" (MB): reduz 1 Stress + recupera 1 uso de habilidade
- Itens consumíveis (stims, calmantes)
- Diálogo com NPCs aliados (Charisma check)

### 7.3 Dual Health Bars (do Mechanized Body)

Cada peça do Frame tem efetivamente duas "barras" de saúde:

**Barra 1 (Operacional):** Dano reduz esta barra primeiro. Peça funcional mas degradando.
**Barra 2 (Crítico):** Quando Barra 1 zera, entra em "Heavily Damaged" (MB). A partir daqui, QUALQUER hit nesta peça também causa +1 Stress no piloto. Quando Barra 2 zera, peça INUTILIZADA.

Isso cria um momento de tensão claro no log de combate:

```
[COMBATE] Braço Direito está Avariado! [██░░░░]
[COMBATE] ALERTA: Braço Direito em estado CRÍTICO! Dano agora causa Stress!
[COMBATE] Braço Direito INUTILIZADO! MG-206 'Rattler' foi destruída!
```

---

## 8. DEBUFFS & STATUS TOKENS

> **→ Implementação em `IMPL_SPEC_debuff_tokens_breach_burn.md`**
> Contém processamento por turno, resolução de stacks, interações entre tokens, e integração com o CombatRunner.

Adaptados do Mechanized Body, com limite de 6 tokens por unidade:

### 8.1 Tokens de Combate

| Token | Ícone | Aplicação | Efeito | Remoção |
|-------|-------|-----------|--------|---------|
| **BREACH** | 🔓 | Armas perfurantes, hacking | Ataques contra o alvo causam +1 dano por token BREACH | Reparo (ação) |
| **BURN** | 🔥 | Armas térmicas, incendiários | Início do turno: d6 por token; 4+ = 1 dano, remove tokens ≤3 | Auto-resolve ou Vent |
| **ERROR** | ⚡ | EMP, hacking, overload | Ao agir: d6; 4+ = perde ação, +1 Stress, remove 1 ERROR | Reboot (ação) |
| **SLOW** | 🐢 | Dano em pernas, congelamento | Velocidade -2 por token; remove 1 por 2 espaços movidos | Movimento natural |
| **TARGET LOCK** | 🎯 | Scanner, drones, spotting | +1 dado bônus d6 em ataques contra o alvo | Evasão (mover 3+ espaços) |
| **SUPPRESS** | 🛡️ | Fogo de cobertura, smoke | Ataques do alvo causam -1 dano por token | Avançar para nova posição |

### 8.2 Interações entre Tokens

Tokens criam sinergias interessantes mesmo em combate idle:

- **BREACH + BURN** = dano amplificado por turno (meta ofensiva: "derreter" armadura)
- **ERROR + SLOW** = unidade quase paralisada (meta de controle)
- **TARGET LOCK + qualquer ataque** = precisão amplificada (meta de burst)
- **SUPPRESS + SLOW** = combo defensivo total (meta de stall)

No idle, essas sinergias influenciam a **IA do auto-combate**: se o jogador configurar stance "Controle", o sistema priorizará aplicar ERROR + SLOW. Se configurar "Burst", priorizará TARGET LOCK + BREACH.

---

## 9. HABILIDADES CONDICIONAIS (MANEUVER SYSTEM)

### 9.1 Conceito

Inspirado nas Maneuver Cards do Mechanized Body, cada unidade possui 3 habilidades especiais que ativam automaticamente quando condições são satisfeitas. Isso traduz a profundidade tática de um TTRPG para o contexto idle sem exigir input constante.

### 9.2 Tipos de Habilidade

| Tipo | Trigger | Exemplo (MB → Idle) |
|------|---------|---------------------|
| **Reaction** | Quando recebe ataque | Deflector Fletchits → Contra-ataque automático |
| **Instinct** | Início do turno, se condição | Shadow Strike → +2 dano se não foi atacado no turno anterior |
| **Maneuver** | Ação ativa (substitui ataque) | Suppressing Fire → -2 dano, +3 SUPPRESS em área |

### 9.3 Exemplos por Posição

**Lutador (Fighter):**

- [Reaction] **Mech Brawl** — Quando inimigo entra em melee: contra-ataque automático (MUS + d4)
- [Instinct] **Berserker Protocol** — Se Stress > 60%: +20% ATK, -15% DEF
- [Maneuver] **Pile Bunker Strike** — Ataque único com +100% dano, +15 Heat

**Comando (Leader):**

- [Reaction] **Tactical Redirect** — Quando aliado é atacado: 30% de redirecionar ataque para si
- [Instinct] **Rally Cry** — Início do turno: todos aliados -2 Stress se COR > 7
- [Maneuver] **Coordinated Strike** — Próximo ataque aliado ganha +3d6 bônus

**Artilheiro (Gunner):**

- [Reaction] **Point Defense** — Contra mísseis: 40% de interceptar projétil (nega dano)
- [Instinct] **Lock & Load** — Se não moveu: +25% precisão no próximo ataque
- [Maneuver] **Salvo Barrage** — Ataca todas as unidades em zona (½ dano cada, +20 Heat)

**Batedor (Scout):**

- [Reaction] **Evasive Maneuver** — Quando atacado: 35% de esquivar completamente
- [Instinct] **Silent Step** — Se nenhum inimigo o atacou: pode mover sem custo
- [Maneuver] **Mark Target** — Aplica 2 TARGET LOCK + 1 BREACH em um alvo

### 9.4 Desbloqueio e Progressão

Habilidades são desbloqueadas por Patente (rank) dentro da Posição. O jogador pode equipar 3 de todas as desbloqueadas (deck building).

**Transições (do FMRPG):** O piloto pode aprender habilidades de OUTRA Posição treinando com um companheiro de esquadrão que possua aquela habilidade. No idle: gastar Glória + tempo de treinamento para desbloquear 1 habilidade cross-class.

---

## 10. POSIÇÕES & PROGRESSÃO DE COMBATE

### 10.1 As 4 Posições

Mapeamento direto do FMRPG, com adaptação para as 4 carreiras do GDD:

| Posição (FMRPG) | Carreira (GDD) | Especialidade | Atributo Chave |
|-----------------|----------------|---------------|----------------|
| **Lutador** | Arena | Melee, tanking, dano bruto | MUS + GRT |
| **Comando** | Polícia | Liderança, suporte, moral | CHA + COR |
| **Artilheiro** | Comerciante* | Dano a distância, controle de área | FOC + ATK |
| **Batedor** | Netrunner | Reconhecimento, stealth, hacking | NEU + REF |

*Comerciante como Artilheiro pode parecer estranho, mas no contexto de Front Mission, quem domina o comércio de armas domina o arsenal — acesso a armas melhores, suprimentos mais baratos, e modificações exclusivas.

### 10.2 Patentes (Ranks)

Progressão em 10 níveis via Glória, com custos escalantes do FMRPG:

| Rank | Patente | Glória Necessária | Total Acumulado | Habilidade Desbloqueada |
|------|---------|-------------------|-----------------|------------------------|
| 1 | Recruta | 0 | 0 | Habilidade básica da Posição |
| 2 | Cadete | 4 | 4 | Passive tier 1 |
| 3 | Alferes | 5 | 9 | Maneuver Card 1 |
| 4 | Oficial | 7 | 16 | Reaction Card 1 |
| 5 | Sargento | 10 | 26 | Passive tier 2 |
| 6 | Primeiro Sargento | 14 | 40 | Instinct Card 1 |
| 7 | Subtenente | 19 | 59 | Maneuver Card 2 |
| 8 | Tenente | 25 | 84 | Reaction Card 2 |
| 9 | Capitão | 32 | 116 | Passive tier 3 + Instinct Card 2 |
| 10 | Major | 40 | 156 | Ultimate (Maneuver Card 3 — habilidade suprema) |

### 10.3 Ramificação Moral

A partir do Rank 4 (Oficial), a progressão bifurca com base na Moralidade:

```
Rank 4: Oficial
         ├── Moralidade ≥ 20 → "Oficial Honrado" (bônus defensivos, squad support)
         └── Moralidade ≤ -20 → "Oficial Corrupto" (bônus ofensivos, self-buff)
```

Isso cria 8 caminhos distintos (4 Posições × 2 alinhamentos), com habilidades exclusivas para cada.

---

## 11. TIPOS DE MISSÃO

### 11.1 Missões de Combate

Adaptadas dos tipos do Mechanized Body:

| Tipo | Condição de Vitória | Condição de Falha | Recompensa Base |
|------|--------------------|--------------------|-----------------|
| **Secure** | Controlar zona por X turnos | Todos os aliados destruídos | Alta (Glória + Recursos) |
| **Survey** | Derrotar todos os inimigos antes do limite de turnos | Timer expira (reforços inimigos chegam) | Média (Glória + Espólios) |
| **Escort** | Proteger alvo por X turnos | Alvo destruído | Alta (Glória + Rep de Facção) |
| **Raid** | Destruir objetivo específico | Todos os aliados destruídos | Muito Alta (Blueprint + Materiais raros) |
| **Arena** | Sobreviver waves crescentes | Mecha do jogador destruído | Variável (Creds × wave alcançada) |

### 11.2 Skill Challenges (Não-Combate)

Do Mechanized Body, adaptados como missões idle que usam atributos do piloto:

| Tipo | Atributo Base | Exemplo | Mecânica |
|------|--------------|---------|----------|
| **Hacking** | NEU | Invadir rede corporativa | Série de checks d100 vs dificuldade crescente |
| **Negociação** | CHA | Convencer informante | Checks com ramificação moral |
| **Investigação** | FOC | Rastrear contrabando | Checks acumulativos (progresso parcial salva) |
| **Sobrevivência** | GRT | Travessia do Wasteland | Checks com custo de recursos |

**Dificuldades (do MB):**

- Challenging: Stress 1-2 em falha (missões básicas)
- Daunting: Stress 2-3 em falha (missões intermediárias)
- Risky: Stress 3-4 em falha (missões avançadas)

---

## 12. ESPÓLIOS & ECONOMIA DE GLÓRIA

> **→ Sistema econômico completo em `gdd_8_economy.md`**
> A §8.1 expande Glory com tabelas de custo detalhadas (Rank 1→10: 4/6/8/12/16/20/24/30/40 Glory), diminishing returns em missões repetidas (100%→75%→50%), e o "Glory Dilemma" (gastar em avanço vs manutenção). A §8.3 detalha blueprints e reverse engineering. A §8.4 formaliza custos de manutenção por categoria de Frame.
>
> **→ Catálogo de recursos em `resource_catalog_unlock_logic.md`**
> Glory, Parts, Supply definidos como recursos com `require: "g.garagem>0"`. Supply auto-reload mechanic documentado com custos.

### 12.1 Glória (XP/Moeda Dupla)

Adaptada diretamente do FMRPG, Glória funciona como XP e moeda simultaneamente:

**Fontes de Glória:**

| Ação | Glória |
|------|--------|
| Sobreviver a combate | +1 |
| Destruir Frame inimigo | +2 por Frame |
| Destruir veículo/drone | +1 |
| Completar objetivo de missão | +1 a +3 (por dificuldade) |
| Salvar aliado em perigo | +1 |
| Tática criativa* | +2 |
| Primeiro clear de uma missão | +3 (bônus único) |

*No idle, "tática criativa" = combate encerrado sem peças inutilizadas ou com Stress abaixo de 25%.

**Gastos de Glória:**

| Uso | Custo |
|-----|-------|
| Avançar Patente | 4-40 (escalante, ver tabela §10.2) |
| Reparar todas as Avarias | 1 Glória |
| Restaurar peça Desativada | 1 Glória |
| Comprar peça estrutural nova | 5 × nível de Integridade |
| Habilidade cross-class (Transição) | 8 Glória + tempo de treinamento |

### 12.2 Espólios de Batalha (Loot)

Ao destruir um inimigo, rolar 1d8 (sistema do FMRPG):

| d8 | Resultado | Detalhes |
|----|-----------|----------|
| 1-2 | Peça Estrutural | Peça do inimigo (vende por Glória = níveis de Integridade) |
| 3-6 | Suprimentos | 1d6 de supply aleatório (munição, energia, blindagem) |
| 7-8 | Nada | Wreckage inutilizado |

**Bônus de raridade:** Inimigos de rank superior têm chance de dropar equipamento especial (armas, escudos, componentes de upgrade).

---

## 13. ESQUADRÃO & ATRIBUTOS COLETIVOS

> **→ Economia de esquadrão em `gdd_8_economy.md` §8.6**
> Três atributos (Reputation, War Funds, Connections) com progressão d6→d8→d10→d12 e custos de Glory (10/20/35/50). Detalhado com impacto mecânico em missões, vendors, e intel.
>
> **→ Massive Hangar em `gdd_6_scrapyard_progression.md` §6.3 Phase 5**
> Squad management requer Massive Hangar (Phase 5). Até 3 Frames ativos, cada um com loadout independente.

### 13.1 Formação do Esquadrão

Adaptado do sistema coletivo do FMRPG, o jogador eventualmente comanda um esquadrão de até 4 mechas (incluindo o próprio). Membros são NPCs recrutáveis.

### 13.2 Atributos do Esquadrão

| Atributo | Origem (FMRPG) | Função no Idle |
|----------|----------------|----------------|
| **Reputação** | Reputação | Desbloqueia missões de facção, atenção da mídia, preços melhores |
| **Fundos de Guerra** | Fundos de Guerra | Determina teto de tecnologia acessível + distribuição de supply |
| **Conexões** | Conexões | Acesso a informação (revela missões ocultas, dicas de loot) |

**Progressão:** Atributos de esquadrão sobem com Glória coletiva investida. Escala: d6 → d8 → d10 → d12, com custos do FMRPG (10/20/35/50 pontos).

### 13.3 Impacto no Gameplay Idle

- **Reputação alta** → mais missões disponíveis, melhores recompensas base
- **Fundos altos** → acesso a armas e peças de tier superior no Market
- **Conexões altas** → chance de intel antes de missões (revelar composição inimiga)

---

## 14. BALANCEAMENTO IDLE

> **→ Curvas de progressão e guardrails em `gdd_8_economy.md` §8.5 e §8.8**
> Scaling de custos (`actualCost = baseCost × 1.5^owned`), diminishing returns por missão, anti-hoarding via storage caps, anti-grind via condition degradation. Timeline de prestige: Run 1 = 8-12h, Run 2 = 4-6h, Run 3+ = 2-4h.
>
> **→ Timeline de desbloqueio em `gdd_6_scrapyard_progression.md` §6.4**
> Phase 1: 0-15min, Phase 2: 15-60min, Phase 3: 1-3h (primeiro combate), Phase 4: 3-8h, Phase 5: 8-12h+. Prestige pode pular phases via upgrades permanentes.

### 14.1 Tempo de Combate

| Dificuldade da Missão | Duração Alvo | Turnos |
|-----------------------|-------------|--------|
| Fácil | 30-60 segundos | 5-10 turnos |
| Médio | 1-3 minutos | 15-30 turnos |
| Difícil | 3-5 minutos | 30-50 turnos |
| Boss/Raid | 5-10 minutos | 50-100 turnos |

### 14.2 Economia de Dano

**Regra dos Terços:** Em um combate equilibrado:

- 33% dos ataques acertam com efeito total
- 33% acertam com efeito parcial (glancing)
- 33% erram (mas geram progresso parcial via Fail Forward)

**Curva de Power:** O jogador deve se sentir ~20% mais forte que a missão recomendada para seu nível. Missões +2 acima devem ser possíveis mas arriscadas. Missões +5 acima devem ser quase impossíveis.

### 14.3 Ciclo de Engajamento

```
MISSÃO (2-5 min) → RESULTADO → REPAROS/UPGRADES → PRÓXIMA MISSÃO
     │                               │
     └── Stress acumula ──────────→ DESCANSO necessário (idle recovery)
     └── Heat reseta entre missões
     └── Integridade persiste até reparo
```

O jogador não pode fazer missões infinitamente — Stress acumula entre missões e requer downtime. Isso incentiva o ciclo idle: fazer missão → enquanto descansa, produzir recursos → usar recursos para melhorar → fazer missão mais difícil.

### 14.4 Fail Forward na Prática

Mesmo em derrota total:

| Resultado | Recompensa Mínima |
|-----------|-------------------|
| Combate perdido | 50% XP base + fragmentos de supply + dados sobre o inimigo |
| Missão falhada | 30% Glória + desbloqueio de dica sobre composição inimiga |
| Mecha destruído | Seguro paga 40% do custo de reparo (se Conexões ≥ d8) |
| Piloto ferido | Injury heal é tarefa idle (produtiva — descansa e treina) |

---

## 15. ROADMAP DE IMPLEMENTAÇÃO

> **→ Plano detalhado em `combat_implementation_plan.md`**
> 5 fases com specs de código: CombatRunner class, data contracts para missions.json/enemies.json/weapons.json, integração com game.js, UI de combat panel. Cada fase tem arquivos tocados, métodos a implementar, e testes de verificação.
>
> **→ Specs de implementação individuais:**
>
> - `IMPL_SPEC_stances_targeting.md` — Stances + Targeting (Sprint 2B, Pacote 1)
> - `IMPL_SPEC_weapon_system.md` — Armas + Equip + Supply (Sprint 2B, Pacote 2)
> - `IMPL_SPEC_debuff_tokens.md` — BREACH/BURN/ERROR/SLOW (Sprint 2B, Pacote 3)

### Sprint 2A — Fundação de Combate (2 semanas)

1. Implementar estrutura de peças do Frame (4 zonas + integridade por nível)
2. Sistema de rolagem d100 com cálculo de targetPercent
3. Motor de combate básico (turno, ataque, defesa, dano localizado)
4. UI de combat log no terminal existente
5. 3 inimigos genéricos para teste

### Sprint 2B — Profundidade Tática (2 semanas)

1. Heat system (acúmulo, dissipação, penalidades)
2. Stress system (acúmulo, recuperação, condições)
3. 4 debuff tokens básicos (BREACH, BURN, ERROR, SLOW)
4. Stances de combate (Ofensiva, Balanceada, Defensiva, Cautelosa)
5. Sistema de escudos (3 tipos)

### Sprint 2C — Progressão (2 semanas)

1. Glória como recurso (ganho e gasto)
2. Espólios de batalha (loot table d8)
3. 4 Posições com habilidades de Rank 1-3
4. Sistema de armas (3 categorias, 4 slots)
5. 3 tipos de missão (Survey, Secure, Arena)

### Sprint 3 — Expansão

1. Habilidades condicionais (Maneuver Cards, 3 por posição)
2. Esquadrão (NPCs aliados, atributos coletivos)
3. Ramificação moral nas Patentes
4. Skill Challenges (missões não-combate)
5. Boss encounters com mecânicas únicas

---

## APÊNDICE A: GLOSSÁRIO DE TERMOS

| Termo | Origem | Definição no Mecha Scrapyard |
|-------|--------|------------------------------|
| Avaria | FMRPG | Nível de dano em uma peça estrutural |
| Integridade | FMRPG | Quantidade de níveis de HP que uma peça possui |
| Inutilização | FMRPG | Estado de uma peça com 0 de integridade |
| Glória | FMRPG | Moeda de experiência usada para progressão e compras |
| Espólio | FMRPG | Loot obtido ao destruir inimigo |
| Posição | FMRPG | Classe/especialização de combate do piloto |
| Patente | FMRPG | Rank dentro de uma Posição |
| Transição | FMRPG | Aprender habilidade de outra Posição |
| Stress | MB | Recurso reverso do piloto (acumula, penaliza) |
| Token | MB | Debuff stackável com mecânica própria |
| Maneuver | MB | Habilidade especial com trigger condicional |
| Heat | GDD | Recurso reverso do Frame (acumula com ações) |
| Coragem | FMRPG | Atributo que brilha em momentos de crise |
| Supply | FMRPG | Recurso consumível para usar armas/escudos |

## APÊNDICE B: REFERÊNCIAS CRUZADAS (Tabletop → Digital)

> **Note:** This table maps tabletop RPG mechanics to their digital adaptation in this combat document. For how these mechanics interact with the broader game systems (economy, scrapyard progression, parts lifecycle), see **Appendix C: Companion Document Index**.

| Mecânica Final | Front Mission RPG | Mechanized Body | GDD Original |
|---------------|-------------------|-----------------|--------------|
| 4 peças estruturais | Braço E/D, Torso, Pernas | — | 8 zonas (simplificado para 4) |
| Integridade por nível | Níveis de integridade | Dual health bars | HP por parte |
| d100 + d6 pool | Dados escalonados d4-d12 | Pool de d6 | d100 |
| Heat | — | — | Heat system |
| Stress | — | Stress como HP do piloto | — |
| Debuff tokens | Condições (Pânico, etc.) | 6 tipos de token | Status effects |
| Glória | Glória (XP + moeda) | — | Respect (prestige) |
| 4 Posições | Lutador/Comando/Artilheiro/Batedor | — | 4 carreiras |
| 10 Patentes | Recruta → Major (10 ranks) | — | Níveis de carreira |
| Maneuver Cards | Habilidades de Patente | 3 cards por unidade | Skill trees |
| Targeting por peça | Ataques direcionados | — | — |
| Escudos por tipo | 3 tipos de escudo por categoria | — | — |
| Esquadrão coletivo | Rep/Fundos/Conexões | — | Facções |
| Supply/munição | Custo por dado (d4=3, d12=⅓) | — | Recursos |
| Fail Forward | — | Stress on failure | Consolation rewards |

---

## APÊNDICE C: COMPANION DOCUMENT INDEX

This combat design document is part of a larger GDD ecosystem. Each companion document expands on systems referenced here and should be consulted for implementation details.

### Core GDD Documents

| Document | Scope | Key Cross-References to This Document |
|----------|-------|--------------------------------------|
| **`gdd_3_4_parts_frame_assembly.md`** | Frame categories (Light/Medium/Heavy), modular parts, compatibility rules, equipment slots, Frankenstein builds | §3 Structural System (category-specific integrity), §4.3 Stances (stance × category combos), §6.3 Equipment Slots (backpack, shoulder tier limits), §7 Heat & Stress (category thermal/stress profiles) |
| **`gdd_6_scrapyard_progression.md`** | 5 scrapyard phases, structure catalog, progressive disclosure, morality impact | §14 Balancing (combat unlock timing at Phase 3), §13 Squad (Massive Hangar at Phase 5), §12 Glory Economy (Garage as combat gate) |
| **`gdd_8_economy.md`** | Four-tier currency, resource chains, Glory economy, maintenance costs, prestige system | §5.4 Supply (cost scaling), §12 Glory Economy (earning/spending tables, rank costs), §14 Balancing (fail-forward rewards, diminishing returns, prestige acceleration) |
| **`resource_catalog_unlock_logic.md`** | 22 resources with JSON definitions, unlock conditions, group organization, auto-reload mechanic | §5.4 Supply (auto-reload paid in scrap), §12 Glory (unlock via `g.garagem>0`), §7 Heat (category modifiers reference) |

### Implementation Specs

| Document | Sprint | Implements |
|----------|--------|-----------|
| **`IMPL_SPEC_stances_targeting.md`** | 2B (Packet 1) | §4.3 Stances + §3.2 Targeting as functional code in CombatRunner |
| **`IMPL_SPEC_weapon_system.md`** | 2C | §6 Armament: weapons.json, equip slots, supply cost integration, UI |
| **`IMPL_SPEC_debuff_tokens_breach_burn.md`** | 2B (Packet 2) | §8 Debuffs: BREACH + BURN token logic and interactions |
| **`combat_implementation_plan.md`** | 2A–3 | Full 5-phase implementation roadmap: CombatRunner → UI → Heat/Stress → Glory → Debuffs |

### Visual References

| Document | Type | Shows |
|----------|------|-------|
| **`parts_implementation_flow.mermaid`** | Mermaid diagram | Parts system pipeline: data flow from JSON → loader → inventory → combat → degradation → dismantle → knowledge → blueprint |

### Reading Order for New Contributors

1. **This document** (combat_design_document.md) — understand the combat philosophy and mechanics
2. **gdd_3_4_parts_frame_assembly.md** — understand what the player is building and how categories shape combat
3. **gdd_8_economy.md** — understand how resources flow through combat and back
4. **gdd_6_scrapyard_progression.md** — understand when each system becomes available to the player
5. **resource_catalog_unlock_logic.md** — understand the concrete data structure behind the economy
6. **combat_implementation_plan.md** + IMPL_SPECs — implement

---

*Documento gerado em Fevereiro 2026. Versão 1.2.*
*v1.0: Combat design foundation.*
*v1.1: Appendix C — Companion Document Index.*
*v1.2: Inline cross-references (→) in §3, §6, §7, §8, §12, §13, §14, §15 + top-level Documentos Complementares table.*
*Próxima revisão: após Sprint 2A (validação com protótipo jogável).*
