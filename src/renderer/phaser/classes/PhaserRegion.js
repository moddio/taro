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
    function PhaserRegion(scene, entity) {
        var _this = _super.call(this, entity) || this;
        _this.gameObject = scene.add.graphics();
        _this.gameObject.setName('region');
        scene.layers[4].add(_this.gameObject);
        _this.transform();
        return _this;
    }
    PhaserRegion.prototype.transform = function () {
        var graphics = this.gameObject;
        var stats = this.entity._stats.default;
        graphics.setPosition(stats.x, stats.y);
        graphics.clear();
        graphics.fillStyle(Number("0x".concat(stats.inside.substring(1))), (stats.alpha || 40) / 100);
        graphics.fillRect(0, 0, stats.width, stats.height);
    };
    return PhaserRegion;
}(PhaserEntity));
//# sourceMappingURL=PhaserRegion.js.map