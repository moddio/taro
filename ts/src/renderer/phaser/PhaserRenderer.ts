class PhaserRenderer implements Renderer {

	private game: Phaser.Game;

	private initialWindowWidth = 800;
	private initialWindowHeight = 600;
	private currentZoomValue = 0;

	// TODO box2dDebug
	// TODO world

	// TODO
	private isUpdateLayersOrderQueued = false;

	// TODO
	private resizeCount = 0;

	constructor (
		private client: Client
	) {

		const forceCanvas = JSON.parse(
			localStorage.getItem('forceCanvas')
		) || {};

		this.game = new Phaser.Game({
			type: forceCanvas[gameId] ?
				Phaser.CANVAS : Phaser.AUTO,
			scale: {
				width: this.initialWindowWidth,
				height: this.initialWindowHeight,
				parent: 'game-div',
				mode: Phaser.Scale.ScaleModes.RESIZE
			},
			render: {
				pixelArt: true,
				transparent: false,
				mipmapFilter: 'NEAREST',
			},
			scene: [
				GameScene,
				MobileControlsScene
			]
		});
		this.game.canvas.id = 'igeFrontBuffer';

		// TODO check if necessary
		ige.createFrontBuffer(true);
	}
}
