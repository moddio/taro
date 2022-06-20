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
		const translate = projectile._translate;
		const bounds = projectile._bounds2d;
		this.x = translate.x;
		this.y = translate.y;
		sprite.rotation = projectile._rotate.z;
		sprite.setDisplaySize(bounds.x, bounds.y);

		this.add(sprite);

		scene.add.existing(this);
		scene.events.on('update', this.update, this);

		this.transformListener = projectile.on('transform', (info) => {
			this.x = info.x;
			this.y = info.y;
			this.sprite.rotation = info.rotation;
		});

		this.scaleListener = projectile.on('scale', (info) => {
			this.sprite.setDisplaySize(info.x, info.y);
		});

		this.playAnimationListener =
			projectile.on('play-animation', (animationId: string) => {
				console.log('PhaserProjectile play-animation', `${key}/${animationId}`);  // TODO remove
				sprite.play(`${key}/${animationId}`);
			});

		this.destroyListener = projectile.on('destroy', () => {
			projectile.off('transform', this.playAnimationListener);
			this.transformListener = null;
			projectile.off('scale', this.playAnimationListener);
			this.scaleListener = null;
			projectile.off('play-animation', this.playAnimationListener);
			this.playAnimationListener = null;
			projectile.off('destroy', this.playAnimationListener);
			this.destroyListener = null;
			this.scene.events.off('update', this.update, this);
			this.destroy();
		});

	}
}
