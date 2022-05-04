declare interface EntityStats {

	name: string;
	currentBody: {
		jointType: string;
	}
	cellSheet: {
		url: string;
	}
	stateId: string;
	states: Record<string, {
		animation: string;
	}>;
	animations: Record<string, {
		frames: number[]
	}>;
	default?: {
		x: number,
		y: number,
		width: number,
		height: number
	}
	type: string;
	id: string;
	itemTypeId?: string;
}
