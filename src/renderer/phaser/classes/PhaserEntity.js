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
var PhaserEntity = /** @class */ (function (_super) {
    __extends(PhaserEntity, _super);
    function PhaserEntity(scene, entity) {
        var _this = _super.call(this, scene) || this;
        _this.entity = entity;
        //const key = `projectile/${entity._stats.type}`;
        _this.entity = entity;
        var sprite = _this.sprite = scene.add.sprite(0, 0, null);
        var translate = entity._translate;
        //const bounds = entity._bounds2d;
        _this.setPosition(translate.x, translate.y);
        sprite.rotation = entity._rotate.z;
        //sprite.setDisplaySize(bounds.x, bounds.y);
        _this.add(sprite);
        scene.add.existing(_this);
        _this.transformListener = entity.on('transform', function (data) {
            _this.transformEntity(data);
        });
        _this.scaleListener = entity.on('scale', function (data) {
            _this.scaleEntity(data);
        });
        _this.playAnimationListener = entity.on('play-animation', function (data) {
            _this.playAnimation(data);
        });
        _this.destroyListener = entity.on('destroy', function () {
            _this.destroyEntity();
        });
        return _this;
    }
    PhaserEntity.prototype.transformEntity = function (data) {
        this.setPosition(data.x, data.y);
        this.sprite.rotation = data.rotation;
    };
    PhaserEntity.prototype.scaleEntity = function (data) {
        this.sprite.setScale(data.x, data.y);
    };
    PhaserEntity.prototype.playAnimation = function (animationId) {
        this.sprite.play("".concat(this.key, "/").concat(animationId));
    };
    PhaserEntity.prototype.destroyEntity = function () {
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
    return PhaserEntity;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserEntity.js.map