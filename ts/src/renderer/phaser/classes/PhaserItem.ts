class PhaserItem extends PhaserAnimatedEntity {
	// can probably just be a sprite
	protected gameObject: Phaser.GameObjects.Container;
	protected entity: Item;

	constructor (
		scene: GameScene,
		entity: Item
	) {
		super(scene, entity, `item/${entity._stats.itemTypeId}`);

		const translate = entity._translate;
		this.gameObject = scene.add.container(
			translate.x,
			translate.y,
			[ this.sprite ]
		);

		Object.assign(this.evtListeners, {
			layer: entity.on('layer', this.layer, this),
		});

		this.gameObject.setName('item');
		console.log(`layer: ${entity._layer}, depth: ${entity._depth}`);
		scene.layers[entity._layer].add(this.gameObject)
		this.gameObject.setDepth(entity._depth);
	}

	private layer(): void {
		console.log(`layer: ${this.entity._layer}, depth: ${this.entity._depth}`);

		this.scene.layers[this.entity._layer].add(this.gameObject)
		this.gameObject.setDepth(this.entity._depth);
	}
}
