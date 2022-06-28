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
    function PhaserAttributeBar() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /*private constructor(private unit: PhaserUnit) {

        const scene = unit.scene;

        super(scene);

        const bar = this.bar = scene.add.graphics();
        this.add(bar);

        const text = this.text = scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            color: '#000000',
            align: 'center'
        });
        text.setFontStyle('bold');
        text.setFontSize(14);
        text.setOrigin(0.5);
        this.add(text);

        unit.add(this);
    }*/
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
        /*const sprite = this.unit.sprite;
        this.y = 25 +
            Math.max(sprite.displayHeight, sprite.displayWidth) / 2
            + data.index * h*1.1;
        */
        this.resetFadeOut();
        if ((data.showWhen instanceof Array &&
            data.showWhen.indexOf('valueChanges') > -1) ||
            data.showWhen === 'valueChanges') {
            this.fadeOut();
        }
    };
    PhaserAttributeBar.prototype.fadeOut = function () {
        var _this = this;
        var scene = this.scene;
        this.fadeTimerEvent = scene.time.delayedCall(1000, function () {
            _this.fadeTimerEvent = null;
            _this.fadeTween = scene.tweens.add({
                targets: _this,
                alpha: 0,
                duration: 500,
                onComplete: function () {
                    _this.fadeTween = null;
                    /*const unit = this.unit;
                    if (unit) {

                        const attributes = unit.attributes;
                        const index = attributes.indexOf(this);

                        if (index !== -1) {
                            attributes.splice(index, 1);
                            PhaserAttributeBar.release(this);
                        }
                    }*/
                }
            });
        });
    };
    PhaserAttributeBar.prototype.resetFadeOut = function () {
        // reset fade timer and tween
        if (this.fadeTimerEvent) {
            this.scene.time.removeEvent(this.fadeTimerEvent);
            this.fadeTimerEvent = null;
        }
        if (this.fadeTween) {
            this.fadeTween.remove();
            this.fadeTween = null;
        }
        this.alpha = 1;
    };
    return PhaserAttributeBar;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserAttributeBar.js.map