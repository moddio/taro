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
        _this.offset = 120;
        //draw text
        var text = _this.textObject = scene.add.text(0, 0, _this.trimText(chatText), {
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        text.setFontSize(11);
        text.setOrigin(0.5);
        text.depth = 1;
        // draw bubble
        _this.bubble = scene.add.graphics();
        _this.createBubble();
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
        _this.add(text);
        scene.add.existing(_this);
        _this.fadeOut();
        return _this;
    }
    PhaserChatBubble.prototype.showMessage = function (chatText) {
        this.textObject.text = this.trimText(chatText);
        this.bubble.clear();
        this.createBubble();
        this.alpha = 1;
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
                    _this.setVisible(false);
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
    };
    //need to add scaling
    PhaserChatBubble.prototype.updateScale = function () {
        /*this.scaleTo(
            1 / ige.pixi.viewport.scale.x,
            1 / ige.pixi.viewport.scale.y,
            1 / ige.pixi.viewport.scale.z
        );*/
    };
    PhaserChatBubble.prototype.trimText = function (chatText) {
        var words = chatText;
        if (words.length > 40) {
            words = words.substring(0, 40);
            words += '...';
        }
        return words;
    };
    PhaserChatBubble.prototype.createBubble = function () {
        var bubble = this.bubble;
        var width = this.textObject.width * 2 + 20;
        var height = 25;
        var borderRadius = 5;
        bubble.fillStyle(0x000000, 0.5);
        bubble.fillRoundedRect(-width / 2, -height / 2, width * 10 / 20, height, borderRadius);
        bubble.lineStyle(2, 0x000000, 1);
        this.bubble.x = this.textObject.x + width / 4;
        bubble.setDepth(0);
        this.add(bubble);
        this.setVisible(true);
    };
    PhaserChatBubble.prototype.update = function (x, y) {
        this.x = x;
        this.y = y - this.offset;
    };
    return PhaserChatBubble;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserChatBubble.js.map