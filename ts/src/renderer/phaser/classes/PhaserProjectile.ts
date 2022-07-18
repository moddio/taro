class PhaserProjectile extends PhaserAnimatedEntity {

	protected gameObject: Phaser.GameObjects.Container;
	protected entity: Projectile;

	constructor (
		scene: GameScene,
		entity: Projectile
	) {
		super(scene, entity, `projectile/${entity._stats.type}`);

		const translate = entity._translate;
		this.gameObject = scene.add.container(
			translate.x,
			translate.y,
			[ this.sprite ]
		);
	}
}
