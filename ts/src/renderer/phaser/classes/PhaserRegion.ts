class PhaserRegion extends Phaser.GameObjects.Graphics {

	private width: number;
	private height: number;

	private updateDimensionsListener: EvtListener;

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

		const width = this.width = stats.width;
		const height = this.height = stats.height;

		// Phaser wants a number for these
		this.fillStyle(
			Number(`0x${stats.inside.substring(1)}`),
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

		this.updateDimensionsListener = region.on('update-region-dimensions', () => {

			const stats = this.region._stats.default;

			// I didn't want to go too deep on the entity stream/update process, but because of the current logic,
			// if we stream changes to (3) variables, this will fire (3) times.
			console.log(`PhaserRegion update ${region._stats.id} ${region._id}`); // TODO: Remove

			this.x = stats.x;
			this.y = stats.y;
			this.width = stats.width;
			this.height = stats.height;

			this.clear();
			this.fillStyle(
				Number(`0x${stats.inside.substring(1)}`),
				stats.alpha / 100 || 0.4
			);
			this.fillRect(
				0,
				0,
				stats.width,
				stats.height
			);
		});

		scene.events.on('update', this.update, this);
	}

	update (/*time: number, delta: number*/): void {

		if (this.region._destroyed) {

			this.region.off('update-region-dimensions', this.updateDimensionsListener)
			this.scene.events.off('update', this.update, this);
			this.destroy();
			return;
		}



	}
}
