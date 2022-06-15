declare class IgeEngine extends IgeClass {

	constructor(options: object);

	_renderFrames: number;
	_tickStart: number;
	_renderLatency: number;

	isClient: boolean;
	isServer: boolean;

	isMobile: boolean;

	client: Client;
	server: Client;

	network: IgeNetIoComponent;

	input: IgeInputComponent;

	mobileControls: MobileControlsComponent;

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

	createFrontBuffer (autoSize: boolean, dontScale?: boolean): void
	engineStep (): void;

	$ (item: number | string | object): any;

	lastTickTime: number;

	entitiesToRender: EntitiesToRender;

	_currentTime: number;

	_cullCounter: number;

	$ (item: number | string | object): any;
}
