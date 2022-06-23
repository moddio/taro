abstract class PhaserAnimatedEntity extends PhaserEntity {

	protected sprite: Phaser.GameObjects.Sprite;

	protected constructor (scene: Phaser.Scene,
						   entity: IgeEntity,
						   protected key: string) {

		super(scene, entity);

		const bounds = entity._bounds2d;
		const sprite = this.sprite = scene.add.sprite(0, 0, key);
		sprite.setDisplaySize(bounds.x, bounds.y);
		sprite.rotation = entity._rotate.z;
		this.add(sprite);

		Object.assign(this.evtListeners, { // TODO remove oneShot once fixed
			'play-animation': entity.on('play-animation', this.playAnimation, this, false)
		});
	}

	protected transformEntity (data: {
		x: number,
		y: number,
		rotation: number
	}): void {
		super.transformEntity(data);
		this.sprite.rotation = data.rotation;
	}

	protected scaleEntity (data: {
		x: number,
		y: number
	}): void {
		this.sprite.setScale(data.x, data.y);
	}

	protected playAnimation(animationId: string): void {
		this.sprite.play(`${this.key}/${animationId}`);
	}

	protected destroyEntity(): void {

		this.sprite = null;

		super.destroyEntity();
	}
}
