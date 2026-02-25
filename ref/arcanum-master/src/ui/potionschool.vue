<script>
import ItemsBase from "ui/itemsBase";
import Game from "@/game";

import { TRY_BUY } from "@/events";
export default {
	props: {
		potions: {
			type: Array,
			required: true,
		},
		school: {
			type: String,
			required: true,
		},
		isOpen: {
			type: Boolean,
		},
		mode: {
			type: String,
		},
	},
	mixins: [ItemsBase],
	emits: ["toggleOpen"],
	created() {
		this.game = Game;
	},
	computed: {
		shown() {
			return this.potions;
		},
		BUY() {
			return TRY_BUY;
		},
	},
};
</script>

<template>
	<div class="potionschool" :class="[school, 'bg']" v-if="shown.length > 0">
		<div class="schooltitle" :class="[school, 'fill']" @click="$emit('toggleOpen', school)">
			<span>{{ isOpen ? "▼" : "▶" }}</span>
			<span>{{ school }}</span>
			<span>{{ isOpen ? "▼" : "◀" }}</span>
		</div>
		<div class="schoolpotions" v-if="isOpen">
			<template v-for="s in shown">
				<div class="potion" @mouseenter.capture.stop="itemOver($event, s)">
					<span>{{ s.name.toTitleCase() }}</span>
					<div>

				<button
					type="button"
					v-if="s.buy && !s.owned"
					:disabled="!s.canBuy(game) || (game.state.inventory.full() && !game.state.inventory.findMatch(s))"
					@click="emit(BUY, s)">
					🔒
				</button>
				<button
					v-else
					type="button"
					:disabled="!s.canUse() || (game.state.inventory.full() && !game.state.inventory.findMatch(s))"
					@click="emit('craft', s)">
					Brew
				</button>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<style scoped>
.potionschool {
	padding: 1px var(--sm-gap);
	overflow-y: auto;
	position: relative;
	flex-direction: column;
}

.schooltitle {
	display: grid;
	grid-template-columns: 5% 90% 5%;
	cursor: pointer;
	border: 1px solid #888;
	text-align: center;
	text-transform: capitalize;
	font-weight: bold;
}

.darkmode .schooltitle {
	border: 1px solid black;
}

.schoolpotions {
	display: grid;
	grid-template-columns: 33% 33% 34%;
	align-content: flex-start;
	row-gap: 1px;
	margin: 2px 0;
}

@media only screen and (max-width: 1440px) {
	.schoolpotions {
		display: grid;
		grid-template-columns: 100%;
		align-content: flex-start;
		row-gap: 1px;
		margin: 2px 0;
	}
}

.potion {
	display: grid;
	grid-template-columns: 60% 35%;
	margin-left: 5%;
}

.potion span {
	display: inline-block;
	align-content: center;
}

.potionButton {
	background-color: #bbb7;
	border-color: #777;
}

.potionButton:hover {
	background-color: #888e;
}

.potionButton:disabled {
	color: #777;
	background-color: #bbb3;
}

.darkmode .potionButton {
	color: #ccc;
	border-color: #111;
	background-color: #5557;
}

.darkmode .potionButton:hover {
	background-color: #666e;
}

.darkmode .potionButton:disabled {
	color: #000;
	background-color: #5557;
}
</style>
