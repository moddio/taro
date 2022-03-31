class PhaserUnit extends Phaser.GameObjects.Container {

	sprite: Phaser.GameObjects.Sprite;
	label: Phaser.GameObjects.Text;

	private followListener: EvtListener;
	private stopFollowListener: EvtListener;

	private playAnimationListener: EvtListener;

	private updateLabelListener: EvtListener;
	private hideLabelListener: EvtListener;

	constructor (scene: Phaser.Scene,
				 private unit: Unit) {

		super(scene);

		const key = `unit/${unit._stats.type}`;

		const sprite = this.sprite = scene.add.sprite(0, 0, key);
		this.add(sprite);

		const label = this.label = scene.add.text(0, 0, 'cccccc');
		label.setOrigin(0.5);
		this.add(label);

		scene.add.existing(this);

		this.followListener = unit.on('follow', () => {
			console.log('PhaserUnit follow', unit.id()); // TODO remove
			scene.cameras.main.startFollow(this, true, 0.05, 0.05);
		});

		this.stopFollowListener = unit.on('stop-follow', () => {
			console.log('PhaserUnit stop-follow', unit.id()); // TODO remove
			scene.cameras.main.stopFollow();
		});

		this.playAnimationListener =
			unit.on('play-animation', (animationId: string) => {
				console.log('PhaserUnit play-animation', `${key}/${animationId}`);  // TODO remove
				sprite.play(`${key}/${animationId}`);
			});

		this.updateLabelListener =
			unit.on('update-label', (config: {
				text? : string;
				bold?: boolean;
				color?: string;
			}) => {
				console.log('PhaserUnit update-label', unit.id()); // TODO remove
				label.visible = true;

				label.setFontFamily('Verdana');
				label.setFontSize(16);
				label.setFontStyle(config.bold ? 'bold' : 'normal');
				label.setFill(config.color || '#fff');

				const strokeThickness = ige.game.data.settings
					.addStrokeToNameAndAttributes !== false ? 4 : 0;
				label.setStroke('#000', strokeThickness);

				label.setText(config.text || '');

				label.y = -25 -
					Math.max(sprite.displayHeight, sprite.displayWidth) / 2;
				label.setScale(1.25);
			});

		this.hideLabelListener =
			unit.on('hide-label', () => {
				console.log('PhaserUnit hide-label', unit.id()); // TODO remove
				label.visible = false;
			});

		scene.events.on('update', this.update, this);
	}

	update (/*time: number, delta: number*/): void {

		const unit = this.unit;

		if (unit._destroyed) {

			unit.off('follow', this.followListener);
			this.followListener = null;

			unit.off('stop-follow', this.stopFollowListener);
			this.stopFollowListener = null;

			unit.off('play-animation', this.playAnimationListener);
			this.playAnimationListener = null;

			unit.off('update-label', this.updateLabelListener);
			this.updateLabelListener = null;

			unit.off('hide-label', this.hideLabelListener);
			this.hideLabelListener = null;

			this.scene.events.off('update', this.update, this);

			this.destroy();

			return;
		}

		const container = unit._pixiContainer;
		const texture = unit._pixiTexture;
		const sprite = this.sprite;

		this.x = container.x;
		this.y = container.y;

		sprite.rotation = texture.rotation;
		sprite.setScale(texture.scale.x, texture.scale.y);
	}
}
