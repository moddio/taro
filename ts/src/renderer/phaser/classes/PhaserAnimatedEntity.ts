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

		// {0,1} is 0 radians | {0,-1} is pi radians
		sprite.rotation = entity._rotate.z;

		Object.assign(this.evtListeners, {
			'play-animation': entity.on('play-animation', this.playAnimation, this),
			width: entity.on('width', this.width, this),
			height: entity.on('height', this.height, this)
		});
	}

	protected playAnimation (animationId: string): void {
		this.sprite.play(`${this.key}/${animationId}`);
	}

	protected transform (data: {
		x: number;
		y: number;
		rotation: number
	}): void {
		this.sprite.setPosition(data.x, data.y);
		this.sprite.rotation = data.rotation;
	}

	protected hide (): void {
		super.hide();
		this.sprite.setVisible(false);
	}

	protected show (): void {
		super.show();
		this.sprite.setVisible(true);
	}

	// considering making these setScale instead of setDisplaySize.
	protected width (width: number) {
		if (this.sprite?.displayHeight) {
			this.sprite.setDisplaySize(width, this.sprite.displayHeight);
		}
	}

	protected height (height: number) {
		if (this.sprite?.displayWidth) {
			this.sprite.setDisplaySize(this.sprite.displayWidth, height);
		}
	}

	protected destroy (): void {

		this.sprite = null;

		super.destroy();
	}
}
