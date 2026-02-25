<script>
import Game from "@/game";
import ItemBase from "@/ui/itemsBase";
import FilterBox from "@/ui/components/filterbox.vue";
import { alphasort } from "@/util/util";
import { ENCOUNTER, DUNGEON, LOCALE, CLASH } from "@/values/consts";
import { formatNumber } from "@/util/format.js";
import Mod from "@/values/mods/mod.js";

export default {
	mixins: [ItemBase],
	data() {
		return {
			filtered: null,
			sortBy: "name",
			sortOrder: 1,
			fltLearn: false,
			showLocked: false,
		};
	},
	components: {
		filterbox: FilterBox,
	},
	beforeCreate() {
		this.game = Game;
	},
	methods: {
		formatNumber,
		fixIt(obj) {
			for (let a of obj) {
				a.encs = a.baseencs.slice();
			}
		},
		searchIt(searchObj, t) {
			searchObj.encs = searchObj.baseencs.slice();
			if (oof(searchObj.locale)) return true;
			for (let a = searchObj.encs.length - 1; a >= 0; a--) {
				if (!oof(searchObj.encs[a])) searchObj.encs.splice(a, 1);
			}
			if (searchObj.encs.length > 0) {
				return true;
			} else searchObj.encs = searchObj.baseencs.slice();

			return false;

			function oof(it) {
				if (it.name.toLowerCase().includes(t.toLowerCase())) return true;
				if (it.tags) {
					let tags = it.tags;
					for (let i = tags.length - 1; i >= 0; i--) {
						if (tags[i].toLowerCase().includes(t.toLowerCase())) return true;
					}
				}
				if (it.mod) {
					for (let p in it.mod) {
						let data = game.state.getData(p);
						if (data == null) continue;
						if (data.name.toLowerCase().includes(t.toLowerCase())) return true;
					}
				}
				if (it.result) {
					for (let p in it.result) {
						let data = game.state.getData(p);
						if (data == null) continue;
						if (data.name.toLowerCase().includes(t.toLowerCase())) return true;
					}
				}
				if (it.loot && it.tags.includes("loot_equip_gen") === false) {
					for (let p in it.loot) {
						let data = game.state.getData(p);
						if (data == null) continue;
						if (data.name.toLowerCase().includes(t.toLowerCase())) return true;
					}
				}
				return false;
			}
		},
		allEncounters() {
			let all = this.game.state.encounters || [];
			var a = [];

			for (let i = all.length - 1; i >= 0; i--) {
				var it = all[i];
				if (it.value <= 0) continue;
				a.push(it);
			}

			return a;
		},
		allLocales() {
			let all = this.game.state
				.filterItems(it => it.type === DUNGEON || it.type === LOCALE || it.type === CLASH)
				.sort(alphasort);
			var a = [];

			for (let i = all.length - 1; i >= 0; i--) {
				var it = all[i];
				if (it.value <= 0 && it.ex <= 0) continue;
				a.push(it);
			}

			return a;
		},
		encByLocale(locale, checkarray) {
			let localencs = [];
			if (!locale.spawns.groups) return null;
			let count = locale.spawns.groups.length;
			for (let encobj of locale.spawns.groups) {
				let enc = this.game.getData(encobj.ids);
				if (!enc) {
					count--;
					continue;
				}
				if (enc.type !== ENCOUNTER) {
					count--;
					continue;
				}
				//checkarray is encounters we do not have the locale for, if we find it here we can take it out of the array
				if (checkarray.findIndex(v => v.id === enc.id) !== -1)
					checkarray.splice(
						checkarray.findIndex(v => v.id === enc.id),
						1,
					);
				//if local encounters does not already contain the encounter (we don't want copies for travelogue, but it's normal in actual locale definitions)
				//we add it, but only if it passes filter. Either way we deduct from the number of unknown encounters for display purposes.
				if (!localencs.find(v => v.id === enc.id)) {
					if (enc.value > 0) {
						if (this.filter(enc)) localencs.push(enc);
						count--;
					} else if (enc.locked || enc.locks > 0) {
						count--;
					}
				} else count--;
			}
			return { encs: localencs, unknown: count };
		},
		filter(encounter) {
			if (this.fltLearn && !encounter.tags.includes("site_of_learning")) {
				return false;
			}
			if (!this.showLocked && this.locked(encounter)) {
				return false;
			}
			return true;
		},
		hasMaxedMods(siteOfLearning) {
			if (!siteOfLearning.mod) return false;
			//delve into the mod until we find all end points
			let modsArray = [];
			this.delveMod(siteOfLearning.mod, modsArray);
			//no mod means no max
			if (modsArray.length == 0) return false;
			for (let mod of modsArray) if (!mod.maxed()) return false;
			//if you made it here, then you are maxed
			return true;
		},
		delveMod(mod, modsArray) {
			if (mod instanceof Mod) {
				modsArray.push(mod);
				return;
			}
			for (let key of Object.keys(mod)) this.delveMod(mod[key], modsArray);
		},
	},
	computed: {
		allItems() {
			let orphanedEncounters = this.allEncounters() || [];
			let tree = [];
			for (let checkedloc of this.allLocales()) {
				let a = {};
				a.locale = checkedloc;
				let e = this.encByLocale(checkedloc, orphanedEncounters);
				if (e) {
					a.encs = e.encs;
					a.baseencs = e.encs.slice();
					a.unknown = e.unknown;
				} else continue;
				if (a.encs.length > 0) tree.push(a);
				else if (this.fltLearn && a.locale.tags?.includes("site_of_learning")) {
					tree.push(a);
				}
			}
			if (tree.length > 0 && orphanedEncounters.length > 0) {
				//make orphans also respect filter
				for (let i = orphanedEncounters.length - 1; i >= 0; i--) {
					if (!this.filter(orphanedEncounters[i])) orphanedEncounters.splice(i, 1);
				}
				tree.push({
					locale: { id: "orphanedencs", name: "Encounters without locale" },
					encs: orphanedEncounters,
					baseencs: orphanedEncounters.slice(),
					unknown: 0,
				});
			}
			return tree;
		},
		solTip() {
			return "Shows only Sites of Learning, encounters or adventures that will grant permanent positive modifiers.";
		},
		lockTip() {
			return "Shows locked encounters that won't occur while adventuring.";
		},
		clearTip() {
			return "Time spent per encounter.";
		},
		hasLockedEncounter() {
			return this.allEncounters().some(this.locked);
		},
	},
};
</script>

<template>
	<div class="search">
		<filterbox v-model="filtered" :prop="searchIt" :items="allItems" :min-items="5" :defFunc="fixIt" />
		<span class="chkSites" @mouseenter.capture.stop="itemOver($event, null, null, null, solTip)">
			<input :id="elmId('showSites')" type="checkbox" v-model="fltLearn" />
			<label :for="elmId('showSites')">Sites of Learning</label>
		</span>
		<span
			v-if="hasLockedEncounter"
			class="chkSites"
			@mouseenter.capture.stop="itemOver($event, null, null, null, lockTip)">
			<input :id="elmId('showLocked')" type="checkbox" v-model="showLocked" />
			<label :for="elmId('showLocked')">Locked</label>
		</span>
	</div>
	<div class="travelogue">
		<span class="header">Encounters</span>
		<span class="header" @mouseenter.capture.stop="itemOver($event, null, null, null, clearTip)">Clear Time</span>
		<span class="header">Visits</span>
		<span class="header">Learned</span>
		<template v-for="b in filtered" :key="b.locale.id">
			<div class="locale">
				<span @mouseenter.capture.stop="itemOver($event, b.locale)">
					{{ b.locale.name.toTitleCase() }}
				</span>
			</div>
			<span>{{ b.locale.tags?.includes("site_of_learning") && hasMaxedMods(b.locale) ? "✓" : "" }} </span>
			<template v-for="c in b.encs" :key="c.id">
				<span class="encounter" :class="locked(c) ? 'lock' : ''" @mouseenter.capture.stop="itemOver($event, c)">
					{{ c.name.toTitleCase() }}
				</span>
				<span>
					{{ formatNumber(c.length / c.rate.value, 1, false) + "s" }}
				</span>
				<span>
					{{ Math.floor(c.value) }}
				</span>
				<span>{{ c.tags?.includes("site_of_learning") && hasMaxedMods(c) ? "✓" : "" }}</span>
			</template>
			<template v-for="a in b.unknown">
				<span class="encounter"> ?????? </span>
				<span> ??? </span>
				<span> ??? </span>
				<span> ??? </span>
			</template>
			<hr style="width: 95%; grid-column: 1/5" />
		</template>
	</div>
</template>

<style scoped>
.search {
	margin: 5px;
	display: flex;
	flex-direction: row;
}

.search .chkSites {
	align-content: center;
	margin: var(--md-gap);
}

.travelogue {
	width: 95%;
	display: inline-grid;
	grid-template-columns: 40% 20% 20% 20%;
	margin: var(--md-gap);
	align-items: center;
	text-align: center;
}

.travelogue span {
	margin: 5px;
}

.travelogue .header {
	font-weight: bold;
	text-decoration: underline;
}

.travelogue .locale {
	margin-left: 4%;
	text-align: left;
	text-decoration: underline;
	grid-column: 1 / 4;
}

.travelogue .encounter {
	margin-left: 20%;
	text-align: left;
}

.travelogue .lock {
	color: red;
}

.darkmode .travelogue .lock {
	color: darkred;
}
</style>
