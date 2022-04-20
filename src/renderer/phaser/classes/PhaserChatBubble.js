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
var PhaserChatBubble = /** @class */ (function (_super) {
    __extends(PhaserChatBubble, _super);
    function PhaserChatBubble(scene, chatText, unit) {
        var _this = _super.call(this, scene) || this;
        _this.unit = unit;
        _this.unit = unit;
        var words = chatText;
        if (words.length > 40) {
            words = words.substring(0, 40);
            words += '...';
        }
        _this.offset = 120;
        //draw text
        var text = _this.text = scene.add.text(0, 0, words, {
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        text.setFontSize(11);
        text.setOrigin(0.5);
        text.depth = 1;
        // draw bubble
        var bubble = _this.bubble = scene.add.graphics();
        var width = text.width + 10;
        var height = 25;
        var borderRadius = 3;
        bubble.fillStyle(0x000000, 0.5);
        bubble.fillRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        bubble.lineStyle(2, 0x000000, 1);
        //temporary for bubble scaling after changing text width
        _this.basicWidth = width;
        // draw triangle
        var triangle = _this.triangle = scene.add.graphics();
        var geometry = Phaser.Geom.Triangle.BuildRight(0, 0, 10, 10);
        var rotatedTriangle = Phaser.Geom.Triangle.Rotate(geometry, -Math.PI / 4);
        triangle.fillStyle(0x000000, 0.5);
        triangle.fillTriangleShape(rotatedTriangle);
        triangle.lineStyle(2, 0x000000, 1);
        triangle.x = -2.5;
        triangle.y = 18.5;
        _this.x = unit.x;
        _this.y = unit.y - _this.offset;
        _this.add(triangle);
        _this.add(bubble);
        _this.add(text);
        scene.add.existing(_this);
        _this.fadeOut();
        return _this;
    }
    PhaserChatBubble.prototype.showMessage = function (chatText) {
        var words = chatText;
        if (words.length > 40) {
            words = words.substring(0, 40);
            words += '...';
        }
        //need to change it later - draw new rectangle, instead of resizing, now problem with z-index
        this.text.text = words;
        var width = this.text.width + 10;
        this.bubble.scaleX = width / this.basicWidth;
        /*this.bubble.clear();
        const bubble = this.bubble = this.scene.add.graphics();
        const width = this.text.width * 2 + 20;
        const height = 25;
        const borderRadius = 5;

        bubble.fillStyle(0x000000, 0.5);
        bubble.fillRoundedRect(
            -width / 2,
            -height / 2,
            width * 10 / 20,
            height,
            borderRadius
        );
        bubble.lineStyle(2, 0x000000, 1);
        bubble.setDepth(0);
        this.bubble.x = this.text.x + width / 4;
        this.add(bubble);*/
        this.resetFadeOut();
        this.fadeOut();
    };
    PhaserChatBubble.prototype.fadeOut = function () {
        var _this = this;
        var scene = this.scene;
        this.fadeTimerEvent = scene.time.delayedCall(3000, function () {
            _this.fadeTimerEvent = null;
            _this.fadeTween = scene.tweens.add({
                targets: _this,
                alpha: 0,
                duration: 500,
                onComplete: function () {
                    _this.fadeTween = null;
                }
            });
        });
    };
    PhaserChatBubble.prototype.resetFadeOut = function () {
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
    //need to add scaling
    PhaserChatBubble.prototype.updateScale = function () {
        /*this.scaleTo(
            1 / ige.pixi.viewport.scale.x,
            1 / ige.pixi.viewport.scale.y,
            1 / ige.pixi.viewport.scale.z
        );*/
    };
    PhaserChatBubble.prototype.update = function (x, y) {
        this.x = x;
        this.y = y - this.offset;
    };
    return PhaserChatBubble;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserChatBubble.js.map