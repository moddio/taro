abstract class PhaserAnimatedEntity extends PhaserEntity {

	sprite: Phaser.GameObjects.Sprite;
	key: string;

	playAnimationListener: EvtListener;

	constructor (scene: Phaser.Scene,
				 entity: IgeEntity) {

		super(scene, entity);

		const sprite = this.sprite = scene.add.sprite(0, 0, null);
		sprite.rotation = entity._rotate.z;
		this.add(sprite);

		this.playAnimationListener = entity.on('play-animation', (data) => {
			this.playAnimation(data);
		});
	}

	transformEntity (data: {x: number,y: number,rotation: number}): void {
		this.setPosition(data.x, data.y);
		this.sprite.rotation = data.rotation;
	}

	scaleEntity (data: {
		x: number,
		y: number
	}): void {
		this.sprite.setScale(data.x, data.y);
	}

	playAnimation(animationId: string): void {
		this.sprite.play(`${this.key}/${animationId}`);
	}

	destroyEntity(): void {
		const entity = this.entity;
		entity.off('transform', this.transformListener);
		this.transformListener = null;
		entity.off('scale', this.scaleListener);
		this.scaleListener = null;
		entity.off('play-animation', this.playAnimationListener);
		this.playAnimationListener = null;
		entity.off('destroy', this.destroyListener);
		this.destroyListener = null;
		this.destroy();
	}
}