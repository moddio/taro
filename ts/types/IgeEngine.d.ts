declare class IgeEngine extends IgeClass {

	_renderFrames: number;
	_tickStart: number;
	_renderLatency: number;

	isClient: boolean;
	isServer: boolean;

	client: Client;
	server: Client;

	input: IgeInputComponent;

	pixi: IgeInitPixi;

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

	entitiesToRender: EntitiesToRender;

	_currentTime: number;

	_cullCounter: number;

	network: any; //IgeNetIoComponent?

	gameLoopTickHasExecuted: boolean;

	$ (item: number | string | object): any;
}