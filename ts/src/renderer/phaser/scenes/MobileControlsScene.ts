type MobileControlKey =
	'movementWheel' |
	'lookWheel' |
	'lookAndFireWheel' |
	string;

class MobileControlsScene extends Phaser.Scene {

	controls: Phaser.GameObjects.Container;
	joysticks: PhaserJoystick[] = [];

	constructor() {
		super({ key: 'MobileControls' });
	}

	init (): void {

		const controls = this.controls = this.add.container();
		this.resize();
		this.scale.on(Phaser.Scale.Events.RESIZE, this.resize, this);

		const joysticks = this.joysticks;

		ige.mobileControls.on('add-control',(
			key: MobileControlKey,
			x: number,
			y: number,
			w: number,
			h: number,
			settings: JoystickSettings
		) => {

			switch (key) {

				case 'movementWheel':
				case 'lookWheel':
				case 'lookAndFireWheel':

					new PhaserJoystick(this, x, y, settings);

					break;

				default:

					const text = key.toUpperCase();

					const button = this.add.image(x, y, 'mobile-button-up')
						.setDisplaySize(w, h)
						.setOrigin(0)
						.setAlpha(0.6);
					controls.add(button);

					if (text === 'BUTTON1') {
						const icon = this.add.image(
							x + w/2, y + h/2,
							'mobile-button-icon'
						);
						icon.setScale(0.5);
						controls.add(icon);
					} else {
						const label = this.add.text(
							x + w/2, y + h/2,
							text,
							{
								fontFamily: 'Arial',
								color: '#ffffff',
								align: 'center'
							});
						label.setFontSize(24);
						label.setOrigin(0.5);
						controls.add(label);
					}

					button.setInteractive();

					let clicked = false;

					button.on('pointerdown', () => {
						if (clicked) return;
						clicked = true;

						button.setTexture('mobile-button-down');

						settings.onStart && settings.onStart();
					});
					const onPointerEnd = () => {
						if (!clicked) return;
						clicked = false;

						button.setTexture('mobile-button-up');

						settings.onEnd && settings.onEnd();
					};
					button.on('pointerup', onPointerEnd);
					button.on('pointerout', onPointerEnd);

					break;
			}
		});

		ige.mobileControls.on('clear-controls', () => {

			joysticks.forEach((j) => {
				j.destroy();
			});
			joysticks.length = 0;

			controls.getAll().forEach((c) => {
				c.destroy();
			});

		});
	}

	preload (): void {

		this.load.image('mobile-button-up',
			'https://cache.modd.io/asset/spriteImage/1549614640644_button1.png');
		this.load.image('mobile-button-down',
			'https://cache.modd.io/asset/spriteImage/1549614658007_button2.png');

		this.load.image('mobile-button-icon',
			'https://cache.modd.io/asset/spriteImage/1610494864771_fightFist_circle.png');
	}

	private resize() {

		const controls = this.controls;
		const scale = this.scale;
		controls.y = scale.height - 540;
		controls.setScale(scale.width / 960);

		this.joysticks.forEach((j) => {
			j.updateTransform();
		});
	}
}
