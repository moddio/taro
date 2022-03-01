var PhaserRenderer = /** @class */ (function () {
    function PhaserRenderer(client) {
        this.client = client;
        this.initialWindowWidth = 800;
        this.initialWindowHeight = 600;
        this.currentZoomValue = 0;
        // TODO box2dDebug
        // TODO world
        // TODO
        this.isUpdateLayersOrderQueued = false;
        // TODO
        this.resizeCount = 0;
        var forceCanvas = JSON.parse(localStorage.getItem('forceCanvas')) || {};
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
    return PhaserRenderer;
}());
//# sourceMappingURL=PhaserRenderer.js.map