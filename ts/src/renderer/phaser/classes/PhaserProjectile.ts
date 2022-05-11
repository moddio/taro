class PhaserProjectile extends Phaser.GameObjects.Container {

	sprite: Phaser.GameObjects.Sprite;

	private playAnimationListener: EvtListener;

	constructor (scene: Phaser.Scene,
				 private projectile: Projectile) {

		super(scene);

		const key = `projectile/${projectile._stats.type}`;

		const sprite = this.sprite = scene.add.sprite(0, 0, key);
		sprite.rotation = projectile._rotate.z;
		//sprite.displayWidth = projectile._stats.currentBody.width;
		//sprite.displayHeight = projectile._stats.currentBody.height;
		sprite.displayWidth = projectile._bounds2d.x;
		sprite.displayHeight = projectile._bounds2d.y;

		this.add(sprite);

		scene.add.existing(this);
		scene.events.on('update', this.update, this);

		this.playAnimationListener =
			projectile.on('play-animation', (animationId: string) => {
				console.log('PhaserProjectile play-animation', `${key}/${animationId}`);  // TODO remove
				sprite.play(`${key}/${animationId}`);
			});

		//console.log('projectile', projectile._scale, projectile._pixiTexture.scale, projectile._stats.currentBody.width)
	}

	update (/*time: number, delta: number*/): void {

		const projectile = this.projectile;
		//const container = projectile._pixiContainer;
		//const texture = projectile._pixiTexture;

		if (!projectile._alive/*projectile._destroyed || container._destroyed*/) {
			console.log('projectile destroy', projectile)
			projectile.off('play-animation', this.playAnimationListener);
			this.playAnimationListener = null;
			this.scene.events.off('update', this.update, this);
			this.destroy();
			return;
		}

		this.x = projectile._translate.x;
		this.y = projectile._translate.y;
		//this.x = container.x;
		//this.y = container.y;

		const sprite = this.sprite;
		sprite.rotation = projectile._rotate.z; //texture.rotation;
		sprite.displayWidth = projectile._bounds2d.x;
		sprite.displayHeight = projectile._bounds2d.y;
		//sprite.setScale (projectile._scale.x, projectile._scale.y); //texture.scale.x, texture.scale.y);
	}
}
