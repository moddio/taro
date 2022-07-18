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
var PhaserItem = /** @class */ (function (_super) {
    __extends(PhaserItem, _super);
    function PhaserItem(scene, entity) {
        var _this = _super.call(this, scene, entity, "item/".concat(entity._stats.itemTypeId)) || this;
        _this.gameObject = _this.sprite;
        var translate = entity._translate;
        _this.transform({
            x: translate.x,
            y: translate.y,
            rotation: translate.z
        });
        _this.gameObject.setName('item');
        return _this;
        // this.layer();
    }
    return PhaserItem;
}(PhaserAnimatedEntity));
//# sourceMappingURL=PhaserItem.js.map