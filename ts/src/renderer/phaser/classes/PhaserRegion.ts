class PhaserRegion extends Phaser.GameObjects.Graphics {

	private updateDimensionsListener: EvtListener;

	constructor (
		scene: Phaser.Scene,
		private region: Region
	) {
		super(scene);

		const stats = this.region._stats.default;

		// Phaser wants a number for these
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

		this.x = stats.x;
		this.y = stats.y;

		scene.add.existing(this);

		this.updateDimensionsListener = region.on('update-region-dimensions', () => {

			const stats = this.region._stats.default;

			console.log(`PhaserRegion update ${region._stats.id} ${region._id}`); // TODO: Remove

			this.x = stats.x;
			this.y = stats.y;

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
