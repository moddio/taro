abstract class PhaserEntity extends Phaser.GameObjects.Container {

	sprite: Phaser.GameObjects.Sprite;
    key: any;

	private playAnimationListener: EvtListener;
	private transformListener: EvtListener;
	private scaleListener: EvtListener;
	private destroyListener: EvtListener;

	constructor (scene: Phaser.Scene,
				 private entity: IgeEntity) {

		super(scene);

		//const key = `projectile/${entity._stats.type}`;

		const sprite = this.sprite = scene.add.sprite(0, 0, null);
		const translate = entity._translate;
		//const bounds = entity._bounds2d;
		this.setPosition(translate.x, translate.y);
		sprite.rotation = entity._rotate.z;
		//sprite.setDisplaySize(bounds.x, bounds.y);

		this.add(sprite);

		scene.add.existing(this);

		this.transformListener = entity.on('transform', (data: {
			x: number,
			y: number,
			rotation: number
		}) => {
			this.setPosition(data.x, data.y);
			sprite.rotation = data.rotation;
		});

		this.scaleListener = entity.on('scale', (data: {
			x: number,
			y: number
		}) => {
			sprite.setScale(data.x, data.y);
		});

		this.playAnimationListener = entity.on('play-animation', (animationId: string) => {
        	sprite.play(`${this.key}/${animationId}`);
		});

		this.destroyListener = entity.on('destroy', () => {
			entity.off('transform', this.transformListener);
			this.transformListener = null;
			entity.off('scale', this.scaleListener);
			this.scaleListener = null;
			entity.off('play-animation', this.playAnimationListener);
			this.playAnimationListener = null;
			entity.off('destroy', this.destroyListener);
			this.destroyListener = null;
			this.destroy();
		});
	}
}
