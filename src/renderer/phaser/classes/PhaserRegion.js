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
        // draw rectangle
        var width = _this.width = stats.width;
        var height = _this.height = stats.height;
        _this.fillStyle(0xFF0000, 0.4);
        _this.fillRect(0, 0, width, height);
        _this.x = stats.x;
        _this.y = stats.y;
        scene.add.existing(_this);
        scene.events.on('update', _this.update, _this);
        return _this;
    }
    PhaserRegion.prototype.update = function ( /*time: number, delta: number*/) {
        var region = this.region;
        var container = region.regionUi._pixiContainer;
        if (region._destroyed || container._destroyed) {
            this.scene.events.off('update', this.update, this);
            this.destroy();
            return;
        }
        var stats = this.region._stats.default;
        console.log(stats);
        this.x = stats.x;
        this.y = stats.y;
        if (this.width !== stats.width || this.height !== stats.height) {
            this.width = stats.width;
            this.height = stats.height;
            this.clear();
            this.fillStyle(0xFF0000, 0.4);
            this.fillRect(0, 0, stats.width, stats.height);
        }
    };
    return PhaserRegion;
}(Phaser.GameObjects.Graphics));
//# sourceMappingURL=PhaserRegion.js.map