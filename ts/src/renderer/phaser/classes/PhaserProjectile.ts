class PhaserProjectile extends Phaser.GameObjects.Container {

	sprite: Phaser.GameObjects.Sprite;

	private playAnimationListener: EvtListener;

	constructor (scene: Phaser.Scene,
				 private projectile: Projectile) {

		super(scene);

		const key = `projectile/${projectile._stats.type}`;

		const sprite = this.sprite = scene.add.sprite(0, 0, key);
		const bounds = projectile._bounds2d;
		sprite.setDisplaySize(bounds.x, bounds.y);
		sprite.rotation = projectile._rotate.z;

		this.add(sprite);

		scene.add.existing(this);
		scene.events.on('update', this.update, this);

		this.playAnimationListener =
			projectile.on('play-animation', (animationId: string) => {
				console.log('PhaserProjectile play-animation', `${key}/${animationId}`);  // TODO remove
				sprite.play(`${key}/${animationId}`);
			});
	}

	update (/*time: number, delta: number*/): void {

		const projectile = this.projectile;

		if (!projectile._alive) {
			projectile.off('play-animation', this.playAnimationListener);
			this.playAnimationListener = null;
			this.scene.events.off('update', this.update, this);
			this.destroy();
			return;
		}

		this.x = projectile._translate.x;
		this.y = projectile._translate.y;

		const sprite = this.sprite;
		const bounds = projectile._bounds2d;
		sprite.setDisplaySize(bounds.x, bounds.y);
		sprite.rotation = projectile._rotate.z;
	}
}
