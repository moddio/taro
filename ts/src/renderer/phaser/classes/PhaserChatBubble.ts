class PhaserChatBubble extends Phaser.GameObjects.Container {

	private readonly triangle: Phaser.GameObjects.Graphics;
	private readonly bubble: Phaser.GameObjects.Graphics;
	private readonly textObject: Phaser.GameObjects.Text;

	private offset: number;

	private fadeTimerEvent: Phaser.Time.TimerEvent;
	private fadeTween: Phaser.Tweens.Tween;

	constructor(scene: Phaser.Scene, chatText: string, private unit: PhaserUnit) {

		super(scene);
		this.updateOffset();

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
		this.setName('chat bubble');
		scene.add.existing(this);

		this.fadeOut();
	}

	showMessage(chatText: string): void {
		this.textObject.text = this.trimText(chatText);

		this.bubble.clear();
		this.drawBubble();

		this.updateScale();
		this.updateOffset();
		this.y = this.unit.gameObject.y - this.offset;
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

	private updateScale(): void {
		this.setScale(1 / this.scene.cameras.main.zoom);
	}

	private trimText(chatText: string): string {
		if (chatText.length > 40) {
			chatText = chatText.substring(0, 40);
			chatText += '...';
		}

		return chatText;
	}

	private drawBubble(): void {
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

	private updateOffset (): void {
		this.offset =  25 + (this.unit.sprite.displayHeight + this.unit.sprite.displayWidth) / 4 + this.unit.label.displayHeight * 2;
	}

	updatePosition (x: number, y: number): void {
		this.x = x;
		this.y = y - this.offset;
	}
}
