class PhaserUnit extends Phaser.GameObjects.Container {

	sprite: Phaser.GameObjects.Sprite;

	private followListener: EvtListener;
	private stopFollowListener: EvtListener;

	constructor (scene: Phaser.Scene,
				 private unit: Unit) {

		super(scene);

		const key = `unit/${unit._stats.type}`;

		const sprite = this.sprite = scene.add.sprite(0, 0, key);
		this.add(sprite);

		scene.add.existing(this);

		this.followListener = unit.on('follow', () => {
			console.log('PhaserUnit follow', unit.id()); // TODO remove
			scene.cameras.main.startFollow(this, true, 0.05, 0.05);
		});

		this.stopFollowListener = unit.on('stop-follow', () => {
			console.log('PhaserUnit stop-follow', unit.id()); // TODO remove
			scene.cameras.main.stopFollow();
		});

		scene.events.on('update', this.update, this);
	}

	update (/*time: number, delta: number*/): void {

		const unit = this.unit;

		if (unit._destroyed) {

			unit.off('follow', this.followListener);
			this.followListener = null;

			unit.off('stop-follow', this.stopFollowListener);
			this.stopFollowListener = null;

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
