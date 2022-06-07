declare class Client extends IgeEventingClass {
	constructor(options?: object);
	entityUpdateQueue: any;
	myPlayer: any; // Player
	selectedUnit: any; // Unit
	isZooming: boolean;
}
