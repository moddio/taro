class PhaserRegion extends Phaser.GameObjects.Container {

	rectangle: Phaser.GameObjects.Rectangle;
	label: Phaser.GameObjects.Text;

	constructor (scene: Phaser.Scene,
				private region: Region) {

		super(scene);

		// const key = `region/${region._stats.type}`;

		const regionName: string = region._stats.id;
		// add in the RegionUi
		// Phaser classes for vec/pt/rect
		const width: number = region.default.width;
		const points: object[] = [
			{ -(width/2), -(height/2) },
			{ (width/2), -(height/2) },
			{ (width/2), (height/2) },
			{ -(width/2), (height/2) }
		];
		const rectangle = this.rectangle = scene.add.rectangle(0, 0, );

	}
}