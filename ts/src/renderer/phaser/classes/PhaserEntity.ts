abstract class PhaserEntity extends Phaser.GameObjects.Container {

	protected evtListeners: Record<string, EvtListener> = {};

	protected constructor (scene: Phaser.Scene,
						   protected entity: IgeEntity) {
		super(scene);

		const translate = entity._translate;
		this.setPosition(translate.x, translate.y);

		scene.add.existing(this);

		Object.assign(this.evtListeners, {
			transform: entity.on('transform', this.transformEntity, this),
			scale: entity.on('scale', this.scaleEntity, this),
			destroy: entity.on('destroy', this.destroyEntity, this)
		});
	}

	protected transformEntity(data: {
		x: number,
		y: number,
		rotation: number
	}): void {
		this.setPosition(data.x, data.y);
	}

	protected abstract scaleEntity(data: {
		x: number,
		y: number
	}): void

	protected destroyEntity(): void {

		Object.keys(this.evtListeners).forEach((key) => {
			this.entity.off(key, this.evtListeners[key]);
			delete this.evtListeners[key];
		});

		this.evtListeners = null;

		this.entity = null;

		this.destroy();
	}
}
