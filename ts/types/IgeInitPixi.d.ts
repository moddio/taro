declare class IgeInitPixi extends IgeEventingClass {

	initialWindowWidth: number;
	initialWindowHeight: number;

	viewport: any; // PIXI.Viewport
	mobileControls: any; // PIXI.Container
	resizeQueuedAt: number;
	isUpdateLayersOrderQueued: boolean;

	app: any;
	cull: any;

	resize (): void;
	frameTick (): void;
	show(): void;
}
