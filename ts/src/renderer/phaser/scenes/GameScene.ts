class GameScene extends Phaser.Scene {

	// TODO remove
	controls: Phaser.Cameras.Controls.FixedKeyControl;

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

		this.load.crossOrigin = 'anonymous';

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

		this.load.tilemapTiledJSON('map', data.map);
	}

	loadEntity (key: string, data: EntityData): void {

		const cellSheet = data.cellSheet;

		if (!cellSheet) { // skip if no cell sheet data
			return;
		}

		this.load.image(key, cellSheet.url);

		if (cellSheet.rowCount === 1 && // skip if not a spritesheet
			cellSheet.columnCount === 1) {
			return;
		}

		this.load.once(`filecomplete-image-${key}`, () => {

			// create spritesheet
			const texture = this.textures.get(key);
			const width = texture.source[0].width;
			const height = texture.source[0].height;
			Phaser.Textures.Parsers.SpriteSheet(
				texture,
				0, 0, 0, width, height,
				{
					frameWidth: width / cellSheet.columnCount,
					frameHeight: height / cellSheet.rowCount,
				}
			);

			// add animations
			for (let animationsKey in data.animations) {

				const animation = data.animations[animationsKey];
				const frames = animation.frames;

				// skip if it's an empty animation
				if (frames.length === 1 && frames[0] === 1) {
					continue;
				}

				const animationFrames: number[] = [];
				for (let i = 0; i < frames.length; i++) {
					// correction for 0-based indexing
					animationFrames.push(frames[i] - 1);
				}

				this.anims.create({
					key: `${key}/${animation.name}`,
					frames: this.anims.generateFrameNumbers(key, {
						frames: animationFrames
					}),
					frameRate: animation.framesPerSecond || 15,
					repeat: (animation.loopCount - 1) // correction for loop/repeat values
				});
			}
		});
	}

	create (): void {
		ige.client.phaserLoaded.resolve();

		const map = this.make.tilemap({ key: 'map' });
		const data = ige.game.data;
		data.map.tilesets.forEach((tileset) => {
			map.addTilesetImage(tileset.name, `tiles/${tileset.name}`);
		});
		data.map.layers.forEach((layer) => {
			if (layer.type !== 'tilelayer') {
				return;
			}
			console.log(layer.name);
			map.createLayer(layer.name, map.tilesets[0], 0, 0);
		});

		this.cameras.main.centerOn(
			map.width * map.tileWidth / 2,
			map.height * map.tileHeight / 2
		);
		this.cameras.main.zoom = this.scale.width / 800;

		const cursors = this.input.keyboard.createCursorKeys();
		this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
			camera: this.cameras.main,
			left: cursors.left,
			right: cursors.right,
			up: cursors.up,
			down: cursors.down,
			speed: 0.5
		});
	}

	update (time: number, delta: number): void {
		this.controls.update(delta);
	}
}
