class PhaserProjectile extends Phaser.GameObjects.Container {

	sprite: Phaser.GameObjects.Sprite;

	private playAnimationListener: EvtListener;
	private transformListener: EvtListener;
	private scaleListener: EvtListener;
	private destroyListener: EvtListener;

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

		this.transformListener = projectile.on('transform', (info) => {
			this.x = info.x;
			this.y = info.y;
			this.sprite.rotation = info.rotation;
		});

		this.scaleListener = projectile.on('scale', (info) => {
			console.log('scale listener', info);
			this.sprite.setDisplaySize(info.x, info.y);
		});

		this.playAnimationListener =
			projectile.on('play-animation', (animationId: string) => {
				console.log('PhaserProjectile play-animation', `${key}/${animationId}`);  // TODO remove
				sprite.play(`${key}/${animationId}`);
			});

		this.destroyListener = projectile.on('destroy', () => {
			projectile.off('play-animation', this.playAnimationListener);
			this.transformListener = null;
			this.scaleListener = null;
			this.playAnimationListener = null;
			this.destroyListener = null;
			this.scene.events.off('update', this.update, this);
			this.destroy();
		});

	}
}
