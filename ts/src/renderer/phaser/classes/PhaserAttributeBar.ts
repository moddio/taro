class PhaserAttributeBar extends Phaser.GameObjects.Container {

	private static pool: Phaser.GameObjects.Group;

	static get(unit: PhaserUnit): PhaserAttributeBar {

		if (!this.pool) {
			this.pool = unit.scene.make.group({});
			console.info('create PhaserAttributeBar pool'); // TODO remove
		}

		console.info(`PhaserAttributeBar get [${
			this.pool.countActive(false)
		}/${
			this.pool.getLength()
		}]`); // TODO remove

		let bar: PhaserAttributeBar = this.pool.getFirstDead(false);
		if (!bar) {
			bar = new PhaserAttributeBar(unit);
			this.pool.add(bar);
			console.info('PhaserAttributeBar created'); // TODO remove
		}
		bar.setActive(true);

		bar.unit = unit;
		unit.add(bar);
		bar.setVisible(true);

		return bar;
	}

	static release (bar: PhaserAttributeBar): void {
		bar.setVisible(false);
		bar.unit.remove(bar);
		bar.unit = null;
		bar.name = null;
		bar.setActive(false);

		console.info(`PhaserAttributeBar release [${
			this.pool.countActive(false)
		}/${
			this.pool.getLength()
		}]`); // TODO remove
	}

	private readonly bar: Phaser.GameObjects.Graphics;
	private readonly text: Phaser.GameObjects.Text;

	private constructor(private unit: PhaserUnit) {

		const scene = unit.scene;

		super(scene);

		const bar = this.bar = scene.add.graphics();
		this.add(bar);

		const text = this.text = scene.add.text(0, 0, '', {
			fontFamily: 'Arial',
			color: '#000000',
			align: 'center'
		});
		text.setFontStyle('bold');
		text.setFontSize(14);
		text.setOrigin(0.5);
		this.add(text);

		unit.add(this);
	}

	render (data: AttributeData): void {

		this.name = data.type || data.key;

		const bar = this.bar;
		const text = this.text;

		const w = 94;
		const h = 16;
		const borderRadius = h / 2 - 1;

		bar.clear();

		bar.fillStyle(Phaser.Display.Color
			.HexStringToColor(data.color)
			.color);
		bar.fillRoundedRect(
			-w / 2,
			-h / 2,
			w * data.value / data.max,
			h,
			borderRadius
		);

		bar.lineStyle(2, 0x000000, 1);
		bar.strokeRoundedRect(
			-w / 2,
			-h / 2,
			w,
			h,
			borderRadius
		);

		text.setText(data.displayValue ?
			(typeof data.value === 'number' ?
				data.value.toFixed(0) : '0') : '');

		const sprite = this.unit.sprite;
		this.y = 25 +
			Math.max(sprite.displayHeight, sprite.displayWidth) / 2
			+ data.index * h*1.1;

		this.visible = true;

		// TODO reset timer and tween
		this.alpha = 1;

		if ((data.showWhen instanceof Array &&
				data.showWhen.indexOf('valueChanges') > -1) ||
			data.showWhen === 'valueChanges') {

			this.fadeOut();
		}
	}

	private fadeOut(): void {
		// TODO showValueAndFadeOut
		console.log('fadeOut');
	}
}
