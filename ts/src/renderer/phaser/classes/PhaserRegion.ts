class PhaserRegion extends PhaserEntity {

	protected gameObject: Phaser.GameObjects.Graphics;
	protected entity: Region;

	constructor (
		scene: GameScene,
		entity: Region
	) {
		super(entity);

		this.gameObject = scene.add.graphics();
		this.gameObject.setName('region');
		scene.layers[4].add(this.gameObject)

		this.transform();
	}

	protected transform (): void {
		const graphics = this.gameObject;
		const stats = this.entity._stats.default;

		graphics.setPosition(stats.x, stats.y);

		graphics.clear();
		graphics.fillStyle(
			Number(`0x${stats.inside.substring(1)}`),
			(stats.alpha || 40 ) / 100
		);
		graphics.fillRect(
			0,
			0,
			stats.width,
			stats.height
		);
	}
}
