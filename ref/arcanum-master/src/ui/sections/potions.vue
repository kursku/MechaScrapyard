<script>
import Game from "@/game";
import Settings from "modules/settings";
import ItemBase from "@/ui/itemsBase";

import FilterBox from "@/ui/components/filterbox.vue";
import PotionSchool from "ui/potionschool.vue";

export default {
	data() {
		return Object.assign(
			{
				min: 0,
				showKeywords: false,
				schools: {},
				keywords: [],
				potionsBySearch: null,
			},
			Settings.getSubVars("potions"),
		);
	},

	mixins: [ItemBase],
	components: {
		inv: () => import(/* webpackChunkName: "inv-ui" */ "./inventory.vue"),
		filterbox: FilterBox,
		potionschool: PotionSchool,
	},

	created() {
		// trim saved schools
		const potions = this.potions;
		const schools = {};

		for (let i = 0; i < potions.length; i++) {
			const potion = potions[i];
			schools[potion.school] = this.schools[potion.school] === true;
		}

		this.schools = schools;

		// trim saved keywords
		const allKeywords = this.allKeywords;
		const keywords = [];
		for (let i = 0; i < this.keywords.length; i++) {
			const keyword = this.keywords[i];
			for (let group in allKeywords)
				if (allKeywords[group][keyword]) {
					keywords.push(keyword);
					break;
				}
		}

		this.keywords = keywords;
	},

	setup() {
		const counter = 0;
		return { counter };
	},

	updated() {
		this.counter++;
	},

	methods: {
		toggleKeywords() {
			this.showKeywords = Settings.setSubVar("potions", "showKeywords", !this.showKeywords);
		},
		toggleSchool(school) {
			this.schools[school] = !this.schools[school];
			Settings.setSubVar("potions", "schools", this.schools);
		},
		toggleAllSchools() {
			const potions = this.potionsBySearch || this.potionsByLevel;

			let anyOpen = false;

			for (let i = 0; i < potions.length; i++) anyOpen ||= !this.schools[potions[i].school];

			for (let i = 0; i < potions.length; i++) this.schools[potions[i].school] = anyOpen;

			Settings.setSubVar("potions", "schools", this.schools);
		},

		getPotionOrder(potion) {
			if (!potion.template) return -9999;
			return potion.sortOrder ?? 9999;
		},

		searchPotion(potion, target) {
			const groups = target.split("|");
			for (let i = 0; i < groups.length; i++) {
				if (groups[i].length == 0) continue;
				const mandatory = groups[i].split(" ");
				let passed = true;
				for (let j = 0; j < mandatory.length; j++) {
					if (mandatory[j].length == 0) continue;
					const term = mandatory[j].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
					if (this.crawlPotion(potion, new RegExp(term, "i"))) continue;
					passed = false;
					break;
				}
				if (passed) return true;
			}
			return false;
		},
		crawlPotion(potion, regex) {
			if (potion.template) return this.crawlTemplate(potion.template, regex);
			const items = potion.items;
			for (let i = 0; i < items.length; i++) if (this.crawlPotion(items[i], regex)) return true;
			return false;
		},
		crawlTemplate(template, regex) {
			if (template.dot && regex.test("buffs")) return true;
			if (template.summon && regex.test("summons")) return true;
			if (template.cost) for (let c in template.cost) if (this.crawlProperty(c, regex)) return true;

			for (let k in template) {
				if (
					k == "desc" ||
					k == "flavor" ||
					k == "require" ||
					k == "buy" ||
					k == "cost" ||
					k == "need" ||
					k == "needtext"
				)
					continue;
				if (this.crawlProperty(template[k], regex)) return true;
			}
			return false;
		},
		crawlObject(obj, regex) {
			for (let k in obj) {
				if (this.crawlProperty(k, regex)) return true;
				if (this.crawlProperty(obj[k], regex)) return true;
			}
			return false;
		},
		crawlProperty(prop, regex) {
			const type = typeof prop;
			if (type == "object" || type == "array") return this.crawlObject(prop, regex);

			if (type != "string") prop = prop.toString();
			const split = prop.split(/\.|=|<|>|!|,|&&|\|\||\(|\)|\+|\-|'/);
			for (let i = 0; i < split.length; i++) {
				const str = split[i];
				if (/^[0-9\*\~\%]*$/.test(str)) continue;
				if (/^[a-zA-Z0-9_ ]*$/.test(str)) {
					const data = Game.state.getData(str);
					if (data) {
						if (regex.test(data.name)) return true;
						continue;
					}
				}
				if (regex.test(str)) return true;
			}
			return false;
		},

		testPotionKeywords(potion, keywords) {
			if (!potion.template) {
				const items = potion.items;
				for (let i = 0; i < items.length; i++) if (this.testPotionKeywords(items[i], keywords)) return true;
				return false;
			}

			if (!potion.keywords) return false;

			for (let i = 0; i < keywords.length; i++) {
				const keyword = keywords[i];
				let passed = false;
				for (let k in potion.keywords) {
					passed ||= potion.keywords[k].includes(keyword);
				}
				if (!passed) return false;
			}
			return true;
		},
	},

	computed: {
		// filters
		minLevel: {
			get() {
				return this.min;
			},
			set(v) {
				this.min = Settings.setSubVar("potions", "min", Number(v));
			},
		},
		varKeywords: {
			get() {
				return this.keywords;
			},
			set(v) {
				this.keywords = Settings.setSubVar("potions", "keywords", v);
			},
		},

		// potion funnel
		state() {
			return Game.state;
		},

		// filter out locked potions
		potions() {
			return this.state
				.filterItems(it => it.type === "potion" && !this.locked(it) && !it.hide)
				.sort((a, b) => this.getPotionOrder(a) - this.getPotionOrder(b));
		},

		// compute avilable keywords
		allKeywords() {
			const result = {
				recovery: {
					life: false,
					stamina: false,
					mana: false,
					status: false,
					breath: false,
				},
				utility: {
					resource: false,
					task: false,
					explore: false,
					infusion: false,
				},
				battle: {
					attack: false,
					buff: false,
					debuff: false,
				},
				delivery: {
					instant: false,
					"over time": false,
				},
			};

			const potions = this.potions;
			for (let i = 0; i < potions.length; i++) {
				const keywords = potions[i].keywords ?? {};
				for (let k in keywords) {
					const group = result[k] ?? (result[k] = {});
					const array = keywords[k];
					for (let j = 0; j < array.length; j++) group[array[j]] = true;
				}
			}

			for (let k1 in result) {
				const group = result[k1];
				for (let k2 in group) if (!group[k2]) delete group[k2];
				if (Object.keys(group).length == 0) delete result[k1];
			}

			return result;
		},

		// filter out potions without selected keywords
		potionsByKeywords() {
			const potions = this.potions;
			const keywords = this.keywords;

			if (!keywords || keywords.length == 0) return potions;
			return potions.filter(potion => this.testPotionKeywords(potion, keywords));
		},

		// filter out unselected levels of potions
		potionsByLevel() {
			const potions = this.potionsByKeywords;
			const level = this.minLevel;

			if (!level) return potions;
			return potions.filter(v => !level || v.level.valueOf() === level);
		},

		/* filterbox happens here */

		// split on schools and render
		potionBySchools() {
			const potions = this.potionsBySearch || this.potionsByLevel;
			const schools = {};

			let potionschool;
			const len = potions.length;
			for (let i = 0; i < len; i++) {
				let potion = potions[i];
				let school = potion.school;
				potionschool = schools[school] || (schools[school] = []);
				potionschool.push(potion);
			}
			return schools;
		},
	},
};
</script>

<template>
	<div class="potions">
		<div class="filters">
			<div class="inputgroup">
				<filterbox v-model="potionsBySearch" :prop="searchPotion" :items="potionsByLevel" />

				<label class="level-lbl" :for="elmId('level')">Level</label>
				<input class="level" :id="elmId('level')" type="number" v-model="minLevel" min="0" size="5" />
			</div>

			<div class="keywordcontainer">
				<div
					class="keywords"
					v-for="(arr, gr) in allKeywords"
					:key="gr"
					v-if="showKeywords"
					:style="{ 'min-width': Object.keys(arr).length * 9 + '%' }">
					<div class="keytitle">
						<b>{{ gr }}</b>
					</div>
					<div class="keywordgroup">
						<div class="checks" v-for="(_, k) in arr" :key="k">
							<input type="checkbox" :value="k" :id="elmId('chk' + k)" v-model="varKeywords" />
							<label :for="elmId('chk' + k)">{{ k.toTitleCase() }}</label>
						</div>
					</div>
				</div>
			</div>

			<div class="buttongroup">
				<button type="button" @click="toggleKeywords">Keywords</button>
				<button type="button" @click="toggleAllSchools">Toggle Schools</button>
			</div>
			<!-- <div class="checks" v-for="(p, k) in allSchools" :key="k">
				<input type="checkbox" :value="k" :id="elmId('chk' + k)" v-model="viewSchools" />
				<label :for="elmId('chk' + k)">{{ k.toTitleCase() }}</label>
			</div> -->
		</div>

		<div class="bottom">
			<div class="potionbook">
				<potionschool
					v-for="(v, k) in potionBySchools"
					:potions="v"
					:school="k"
					:key="k"
					:isOpen="!schools[k]"
					@toggle-open="toggleSchool" />
			</div>
		</div>
	</div>
</template>

<style scoped>
div.potions {
	display: flex;
	flex-flow: column nowrap;
	padding: var(--sm-gap) var(--md-gap);
}

div.filters {
	flex-flow: row wrap;
	display: flex;
	text-align: center;
	border-bottom: 1px solid var(--separator-color);
	margin: 0;
	padding: var(--sm-gap);
	line-height: 2em;
	justify-content: center;
}

div.inputgroup {
	width: 100%;
	display: flex;
	justify-content: center;
}

div.inputgroup label {
	margin-left: 1em;
	padding: var(--tiny-gap) 0;
	text-indent: var(--sm-gap);
}

div.inputgroup input {
	margin-right: 1em;
	margin-left: 1em;
	padding: var(--tiny-gap) 0;
	text-indent: var(--sm-gap);
}

div.keywordcontainer {
	display: flex;
	flex-wrap: wrap;
}

div.keywords {
	padding: var(--sm-gap);
	background-color: #9992;
	flex-grow: 1;
}

div.keytitle {
	border: 1px solid #9998;
	width: 100%;
	text-transform: capitalize;
	text-align: center;
}

div.keywordgroup {
	width: 100%;
	display: flex;
	justify-content: center;
}

div.buttongroup {
	width: 100%;
	display: flex;
	justify-content: center;
}

div.potions .bottom {
	display: flex;
	flex-flow: row nowrap;
}

div.potions .potionbook {
	flex-basis: 80%;
	flex-grow: 1;
}

div.potions div.filters div {
	box-sizing: border-box;
	margin: 0;
}

div.potions div.filters div.checks {
	margin: 0;
	padding: 0 0.5em;
	flex-basis: unset;
}
</style>
