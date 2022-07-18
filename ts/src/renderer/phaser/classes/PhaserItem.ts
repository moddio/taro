class PhaserItem extends PhaserAnimatedEntity {

	protected gameObject: Phaser.GameObjects.Sprite;
	protected entity: Item;

	constructor (
		scene: GameScene,
		entity: Item
	) {
		super(scene, entity, `item/${entity._stats.itemTypeId}`);

		this.gameObject = this.sprite;

		const translate = entity._translate;
		this.transform({
			x: translate.x,
			y: translate.y,
			rotation: translate.z
		});

		this.gameObject.setName('item');
		// this.layer();
	}
}
