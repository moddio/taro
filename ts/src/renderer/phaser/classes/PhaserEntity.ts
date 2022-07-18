/* eslint-disable @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars */
class PhaserEntity {

	protected gameObject:
		Phaser.GameObjects.GameObject &
		Phaser.GameObjects.Components.Transform &
		Phaser.GameObjects.Components.Visible &
		Phaser.GameObjects.Components.Depth;

	protected evtListeners: Record<string, EvtListener> = {};

	protected constructor (
		protected entity: IgeEntity
	) {
		Object.assign(this.evtListeners, {
			transform: entity.on('transform', this.transform, this),
			scale: entity.on('scale', this.scale, this),
			hide: entity.on('hide', this.hide, this),
			show: entity.on('show', this.show, this),
			destroy: entity.on('destroy', this.destroy, this)
		});
	}

	protected transform (data: {
		x: number,
		y: number,
		rotation: number
	}): void { }

	protected scale (data: {
		x: number,
		y: number
	}): void { }

	protected hide (): void {
		console.log('hide');
		this.gameObject.setActive(false)
			.setVisible(false);
	}

	protected show (): void {
		console.log('show');
		this.gameObject.setActive(true)
			.setVisible(true);
	}

	protected destroy (): void {
		Object.keys(this.evtListeners).forEach((key) => {
			this.entity.off(key, this.evtListeners[key]);
			delete this.evtListeners[key];
		});

		this.gameObject.destroy();

		this.gameObject = null;
		this.evtListeners = null;
		this.entity = null;
	}
}
