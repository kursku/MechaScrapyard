/**
 * Helpers for hiding item selections.
 */
export default {
	data() {
		return {
			inConfig: false,
			hideUIMixin: {},
			favUIMixin: {},
		};
	},

	mounted() {
		let btnHides = this.$refs.btnHides;
		if (btnHides) {
			btnHides.addEventListener("click", e => {
				e.preventDefault();

				// Do nothing if favourite config is active
				if (this.inConfig && this.onTogFavourite) return;

				if (this.inConfig) {
					this.stopHides();

					this.hide = this.newHides;
					this.newHides = null;

					e.target.classList.remove("inConfig");
				} else {
					this.inConfig = true;
					e.target.classList.add("inConfig");

					this.newHides = this.hide;
					this.hide = {};

					this.$nextTick(() => this.configHides());
				}
			});
		}
		let btnFavs = this.$refs.btnFavs;
		if (btnFavs) {
			btnFavs.addEventListener("click", e => {
				e.preventDefault();

				// Do nothing if hide config is active
				if (this.inConfig && this.onTogHide) return;

				if (this.inConfig) {
					this.stopFavs();

					this.favourite = this.newFavs;
					this.newFavs = null;

					e.target.classList.remove("inConfig");
				} else {
					this.inConfig = true;
					e.target.classList.add("inConfig");

					this.newFavs = this.favourite;

					this.$nextTick(() => this.configFavs());
				}
			});
		}
	},

	methods: {
		show(it) {
			return (this.inConfig || !this.hide[it.id]) && !it.hide;
		},
		isFavourite(it) {
			return (this.favourite[it.id]) || it.favourite;
		},

		configHides() {
			// containing element.
			var sel = this.$refs.hidables || this.$el;
			var hideElms = sel.querySelectorAll(".hidable");
			if (!hideElms) return;
			/**
			 * @property {(Event)=>null} onTogHide - listens to click events.
			 */
			this.onTogHide = e => this.hideToggle(e);

			for (let i = hideElms.length - 1; i >= 0; i--) {
				var h = hideElms[i];
				if (this.newHides[h.dataset.key]) h.classList.add("inConfig", "configHiding");
				else h.classList.add("inConfig");

				h.addEventListener("pointerdown", this.onTogHide, true);
			}
		},

		configFavs() {
			// containing element.
			var sel = this.$refs.hidables || this.$el;
			var hideElms = sel.querySelectorAll(".hidable");
			if (!hideElms) return;
			/**
			 * @property {(Event)=>null} onTogHide - listens to click events.
			 */
			this.onTogFavourite = e => this.favToggle(e);

			for (let i = hideElms.length - 1; i >= 0; i--) {
				var h = hideElms[i];
				if (this.newFavs[h.dataset.key]) h.classList.add("inConfig", "configFaving");
				else h.classList.add("inConfig");

				h.addEventListener("pointerdown", this.onTogFavourite, true);
			}
		},
		/**
		 * Stop toggling hide on elements.
		 */
		stopHides() {
			// containing element.
			var sel = this.$refs.hidables || this.$el;
			var hideElms = sel.querySelectorAll(".hidable");
			if (!hideElms) return;
			// remove event listeners.
			for (let i = hideElms.length - 1; i >= 0; i--) {
				var h = hideElms[i];
				h.removeEventListener("pointerdown", this.onTogHide, true);
				h.classList.remove("configHiding", "inConfig");
			}

			this.onTogHide = null;
			this.inConfig = false;
		},
		stopFavs() {
			// containing element.
			var sel = this.$refs.hidables || this.$el;
			var hideElms = sel.querySelectorAll(".hidable");
			if (!hideElms) return;
			// remove event listeners.
			for (let i = hideElms.length - 1; i >= 0; i--) {
				var h = hideElms[i];
				h.removeEventListener("pointerdown", this.onTogFavourite, true);
				h.classList.remove("configFaving", "inConfig");
			}

			this.onTogFavourite = null;
			this.inConfig = false;
		},
		/**
		 * Toggle the hidden status of a button.
		 * @param {*} it
		 */
		hideToggle(e) {
			if (!this.newHides) return;

			e.preventDefault();
			e.stopPropagation();

			let targ = e.currentTarget;
			let id = targ.dataset.key;
			if (!id) return;

			let v = this.newHides[id];
			this.newHides[id] = v == null ? true : !v;

			if (!v) targ.classList.add("configHiding");
			else targ.classList.remove("configHiding");
		},
		favToggle(e) {
			if (!this.newFavs) return;

			e.preventDefault();
			e.stopPropagation();

			let targ = e.currentTarget;
			let id = targ.dataset.key;
			if (!id) return;

			let v = this.newFavs[id];
			this.newFavs[id] = v == null ? true : !v;

			if (!v) targ.classList.add("configFaving");
			else targ.classList.remove("configFaving");
		},

		beforeDestroy() {
			this.onTogHide = null;
			this.onTogFavourite = null;
		},
	},
};
