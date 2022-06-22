class PhaserRegion extends Phaser.GameObjects.Graphics {

	private transformListener: EvtListener;
	private destroyListener: EvtListener;

	constructor (
		scene: Phaser.Scene,
		private region: Region
	) {
		super(scene);

		this.transform();

		scene.add.existing(this);

		this.transformListener = region.on('transform', () => {

			this.transform();

		});

		this.destroyListener = region.on('destroy', () => {
			region.off('transform', this.transformListener);
			this.transformListener = null;

			region.off('destroy', this.destroyListener);
			this.destroyListener = null;

			this.destroy();
		});
	}

	 transform (): void {
		const stats = this.region._stats.default;

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
	}
}
