declare class IgePixiAnimation extends IgeClass {

	animating: boolean;
	fpsCount: number;
	fpsSecond: number;
	i: number;

	animationTick (): void;
}
