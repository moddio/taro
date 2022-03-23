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
	type: string;
}
