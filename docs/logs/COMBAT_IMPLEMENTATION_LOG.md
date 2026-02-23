# Relatório de Implementação: Sistema de Combate (Sprint 2)

Este documento resume as funcionalidades implementadas no sistema de combate de **Mecha Scrapyard**, com base no Combat Design Document.

---

## 🛠️ Sprint 2A: Fundação e Integridade Localizada

*Foco: Mecânicas básicas de dano e partes do mecha.*

- **Dano Localizado**: Implementação de HP e Integridade para partes específicas: Torso, Braços (L/R) e Pernas.
- **Sistema de Integridade**: Quando o HP de uma peça chega a 0, ela perde 1 ponto de Integridade. Se a Integridade zerar, a peça fica `INOPERABLE`.
- **Motor de Combate (`CombatEngine`)**: Lógica para cálculo de acerto (d100) baseada em ATK do atacante vs DEF do defensor.
- **D6 Bonus Pool**: Adição de dados de bônus que podem gerar `Direct Hits` (dano extra e estresse) ou `Glancing Hits`.

---

## 🔥 Sprint 2B: Calor e Estresse

*Foco: Gerenciamento de recursos e penalidades de performance.*

- **Heat System (Calor)**:
  - Atacar gera calor (10 por acerto, 5 por erro).
  - Fase de Manutenção: Dissipação passiva de calor (-15 por turno).
  - Penalidade: Acima de 75% de Heat, o mecha sofre **-15% de precisão**.
- **Stress System (Estresse)**:
  - Acúmulo passivo por turno de combate e picos de estresse ao receber danos críticos.
  - Penalidade: Acima de 50% de Stress, o piloto sofre **-10% de precisão**.

---

## 💀 Sprint 2B (Pacote 2): Tokens e Debuffs

*Foco: Infraestrutura de condições e interação tática.*

- **Sistema de Tokens**: Stackáveis, visualizados na UI, persistence no save.
- **BREACH**:
  - Aplicação via Critical Hit do jogador (5% chance) ou inimigos pesados.
  - Amplifica todo dano recebido (+1 por stack).
- **BURN**:
  - Aplicação via inimigos térmicos (Sentry/Furnace).
  - Mecânica de "damage over time" com chance de extinção a cada turno.
- **Updates de UI**:
  - Barra de tokens nos frames.
  - Logs de combate com color-coding para debuffs e danos elementais.
- **Novos Inimigos**:
  - **Furnace Bot**: Especialista em BURN/BREACH.
  - **Rogue Labor**: Atualizado para causar BREACH.

---

## ⚡ Sprint 2B (Pacote 3): Tokens Avançados e Sinergias

*Foco: Controle de batalha e penalidades táticas.*

- **ERROR** (⚡): Chance de 50% de perder turno e sofrer Stress.
- **SLOW** (🐢): Reduz Precisão e Evasão (-10% por stack).
- **TARGET_LOCK** (🎯): +1 Dado Bônus para atacantes contra o alvo.
- **SUPPRESS** (🛡️): Reduz dano causado pelo alvo (-1 por stack).
- **Integração de UI**: Novos logs coloridos e ícones para todos os tokens.
- **Atualização de Inimigos**: `Security Unit` agora aplica `TARGET_LOCK` e `SUPPRESS`.
- **Testes Avançados**: Script `testAdvancedTokens()` para validação isolada.

---

## ⚔ Sprint 2C: Sistema de Armas (Em Progresso)

*Foco: Implementação de armas e impacto tático. Baseado em `IMPL_SPEC_weapon_system 3.md`.*

- **Arquitetura de Dados**: Implementação de `data/mecha/weapons.json` projetado para extensibilidade futura (novas armas e sistemas).
- **Categorias (Fight/Short/Long)**: Diferenciação de atributos (MUS/REF/FOC) e estilos de jogo.
- **Gerenciamento de Recursos**:
  - `Heat Generation`: Armas geram calor variável (ex: Heat Blade > Machine Gun).
  - `Supply Cost`: Custo de munição por ataque.
- **Integração de Equipamento**: Slots (Mãos/Ombros) e links com integridade das partes.

---

## ✦ Sprint 2D: Manobras e Recompensas (Próximo)

*Foco: Reações táticas e economia de combate.*

- **Maneuver System**: Arquitetura para habilidades automáticas.
  - **Reações (Reaction)**: Gatilhos imediatos (ex: `Mech Brawl` contra-ataca ao ser atingido).
  - **Instintos (Instinct)**: Condições de início de turno (ex: `Berserker Protocol` ativa com estresse alto).
- **Glória e Loot**:
  - Cálculo de recompensas baseado em performance (Vitória Limpa vs Destruição Total).
  - Tabela de Loot d8 para salvamento de `Scrap` e `Supplies`.

---

## 📂 Arquivos de Configuração (Data Layer)

*Arquivos criados para facilitar o balanceamento do jogo via JSON:*

1. `data/mecha/maneuvers.json`: Lista de todas as habilidades e gatilhos.
2. `data/mecha/combat_config.json`: Regras de premiação de Glória e Tabelas de Loot.
3. `data/mecha/enemies.json`: Definições de atributos e partes dos inimigos (`Scrap Drone`, etc).
4. `data/mecha/weapons.json`: Definições de armas e seus atributos (dano, heat, dice, supply). Projetado para ser facilmente expansível.

---

## 🚀 Como Testar

No console do navegador (F12) em `http://localhost:3000`:

```javascript
testCombat()         // Teste básico e tokens iniciais
testAdvancedTokens() // Teste focado em ERROR, SLOW, TARGET_LOCK
```

*O log detalhado mostrará todas as mecânicas acima em funcionamento simultâneo.*
