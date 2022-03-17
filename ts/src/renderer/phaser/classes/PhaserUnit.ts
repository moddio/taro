class PhaserUnit extends Phaser.GameObjects.Container {

	constructor (scene: Phaser.Scene,
				 private unit: Unit) {

		super(scene);

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

		this.x = container.x;
		this.y = container.y;
	}
}
