class PhaserRegion extends Phaser.GameObjects.Graphics {

	private width: number;
	private height: number;

	constructor (
		scene: Phaser.Scene,
		private region: Region
	) {
		super(scene);

		const stats = this.region._stats.default

		// draw rectangle
		const width = this.width = stats.width;
		const height = this.height = stats.height;
		this.fillStyle(0xFF0000, 0.4);
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
		const container = region.regionUi._pixiContainer;

		if (region._destroyed || container._destroyed) {
			this.scene.events.off('update', this.update, this);
			this.destroy();
			return;
		}

		const stats = this.region._stats.default

		this.x = stats.x;
		this.y = stats.y;

		if (this.width !== stats.width || this.height !== stats.height) {
			this.width = stats.width;
			this.height = stats.height;

			this.clear();
			this.fillStyle(0xFF0000, 0.4);
			this.fillRect(
				0,
				0,
				stats.width,
				stats.height
			);
		}
	}
}
