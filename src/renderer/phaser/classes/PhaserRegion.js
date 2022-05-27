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
        // looking at whether to use _stats.default or _stats.currentBody
        // appears the implementation of currentBody for regions is unfinished,
        // but everything we should need for rendering is contained in default.
        //
        // I believe this is an issue unique to 'Region'
        var stats = _this.region._stats.default;
        var width = _this.width = stats.width;
        var height = _this.height = stats.height;
        // Phaser wants a number for these
        _this.fillStyle(Number("0x".concat(stats.inside.substring(1))), stats.alpha / 100 || 0.4);
        _this.fillRect(0, 0, width, height);
        _this.x = stats.x;
        _this.y = stats.y;
        scene.add.existing(_this);
        _this.updateDimensionsListener = region.on('update-region-dimensions', function () {
            var stats = _this.region._stats.default;
            // I didn't want to go too deep on the entity stream/update process, but because of the current logic,
            // if we stream changes to (3) variables, this will fire (3) times.
            console.log("PhaserRegion update ".concat(region._stats.id, " ").concat(region._id)); // TODO: Remove
            _this.x = stats.x;
            _this.y = stats.y;
            _this.width = stats.width;
            _this.height = stats.height;
            _this.clear();
            _this.fillStyle(Number("0x".concat(stats.inside.substring(1))), stats.alpha / 100 || 0.4);
            _this.fillRect(0, 0, stats.width, stats.height);
        });
        scene.events.on('update', _this.update, _this);
        return _this;
    }
    PhaserRegion.prototype.update = function ( /*time: number, delta: number*/) {
        if (this.region._destroyed) {
            this.region.off('update-region-dimensions', this.updateDimensionsListener);
            this.scene.events.off('update', this.update, this);
            this.destroy();
            return;
        }
    };
    return PhaserRegion;
}(Phaser.GameObjects.Graphics));
//# sourceMappingURL=PhaserRegion.js.map