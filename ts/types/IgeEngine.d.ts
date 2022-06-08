declare class IgeEngine extends IgeClass {

	_renderFrames: number;
	_tickStart: number;
	_renderLatency: number;

	isClient: boolean;
	isServer: boolean;

	client: Client;
	server: Client;

<<<<<<< HEAD
	network: IgeNetworkComponent;

	input: IgeInputComponent;

	gameLoopTickHasExecuted: boolean;

	game: GameComponent;

	pixi: IgeInitPixi;
	phaser: PhaserRenderer;
=======
	input: IgeInputComponent;

	pixi: IgeInitPixi;
>>>>>>> decouple-pixi-and-game-logic

	scaleMapDetails: {
		scaleFactor: {
			x: number;
			y: number;
		};
		shouldScaleTilesheet: boolean;
		tileWidth: number;
		tileHeight: number;
		originalTileHeight: number;
		originalTileWidth: number;
	};

	constructor(options: object);

	createFrontBuffer (autoSize: boolean, dontScale?: boolean): void
	engineStep (): void;

	lastTickTime: number;

	entityTrack: EntityTrack;

	_currentTime: number;

	_cullCounter: number;

	$ (item: number | string | object): any;
}
