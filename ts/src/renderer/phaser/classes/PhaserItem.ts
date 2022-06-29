class PhaserItem extends PhaserAnimatedEntity {
	// can probably just be a sprite
	protected gameObject: Phaser.GameObjects.Container;
	protected entity: Item;

	constructor (
		scene: Phaser.Scene,
		entity: Item
	) {
		super(scene, entity, `item/${entity._stats.itemTypeId}`);

		const translate = entity._translate;
		this.gameObject = scene.add.container(
			translate.x,
			translate.y,
			[ this.sprite ]
		);
	}

	protected transform (data: {
		x: number;
		y: number;
		rotation: number
	}): void {
		this.gameObject.setPosition(data.x, data.y);
		this.sprite.rotation = data.rotation;
	}

	protected scale (data: {
		x: number;
		y: number
	}): void {
		this.sprite.setScale(data.x, data.y);
	}
}
