class GameScene extends PhaserScene {

	private zoomSize: number;

	entityLayers: Phaser.GameObjects.Layer[] = [];

	constructor() {
		super({ key: 'Game' });
	}

	init (): void {
		// TODO move to css once pixi is gone
		// phaser canvas adjustments
		const canvas = this.game.canvas;
		canvas.style.position = 'fixed';
		canvas.style.opacity = '1';
		canvas.style.backgroundColor = 'transparent';
		//canvas.style.pointerEvents = 'none'; // TODO remove after pixi is gone

		if (ige.isMobile) {
			this.scene.launch('MobileControls');
		}

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

			if (this.zoomSize) {
				camera.zoom = this.calculateZoom();
			}
		});

		ige.client.on('zoom', (height: number) => {
			console.log('GameScene zoom event', height); // TODO remove

			this.setZoomSize(height);

			camera.zoomTo(
				this.calculateZoom(),
				1000,
				Phaser.Math.Easing.Quadratic.Out,
				true
			);
		});

		this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
			ige.input.emit('pointermove', [{
				x: pointer.worldX,
				y: pointer.worldY
			}]);
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

		ige.client.on('floating-text', (data: {
			text: string,
			x: number,
			y: number,
			color: string
		}) => {
			console.log('create-floating-text', data); // TODO remove
			new PhaserFloatingText(this, data);
		});
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
			const key = `tiles/${tileset.name}`;
			this.load.once(`filecomplete-image-${key}`, () => {
				const texture = this.textures.get(key);
				const canvas = this.extrude(tileset,
					texture.getSourceImage() as HTMLImageElement
				);
				if (canvas) {
					this.textures.remove(texture);
					this.textures.addCanvas(`extruded-${key}`, canvas);
				}
			});
			this.load.image(key, this.patchAssetUrl(tileset.image));
		});

		this.load.tilemapTiledJSON('map', this.patchMapData(data.map));
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
					key: `${key}/${animationsKey}`,
					frames: this.anims.generateFrameNumbers(key, {
						frames: animationFrames
					}),
					frameRate: animation.framesPerSecond || 15,
					repeat: (animation.loopCount - 1) // correction for loop/repeat values
				});
			}
		});

		this.load.image(key, this.patchAssetUrl(cellSheet.url));
	}

	create (): void {
		ige.client.phaserLoaded.resolve();

		const map = this.make.tilemap({ key: 'map' });
		const data = ige.game.data;
		const scaleFactor = ige.scaleMapDetails.scaleFactor;

		data.map.tilesets.forEach((tileset) => {
			const key = `tiles/${tileset.name}`;
			const extrudedKey = `extruded-${key}`;
			if (this.textures.exists(extrudedKey)) {
				map.addTilesetImage(tileset.name, extrudedKey,
					tileset.tilewidth, tileset.tileheight,
					(tileset.margin || 0) + 1,
					(tileset.spacing || 0) + 2
				);
			} else {
				map.addTilesetImage(tileset.name, key);
			}
		});

		const entityLayers = this.entityLayers;
		data.map.layers.forEach((layer) => {

			/**
			 * Tile Layers
			 *
			 * [0] floor
			 * [1] floor2
			 * [2] debris
			 * [3] walls
			 * [4] trees
			 */

			if (layer.type === 'tilelayer') {
				const tileLayer = map.createLayer(layer.name, map.tilesets, 0, 0);
				tileLayer.setScale(scaleFactor.x, scaleFactor.y);
			}

			entityLayers.push(this.add.layer());
		});

		/**
		 * Entity Layers
		 *
		 * [0] floor
		 * [1] floor2
		 * [2] walls (swapped)
		 * [3] debris (swapped)
		 * [4] trees
		 */

		// taro expects 'debris' entity layer to be in front of 'walls'
		// entity layer, so we need to swap them for backwards compatibility
		const debrisLayer = entityLayers[2];
		const wallsLayer = entityLayers[3];
		entityLayers[2] = wallsLayer;
		entityLayers[3] = debrisLayer;
		this.children.moveAbove(<any>debrisLayer, <any>wallsLayer);

		const camera = this.cameras.main;
		camera.centerOn(
			map.width * map.tileWidth / 2 * scaleFactor.x,
			map.height * map.tileHeight / 2 * scaleFactor.y
		);
	}

	private setZoomSize (height: number): void {
		// backward compatible game scaling on average 16:9 screen
		this.zoomSize = height * 2.15;
	}

	private calculateZoom(): number {
		const { width, height } = this.scale;
		return Math.max(width, height) / this.zoomSize;
	}

	private patchMapData (map: GameComponent['data']['map']): typeof map {

		/**
		 * map data gets patched in place
		 * to not make a copy of a huge object
		 **/

		const tilecount = map.tilesets[0].tilecount;

		map.layers.forEach((layer) => {

			if (layer.type !== 'tilelayer') {
				return;
			}

			for (let i = 0; i < layer.data.length; i++) {

				const value = layer.data[i];

				if (value > tilecount) {

					console.warn(`map data error: layer[${
						layer.name
					}], index[${
						i
					}], value[${
						value
					}].`);

					layer.data[i] = 0;
				}
			}
		});

		return map;
	}

	private extrude (
		tileset: ArrayElement<GameComponent['data']['map']['tilesets']>,
		sourceImage: HTMLImageElement,
		extrusion = 1,
		color = '#ffffff00'
	): HTMLCanvasElement {

		const { tilewidth, tileheight, margin = 0, spacing = 0 } = tileset;
		const { width, height } = sourceImage;

		const cols = (width - 2 * margin + spacing) / (tilewidth + spacing);
		const rows = (height - 2 * margin + spacing) / (tileheight + spacing);

		if (!Number.isInteger(cols) || !Number.isInteger(rows)) {
			console.warn(
				'Non-integer number of rows or cols found while extruding. ' +
				`Tileset "${tileset.name}" image doesn't match the specified parameters. ` +
				'Double check your margin, spacing, tilewidth and tileheight.'
			);
			return null;
		}

		const newWidth = 2 * margin + (cols - 1) * spacing + cols * (tilewidth + 2 * extrusion);
		const newHeight = 2 * margin + (rows - 1) * spacing + rows * (tileheight + 2 * extrusion);

		const canvas = document.createElement('canvas');
		canvas.width = newWidth;
		canvas.height = newHeight;

		const ctx = canvas.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		ctx.fillStyle = color;
		ctx.fillRect(0, 0, newWidth, newHeight);

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				let srcX = margin + col * (tilewidth + spacing);
				let srcY = margin + row * (tileheight + spacing);
				let destX = margin + col * (tilewidth + spacing + 2 * extrusion);
				let destY = margin + row * (tileheight + spacing + 2 * extrusion);
				const tw = tilewidth;
				const th = tileheight;

				// Copy the tile.
				ctx.drawImage(sourceImage,
					srcX, srcY,
					tw, th,
					destX + extrusion,
					destY + extrusion,
					tw, th
				);

				// Extrude the top row.
				ctx.drawImage(sourceImage,
					srcX, srcY,
					tw, 1,
					destX + extrusion, destY,
					tw, extrusion
				);

				// Extrude the bottom row.
				ctx.drawImage(sourceImage,
					srcX, srcY + th - 1,
					tw, 1,
					destX + extrusion,
					destY + extrusion + th,
					tw, extrusion
				);

				// Extrude left column.
				ctx.drawImage(sourceImage,
					srcX, srcY,
					1, th,
					destX,
					destY + extrusion,
					extrusion, th
				);

				// Extrude the right column.
				ctx.drawImage(sourceImage,
					srcX + tw - 1,
					srcY,
					1, th,
					destX + extrusion + tw,
					destY + extrusion,
					extrusion, th
				);

				// Extrude the top left corner.
				ctx.drawImage(sourceImage,
					srcX, srcY, 1, 1,
					destX, destY, extrusion, extrusion
				);

				// Extrude the top right corner.
				ctx.drawImage(sourceImage,
					srcX + tw - 1,
					srcY,
					1, 1,
					destX + extrusion + tw,
					destY,
					extrusion, extrusion
				);

				// Extrude the bottom left corner.
				ctx.drawImage(sourceImage,
					srcX,
					srcY + th - 1,
					1, 1,
					destX,
					destY + extrusion + th,
					extrusion, extrusion
				);

				// Extrude the bottom right corner.
				ctx.drawImage(sourceImage,
					srcX + tw - 1,
					srcY + th - 1,
					1, 1,
					destX + extrusion + tw,
					destY + extrusion + th,
					extrusion, extrusion
				);
			}
		}

		return canvas;
	}
}
