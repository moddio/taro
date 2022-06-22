abstract class PhaserEntity extends Phaser.GameObjects.Container {

	entity: IgeEntity;

	transformListener: EvtListener;
	scaleListener: EvtListener;
	destroyListener: EvtListener;

	constructor (scene: Phaser.Scene,
				  entity: IgeEntity) {

		super(scene);

		this.entity = entity;
		const translate = entity._translate;
		this.setPosition(translate.x, translate.y);

		scene.add.existing(this);

		this.transformListener = entity.on('transform', (data) => {
			this.transformEntity(data);
		});
		this.scaleListener = entity.on('scale', (data) => {
			this.scaleEntity(data);
		});
		this.destroyListener = entity.on('destroy', () => {
			this.destroyEntity();
		});
	}

	transformEntity (data: {x: number,y: number,rotation: number}): void {
		this.setPosition(data.x, data.y);
	}

	abstract scaleEntity (data: {
		x: number,
		y: number
	}): void

	destroyEntity(): void {
		const entity = this.entity;
		entity.off('transform', this.transformListener);
		this.transformListener = null;
		entity.off('scale', this.scaleListener);
		this.scaleListener = null;
		entity.off('destroy', this.destroyListener);
		this.destroyListener = null;
		this.destroy();
	}
}
