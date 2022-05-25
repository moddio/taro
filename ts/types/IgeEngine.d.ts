declare class IgeEngine extends IgeClass {

	_renderFrames: number;
	_tickStart: number;
	_renderLatency: number;

	isClient: boolean;
	isServer: boolean;

	client: Client;
	server: Client;

	network: IgeNetworkComponent;

	input: IgeInputComponent;

	gameLoopTickHasExecuted: boolean;

	game: GameComponent;

	pixi: IgeInitPixi;
	phaser: PhaserRenderer;

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

	$ (item: number | string | object): any;
}
