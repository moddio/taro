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
var PhaserRegion = /** @class */ (function (_super) {
    __extends(PhaserRegion, _super);
    function PhaserRegion(scene, region) {
        var _this = _super.call(this, scene) || this;
        _this.region = region;
        _this.transform();
        scene.add.existing(_this);
        _this.transformListener = region.on('transform', _this.transform, _this, false); // hack for now
        _this.destroyListener = region.on('destroy', function () {
            region.off('transform', _this.transformListener);
            _this.transformListener = null;
            region.off('destroy', _this.destroyListener);
            _this.destroyListener = null;
            _this.destroy();
        });
        return _this;
    }
    PhaserRegion.prototype.transform = function () {
        var stats = this.region._stats.default;
        this.x = stats.x;
        this.y = stats.y;
        this.clear();
        this.fillStyle(Number("0x".concat(stats.inside.substring(1))), stats.alpha / 100 || 0.4);
        this.fillRect(0, 0, stats.width, stats.height);
    };
    return PhaserRegion;
}(Phaser.GameObjects.Graphics));
//# sourceMappingURL=PhaserRegion.js.map