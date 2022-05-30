declare class IgeInitPixi extends IgeClass {

	initialWindowWidth: number;
	initialWindowHeight: number;
	viewport: any; // PIXI.Viewport
	resizeQueuedAt: number;
	isUpdateLayersOrderQueued: boolean;
	app: any;
	cull: any;
	resize (): void;
}