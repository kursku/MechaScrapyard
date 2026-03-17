<template>
  <Transition name="fade">
    <div v-if="visible" class="dialogue-overlay" role="dialog" aria-modal="true" aria-labelledby="dialogue-speaker-name" @click="handleClick">
      <div class="dialogue-box" @click.stop>
        <div class="dialogue-header" :style="{ color: speakerColor }">
          <span class="speaker-name" id="dialogue-speaker-name">{{ speakerName }}</span>
          <div class="header-line"></div>
        </div>
        
        <div class="dialogue-content">
          <p class="dialogue-text">
            {{ displayedText }}<span class="cursor" v-if="!isTypingComplete">_</span>
          </p>
        </div>

        <!-- Choice buttons (shown on last page when choices exist) -->
        <div v-if="choices.length && isLastPage && isTypingComplete" class="choice-container">
          <button
            type="button"
            v-for="choice in choices"
            :key="choice.id"
            class="choice-button"
            @click="selectChoice(choice)"
          >
            <span class="choice-label">▸ {{ choice.label }}</span>
            <span class="choice-desc">{{ choice.desc }}</span>
          </button>
        </div>

        <div class="dialogue-footer">
          <button v-if="isTypingComplete && !(choices.length && isLastPage)" class="continue-btn" @click="nextPage">
            {{ isLastPage ? '[ CLOSE ]' : '[ CONTINUE ▸ ]' }}
          </button>
          <span v-else-if="!isTypingComplete" class="skip-hint">Click to skip...</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
const SPEAKERS = {
  grandpa: { name: 'GRANDPA', color: '#f5c542' },
  system: { name: 'SYSTEM', color: '#0fa' },
  kita: { name: 'K.I.T.A.', color: '#4cf' },
  kenji: { name: 'KENJI', color: '#5cf' },
  ironjaw_enforcer: { name: 'IRONJAW', color: '#f55' },
  covenant_liaison: { name: 'COVENANT LIAISON', color: '#8af' },
  nephilim_operator: { name: 'NEPHILIM OP.', color: '#f4a' },
  npc_arena_master: { name: 'ARENA MASTER', color: '#f0c' },
  npc_aegis_officer: { name: 'AEGIS OFFICER', color: '#68f' },
  npc_steele: { name: 'COMMANDER STEELE', color: '#f44' },
  npc_null: { name: 'NULL', color: '#c8f' },
  npc_fixer: { name: 'UNDERGROUND FIXER', color: '#ca6' },
  npc_taeyang: { name: 'TAEYANG AGENT', color: '#f86' },
  npc_phantom: { name: 'PHANTOM SIGNAL', color: '#c8f' },
  npc_bounty_hunter: { name: 'BOUNTY HUNTER', color: '#f55' },
  narrator: { name: 'NARRATOR', color: '#8af' },
  unknown: { name: '???', color: '#aaa' },
};

export default {
  name: 'DialogueModal',
  
  data() {
    return {
      visible: false,
      speakerId: 'unknown',
      pages: [],
      currentPageIndex: 0,
      displayedText: '',
      typingInterval: null,
      isTypingComplete: false,
      onComplete: null,
      choices: [],
      onChoice: null,
      queue: []
    };
  },

  computed: {
    speakerName() {
      return SPEAKERS[this.speakerId]?.name || this.speakerId?.toUpperCase() || 'UNKNOWN';
    },
    speakerColor() {
      return SPEAKERS[this.speakerId]?.color || '#aaa';
    },
    isLastPage() {
      return this.currentPageIndex >= this.pages.length - 1;
    }
  },

  methods: {
    show(speakerId, pages, onComplete) {
      if (this.visible) {
        this.queue.push({ speakerId, pages, onComplete });
        return;
      }
      this.speakerId = speakerId;
      this.pages = pages;
      this.currentPageIndex = 0;
      this.visible = true;
      this.onComplete = onComplete;
      this.choices = [];
      this.onChoice = null;
      this.startTyping();
    },

    showWithChoices(speakerId, pages, choices, onChoice) {
      if (this.visible) {
        this.queue.push({ speakerId, pages, choices, onChoice });
        return;
      }
      this.speakerId = speakerId;
      this.pages = pages;
      this.currentPageIndex = 0;
      this.visible = true;
      this.choices = choices || [];
      this.onChoice = onChoice;
      this.onComplete = null;
      this.startTyping();
    },

    selectChoice(choice) {
      const callback = this.onChoice;
      this.onChoice = null;
      this.choices = [];
      this.visible = false;
      if (callback) callback(choice);
      this._processQueue();
    },

    startTyping() {
      this.isTypingComplete = false;
      this.displayedText = '';
      const fullText = this.pages[this.currentPageIndex] || '';
      let charIndex = 0;

      if (this.typingInterval) clearInterval(this.typingInterval);

      this.typingInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          this.displayedText += fullText[charIndex];
          charIndex++;
        } else {
          this.completeTyping();
        }
      }, 30);
    },

    completeTyping() {
      const fullText = this.pages[this.currentPageIndex] || '';
      this.displayedText = fullText;
      this.isTypingComplete = true;
      if (this.typingInterval) {
        clearInterval(this.typingInterval);
        this.typingInterval = null;
      }
    },

    handleClick() {
      if (!this.isTypingComplete) {
        this.completeTyping();
      } else if (!(this.choices.length && this.isLastPage)) {
        this.nextPage();
      }
    },

    nextPage() {
      if (this.isLastPage) {
        this.close();
      } else {
        this.currentPageIndex++;
        this.startTyping();
      }
    },

    close() {
      this.visible = false;
      const callback = this.onComplete;
      this.onComplete = null;
      this.choices = [];
      this.onChoice = null;
      if (callback) callback();
      this._processQueue();
    },

    _processQueue() {
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        setTimeout(() => {
          if (next.choices) {
            this.showWithChoices(next.speakerId, next.pages, next.choices, next.onChoice);
          } else {
            this.show(next.speakerId, next.pages, next.onComplete);
          }
        }, 200);
      }
    }
  }
};
</script>

<style scoped>
.dialogue-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.dialogue-box {
  width: 100%;
  max-width: 600px;
  background: #0d1117;
  border: 1px solid #1a1a1a;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(0, 255, 65, 0.05);
  padding: 25px;
  position: relative;
}

.dialogue-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.speaker-name {
  font-family: var(--font-mono);
  font-weight: 900;
  font-size: var(--font-size-sm);
  letter-spacing: 2px;
}

.header-line {
  flex: 1;
  height: 1px;
  background: currentColor;
  opacity: 0.3;
}

.speaker-grandpa { color: #f5c542; }
.speaker-system { color: #0fa; }
.speaker-unknown { color: #aaa; }

.dialogue-content {
  min-height: 100px;
  margin-bottom: 25px;
}

.dialogue-text {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: #e2e8f0;
  text-shadow: 0 0 2px rgba(226, 232, 240, 0.2);
  margin: 0;
}

.cursor {
  animation: blink 1s infinite;
  display: inline-block;
  margin-left: 2px;
}

@keyframes blink { 50% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .cursor { animation: none; }
}

.dialogue-footer {
  display: flex;
  justify-content: flex-end;
  height: 35px;
  align-items: center;
}

.continue-btn {
  background: transparent;
  border: none;
  color: #8899aa; /* lifted from #64748b — contrast ~6.4:1 on #0d1117 */
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 5px 10px;
  transition: all 0.2s;
}

.continue-btn:hover {
  color: var(--primary);
  text-shadow: 0 0 5px var(--primary);
}

.skip-hint {
  font-family: var(--font-body);
  font-size: var(--font-size-xxs);
  color: #7c8a9a; /* lifted from #334155 — contrast ~5.4:1 on #0d1117 */
  font-style: italic;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Moral Choice Buttons */
.choice-container {
  margin-top: 12px;
  border-top: 1px solid var(--border-dim, #333);
  padding-top: 8px;
}
.choice-button {
  display: block;
  width: 100%;
  text-align: left;
  font-family: inherit;
  color: inherit;
  background: transparent;
  padding: 8px 12px;
  margin: 6px 0;
  border: 1px solid var(--border-dim, #333);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.choice-button:hover {
  border-color: var(--primary, #0f0);
  background: rgba(0, 255, 65, 0.05);
}
.choice-label {
  color: var(--primary, #0f0);
  font-family: var(--font-mono);
  font-weight: bold;
  font-size: var(--font-size-sm);
}
.choice-desc {
  display: block;
  font-family: var(--font-body);
  font-size: var(--font-size-xs);
  opacity: 0.6;
  margin-top: 3px;
  color: #94a3b8;
}
</style>

