declare class Client extends IgeClass {

	myPlayer: IgeEntity;
	selectedUnit: IgeEntity;
	entityUpdateQueue: Record<string, UpdateData[]>;

	phaserLoaded: JQueryDeferred<void>;

	constructor(options?: object);
}
