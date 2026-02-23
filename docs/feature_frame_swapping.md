# Feature: Frame Swapping & Parts Inventory

## 1. Visão Geral (Overview)

O sistema de customização do Mecha será expandido para abraçar o inventário completo do jogador:
1.  **Troca de Frames (Chassis):** O jogador poderá alternar entre diferentes "corpos" de mecha (ex: trocar um *Sora C-100* por um *Type 90 Fortress*). O Frame define os atributos base (HP, Armadura, Calor), as restrições de peso e os slots disponíveis.
2.  **Inventário Visível de Peças e Armas:** O jogador precisa visualizar a lista completa de **Frames**, **Peças Estruturais (Parts)** e **Armas (Weapons)** que possui guardados ("na garagem").
3.  **Identidade de Fabricantes (Manufacturers):** A UI de inventário deve refletir as identidades visuais e narrativas (marca, cores, lore) definidas no sistema de fabricantes ([manufacturers.json](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/data/mecha/manufacturers.json)).

## 2. Mecânica de Troca de Frames e Desequipamento

*   **Impacto no Status:** A troca de Frame recalcula imediatamente todos os status base do mecha.
*   **Gestão de Compatibilidade (Proposta de Decisão):**
    *   Como os Frames possuem restrições (`weightRange`, `slots`, compatibilidade de `category_compat` para mechas *Light*, *Medium* e *Heavy*), ao equipar um novo Frame, **o sistema deve desequipar automaticamente todas as peças e armas do mecha atual que sejam incompatíveis com o novo Frame** e enviá-las para o Inventário.
    *   Isso remove a fricção de exigir que o jogador faça o desmanche manual antes de testar um novo chassi.
*   **Restrições de Armas:** Armas de diferentes tamanhos (Short, Long, Fight) requerem slots específicos (ex: *Shoulder* vs *Hand*). Frames mais pesados possuem slots de *Shoulder* que os leves não têm. Ao rebaixar de *Heavy* para *Light*, as armas de ombro (ex: *Valkyr Mk.I Salvo*) devem obrigatoriamente voltar para o inventário.

## 3. UI de Inventário (Garagem / Controle de Estoque)

*   **Nova Seção "Garagem" (Garage) no Terminal:**
    *   Sugerimos criar uma aba (ou sub-painel na tela de Assembly) focada unicamente no Estoque.
    *   **Abas Internas no Estoque:** 
        1.  `Frames`: Lista de chassis com botão "Transferir IA para o Frame".
        2.  `Parts`: Filtro por tipo (Torso, Arms, Legs, Backpack).
        3.  `Weapons`: Filtro por categoria (Fight, Short, Long).
*   **Cards de Itens Aprimorados:**
    *   O design de cada peça e arma no inventário deve exibir ícones/cores do seu **Manufacturer**, facilitando a identificação (ex: Armas avermelhadas da *Shibata Arms*, Armaduras escuras da *Kuroda Heavy*).
    *   Indicadores claros de restrição: Uma arma muito pesada (`weight`) para o frame atual deve aparecer esmaecida (disabled) na lista de equipamentos com um aviso de "Acima da capacidade de peso".

## 4. Estrutura de Dados em `gameState.js`

*   O Estado do Jogo (Save) manterá arrays atualizados:
    *   `g.inventory.frames`: `['frame_hayabusa_mk1', 'frame_sora_c100']`
    *   `g.inventory.parts`: IDs das peças desequipadas.
    *   `g.inventory.weapons`: IDs das armas desequipadas.
*   A UI renderizada no Vue cruzará esses arrays com [frames.json](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/data/mecha/frames.json), [parts.json](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/data/mecha/parts.json) e `weapons.json` e buscará detalhes estéticos em [manufacturers.json](file:///c:/Users/nicol/dyad-apps/MechaScrapyard/data/mecha/manufacturers.json).
