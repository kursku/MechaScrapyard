<script>
import Game from "@/game";
import Upgrades from "@/ui/panes/upgrades.vue";
import Profile from "modules/profile";
import Settings from "modules/settings";
import ItemsBase from "@/ui/itemsBase";
import UIMixin from "@/ui/uiMixin";
import TaskGroup from "@/ui/panes/taskGroup.vue";
import { alphasort, localeLevelsort } from "@/util/util";

export default {
	mixins: [ItemsBase, UIMixin],
	components: {
		upgrades: Upgrades,
		taskGroup: TaskGroup,
	},
	data() {
		let ops = Settings.getSubVars("main");
		if (!ops.hide) ops.hide = {};
		if (!ops.favourite) ops.favourite = {};

		return {
			hide: ops.hide,
			favourite: ops.favourite,
		};
	},
	collapseSection() {},
	methods: {
		groupMap(elements) {
			const map = new Map();
			for (let elem of elements) {
				const group = elem.group ?? "other";
				let array = map.get(group);
				if (array) {
					array.push(elem);
				} else {
					map.set(group, [elem]);
				}
			}

			return [...map].sort((a, b) => String(a[0]).localeCompare(b[0]));
		},
		isVisible(thing) {
			return !this.locked(thing) && this.show(thing);
		},
		isClassVisible(thing) {
			return (
				!this.locked(thing) &&
				this.show(thing) &&
				(!thing.need || (thing.need && Game.unlockTest(thing.need, thing)) || thing.hasTag("t_tier0"))
			);
		},
		isTaskInfinite(thing) {
			return thing.repeat && !thing.max;
		},
		isVisibleFavourite(thing) {
			return !this.locked(thing) && this.isFavourite(thing);
		},
	},
	computed: {
		hall() {
			return Profile.hall.tasks.filter(this.isVisible);
		},
		visibleFavourites() {
			const tasks = Game.state.tasks.concat(this.hall);
			const upgrades = Game.state.upgrades;
			const quests = Game.state.quests;
			const classes = Game.state.classes.filter(this.isClassVisible);
			const possessions = [...tasks, ...upgrades, ...quests, ...classes]
				.filter(this.isVisibleFavourite)
				.sort(alphasort);
			return possessions;
		},
		tasks() {
			return Game.state.tasks.filter(this.isVisible);
		},
		upgrades() {
			return Game.state.upgrades.filter(this.isVisible);
		},
		quests() {
			return Game.state.quests.filter(this.isVisible);
		},
		classes() {
			return Game.state.classes.filter(this.isClassVisible).sort(localeLevelsort);
		},
		morals() {
			return this.tasks.filter(v => v.morality).sort(localeLevelsort);
		},
		allTasks() {
			const tasks = this.tasks.filter(v => !v.morality);
			return tasks.concat(this.hall);
		},
		visibleTasks() {
			const tasks = this.allTasks.filter(this.isTaskInfinite);
			return this.groupMap(tasks);
		},
		visibleUpgrades() {
			const tasks = this.allTasks.filter(task => !this.isTaskInfinite(task));
			const upgrades = this.upgrades.filter(upgrade => !upgrade.buy || !upgrade.owned);
			const sum = upgrades.concat(tasks);
			return this.groupMap(sum);
		},
		visibleQuests() {
			return this.groupMap(this.quests);
		},
		hideTip() {
			return "Used to hide and unhide entries. This setting is retained between characters.";
		},
		favTip() {
			return "Used to mark and unmark entries as favourites. This setting is retained between characters.";
		},
	},
};
</script>

<template>
	<div class="main-tasks" ref="hidables">
		<div class="config">
			<button
				ref="btnHides"
				class="btnConfig"
				@mouseenter.capture.stop="itemOver($event, null, null, null, hideTip)"></button>
			<button
				ref="btnFavs"
				class="btnFavConfig"
				@mouseenter.capture.stop="itemOver($event, null, null, null, favTip)"></button>
		</div>
		<div v-if="visibleFavourites.length != 0" class="div-hs">Favourites</div>
		<upgrades
			v-if="visibleFavourites.length != 0"
			class="upgrade-list"
			:items="visibleFavourites"
			:preventClick="inConfig" />
		<div class="div-hs">Tasks</div>
		<taskGroup id="tasks" v-for="group in visibleTasks" :group="group" :preventClick="inConfig" />
		<div v-if="visibleUpgrades.length != 0" class="div-hs">Upgrades</div>
		<taskGroup id="upgrades" v-for="group in visibleUpgrades" :group="group" :preventClick="inConfig" />
		<div v-if="quests.length != 0" class="div-hs">Progression Quests</div>
		<taskGroup id="quests" v-for="group in visibleQuests" :group="group" :preventClick="inConfig" />
		<div v-if="classes.length != 0" class="div-hs">Classes</div>
		<upgrades class="upgrade-list" :items="classes" :preventClick="inConfig" />
		<div v-if="morals.length != 0" class="div-hs">Morality Options</div>
		<upgrades class="upgrade-list" :items="morals" :preventClick="inConfig" />
	</div>
</template>

<style scoped>
.div-hs {
	background: var(--header-background-color);
	height: 2.5em;
	display: flex;
	justify-content: center;
	align-items: center;
	font-weight: bold;
}

.compact .div-hs {
	height: 1.75em;
}

.main-tasks > div.upgrade-list {
	padding: var(--md-gap);
	display: grid;
	justify-items: center;
	justify-content: left;
	grid-template-columns: repeat(auto-fit, var(--task-button-width));
}

button.btnFavConfig:after,
button.config:after {
	content: "\2605";
}

.btnFavConfig.inConfig,
.btnFavConfig.inConfig:hover {
	background-color: var(--quiet-text-color);
	display: unset;
}

.btnFavConfig,
button.config {
	padding: 0;
	margin: 0;
	width: 100%;
	border-top: none;
	border-left: none;
	border-right: none;
	border-radius: 0;
}
.btnConfig {
	box-shadow: inset 1px 0 0 gray;
}
</style>
