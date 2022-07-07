class PhaserChatBubble extends Phaser.GameObjects.Container {

	private readonly triangle: Phaser.GameObjects.Graphics;
	protected bubble: Phaser.GameObjects.Graphics;
	protected textObject: Phaser.GameObjects.Text;

	protected offset: number;

	private fadeTimerEvent: Phaser.Time.TimerEvent;
	private fadeTween: Phaser.Tweens.Tween;

	constructor(scene: Phaser.Scene, chatText: string, private unit: PhaserUnit) {

		super(scene);

		this.unit = unit;
		this.offset = this.unit.sprite.displayHeight + this.unit.label.displayHeight + 4;

		//draw text
		const text = this.textObject = scene.add.text(
			0,
			0,
			this.trimText(chatText),
			{
				font: '600 24px Arial',
				color: '#ffffff',
				align: 'center'
			}
		);

		// text.setFontSize(11);
		text.setOrigin(0.5);
		text.depth = 1;
		this.textObject.setScale(0.5);

		// draw bubble
		const bubble = this.bubble = scene.add.graphics();
		this.drawBubble();

		// draw triangle
		const triangle = this.triangle = scene.add.graphics();
		const geometry = Phaser.Geom.Triangle.BuildRight(0, 0, 10, 10);
		const rotatedTriangle = Phaser.Geom.Triangle.Rotate(geometry, -Math.PI/4);

		triangle.fillStyle(0x000000, 0.5);
		triangle.fillTriangleShape(rotatedTriangle);

		triangle.x = -2.5;

		triangle.y = this.bubble.y + 14 + 5.85;
		this.x = unit.gameObject.x;
		this.y = unit.gameObject.y - this.offset;

		this.add(triangle);
		this.add(bubble);
		this.add(text);

		this.updateScale();
		scene.add.existing(this);

		this.fadeOut();
	}

	showMessage(chatText: string): void {
		this.textObject.text = this.trimText(chatText);

		this.bubble.clear();
		this.drawBubble();

		this.updateScale();
		this.alpha = 1;

		this.resetFadeOut ();
		this.fadeOut();
	}

	private fadeOut(): void {
		const scene = this.scene;
		this.fadeTimerEvent = scene.time.delayedCall(3000, () => {
			this.fadeTimerEvent = null;
			this.fadeTween = scene.tweens.add({
				targets: this,
				alpha: 0,
				duration: 500,
				onComplete: () => {
					this.fadeTween = null;
					this.setVisible(false);
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
	}

	updateScale(): void {
		this.setScale(1 / this.scene.cameras.main.zoom);
	}

	trimText(chatText: string): string {
		let words = chatText;

		if (words.length > 40) {
			words = words.substring(0, 40);
			words += '...';
		}

		return words;
	}

	drawBubble(): void {
		const bubble = this.bubble;
		const width = this.textObject.width + 20;
		const height = 28;
		const borderRadius = 5;

		bubble.fillStyle(0x000000, 0.5);
		bubble.fillRoundedRect(
			-width / 2,
			-height / 2,
			width * 10 / 20,
			height,
			borderRadius
		);

		bubble.x = this.textObject.x + width / 4;

		bubble.setDepth(0);

		this.setVisible(true);
	}

	update (x, y) {
		this.x = x;
		this.y = y - this.offset;
	}
}
