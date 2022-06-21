class PhaserProjectile extends PhaserEntity {

	/*sprite: Phaser.GameObjects.Sprite;

	private playAnimationListener: EvtListener;
	private transformListener: EvtListener;
	private scaleListener: EvtListener;
	private destroyListener: EvtListener;*/

	constructor (scene: Phaser.Scene,
				 private projectile: Projectile) {

		super(scene, projectile);

		/*const key = `projectile/${projectile._stats.type}`;

		const sprite = this.sprite = scene.add.sprite(0, 0, key);
		const translate = projectile._translate;
		const bounds = projectile._bounds2d;
		this.setPosition(translate.x, translate.y);
		sprite.rotation = projectile._rotate.z;
		sprite.setDisplaySize(bounds.x, bounds.y);

		this.add(sprite);

		scene.add.existing(this);

		this.transformListener = projectile.on('transform', (data: {
			x: number,
			y: number,
			rotation: number
		}) => {
			this.setPosition(data.x, data.y);
			sprite.rotation = data.rotation;
		});

		this.scaleListener = projectile.on('scale', (data: {
			x: number,
			y: number
		}) => {
			sprite.setScale(data.x, data.y);
		});

		this.playAnimationListener =
			projectile.on('play-animation', (animationId: string) => {
				sprite.play(`${key}/${animationId}`);
			});

		this.destroyListener = projectile.on('destroy', () => {
			projectile.off('transform', this.transformListener);
			this.transformListener = null;
			projectile.off('scale', this.scaleListener);
			this.scaleListener = null;
			projectile.off('play-animation', this.playAnimationListener);
			this.playAnimationListener = null;
			projectile.off('destroy', this.destroyListener);
			this.destroyListener = null;
			this.destroy();
		});*/
	}
}
