class PhaserChatBubble extends Phaser.GameObjects.Container {

	private readonly triangle: Phaser.GameObjects.Graphics;
	private readonly bubble: Phaser.GameObjects.Graphics;
	private readonly text: Phaser.GameObjects.Text;

	private offset: number;
	private basicWidth: number;

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
		text.setFontSize(11);
		text.setOrigin(0.5);
		text.depth = 1;

		// draw bubble
		const bubble = this.bubble = scene.add.graphics();
		const width = text.width + 10;
		const height = 25;
		const borderRadius = 3;

		bubble.fillStyle(0x000000, 0.5);
		bubble.fillRoundedRect(
			-width / 2,
			-height / 2,
			width,
			height,
			borderRadius
		);
		bubble.lineStyle(2, 0x000000, 1);
		//temporary for bubble scaling after changing text width
		this.basicWidth = width;

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

		//need to change it later - draw new rectangle, instead of resizing, now problem with z-index
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
		bubble.setDepth(0);
		this.bubble.x = this.text.x + width / 4;
		this.add(bubble);*/

		this.setVisible(true);
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
		this.alpha = 1;
	}

	//need to add scaling
	updateScale(): void {
		/*this.scaleTo(
			1 / ige.pixi.viewport.scale.x,
			1 / ige.pixi.viewport.scale.y,
			1 / ige.pixi.viewport.scale.z
		);*/
	}

	update (x, y) {
		this.x = x;
		this.y = y - this.offset;
	}
}
