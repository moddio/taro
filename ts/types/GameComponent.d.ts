interface EntityData {
	cellSheet: {
		columnCount: number;
		rowCount: number;
		url: string;
	}
}

declare class GameComponent extends IgeEntity {

	data: {
		map: {
			tilesets: {
				image: string;
				name: string;
			}[];
		};
		unitTypes: Record<string, EntityData>;
		projectileTypes: Record<string, EntityData>;
		itemTypes: Record<string, EntityData>;
	}

}
