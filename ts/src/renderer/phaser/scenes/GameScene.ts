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

		const data = ige.game.data;

		for (let type in data.unitTypes) {
			this.loadEntity(`unit/${type}`, data.unitTypes[type]);
		}

		for (let type in data.projectileTypes) {
			this.loadEntity(`projectile/${type}`, data.projectileTypes[type]);
		}

		for (let type in data.itemTypes) {
			this.loadEntity(`item/${type}`, data.itemTypes[type]);
		}

		data.map.tilesets.forEach((tileset) => {
			this.load.image(`tiles/${tileset.name}`, tileset.image);
		});
	}

	loadEntity (key: string, data: EntityData): void {

		const cellSheet = data.cellSheet;

		if (!cellSheet) { // skip if no cell sheet data
			return;
		}

		this.load.image(key, cellSheet.url);
	}

	create (): void {
		ige.client.phaserLoaded.resolve();
	}

	update (time: number, delta: number): void {

	}
}
