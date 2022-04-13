class PhaserProjectile extends Phaser.GameObjects.Container {

	sprite: Phaser.GameObjects.Sprite;

	private playAnimationListener: EvtListener;

	constructor (scene: Phaser.Scene,
				 private projectile: Projectile) {

		super(scene);

		let key;
		if (projectile._stats.type) {
			key = `projectile/${projectile._stats.type}`;
		}
		else key = 'projectile/blood';

		const sprite = this.sprite = scene.add.sprite(0, 0, key);
		this.add(sprite);
		console.log('sprite', key, sprite);

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
		const container = projectile._pixiContainer;
		const texture = projectile._pixiTexture;

		if (projectile._destroyed || container._destroyed) {
			projectile.off('play-animation', this.playAnimationListener);
			this.playAnimationListener = null;

			this.destroy();
			return;
		}

		this.x = container.x;
		this.y = container.y;

		const sprite = this.sprite;
		sprite.rotation = texture.rotation;
		sprite.setScale(texture.scale.x, texture.scale.y);
	}
}
