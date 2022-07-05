class PhaserChatBubble extends Phaser.GameObjects.Container {

	private readonly triangle: Phaser.GameObjects.Graphics;
	protected bubble: Phaser.GameObjects.Graphics;
	protected textObject: Phaser.GameObjects.Text;

	private offset: number;

	private fadeTimerEvent: Phaser.Time.TimerEvent;
	private fadeTween: Phaser.Tweens.Tween;

	constructor(scene: Phaser.Scene, chatText: string, private unit: PhaserUnit) {

		super(scene);

		this.unit = unit;
		this.offset = 120;

		//draw text
		const text = this.textObject = scene.add.text(
			0,
			0,
			this.trimText(chatText),
			{
				fontFamily: 'Arial',
				color: '#ffffff',
				align: 'center'
			}
		);

		text.setFontSize(11);
		text.setOrigin(0.5);
		text.depth = 1;

		// draw bubble
		this.bubble = scene.add.graphics();
		this.createBubble();

		// draw triangle
		const triangle = this.triangle = scene.add.graphics();
		const geometry = Phaser.Geom.Triangle.BuildRight(0, 0, 10, 10);
		const rotatedTriangle = Phaser.Geom.Triangle.Rotate(geometry, -Math.PI/4);
		triangle.fillStyle(0x000000, 0.5);
		triangle.fillTriangleShape(rotatedTriangle);
		triangle.lineStyle(2, 0x000000, 1);
		triangle.x = -2.5;
		triangle.y = 18.5;

		this.x = unit.x;
		this.y = unit.y - this.offset;

		this.add(triangle);
		this.add(text);
		scene.add.existing(this);

		this.fadeOut();
	}

	showMessage(chatText: string): void {
		this.textObject.text = this.trimText(chatText);

		this.bubble.clear();
		this.createBubble();
		
		this.alpha = 1;
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
					this.setVisible(false);
				}
			});
		});
	}

	resetFadeOut (): void {
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

	//need to add scaling
	updateScale(): void {
		/*this.scaleTo(
			1 / ige.pixi.viewport.scale.x,
			1 / ige.pixi.viewport.scale.y,
			1 / ige.pixi.viewport.scale.z
		);*/
	}

	trimText(chatText: string): string {
		let words = chatText;

		if (words.length > 40) {
			words = words.substring(0, 40);
			words += '...';
		}
		
		return words;
	}

	createBubble(): void {
		const bubble = this.bubble;
		const width = this.textObject.width * 2 + 20;
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
		this.bubble.x = this.textObject.x + width / 4;

		bubble.setDepth(0);
		this.add(bubble);


		this.setVisible(true);
	}

	update (x, y) {
		this.x = x;
		this.y = y - this.offset;
	}
}
