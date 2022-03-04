class GameScene extends Phaser.Scene {

	constructor() {
		super({ key: 'Game' });
	}

	init (): void {
		// TODO move to css once pixi is gone
		// phaser canvas adjustments
		const canvas = this.game.canvas;
		canvas.style.position = 'fixed';
		canvas.style.opacity = '0.5';
		canvas.style.backgroundColor = 'transparent';
	}

	preload (): void {

	}

	create (): void {
		ige.client.phaserLoaded.resolve();

	}

	update (time: number, delta: number): void {

	}
}
