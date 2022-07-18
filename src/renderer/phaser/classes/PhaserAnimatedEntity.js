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
var PhaserAnimatedEntity = /** @class */ (function (_super) {
    __extends(PhaserAnimatedEntity, _super);
    function PhaserAnimatedEntity(scene, entity, key) {
        var _this = _super.call(this, entity) || this;
        _this.key = key;
        _this.scene = scene;
        var bounds = entity._bounds2d;
        var sprite = _this.sprite = scene.add.sprite(0, 0, key);
        sprite.setDisplaySize(bounds.x, bounds.y);
        sprite.rotation = entity._rotate.z;
        Object.assign(_this.evtListeners, {
            'play-animation': entity.on('play-animation', _this.playAnimation, _this),
            size: entity.on('size', _this.size, _this),
            layer: entity.on('layer', _this.layer, _this)
        });
        return _this;
    }
    PhaserAnimatedEntity.prototype.playAnimation = function (animationId) {
        this.sprite.play("".concat(this.key, "/").concat(animationId));
    };
    PhaserAnimatedEntity.prototype.transform = function (data) {
        this.gameObject.setPosition(data.x, data.y);
        this.sprite.rotation = data.rotation;
    };
    PhaserAnimatedEntity.prototype.size = function (data) {
        this.sprite.setDisplaySize(data.width, data.height);
    };
    PhaserAnimatedEntity.prototype.layer = function () {
        console.log("layer: ".concat(this.entity._layer, ", depth: ").concat(this.entity._depth));
        this.scene.layers[this.entity._layer].add(this.gameObject);
        this.gameObject.setDepth(this.entity._depth);
    };
    PhaserAnimatedEntity.prototype.destroy = function () {
        this.sprite = null;
        _super.prototype.destroy.call(this);
    };
    return PhaserAnimatedEntity;
}(PhaserEntity));
//# sourceMappingURL=PhaserAnimatedEntity.js.map