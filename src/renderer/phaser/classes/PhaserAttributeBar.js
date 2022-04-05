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
var PhaserAttributeBar = /** @class */ (function (_super) {
    __extends(PhaserAttributeBar, _super);
    function PhaserAttributeBar(unit) {
        var _this = this;
        var scene = unit.scene;
        _this = _super.call(this, scene) || this;
        _this.unit = unit;
        var bar = _this.bar = scene.add.graphics();
        _this.add(bar);
        var text = _this.text = scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            color: '#000000',
            align: 'center'
        });
        text.setFontStyle('bold');
        text.setFontSize(14);
        text.setOrigin(0.5);
        _this.add(text);
        unit.add(_this);
        return _this;
    }
    return PhaserAttributeBar;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserAttributeBar.js.map