# MECHA SCRAPYARD — Morale System Patch
## IMPL_SPEC_01_PATCH — Three-Way Alignment Update

**De:** Design  
**Para:** Antigravity  
**Prioridade:** 🔴 CRITICAL — Todo documento que vem depois depende disso  
**Effort:** ~1-2 horas (refactor de nomenclatura + lógica de terceira via)  
**Contexto:** O sistema de morale já está vivo. Este patch NÃO reescreve — atualiza.

---

## POR QUE ESTE PATCH

O morale system que implementamos usa um modelo binário: **Idealist** (+) vs **Pragmatic** (-). O redesign do prestige exige um modelo de **três vias** porque:

1. Cada alignment gera uma experiência de gameplay diferente (idle/active/hybrid)
2. O prestige registra um "snapshot" de alignment por cycle
3. Glory earning, jobs, furniture, factions e K.I.T.A. ramificam por alignment
4. Jogadores que ficam no meio (neutro) precisam de conteúdo próprio — não penalty

O modelo antigo penalizava quem ficava neutro (sem acesso a nada). O novo trata neutralidade como a via **Pragmatist** com mecânicas exclusivas.

---

## MUDANÇA 1: Terminologia

### Substituições globais em todo o código e dados

```
ANTIGO              →  NOVO
────────────────────────────────────
"Idealist"          →  "Paragon"
"Pragmatic"         →  "Shadow"
(não existia)       →  "Pragmatist" (NOVA terceira via)

"idealist"          →  "paragon"
"pragmatic"         →  "shadow"
(não existia)       →  "pragmatist"
```

**Nota sobre "Pragmatic" vs "Pragmatist":** No modelo antigo, "Pragmatic" era o polo negativo (escolhas egoístas/criminais). No modelo novo, esse polo é "Shadow". "Pragmatist" é uma coisa completamente diferente — é a via neutra/flexível. Não confundir.

### Onde buscar e substituir

```
ARQUIVOS A VERIFICAR:
  src/gameState.js         → BipolarStat labels, alignment strings
  src/game.js              → _resolveChoice log messages, alignment checks
  src/ui/TerminalUI.vue    → morality display labels, colors
  src/ui/popups/*.vue      → qualquer referência a "Idealist"/"Pragmatic"
  data/mecha/events.json   → choice descriptions que mencionam alignment
  data/mecha/resources.json → moralidade desc text
  data/mecha/missions.json → narrative text, require comments
```

---

## MUDANÇA 2: Thresholds de Alignment

### Antigo (binário, ±30)

```js
// ANTES:
getAlignmentText() {
  if (this.value >= 30) return 'Idealist';
  if (this.value <= -30) return 'Pragmatic';
  return 'Neutral';
}
```

### Novo (três vias, ±40)

```js
// DEPOIS:
getAlignmentText() {
  const v = this.value;
  if (v >= 80) return 'Paragon (Devoted)';
  if (v >= 40) return 'Paragon';
  if (v <= -80) return 'Shadow (Entrenched)';
  if (v <= -40) return 'Shadow';
  return 'Pragmatist';
}
```

**Breakdown dos ranges:**

```
+100 ─── Paragon (Devoted)     ← Deep Paragon content (±80)
 +80 ─── Paragon (Devoted)
         ...
 +40 ─── Paragon               ← Alignment classification threshold
         ...
 +20 ─── Pragmatist            ← First Paragon-leaning unlocks
   0 ─── Pragmatist (center)
 -20 ─── Pragmatist            ← First Shadow-leaning unlocks
         ...
 -40 ─── Shadow                ← Alignment classification threshold
         ...
 -80 ─── Shadow (Entrenched)
-100 ─── Shadow (Entrenched)   ← Deep Shadow content (±80)
```

### Expose alignment to g. namespace

O `g.moral_alignment` que já existe precisa retornar os novos valores:

```js
Object.defineProperty(this.g, 'moral_alignment', {
    get: () => {
        const v = this.morality.value;
        if (v >= 40) return 'paragon';
        if (v <= -40) return 'shadow';
        return 'pragmatist';
    },
    configurable: true,
});
```

Isso permite require strings como:
```json
{ "require": "g.moral_alignment==='paragon'" }
{ "require": "g.moral_alignment==='shadow'" }
{ "require": "g.moral_alignment==='pragmatist'" }
```

---

## MUDANÇA 3: Require String Updates

### Todos os gates de conteúdo ±30 → ±40

Buscar em TODOS os arquivos JSON e atualizar:

```
ANTIGO                        →  NOVO
──────────────────────────────────────────────
g.morality>=30                →  g.morality>=40
g.morality<=-30               →  g.morality<=-40
g.morality>=70                →  g.morality>=80
g.morality<=-70               →  g.morality<=-80
g.morality>=20                →  g.morality>=20  (sem mudança — content hints)
g.morality<=-20               →  g.morality<=-20 (sem mudança — content hints)
```

Os thresholds ±20 permanecem porque são "primeiros sinais" de inclinação — o jogador começa a ver conteúdo daquela direção antes de se classificar como Paragon/Shadow. Isso dá feedback gradual.

---

## MUDANÇA 4: Pragmatist Content Gates (NOVO)

### 4.1 Nova require expression pra Pragmatist

```json
{ "require": "g.morality>-40&&g.morality<40" }
```

Ou, mais limpo usando o alignment:
```json
{ "require": "g.moral_alignment==='pragmatist'" }
```

### 4.2 Sistema de unlock por faixa

O prestige framework define unlocks progressivos por alignment. Para o morale patch, a estrutura é:

```
PARAGON UNLOCKS (morale positivo):
  +20 → Community resources (fonte de passive income)
  +40 → Cooperative jobs (idle-optimized income)
  +60 → K.I.T.A. Full Autonomy (expanded automation)
  +80 → Paragon-exclusive mission chain

SHADOW UNLOCKS (morale negativo):
  -20 → Black Market Terminal (timed trade windows)
  -40 → Smuggling jobs (active burst income)
  -60 → Fence Network (sell burst events)
  -80 → Shadow-exclusive mission chain

PRAGMATIST UNLOCKS (morale neutro, |m| < 40):
  Sustentado por 5+ minutos → Brokering system (buy from either side)
  |m| < 30 sustentado       → Pragmatist-exclusive content
```

**Nota:** Os unlocks de Pragmatist são baseados em *manter* morale perto do centro, não em alcançar um valor. Implementação sugerida:

```js
// Adicionar ao gameState ou game.js:
this.pragmatistTimer = 0; // Seconds spent with |morale| < 40

// No update(dt):
const m = this.state.morality.value;
if (Math.abs(m) < 40) {
    this.pragmatistTimer += dt;
} else {
    this.pragmatistTimer = Math.max(0, this.pragmatistTimer - dt * 2);
    // Decai 2x mais rápido do que acumula — sair da zona neutra penaliza
}

// Expose to g. namespace:
Object.defineProperty(this.g, 'pragmatist_time', {
    get: () => this.pragmatistTimer,
    configurable: true,
});
```

Require strings de Pragmatist:
```json
{ "require": "g.pragmatist_time>=300" }
```
(300 seconds = 5 minutes of sustained neutrality)

### 4.3 Save/Load do pragmatistTimer

```js
// Serialize:
pragmatistTimer: this.pragmatistTimer,

// Restore:
if (saveData.pragmatistTimer !== undefined) {
    this.pragmatistTimer = saveData.pragmatistTimer;
}
```

---

## MUDANÇA 5: UI Colors e Labels

### Antigo

```js
const color = val >= 30 ? '#4af' : val <= -30 ? '#f44' : '#aaa';
```

### Novo

```js
// Três cores distintas:
function getMoralityColor(val) {
    if (val >= 40) return '#4af';      // Paragon — blue/cyan
    if (val <= -40) return '#f44';     // Shadow — red
    return '#fa0';                      // Pragmatist — amber/orange
}

function getMoralityLabel(val) {
    if (val >= 80) return 'Paragon (Devoted)';
    if (val >= 40) return 'Paragon';
    if (val <= -80) return 'Shadow (Entrenched)';
    if (val <= -40) return 'Shadow';
    return 'Pragmatist';
}
```

### Ícone do moralidade resource

```
Paragon:    ☀  (ou manter ⚖ com cor azul)
Shadow:     ◑  (ou manter ⚖ com cor vermelha)
Pragmatist: ⚖  (neutro, cor amber)
```

Sugestão: manter ⚖ pra todos mas mudar a cor dinamicamente. Menos confuso.

---

## MUDANÇA 6: _resolveChoice Log Messages

### Antigo

```js
const dir = chosen.morality > 0 ? 'Idealist' : 'Pragmatic';
Log.add(`⚖ Morality shifted: ${dir} +${abs}`, 'morality');
```

### Novo

```js
const dir = chosen.morality > 0 ? 'Paragon' : 'Shadow';
Log.add(`⚖ Morale shifted: ${dir} +${Math.abs(chosen.morality)}`, 'morality');

// Adicionar feedback de alignment change se cruzou threshold:
const oldAlignment = this._lastAlignment || 'pragmatist';
const newAlignment = this.state.g.moral_alignment;
if (oldAlignment !== newAlignment) {
    Log.add(`⚖ Alignment changed: ${newAlignment.toUpperCase()}`, 'story');
    // Opcional: trigger dialogue
    if (newAlignment === 'paragon') {
        this.showDialogue('system', [
            'Your actions speak louder than words.',
            'The community notices.'
        ]);
    } else if (newAlignment === 'shadow') {
        this.showDialogue('system', [
            'The shadows welcome practical people.',
            'New doors open in dark places.'
        ]);
    } else {
        this.showDialogue('system', [
            'You walk the middle path.',
            'Both sides watch. Neither trusts — but both deal.'
        ]);
    }
}
this._lastAlignment = newAlignment;
```

---

## MUDANÇA 7: Resource Description Update

### Antigo (resources.json)

```json
{
  "id": "moralidade",
  "desc": "Your moral compass. Idealist or Pragmatic — the city judges."
}
```

### Novo

```json
{
  "id": "moralidade",
  "name": "Morale",
  "desc": "Your moral compass. Paragon, Shadow, or Pragmatist — the city watches.",
  "flavor": "Every choice echoes. Every echo shapes the world."
}
```

---

## MUDANÇA 8: Alignment Impact no Faction System

O IMPL_SPEC_05 (Factions) usa ±30 nos moral modifiers. Quando for implementar factions, usar ±40:

```js
// ANTES (não implementar):
if (faction.alignment === 'lawful' && morality >= 30) moralMod = 1.2;
if (faction.alignment === 'lawful' && morality <= -30) moralMod = 0.8;

// DEPOIS:
if (faction.alignment === 'lawful' && morality >= 40) moralMod = 1.2;
if (faction.alignment === 'lawful' && morality <= -40) moralMod = 0.8;
if (faction.alignment === 'criminal' && morality <= -40) moralMod = 1.2;
if (faction.alignment === 'criminal' && morality >= 40) moralMod = 0.8;

// NOVO — Pragmatist bonus:
if (Math.abs(morality) < 40) moralMod = 1.0; // No penalty, no bonus — fair dealer
```

**Não implementar factions agora** — só garantir que o morale threshold está correto quando for a vez.

---

## VERIFICATION CRITERIA

- [ ] `getAlignmentText()` retorna 'Paragon', 'Shadow', ou 'Pragmatist'
- [ ] `g.moral_alignment` retorna 'paragon', 'shadow', ou 'pragmatist'
- [ ] Threshold de classificação é ±40 (não ±30)
- [ ] Morale bar mostra 3 cores: azul (Paragon), vermelho (Shadow), amber (Pragmatist)
- [ ] Nenhuma string "Idealist" ou "Pragmatic" existe no código
- [ ] Log de morality shift diz "Paragon" ou "Shadow"
- [ ] Alignment change trigger funciona (crossing ±40 gera log + dialogue)
- [ ] `pragmatistTimer` acumula quando |morale| < 40
- [ ] `g.pragmatist_time` funciona em require strings
- [ ] Content gates em JSON usam ±40 (não ±30)
- [ ] Resource description atualizada
- [ ] Save/load preserva pragmatistTimer

---

## FILE REFERENCE

| File | Action | O que muda |
|------|--------|------------|
| `src/gameState.js` | MODIFY | getAlignmentText thresholds, g.moral_alignment, pragmatistTimer |
| `src/game.js` | MODIFY | _resolveChoice logs, alignment change detection, pragmatist timer update |
| `src/ui/TerminalUI.vue` | MODIFY | Morality colors and labels (3-way) |
| `data/mecha/resources.json` | MODIFY | moralidade desc text |
| `data/mecha/events.json` | VERIFY | Ensure no "Idealist"/"Pragmatic" strings remain |
| `data/mecha/missions.json` | MODIFY | require thresholds ±30 → ±40 |
| `modules/persist.js` | MODIFY | Add pragmatistTimer to save/load |

---

*Este patch é pré-requisito para: IMPL_SPEC_02 (Jobs), IMPL_SPEC_05 (Factions), e o Prestige system.*
*Depois deste patch: o mundo fala "Paragon/Shadow/Pragmatist" uniformemente.*
