<script>
/**
 * CareerPanel.vue — Extracted from TerminalUI.vue
 * Displays active job, promotions, and available careers.
 */
import Game from "@/game";
import { RollOver, ItemOut } from "@/ui/popups/itemPopup.vue";

export default {
    props: {
        state: { type: Object, required: true },
    },
    emits: ['action'],
    data() {
        return { renderTick: 0 };
    },
    mounted() {
        this._tick = setInterval(() => this.renderTick++, 200);
    },
    beforeUnmount() {
        if (this._tick) clearInterval(this._tick);
    },
    computed: {
        activeJob() {
            this.renderTick;
            return Game.getActiveJob();
        },
        availableJobs() {
            this.renderTick;
            return Object.values(this.state.items).filter(i => i.type === 'job' && !i.locked && !i.enrolled);
        },
        jobTierData() {
            if (!this.activeJob) return null;
            return Game._getJobTierData(this.activeJob);
        },
        jobPathLabel() {
            if (!this.activeJob) return '';
            return this.activeJob.currentPath === 'high' ? '\u25C6 Paragon Path' : '\u25C7 Shadow Path';
        },
        jobPathColor() {
            if (!this.activeJob) return '#aaa';
            return this.activeJob.currentPath === 'high' ? '#4af' : '#f55';
        },
        nextTierInfo() {
            if (!this.activeJob || this.activeJob.currentTier >= 3) return null;
            const nextIdx = this.activeJob.currentTier;
            const nextTier = this.activeJob.tiers[nextIdx];
            if (!nextTier) return null;
            const morality = this.state.morality?.value || 0;
            const path = morality >= 30 ? 'high' : morality <= -30 ? 'low' : (morality >= 0 ? 'high' : 'low');
            return nextTier[path];
        },
        canPromote() {
            this.renderTick;
            const job = this.activeJob;
            if (!job || job.currentTier >= 3) return false;
            const nextIdx = job.currentTier;
            const nextTier = job.tiers[nextIdx];
            if (!nextTier) return false;
            const morality = this.state.morality?.value || 0;
            const path = morality >= 30 ? 'high' : morality <= -30 ? 'low' : (morality >= 0 ? 'high' : 'low');
            const info = nextTier[path];
            if (!info) return false;
            if (info.require && !Game.evalRequire(info.require)) return false;
            if (info.moralityMin !== undefined && morality < info.moralityMin) return false;
            if (info.moralityMax !== undefined && morality > info.moralityMax) return false;
            return true;
        },
        lockedJobs() {
            this.renderTick;
            return Object.values(this.state.items).filter(i => {
                if (i.type !== 'job' || i.locked || i.enrolled) return false;
                if (i.require_morality === undefined) return false;
                const morality = this.state.morality?.value || 0;
                if (i.require_morality === 'paragon' && morality < 30) return true;
                if (i.require_morality === 'shadow' && morality > -30) return true;
                return false;
            });
        },
        negotiationTier() {
            this.renderTick;
            const c = this.state.items['street_cred']?.val || 0;
            if (c >= 60) return 'high';
            if (c >= 30) return 'mid';
            return 'low';
        },
        promoteBlockedReason() {
            this.renderTick;
            const job = this.activeJob;
            if (!job || job.currentTier >= 3) return null;
            const nextIdx = job.currentTier;
            const nextTier = job.tiers[nextIdx];
            if (!nextTier) return null;
            const morality = this.state.morality?.value || 0;
            const path = morality >= 30 ? 'high' : morality <= -30 ? 'low' : (morality >= 0 ? 'high' : 'low');
            const info = nextTier[path];
            if (!info) return null;
            if (info.moralityMin !== undefined && morality < info.moralityMin) return `Alignment too low (need ≥${info.moralityMin} morality)`;
            if (info.moralityMax !== undefined && morality > info.moralityMax) return `Alignment too high (need ≤${info.moralityMax} morality)`;
            if (info.require && !Game.evalRequire(info.require)) return `Requirements: ${info.require}`;
            return null;
        },
    },
    methods: {
        enrollJob(id) {
            Game.enrollJob(id);
            this.$emit('action');
        },
        promoteJob() {
            Game.promoteJob();
            this.$emit('action');
        },
        quitJob() {
            Game.quitJob();
            this.$emit('action');
        },
        itemOver(e, it) {
            RollOver(e, it);
        },
        itemOut() {
            ItemOut();
        },
        _morality() {
            return this.state.morality?.value ?? 0;
        },
        _tier1Path(job) {
            const m = this._morality();
            return m >= 30 ? 'high' : m <= -30 ? 'low' : (m >= 0 ? 'high' : 'low');
        },
        getTier1Title(job) {
            return job.tiers[0]?.[this._tier1Path(job)]?.title || '???';
        },
        formatTier1Income(job) {
            const income = job.tiers[0]?.[this._tier1Path(job)]?.passiveIncome;
            if (!income) return '';
            const resLabel = { creds: '¢', scrap: 'Sc', data_chips: 'Dc', glory: 'Gl', nano_infra: 'Nf', ceramite: 'Ce', parts: 'Pt' };
            return Object.entries(income)
                .map(([k, v]) => `+${resLabel[k] || k}${v.toFixed(2)}/s`)
                .join(' · ');
        },
    },
};
</script>

<template>
    <section class="career-panel">
        <!-- ACTIVE JOB -->
        <div v-if="activeJob" class="active-job-panel">
            <h3 class="hud-section-title">> ACTIVE CAREER</h3>
            <div class="job-active-card">
                <div class="job-header">
                    <span class="job-icon">{{ activeJob.icon }}</span>
                    <span class="job-title">{{ jobTierData ? jobTierData.title : activeJob.name }}</span>
                    <span class="job-tier-badge">Tier {{ activeJob.currentTier }}/3</span>
                </div>
                <div class="job-path" :style="{ color: jobPathColor }">{{ jobPathLabel }}</div>
                <div class="job-flavor" v-if="jobTierData">{{ jobTierData.flavor }}</div>

                <div class="job-income" v-if="jobTierData && jobTierData.passiveIncome">
                    <div class="income-header">PASSIVE INCOME</div>
                    <div v-for="(rate, res) in jobTierData.passiveIncome" :key="res" class="income-line">
                        +{{ rate.toFixed(2) }} <span class="income-res">{{ res.toUpperCase() }}/s</span>
                    </div>
                </div>

                <div v-if="activeJob.currentTier < 3" class="promotion-section">
                    <div class="promote-header">NEXT TIER: {{ nextTierInfo ? nextTierInfo.title : '???' }}</div>
                    <div v-if="promoteBlockedReason" class="promote-blocked">
                        ✗ {{ promoteBlockedReason }}
                    </div>
                    <button v-if="canPromote" class="hud-btn-cta" @click="promoteJob()">&#x25B2; SEEK PROMOTION</button>
                </div>
                <div v-else class="job-max-tier">&#x2605; MAXIMUM TIER REACHED</div>

                <button class="hud-btn-danger" @click="quitJob()">&#x2715; QUIT JOB</button>
            </div>
        </div>

        <!-- AVAILABLE JOBS -->
        <div v-else>
            <h3 class="hud-section-title">> CAREER REGISTRY</h3>
            <div class="negotiation-tier-badge" :class="'neg-' + negotiationTier">
                NEGOTIATION: {{ negotiationTier.toUpperCase() }}
            </div>
            <div v-if="availableJobs.length === 0" class="empty-state">
                &gt; NO CONTRACTS AVAILABLE
            </div>
            <div class="job-registry">
                <div v-for="job in availableJobs" :key="job.id"
                     class="job-dossier"
                     @click="enrollJob(job.id)"
                     @mouseover="itemOver($event, job)"
                     @mouseleave="itemOut">
                    <div class="dossier-header">
                        <span class="dossier-code">[{{ job.icon }}]</span>
                        <span class="dossier-name">{{ job.name.toUpperCase() }}</span>
                        <span class="dossier-cat">// {{ (job.category || 'career').toUpperCase() }}</span>
                    </div>
                    <div class="dossier-desc">&gt; {{ job.desc }}</div>
                    <div class="dossier-meta">
                        <span class="dossier-start">START: {{ getTier1Title(job) }}</span>
                        <span class="dossier-income">{{ formatTier1Income(job) }}</span>
                    </div>
                    <div class="dossier-flavor">"{{ job.flavor }}"</div>
                    <div class="dossier-action">[ &#x25BA; ENROLL ]</div>
                </div>
            </div>
            <!-- PATH-LOCKED JOBS -->
            <div v-if="lockedJobs.length" class="locked-jobs-section">
                <div class="hud-section-title" style="opacity:0.4;font-size:var(--font-size-xxs);">&gt; PATH-LOCKED OPPORTUNITIES</div>
                <div v-for="job in lockedJobs" :key="job.id" class="locked-job-row">
                    <span class="locked-job-name">{{ job.name.toUpperCase() }}</span>
                    <span class="locked-job-gate">&#x2298; REQUIRES {{ job.require_morality === 'paragon' ? 'PARAGON' : 'SHADOW' }} PATH</span>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.promote-blocked {
    color: var(--error, #f55);
    font-size: 0.85em;
    margin-bottom: 4px;
}
.negotiation-tier-badge {
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    letter-spacing: 0.1em;
    padding: 2px 6px;
    border: 1px solid currentColor;
    display: inline-block;
    margin-bottom: 8px;
}
.neg-high { color: #4f4; }
.neg-mid  { color: #fa0; }
.neg-low  { color: #888; }

/* ── DOSSIER LAYOUT (available jobs) ── */
.job-registry {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.job-dossier {
    border: 1px solid var(--border-dim);
    border-left: 3px solid var(--secondary);
    padding: 12px 16px;
    cursor: pointer;
    background: rgba(255, 176, 0, 0.02);
    transition: border-color 0.15s, background 0.15s;
}
.job-dossier:hover {
    border-color: var(--secondary);
    background: rgba(255, 176, 0, 0.05);
}
.dossier-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
}
.dossier-code {
    color: var(--secondary);
    font-weight: bold;
    flex-shrink: 0;
}
.dossier-name {
    color: var(--text);
    font-weight: bold;
    letter-spacing: 0.06em;
    flex: 1;
}
.dossier-cat {
    color: var(--text-faint);
    font-size: var(--font-size-xxs);
    letter-spacing: 0.1em;
    flex-shrink: 0;
}
.dossier-desc {
    font-size: var(--font-size-xs);
    color: var(--text-dim);
    line-height: 1.5;
    margin-bottom: 8px;
    padding-left: 4px;
}
.dossier-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--font-mono);
    font-size: var(--font-size-xxs);
    color: var(--text-dim);
    margin-bottom: 6px;
}
.dossier-income {
    color: var(--color-success);
}
.dossier-flavor {
    font-size: var(--font-size-xxs);
    color: var(--text-faint);
    letter-spacing: 0.03em;
    margin-bottom: 8px;
}
.dossier-action {
    text-align: right;
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--secondary);
    letter-spacing: 0.1em;
}

/* ── PATH-LOCKED JOBS ── */
.locked-jobs-section { margin-top: 12px; }
.locked-job-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
    color: var(--text-dim);
    opacity: 0.45;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.locked-job-gate { color: #888; }
</style>
