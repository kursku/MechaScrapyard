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
- **Status Tokens**:
  - `BURN` (🔥): Dano contínuo ao Torso por turno.
  - `ERROR` (⚡): 40% de chance de perder a ação e ganhar estresse.
  - `BREACH` (🔓): Amplificação de dano (+5 fixo por token).

---

## ✦ Sprint 2C: Manobras e Recompensas

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

---

## 🚀 Como Testar

No console do navegador (F12) em `http://localhost:3000`:

```javascript
testCombat()
```

*O log detalhado mostrará todas as mecânicas acima em funcionamento simultâneo.*
