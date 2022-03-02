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

	pixi: IgeInitPixi;
	phaser: PhaserRenderer;

	constructor(options: object);

	createFrontBuffer (autoSize: boolean, dontScale?: boolean): void
	engineStep (): void;

	$ (item: number | string | object): any;
}
