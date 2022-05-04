class PhaserRegion extends Phaser.GameObjects.Container {

	private readonly rectangle: Phaser.GameObjects.Graphics;
	private translateTo: EvtListener;
	//rectangle: Phaser.GameObjects.Rectangle;
	label: Phaser.GameObjects.Text;

	private basicWidth: number;
	private basicHeight: number;

	constructor (scene: Phaser.Scene,
				private region: any) {

		super(scene);

		// draw bubble
		const rectangle = this.rectangle = scene.add.graphics();
		const width = this.basicWidth = region._stats.default.height;
		const height = this.basicHeight = region._stats.default.width;
		console.log('region basics', this.basicWidth, this.basicHeight)

		rectangle.fillStyle(0xFF0000, 0.4);
		rectangle.fillRect(
			0,
			0,
			width,
			height
		);
		//rectangle.lineStyle(2, 0xFF0000, 1);

		this.x = region._stats.default.x;
		this.y = region._stats.default.y;

		this.add(rectangle);
		scene.add.existing(this);

		this.translateTo = region.on('transform-region', (regionTransform) => {
			this.x = regionTransform.x;
			this.y = regionTransform.y;

			//maybe possible to rescale old rectangle instead of creating new one?
			const rectangle = this.rectangle
			rectangle.clear();
			rectangle.fillStyle(0xFF0000, 0.4);
			rectangle.fillRect(
				0,
				0,
				regionTransform.width,
				regionTransform.height
			);
		});

		// const key = `region/${region._stats.type}`;

		//const regionName: string = region._stats.id;
		// add in the RegionUi
		// Phaser classes for vec/pt/rect
		/*const width: number = region.default.width;
		const points: object[] = [
			{ -(width/2), -(height/2) },
			{ (width/2), -(height/2) },
			{ (width/2), (height/2) },
			{ -(width/2), (height/2) }
		];
		const rectangle = this.rectangle = scene.add.rectangle(0, 0, );*/

	}
}