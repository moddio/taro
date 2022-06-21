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
var PhaserProjectile = /** @class */ (function (_super) {
    __extends(PhaserProjectile, _super);
    function PhaserProjectile(scene, projectile) {
        var _this = _super.call(this, scene) || this;
        _this.projectile = projectile;
        var key = "projectile/".concat(projectile._stats.type);
        var sprite = _this.sprite = scene.add.sprite(0, 0, key);
        var translate = projectile._translate;
        var bounds = projectile._bounds2d;
        _this.setPosition(translate.x, translate.y);
        sprite.rotation = projectile._rotate.z;
        sprite.setDisplaySize(bounds.x, bounds.y);
        _this.add(sprite);
        scene.add.existing(_this);
        _this.transformListener = projectile.on('transform', function (data) {
            _this.setPosition(data.x, data.y);
            sprite.rotation = data.rotation;
        });
        _this.scaleListener = projectile.on('scale', function (data) {
            sprite.setScale(data.x, data.y);
        });
        _this.playAnimationListener =
            projectile.on('play-animation', function (animationId) {
                sprite.play("".concat(key, "/").concat(animationId));
            });
        _this.destroyListener = projectile.on('destroy', function () {
            projectile.off('transform', _this.transformListener);
            _this.transformListener = null;
            projectile.off('scale', _this.scaleListener);
            _this.scaleListener = null;
            projectile.off('play-animation', _this.playAnimationListener);
            _this.playAnimationListener = null;
            projectile.off('destroy', _this.destroyListener);
            _this.destroyListener = null;
            _this.destroy();
        });
        return _this;
    }
    return PhaserProjectile;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserProjectile.js.map