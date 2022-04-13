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
var PhaserItem = /** @class */ (function (_super) {
    __extends(PhaserItem, _super);
    function PhaserItem(scene, item) {
        var _this = _super.call(this, scene) || this;
        _this.item = item;
        var key = "item/".concat(item._stats.itemTypeId);
        var sprite = _this.sprite = scene.add.sprite(0, 0, key);
        _this.add(sprite);
        scene.add.existing(_this);
        _this.playAnimationListener =
            item.on('play-animation', function (animationId) {
                console.log('PhaserItem play-animation', "".concat(key, "/").concat(animationId)); // TODO remove
                sprite.play("".concat(key, "/").concat(animationId));
            });
        scene.events.on('update', _this.update, _this);
        return _this;
    }
    PhaserItem.prototype.update = function ( /*time: number, delta: number*/) {
        var item = this.item;
        var container = item._pixiContainer;
        var texture = item._pixiTexture;
        if (item._destroyed || container._destroyed) {
            item.off('play-animation', this.playAnimationListener);
            this.playAnimationListener = null;
            this.scene.events.off('update', this.update, this);
            this.sprite = null;
            this.destroy();
            return;
        }
        this.x = container.x;
        this.y = container.y;
        var sprite = this.sprite;
        sprite.rotation = texture.rotation;
        sprite.setScale(texture.scale.x, texture.scale.y);
    };
    return PhaserItem;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserItem.js.map