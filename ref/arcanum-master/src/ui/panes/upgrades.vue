<script>
import UIMixin from "@/ui/uiMixin";
import Settings from "modules/settings";
import ItemsBase from "@/ui/itemsBase.js";
import CurvedMod from "@/values/mods/curvedmod.js";
import RangedMod from "@/values/mods/rangedmod.js";
import AtMod from "@/values/mods/atmod.js";
import Mod from "@/values/mods/mod.js";

export default {
	/**
	 * @property {string} event - name of event to fire when an item is selected.
	 */
	props: ["items", "preventClick"],
	mixins: [ItemsBase, UIMixin],
	data() {
		let ops = Settings.getSubVars("main");
		if (!ops.favourite) ops.favourite = {};

		return {
			favourite: ops.favourite
		};
	},
	methods: {
		clickHandler(it) {
			if (!this.preventClick && it.canUse()) {
				// config : inConfig from task, value in uiMixin.js
				this.emit("upgrade", it);
			}
		},
		getStyle(it) {
			return {
				"fade-in": true,
				"task-btn": true,
				hidable: true,
				locked: this.locked(it) || (it.owned && !it.repeat),
				running: it.running,
				runnable: it.perpetual > 0 || it.length > 0,
				disabled: !it.canUse(),
			};
		},
		hasMaxedMod(upgrade) {
			if (!upgrade.repeat || upgrade.max || !upgrade.mod) return "";
			let modsArray = [];
			this.delveMod(upgrade.mod, modsArray);
			if (modsArray.length == 0) return "";
			for (let mod of modsArray) if (!mod.maxed()) return "";
			return "✅";
		},
		delveMod(mod, modsArray) {
			if (mod instanceof Mod) {
				modsArray.push(mod);
				return;
			}
			for (let key of Object.keys(mod)) this.delveMod(mod[key], modsArray);
		},
		favStar(it) {
			if (this.isFavourite(it)) return "✨"
		},
	},
};
</script>

<template>
	<div class="upgrades fade-in">
		<button
			v-for="it in items"
			:data-key="it.id"
			:key="it.id"
			type="button"
			:class="getStyle(it)"
			@click="clickHandler(it)"
			@mouseenter.capture.stop="itemOver($event, it)">
			{{ it.actname || it.name }}{{ hasMaxedMod(it) }}{{favStar(it)}}
		</button>
	</div>
</template>

<style scoped>
button {
	width: 100%;
}
</style>
