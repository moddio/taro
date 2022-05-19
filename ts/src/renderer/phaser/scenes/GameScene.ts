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

		const camera = this.cameras.main;

		this.scale.on(Phaser.Scale.Events.RESIZE, (
			gameSize: Phaser.Structs.Size,
			baseSize: Phaser.Structs.Size,
			displaySize: Phaser.Structs.Size,
			previousWidth: number,
			previousHeight: number
		) => {
			console.log(Phaser.Scale.Events.RESIZE, // TODO remove
				gameSize, baseSize, displaySize, previousWidth, previousHeight);

			camera.zoom *= gameSize.height / previousHeight;

			/*camera.centerOn(
				camera.scrollX + (gameSize.width - previousWidth) / 2,
				camera.scrollY + (gameSize.height - previousHeight) / 2
			);*/
		});
		this.input.on('pointermove', (pointer)=> {
			ige.client.emit('mouse-move', {x: pointer.worldX, y: pointer.worldY});
		});

		ige.client.on('zoom', (height: number) => {
			console.log('GameScene zoom event', height); // TODO remove

			camera.zoomTo(
				this.scale.height / height,
				1000,
				Phaser.Math.Easing.Quadratic.Out
			);
		});

		ige.client.on('create-unit', (unit: Unit) => {
			console.log('create-unit', unit); // TODO remove
			new PhaserUnit(this, unit);
		});

		ige.client.on('create-item', (item: Item) => {
			console.log('create-item', item); // TODO remove
			new PhaserItem(this, item);
		});

		ige.client.on('create-projectile', (projectile: Projectile) => {
			console.log('create-projectile', projectile); // TODO remove
			new PhaserProjectile(this, projectile);
		});

		ige.client.on('create-region', (region: Region) => {
			console.log('create-region', region); // TODO remove
			new PhaserRegion(this, region);
		});
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

		this.load.once(`filecomplete-image-${key}`, () => {

			// create spritesheet,
			// even if it has only one sprite
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

		this.load.image(key, cellSheet.url);
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

		const camera = this.cameras.main;
		camera.centerOn(
			map.width * map.tileWidth / 2,
			map.height * map.tileHeight / 2
		);
		camera.zoom = this.scale.width / 800;
	}
}
