class PhaserAnimatedEntity extends PhaserEntity {

	protected sprite: Phaser.GameObjects.Sprite;

	protected constructor (
		scene: Phaser.Scene,
		entity: IgeEntity,
		protected key: string
	) {
		super(entity);

		const bounds = entity._bounds2d;
		const sprite = this.sprite = scene.add.sprite(0, 0, key);
		sprite.setDisplaySize(bounds.x, bounds.y);
		sprite.rotation = entity._rotate.z;

		Object.assign(this.evtListeners, {
			'play-animation': entity.on('play-animation', this.playAnimation, this)
		});
	}

	protected playAnimation (animationId: string): void {
		this.sprite.play(`${this.key}/${animationId}`);
	}

	protected hide (): void {
		super.hide();
		this.sprite.setVisible(false);
	}

	protected show (): void {
		super.show();
		this.sprite.setVisible(true);
	}

	protected destroy (): void {

		this.sprite = null;

		super.destroy();
	}
}
