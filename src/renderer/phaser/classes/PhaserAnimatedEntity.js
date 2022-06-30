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
        var bounds = entity._bounds2d;
        var sprite = _this.sprite = scene.add.sprite(0, 0, key);
        sprite.setDisplaySize(bounds.x, bounds.y);
        sprite.rotation = entity._rotate.z;
        Object.assign(_this.evtListeners, {
            'play-animation': entity.on('play-animation', _this.playAnimation, _this),
            width: entity.on('width', _this.width, _this),
            height: entity.on('height', _this.height, _this)
        });
        return _this;
    }
    PhaserAnimatedEntity.prototype.playAnimation = function (animationId) {
        this.sprite.play("".concat(this.key, "/").concat(animationId));
    };
    PhaserAnimatedEntity.prototype.hide = function () {
        _super.prototype.hide.call(this);
        this.sprite.setVisible(false);
    };
    PhaserAnimatedEntity.prototype.show = function () {
        _super.prototype.show.call(this);
        this.sprite.setVisible(true);
    };
    PhaserAnimatedEntity.prototype.width = function (width) {
        var _a;
        if ((_a = this.sprite) === null || _a === void 0 ? void 0 : _a.displayHeight) {
            this.sprite.setDisplaySize(width, this.sprite.displayHeight);
        }
    };
    PhaserAnimatedEntity.prototype.height = function (height) {
        var _a;
        if ((_a = this.sprite) === null || _a === void 0 ? void 0 : _a.displayWidth) {
            this.sprite.setDisplaySize(this.sprite.displayWidth, height);
        }
    };
    PhaserAnimatedEntity.prototype.destroy = function () {
        this.sprite = null;
        _super.prototype.destroy.call(this);
    };
    return PhaserAnimatedEntity;
}(PhaserEntity));
//# sourceMappingURL=PhaserAnimatedEntity.js.map