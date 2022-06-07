declare class IgeEntity extends IgeObject {

	_destroyed: boolean;
	_deathTime: number;
	_category: string; 

	_deathCallBack?: () => void;
	_behaviour?: () => void;

	_processTransform (): void

	isHidden (): boolean;
	getOwnerUnit (): IgeEntity | undefined;
	
	transformTexture (x: number, y: number, z: number, type?: boolean);
}