class PhaserProjectile extends PhaserAnimatedEntity {

	constructor (scene: Phaser.Scene,
				 projectile: Projectile) {

		super(scene, projectile);

		const key = this.key = `projectile/${projectile._stats.type}`;
		this.sprite.setTexture(key);
		const bounds = projectile._bounds2d;
		this.sprite.setDisplaySize(bounds.x, bounds.y);
	}
}
