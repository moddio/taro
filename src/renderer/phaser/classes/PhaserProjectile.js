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
        var bounds = projectile._bounds2d;
        sprite.setDisplaySize(bounds.x, bounds.y);
        sprite.rotation = projectile._rotate.z;
        _this.add(sprite);
        scene.add.existing(_this);
        scene.events.on('update', _this.update, _this);
        _this.transformListener = projectile.on('transform', function (info) {
            _this.x = info.x;
            _this.y = info.y;
            _this.sprite.rotation = info.rotation;
        });
        _this.scaleListener = projectile.on('scale', function (info) {
            console.log('scale listener', info);
            _this.sprite.setDisplaySize(info.x, info.y);
        });
        _this.playAnimationListener =
            projectile.on('play-animation', function (animationId) {
                console.log('PhaserProjectile play-animation', "".concat(key, "/").concat(animationId)); // TODO remove
                sprite.play("".concat(key, "/").concat(animationId));
            });
        _this.destroyListener = projectile.on('destroy', function () {
            projectile.off('play-animation', _this.playAnimationListener);
            _this.transformListener = null;
            _this.scaleListener = null;
            _this.playAnimationListener = null;
            _this.destroyListener = null;
            _this.scene.events.off('update', _this.update, _this);
            _this.destroy();
        });
        return _this;
    }
    return PhaserProjectile;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserProjectile.js.map