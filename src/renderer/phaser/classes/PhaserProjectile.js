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
        sprite.rotation = projectile._rotate.z;
        sprite.displayWidth = projectile._stats.currentBody.width;
        sprite.displayHeight = projectile._stats.currentBody.height;
        _this.add(sprite);
        scene.add.existing(_this);
        scene.events.on('update', _this.update, _this);
        _this.playAnimationListener =
            projectile.on('play-animation', function (animationId) {
                console.log('PhaserProjectile play-animation', "".concat(key, "/").concat(animationId)); // TODO remove
                sprite.play("".concat(key, "/").concat(animationId));
            });
        return _this;
        //console.log('projectile', projectile._scale, projectile._pixiTexture.scale, projectile._stats.currentBody.width)
    }
    PhaserProjectile.prototype.update = function ( /*time: number, delta: number*/) {
        var projectile = this.projectile;
        //const container = projectile._pixiContainer;
        //const texture = projectile._pixiTexture;
        if (!projectile._alive /*projectile._destroyed || container._destroyed*/) {
            console.log('projectile destroy', projectile);
            projectile.off('play-animation', this.playAnimationListener);
            this.playAnimationListener = null;
            this.scene.events.off('update', this.update, this);
            this.destroy();
            return;
        }
        this.x = projectile._translate.x;
        this.y = projectile._translate.y;
        //this.x = container.x;
        //this.y = container.y;
        var sprite = this.sprite;
        sprite.rotation = projectile._rotate.z; //texture.rotation;
        //sprite.setScale (projectile._scale.x, projectile._scale.y); //texture.scale.x, texture.scale.y);
    };
    return PhaserProjectile;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserProjectile.js.map