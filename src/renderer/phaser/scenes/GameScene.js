var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var GameScene = /** @class */ (function (_super) {
    __extends(GameScene, _super);
    function GameScene() {
        return _super.call(this, { key: 'Game' }) || this;
    }
    GameScene.prototype.init = function () {
        // TODO move to css once pixi is gone
        // phaser canvas adjustments
        var canvas = this.game.canvas;
        canvas.style.position = 'fixed';
        canvas.style.opacity = '0.5';
        canvas.style.backgroundColor = 'transparent';
    };
    GameScene.prototype.preload = function () {
    };
    GameScene.prototype.create = function () {
        ige.client.phaserLoaded.resolve();
    };
    GameScene.prototype.update = function (time, delta) {
    };
    return GameScene;
}(Phaser.Scene));
//# sourceMappingURL=GameScene.js.map