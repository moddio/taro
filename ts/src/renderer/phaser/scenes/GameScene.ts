class GameScene extends Phaser.Scene {

	constructor() {
		super({ key: 'Game' });
	}

	preload (): void {

	}

	create (): void {
		ige.client.phaserLoaded.resolve();

	}

	update (time: number, delta: number): void {

	}
}
