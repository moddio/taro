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
        var translate = entity._translate;
        _this.gameObject = scene.add.container(translate.x, translate.y, [_this.sprite]);
        Object.assign(_this.evtListeners, {
            layer: entity.on('layer', _this.layer, _this),
        });
        _this.gameObject.setName('item');
        console.log("layer: ".concat(entity._layer, ", depth: ").concat(entity._depth));
        scene.layers[entity._layer].add(_this.gameObject);
        _this.gameObject.setDepth(entity._depth);
        return _this;
    }
    PhaserItem.prototype.layer = function () {
        console.log("layer: ".concat(this.entity._layer, ", depth: ").concat(this.entity._depth));
        this.scene.layers[this.entity._layer].add(this.gameObject);
        this.gameObject.setDepth(this.entity._depth);
    };
    return PhaserItem;
}(PhaserAnimatedEntity));
//# sourceMappingURL=PhaserItem.js.map