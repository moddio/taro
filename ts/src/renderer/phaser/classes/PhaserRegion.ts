class PhaserRegion extends Phaser.GameObjects.Graphics {

	private width: number;
	private height: number;

	constructor (
		scene: Phaser.Scene,
		private region: Region
	) {
		super(scene);

		// looking at whether to use _stats.default or _stats.currentBody
		// appears the implementation of currentBody for regions is unfinished,
		// but everything we should need for rendering is contained in default.
		//
		// I believe this is an issue unique to 'Region'
		const stats = this.region._stats.default;

		// const stats = this.region._stats;

		// draw rectangle
		const width = this.width = stats.width;
		const height = this.height = stats.height;
		// Phaser wants a number for these
		this.fillStyle(
			Number(`0x${stats.inside.substring(1)}`) || 0xffffff,
			stats.alpha / 100 || 0.4
		);
		this.fillRect(
			0,
			0,
			width,
			height
		);

		this.x = stats.x;
		this.y = stats.y;

		scene.add.existing(this);
		scene.events.on('update', this.update, this);
	}

	update (/*time: number, delta: number*/): void {

		const region = this.region;
		// const container = region.regionUi._pixiContainer;

		if (region._destroyed /*|| container._destroyed*/) {
			this.scene.events.off('update', this.update, this);
			this.destroy();
			return;
		}

		const stats = this.region._stats.default;


		// works well now, but going to make this its own event listener I think.
		// currently this logic triggers the console.log() 4 times per region change.
		//
		// output of console looks like:
		// F T T T
		// T F T T
		// T T F T
		// T T T F
		if (
			this.x !== stats.x ||
			this.y !== stats.y ||
			this.width !== stats.width ||
			this.height !== stats.height
		) {
			console.log(`PhaserRegion update ${region._stats.id} ${region._id}`); // TODO: Remove
			console.log(
				this.x === stats.x,
				this.y === stats.y,
				this.width === stats.width,
				this.height === stats.height
			); // TODO: Remove
			this.x = stats.x;
			this.y = stats.y;
			this.width = stats.width;
			this.height = stats.height;

			this.clear();
			this.fillStyle(
				Number(`0x${stats.inside.substring(1)}`),
				0.4 || stats.alpha / 100
			);
			this.fillRect(
				0,
				0,
				stats.width,
				stats.height
			);
		}
	}
}
