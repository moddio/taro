declare class Client extends IgeEventingClass {

	constructor(options?: object);

	myPlayer: IgeEntity;
	selectedUnit: IgeEntity;
	entityUpdateQueue: Record<string, UpdateData[]>;

	phaserLoaded: JQueryDeferred<void>;

	isZooming: boolean;
}
