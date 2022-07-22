class PhaserItem extends PhaserAnimatedEntity {

	protected gameObject: Phaser.GameObjects.Sprite;
	protected entity: Item;

	constructor (
		scene: GameScene,
		entity: Item
	) {
		super(scene, entity, `item/${entity._stats.itemTypeId}`);

		this.gameObject = this.sprite;

		const { x, y } = entity._translate;
		this.gameObject.setPosition(x, y);
	}
}
