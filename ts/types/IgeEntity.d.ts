declare class IgeEntity extends IgeObject {

	_destroyed: boolean;
	_deathTime: number;
	_category: string; // TODO more specific values
	_translate: IgePoint3d;
	_rotate: IgePoint3d;
	_stats: EntityStats;

	angleToTarget: number;
	tween: TweenComponent;
	pixianimation: IgePixiAnimation;

	_deathCallBack?: () => void;
	_behaviour?: () => void;

	_processTransform (): void

	isHidden (): boolean;
	getOwnerUnit (): IgeEntity | undefined;
	streamUpdateData (queuedData: UpdateData[]);
	transformPixiEntity (x: number, y: number, z: number, type?: boolean);
}
