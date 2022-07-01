class PhaserFloatingText extends Phaser.GameObjects.Text {

	protected gameObject: Phaser.GameObjects.Container;
	protected entity: Projectile;

	constructor (
		scene: Phaser.Scene,
		data: {
			text: string,
			x: number,
			y: number,
			color: string
		},
		unit: PhaserUnit = null
	) {
		super(scene, data.x, data.y, data.text, { fontFamily: 'Verdana' });

		this.setOrigin(0.5);
		this.setFontSize(16);
		this.setFontStyle('bold');
		this.setFill(data.color || '#fff');

		const strokeThickness = ige.game.data.settings
			.addStrokeToNameAndAttributes !== false ? 4 : 0;
		this.setStroke('#000', strokeThickness);

		if (unit) {
			unit.add(this);
			this.y = -25 -
					Math.max(unit.sprite.displayHeight, unit.sprite.displayWidth) / 2;
		} else {
			scene.add.existing(this);
		}


		let fadeTween = scene.tweens.add({
			targets: this,
			alpha: 0.5,
			duration: 2500,
			y: this.y - 40,
			onComplete: () => {
				fadeTween = null;
				this.destroy();
			}
		});
	}
}