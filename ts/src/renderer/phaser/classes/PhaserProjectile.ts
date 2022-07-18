class PhaserProjectile extends PhaserAnimatedEntity {

	protected gameObject: Phaser.GameObjects.Sprite;
	protected entity: Projectile;

	constructor (
		scene: GameScene,
		entity: Projectile
	) {
		super(scene, entity, `projectile/${entity._stats.type}`);

		this.gameObject = this.sprite;

		const translate = entity._translate;
		this.transform({
			x: translate.x,
			y: translate.y,
			rotation: translate.z
		});

		this.gameObject.setName('projectile');
		this.layer();
	}

	protected scale (data: {
		x: number;
		y: number
	}): void {
		this.gameObject.setScale(data.x, data.y);
	}
}
