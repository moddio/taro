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
    PhaserAttributeBar.get = function (unit) {
        if (!this.pool) {
            this.pool = unit.scene.make.group({});
            console.info('create PhaserAttributeBar pool'); // TODO remove
        }
        console.info("PhaserAttributeBar get [".concat(this.pool.countActive(false), "/").concat(this.pool.getLength(), "]")); // TODO remove
        var bar = this.pool.getFirstDead(false);
        if (!bar) {
            bar = new PhaserAttributeBar(unit);
            this.pool.add(bar);
            console.info('PhaserAttributeBar created'); // TODO remove
        }
        bar.setActive(true);
        bar.unit = unit;
        unit.add(bar);
        bar.setVisible(true);
        return bar;
    };
    PhaserAttributeBar.release = function (bar) {
        bar.setVisible(false);
        bar.unit.remove(bar);
        bar.unit = null;
        bar.name = null;
        bar.setActive(false);
        console.info("PhaserAttributeBar release [".concat(this.pool.countActive(false), "/").concat(this.pool.getLength(), "]")); // TODO remove
    };
    PhaserAttributeBar.prototype.render = function (data) {
        this.name = data.type || data.key;
        var bar = this.bar;
        var text = this.text;
        var w = 94;
        var h = 16;
        var borderRadius = h / 2 - 1;
        bar.clear();
        bar.fillStyle(Phaser.Display.Color
            .HexStringToColor(data.color)
            .color);
        bar.fillRoundedRect(-w / 2, -h / 2, w * data.value / data.max, h, borderRadius);
        bar.lineStyle(2, 0x000000, 1);
        bar.strokeRoundedRect(-w / 2, -h / 2, w, h, borderRadius);
        text.setText(data.displayValue ?
            (typeof data.value === 'number' ?
                data.value.toFixed(0) : '0') : '');
        var sprite = this.unit.sprite;
        this.y = 25 +
            Math.max(sprite.displayHeight, sprite.displayWidth) / 2
            + data.index * h * 1.1;
        this.visible = true;
        // TODO reset timer and tween
        this.alpha = 1;
        if ((data.showWhen instanceof Array &&
            data.showWhen.indexOf('valueChanges') > -1) ||
            data.showWhen === 'valueChanges') {
            this.fadeOut();
        }
    };
    PhaserAttributeBar.prototype.fadeOut = function () {
        // TODO showValueAndFadeOut
        console.log('fadeOut');
    };
    return PhaserAttributeBar;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserAttributeBar.js.map