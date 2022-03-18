class PhaserUnit extends Phaser.GameObjects.Container {

	sprite: Phaser.GameObjects.Sprite;

	constructor (scene: Phaser.Scene,
				 private unit: Unit) {

		super(scene);

		const key = `unit/${unit._stats.type}`;

		const sprite = this.sprite = scene.add.sprite(0, 0, key);
		this.add(sprite);

		scene.add.existing(this);

		scene.events.on('update', this.update, this);
	}

	update (/*time: number, delta: number*/): void {

		const unit = this.unit;

		if (unit._destroyed) {

			this.scene.events.off('update', this.update, this);

			this.destroy();

			return;
		}

		const container = unit._pixiContainer;
		const texture = unit._pixiTexture;
		const sprite = this.sprite;

		this.x = container.x;
		this.y = container.y;

		sprite.rotation = texture.rotation;
		sprite.setScale(texture.scale.x, texture.scale.y);
	}
}
