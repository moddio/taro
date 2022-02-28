declare class IgePixiAnimation extends IgeClass {

	animating: boolean;
	fpsCount: number;
	fpsSecond: number;

	animationTick (): void;
}
