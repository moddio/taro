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
        _this.x = translate.x;
        _this.y = translate.y;
        sprite.rotation = projectile._rotate.z;
        sprite.setDisplaySize(bounds.x, bounds.y);
        _this.add(sprite);
        scene.add.existing(_this);
        scene.events.on('update', _this.update, _this);
        _this.transformListener = projectile.on('transform', function (info) {
            _this.x = info.x;
            _this.y = info.y;
            _this.sprite.rotation = info.rotation;
        });
        _this.scaleListener = projectile.on('scale', function (info) {
            _this.sprite.setDisplaySize(info.x, info.y);
        });
        _this.playAnimationListener =
            projectile.on('play-animation', function (animationId) {
                console.log('PhaserProjectile play-animation', "".concat(key, "/").concat(animationId)); // TODO remove
                sprite.play("".concat(key, "/").concat(animationId));
            });
        _this.destroyListener = projectile.on('destroy', function () {
            projectile.off('transform', _this.playAnimationListener);
            _this.transformListener = null;
            projectile.off('scale', _this.playAnimationListener);
            _this.scaleListener = null;
            projectile.off('play-animation', _this.playAnimationListener);
            _this.playAnimationListener = null;
            projectile.off('destroy', _this.playAnimationListener);
            _this.destroyListener = null;
            _this.scene.events.off('update', _this.update, _this);
            _this.destroy();
        });
        return _this;
    }
    return PhaserProjectile;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserProjectile.js.map