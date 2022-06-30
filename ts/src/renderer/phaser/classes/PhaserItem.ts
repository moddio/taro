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
}
