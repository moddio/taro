class PhaserRegion extends Phaser.GameObjects.Graphics {

	private updateDimensionsListener: EvtListener;
	private destroyListener: EvtListener;

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
		scene.events.on('update', this.update, this);

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

		this.destroyListener = region.on('destroy', () => {
			region.off('update-region-dimensions', this.updateDimensionsListener);
			this.updateDimensionsListener = null;

			region.off('destroy', this.destroyListener);
			this.destroyListener = null;

			this.destroy();
		});
	}
}
