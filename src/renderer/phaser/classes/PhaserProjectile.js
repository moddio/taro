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
    /*sprite: Phaser.GameObjects.Sprite;

    private playAnimationListener: EvtListener;
    private transformListener: EvtListener;
    private scaleListener: EvtListener;
    private destroyListener: EvtListener;*/
    function PhaserProjectile(scene, projectile) {
        var _this = _super.call(this, scene, projectile) || this;
        _this.projectile = projectile;
        var key = _this.key = "projectile/".concat(projectile._stats.type);
        _this.sprite.setTexture(key);
        var bounds = projectile._bounds2d;
        _this.sprite.setDisplaySize(bounds.x, bounds.y);
        return _this;
        /*const translate = projectile._translate;
        const bounds = projectile._bounds2d;
        this.setPosition(translate.x, translate.y);
        sprite.rotation = projectile._rotate.z;
        sprite.setDisplaySize(bounds.x, bounds.y);

        this.add(sprite);

        scene.add.existing(this);

        this.transformListener = projectile.on('transform', (data: {
            x: number,
            y: number,
            rotation: number
        }) => {
            this.setPosition(data.x, data.y);
            sprite.rotation = data.rotation;
        });

        this.scaleListener = projectile.on('scale', (data: {
            x: number,
            y: number
        }) => {
            sprite.setScale(data.x, data.y);
        });

        this.playAnimationListener =
            projectile.on('play-animation', (animationId: string) => {
                sprite.play(`${key}/${animationId}`);
            });

        this.destroyListener = projectile.on('destroy', () => {
            projectile.off('transform', this.transformListener);
            this.transformListener = null;
            projectile.off('scale', this.scaleListener);
            this.scaleListener = null;
            projectile.off('play-animation', this.playAnimationListener);
            this.playAnimationListener = null;
            projectile.off('destroy', this.destroyListener);
            this.destroyListener = null;
            this.destroy();
        });*/
    }
    return PhaserProjectile;
}(PhaserAnimatedEntity));
//# sourceMappingURL=PhaserProjectile.js.map