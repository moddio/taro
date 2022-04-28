class PhaserRenderer {

	private game: Phaser.Game;

	constructor () {

		const forceCanvas = JSON.parse(
			localStorage.getItem('forceCanvas')
		) || {};

		this.game = new Phaser.Game({
			type: forceCanvas[gameId] ?
				Phaser.CANVAS : Phaser.AUTO,
			scale: {
				width: ige.pixi.initialWindowWidth,
				height: ige.pixi.initialWindowHeight,
				parent: 'game-div',
				mode: Phaser.Scale.ScaleModes.RESIZE
			},
			render: {
				pixelArt: true,
				transparent: !false,
				mipmapFilter: 'NEAREST'
			},
			scene: [
				GameScene,
				MobileControlsScene
			]
		});
	}
}
