<script>
import Game from "@/game";
import FilterBox from "@/ui/components/filterbox.vue";
import { alphasort, localeLevelsort } from "@/util/util";

export default {
	data() {
		return {
			filtered: null,
			showFilter: false,
		};
	},
	methods: {
		count(it) {
			return it.value > 1 ? " (" + Math.floor(it.value) + ")" : "";
		},

		searchIt(it, target) {
			const groups = target.split("|");
			for (let i = 0; i < groups.length; i++) {
				if (groups[i].length == 0) continue;
				const mandatory = groups[i].split(" ");
				let passed = true;
				for (let j = 0; j < mandatory.length; j++) {
					if (mandatory[j].length == 0) continue;
					const term = mandatory[j].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
					if (this.crawlItem(it, new RegExp(term, "i"))) continue;
					passed = false;
					break;
				}
				if (passed) return true;
			}
			return false;
		},
		crawlItem(item, regex) {
			if (item.template) return this.crawlTemplate(item.template, regex);
			const items = item.items;
			for (let i = 0; i < items.length; i++) if (this.crawlItem(items[i], regex)) return true;
			return false;
		},
		crawlTemplate(template, regex) {
			//if (template.cost) for (let c in template.cost) if (this.crawlProperty(c, regex)) return true;

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
	},
	components: {
		filterbox: FilterBox,
	},
	computed: {
		classes() {
			return Game.state.classes.filter(v => !v.disabled && v.value >= 1).sort(localeLevelsort);
		},
		tiers() {
			return Game.state.quests.filter(v => !v.disabled && v.value >= 1 && v.wizardtier);
		},
		tasks() {
			return Game.state.tasks
				.filter(v => v.max >= 1 && !v.disabled && v.value >= 1 && !v.morality);
		},
		morals() {
			return Game.state.tasks
				.filter(v => v.max >= 1 && !v.disabled && v.value >= 1 && v.morality)
				.sort(localeLevelsort);
		},
		upgrades() {
			return Game.state.upgrades.filter(v => !v.disabled && v.value >= 1);
		},
		possessions() {
			const possessions = [...this.tasks, ...this.upgrades].sort(alphasort);
			return possessions;
		},
		hallUpgrades() {
			return Object.values(Game.state.items)
				.filter(v => v.type === "upgrade" && !this.upgrades.includes(v) && !v.disabled && v.value >= 1)
				.sort(alphasort);
		},
		searchTip() {
			return "Click to enable searching";
		},
	},
};
</script>

<template>
	<div class="allupgrades">
		<div class="up-list">
			<div v-if="classes.length != 0" class="div-hr">Classes</div>
			<div v-for="it in classes" :key="it.id" @mouseenter.capture.stop="itemOver($event, it)">
				{{ it.name.toTitleCase() + count(it) }}
			</div>
			<div v-if="tiers.length != 0" class="div-hr">Tiers</div>
			<div v-for="it in tiers" :key="it.id" @mouseenter.capture.stop="itemOver($event, it)">
				{{ it.name.toTitleCase() + count(it) }}
			</div>
			<div v-if="morals.length != 0" class="div-hr">Morality</div>
			<div v-for="it in morals" :key="it.id" @mouseenter.capture.stop="itemOver($event, it)">
				{{ it.name.toTitleCase() + count(it) }}
			</div>
			<div v-if="possessions.length != 0" class="div-hr">
				Upgrades
				<button
					@mouseenter.capture.stop="itemOver($event, null, null, null, searchTip)"
					v-if="!showFilter"
					class="filter-toggle"
					@click="showFilter = true">
					🔍
				</button>
				<filterbox v-else v-model="filtered" :prop="searchIt" :items="possessions" />
			</div>
			<div
				v-if="!showFilter"
				v-for="it in possessions"
				:key="it.id"
				@mouseenter.capture.stop="itemOver($event, it)">
				{{ it.name.toTitleCase() + count(it) }}
			</div>
			<div v-else v-for="it in filtered" :key="it.id" @mouseenter.capture.stop="itemOver($event, it)">
				{{ it.name.toTitleCase() + count(it) }}
			</div>
			<div v-if="hallUpgrades.length != 0" class="div-hr">Hall Upgrades</div>
			<div v-for="it in hallUpgrades" :key="it.id" @mouseenter.capture.stop="itemOver($event, it)">
				{{ it.name.toTitleCase() + count(it) }}
			</div>
		</div>
	</div>
</template>

<style scoped>
div.allupgrades {
	display: flex;
	flex-flow: column nowrap;
	height: 100%;
}

div.up-list {
	margin-bottom: 1rem;
	overflow-x: visible;
}
</style>
