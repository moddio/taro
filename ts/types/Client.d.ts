declare class Client extends IgeEventingClass {

	myPlayer: IgeEntity;
	selectedUnit: IgeEntity;
	entityUpdateQueue: Record<string, UpdateData[]>;

	phaserLoaded: JQueryDeferred<void>;

	constructor(options?: object);
<<<<<<< HEAD
=======
	entityUpdateQueue: any;
	myPlayer: any; // Player
	selectedUnit: any; // Unit
	isZooming: boolean;
>>>>>>> decouple-pixi-and-game-logic
}
