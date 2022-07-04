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
var PhaserUnit = /** @class */ (function (_super) {
    __extends(PhaserUnit, _super);
    function PhaserUnit(scene, unit) {
        var _this = _super.call(this, scene) || this;
        _this.unit = unit;
        _this.attributes = [];
        var key = "unit/".concat(unit._stats.type);
        var sprite = _this.sprite = scene.add.sprite(0, 0, key);
        _this.add(sprite);
        var label = _this.label = scene.add.text(0, 0, 'cccccc');
        label.setOrigin(0.5);
        _this.add(label);
        scene.add.existing(_this);
        _this.followListener = unit.on('follow', function () {
            console.log('PhaserUnit follow', unit.id()); // TODO remove
            var camera = scene.cameras.main;
            if (camera._follow === _this) {
                return;
            }
            camera.startFollow(_this, true, 0.05, 0.05);
        });
        _this.stopFollowListener = unit.on('stop-follow', function () {
            console.log('PhaserUnit stop-follow', unit.id()); // TODO remove
            scene.cameras.main.stopFollow();
        });
        _this.playAnimationListener =
            unit.on('play-animation', function (animationId) {
                console.log('PhaserUnit play-animation', "".concat(key, "/").concat(animationId)); // TODO remove
                sprite.play("".concat(key, "/").concat(animationId));
            });
        _this.updateLabelListener =
            unit.on('update-label', function (config) {
                console.log('PhaserUnit update-label', unit.id()); // TODO remove
                label.visible = true;
                label.setFontFamily('Verdana');
                label.setFontSize(16);
                label.setFontStyle(config.bold ? 'bold' : 'normal');
                label.setFill(config.color || '#fff');
                var strokeThickness = ige.game.data.settings
                    .addStrokeToNameAndAttributes !== false ? 4 : 0;
                label.setStroke('#000', strokeThickness);
                label.setText(config.text || '');
                label.y = -25 -
                    Math.max(sprite.displayHeight, sprite.displayWidth) / 2;
                label.setScale(1.25);
            });
        _this.hideLabelListener =
            unit.on('hide-label', function () {
                console.log('PhaserUnit hide-label', unit.id()); // TODO remove
                label.visible = false;
            });
        _this.fadingTextListener =
            unit.on('fading-text', function (config) {
                console.log('PhaserUnit fading-text', unit.id()); // TODO remove
                var data = {
                    text: config.text || '',
                    x: 0,
                    y: 0,
                    color: config.color || '#fff'
                };
                new PhaserFloatingText(_this.scene, data, _this);
            });
        var attributes = _this.attributes;
        _this.renderAttributesListener =
            unit.on('render-attributes', function (data) {
                console.log('PhaserUnit render-attributes', data); // TODO remove
                // release all existing attribute bars
                attributes.forEach(function (a) {
                    PhaserAttributeBar.release(a);
                });
                attributes.length = 0;
                // add attribute bars based on passed data
                data.attrs.forEach(function (ad) {
                    var a = PhaserAttributeBar.get(_this);
                    a.render(ad);
                    attributes.push(a);
                });
            });
        _this.updateAttributeListener =
            unit.on('update-attribute', function (data) {
                console.log('PhaserUnit update-attribute', data); // TODO remove
                var a;
                var i = 0;
                for (; i < attributes.length; i++) {
                    if (attributes[i].name === data.attr.type) {
                        a = attributes[i];
                        break;
                    }
                }
                if (!data.shouldRender) {
                    if (a) {
                        PhaserAttributeBar.release(a);
                        attributes.splice(i, 1);
                    }
                    return;
                }
                if (!a) {
                    a = PhaserAttributeBar.get(_this);
                    attributes.push(a);
                }
                a.render(data.attr);
            });
        _this.renderChatListener = unit.on('render-chat-bubble', function (text) {
            console.log('create-chat', text); // TODO remove
            if (_this.chat) {
                _this.chat.showMessage(text);
            }
            else {
                _this.chat = new PhaserChatBubble(scene, text, _this);
            }
        });
        /*this.renderChatBubble =
            unit.on('render-chat-bubble', (data: {
                attrs: AttributeData[]
            }) => {
                console.log('PhaserUnit render-attributes', data); // TODO remove

                // release all existing attribute bars
                attributes.forEach((a) => {
                    PhaserAttributeBar.release(a);
                });
                attributes.length = 0;

                // add attribute bars based on passed data
                data.attrs.forEach((ad) => {
                    const a = PhaserAttributeBar.get(this);
                    a.render(ad);
                    attributes.push(a);
                });
            });*/
        scene.events.on('update', _this.update, _this);
        return _this;
    }
    PhaserUnit.prototype.update = function ( /*time: number, delta: number*/) {
        var unit = this.unit;
        var container = unit._pixiContainer;
        var texture = unit._pixiTexture;
        if (unit._destroyed || container._destroyed) {
            unit.off('follow', this.followListener);
            this.followListener = null;
            unit.off('stop-follow', this.stopFollowListener);
            this.stopFollowListener = null;
            unit.off('play-animation', this.playAnimationListener);
            this.playAnimationListener = null;
            unit.off('update-label', this.updateLabelListener);
            this.updateLabelListener = null;
            unit.off('hide-label', this.hideLabelListener);
            this.hideLabelListener = null;
            unit.off('render-attributes', this.renderAttributesListener);
            this.renderAttributesListener = null;
            unit.off('update-attribute', this.updateAttributeListener);
            this.updateAttributeListener = null;
            unit.off('render-chat-bubble', this.renderChatListener);
            this.renderChatListener = null;
            if (this.chat)
                this.chat.destroy();
            // release all instantiated attribute bars
            this.attributes.forEach(function (a) {
                PhaserAttributeBar.release(a);
            });
            this.attributes.length = 0;
            this.attributes = null;
            this.scene.events.off('update', this.update, this);
            this.label = null;
            this.sprite = null;
            this.destroy();
            return;
        }
        this.x = container.x;
        this.y = container.y;
        if (this.chat)
            this.chat.update(this.x, this.y);
        var sprite = this.sprite;
        sprite.rotation = texture.rotation;
        var bounds = unit._bounds2d;
        var flip = unit._stats.flip;
        sprite.setDisplaySize(bounds.x, bounds.y);
        sprite.setFlip(flip % 2 === 1, flip > 1);
    };
    return PhaserUnit;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserUnit.js.map