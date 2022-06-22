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
    function PhaserAnimatedEntity(scene, entity) {
        var _this = _super.call(this, scene, entity) || this;
        var sprite = _this.sprite = scene.add.sprite(0, 0, null);
        sprite.rotation = entity._rotate.z;
        _this.add(sprite);
        _this.playAnimationListener = entity.on('play-animation', _this.playAnimation, _this, false);
        return _this;
    }
    PhaserAnimatedEntity.prototype.transformEntity = function (data) {
        this.setPosition(data.x, data.y);
        this.sprite.rotation = data.rotation;
    };
    PhaserAnimatedEntity.prototype.scaleEntity = function (data) {
        this.sprite.setScale(data.x, data.y);
    };
    PhaserAnimatedEntity.prototype.playAnimation = function (animationId) {
        this.sprite.play("".concat(this.key, "/").concat(animationId));
    };
    PhaserAnimatedEntity.prototype.destroyEntity = function () {
        var entity = this.entity;
        entity.off('transform', this.transformListener);
        this.transformListener = null;
        entity.off('scale', this.scaleListener);
        this.scaleListener = null;
        entity.off('play-animation', this.playAnimationListener);
        this.playAnimationListener = null;
        entity.off('destroy', this.destroyListener);
        this.destroyListener = null;
        this.destroy();
    };
    return PhaserAnimatedEntity;
}(PhaserEntity));
//# sourceMappingURL=PhaserAnimatedEntity.js.map