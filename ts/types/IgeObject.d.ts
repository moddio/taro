declare class IgeObject extends IgeEventingClass {

	_pixiContainer: any; // PIXI.Container
	_pixiTexture: any; // PIXI.Sprite

	destroy (): void;

	id (id?: string): this | string;
<<<<<<< HEAD
}
=======
}
>>>>>>> decouple-pixi-and-game-logic
