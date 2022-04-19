class PhaserChatBubble extends Phaser.GameObjects.Container {

	/*private static pool: Phaser.GameObjects.Group;

	static get(unit: PhaserUnit): PhaserAttributeBar {

		if (!this.pool) {
			this.pool = unit.scene.make.group({});
		}

		let bar: PhaserAttributeBar = this.pool.getFirstDead(false);
		if (!bar) {
			bar = new PhaserAttributeBar(unit);
			this.pool.add(bar);
		}
		bar.setActive(true);

		bar.unit = unit;
		unit.add(bar);
		bar.setVisible(true);

		return bar;
	}

	static release (bar: PhaserAttributeBar): void {

		bar.resetFadeOut();

		bar.setVisible(false);
		bar.unit.remove(bar);
		bar.unit = null;

		bar.name = null;

		bar.setActive(false);
	}*/

	private bubble: Phaser.GameObjects.Graphics;
	private readonly text: Phaser.GameObjects.Text;

	offset: number;
	basicWidth: number;

	private fadeTimerEvent: Phaser.Time.TimerEvent;
	private fadeTween: Phaser.Tweens.Tween;

	constructor(scene, chatText: string, private unit: PhaserUnit) {

		super(scene);

		this.unit = unit;

		let words = chatText;
		if (words.length > 40) {
			words = words.substring(0, 40);
			words += '...';
		}
		this.offset = 120;

		//draw text
		const text = this.text = scene.add.text(0, 0, words, {
			fontFamily: 'Arial',
			color: '#ffffff',
			align: 'center'
		});
		//text.setFontStyle('bold');
		text.setFontSize(11);
		text.setOrigin(0.5);

		// draw bubble
		const bubble = this.bubble = scene.add.graphics();
		const width = text.width + 10;
		const height = 25;
		const borderRadius = 5;

		bubble.fillStyle(0x000000, 0.5);
		bubble.fillRoundedRect(
			-width / 2,
			-height / 2,
			width,
			height,
			borderRadius
		);
		bubble.lineStyle(2, 0x000000, 1);
		this.basicWidth = width;

		this.x = unit.x;
		this.y = unit.y - this.offset;

		this.add(bubble);
		this.add(text);
		scene.add.existing(this);

		this.fadeOut();
	}

	showMessage(chatText: string): void {
		let words = chatText;
		if (words.length > 40) {
			words = words.substring(0, 40);
			words += '...';
		}

		//need to change it later - draw new rectangle, instead of resizing
		this.text.text = words;
		const width = this.text.width + 10;
		this.bubble.scaleX = width/this.basicWidth;

		/*this.bubble.clear();
		const bubble = this.bubble = this.scene.add.graphics();
		const width = this.text.width * 2 + 20;
		const height = 25;
		const borderRadius = 5;

		bubble.fillStyle(0x000000, 0.5);
		bubble.fillRoundedRect(
			-width / 2,
			-height / 2,
			width * 10 / 20,
			height,
			borderRadius
		);
		bubble.lineStyle(2, 0x000000, 1);
		//bubble.setOrigin(0.5);
		this.bubble.x = this.text.x + width / 4;
		this.add(bubble);*/

		this.resetFadeOut ();
		this.fadeOut();
	}

	fadeOut(): void {

		const scene = this.scene;

		this.fadeTimerEvent = scene.time.delayedCall(3000, () => {

			this.fadeTimerEvent = null;

			this.fadeTween = scene.tweens.add({
				targets: this,
				alpha: 0,
				duration: 500,
				onComplete: () => {
					this.fadeTween = null;
				}
			});
		});
	}

	private resetFadeOut (): void {
		// reset fade timer and tween
		if (this.fadeTimerEvent) {
			this.scene.time.removeEvent(this.fadeTimerEvent);
			this.fadeTimerEvent = null;
		}
		if (this.fadeTween) {
			this.fadeTween.remove();
			this.fadeTween = null;
		}
		this.alpha = 1;
	}

	update (x, y) {
		this.x = x;
		this.y = y - this.offset;
	}

	/*render (data: AttributeData): void {

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

		this.resetFadeOut();

		if ((data.showWhen instanceof Array &&
			data.showWhen.indexOf('valueChanges') > -1) ||
			data.showWhen === 'valueChanges') {

			this.fadeOut();
		}
	}*/

	/*private fadeOut(): void {

		const scene = this.scene;

		this.fadeTimerEvent = scene.time.delayedCall(1000, () => {

			this.fadeTimerEvent = null;

			this.fadeTween = scene.tweens.add({
				targets: this,
				alpha: 0,
				duration: 500,
				onComplete: () => {

					this.fadeTween = null;

					const unit = this.unit;
					if (unit) {

						const attributes = unit.attributes;
						const index = attributes.indexOf(this);

						if (index !== -1) {
							attributes.splice(index, 1);
							PhaserAttributeBar.release(this);
						}
					}
				}
			});
		});
	}*/

	/*private resetFadeOut (): void {
		// reset fade timer and tween
		if (this.fadeTimerEvent) {
			this.scene.time.removeEvent(this.fadeTimerEvent);
			this.fadeTimerEvent = null;
		}
		if (this.fadeTween) {
			this.fadeTween.remove();
			this.fadeTween = null;
		}
		this.alpha = 1;
	}*/
}
