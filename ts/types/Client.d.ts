declare class Client extends IgeEventingClass {

	myPlayer: IgeEntity;
	selectedUnit: IgeEntity;
	entityUpdateQueue: Record<string, UpdateData[]>;

	phaserLoaded: JQueryDeferred<void>;

	constructor(options?: object);

	isZooming: boolean;
}
