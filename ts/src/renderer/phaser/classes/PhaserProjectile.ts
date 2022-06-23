class PhaserProjectile extends PhaserAnimatedEntity {

	constructor (scene: Phaser.Scene,
				 protected entity: Projectile) {

		super(scene, entity, `projectile/${entity._stats.type}`);
	}
}
