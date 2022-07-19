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
    function PhaserUnit(scene, entity) {
        var _this = _super.call(this, scene, entity, "unit/".concat(entity._stats.type)) || this;
        _this.scene = scene;
        _this.attributes = [];
        var translate = entity._translate;
        _this.gameObject = scene.add.container(translate.x, translate.y, [_this.sprite]);
        Object.assign(_this.evtListeners, {
            flip: entity.on('flip', _this.flip, _this),
            follow: entity.on('follow', _this.follow, _this),
            'stop-follow': entity.on('stop-follow', _this.stopFollow, _this),
            'update-label': entity.on('update-label', _this.updateLabel, _this),
            'show-label': entity.on('show-label', _this.showLabel, _this),
            'hide-label': entity.on('hide-label', _this.hideLabel, _this),
            'fading-text': entity.on('fading-text', _this.fadingText, _this),
            'render-attributes': entity.on('render-attributes', _this.renderAttributes, _this),
            'update-attribute': entity.on('update-attribute', _this.updateAttribute, _this),
            'render-chat-bubble': entity.on('render-chat-bubble', _this.renderChat, _this),
        });
        ige.client.on('zoom', function (height) {
            _this.scaleElements(height);
        });
        return _this;
    }
    PhaserUnit.prototype.transform = function (data) {
        _super.prototype.transform.call(this, data);
        if (this.chat) {
            this.chat.updatePosition(this.gameObject.x, this.gameObject.y);
        }
        this.flip(this.entity._stats.flip);
    };
    PhaserUnit.prototype.size = function (data) {
        _super.prototype.size.call(this, data);
        if (this.label) {
            this.updateLabelOffset();
        }
        if (this.attributesContainer) {
            this.updateAttributesOffset();
        }
    };
    PhaserUnit.prototype.updateLabelOffset = function () {
        this.label.y = -25 - (this.sprite.displayHeight + this.sprite.displayWidth) / 4;
    };
    PhaserUnit.prototype.updateAttributesOffset = function () {
        this.attributesContainer.y = 25 + (this.sprite.displayHeight + this.sprite.displayWidth) / 4;
    };
    PhaserUnit.prototype.flip = function (flip) {
        this.sprite.setFlip(flip % 2 === 1, flip > 1);
    };
    PhaserUnit.prototype.follow = function () {
        console.log('PhaserUnit follow', this.entity.id()); // TODO remove
        var camera = this.scene.cameras.main;
        if (camera._follow === this.gameObject) {
            return;
        }
        camera.startFollow(this.gameObject, false, 0.05, 0.05);
    };
    PhaserUnit.prototype.stopFollow = function () {
        console.log('PhaserUnit stop-follow', this.entity.id()); // TODO remove
        this.scene.cameras.main.stopFollow();
    };
    PhaserUnit.prototype.getLabel = function () {
        if (!this.label) {
            var label = this.label = this.scene.add.text(0, 0, 'cccccc');
            label.setOrigin(0.5);
            this.gameObject.add(label);
        }
        return this.label;
    };
    PhaserUnit.prototype.updateLabel = function (data) {
        console.log('PhaserUnit update-label', this.entity.id()); // TODO remove
        var label = this.getLabel();
        label.visible = true;
        label.setFontFamily('Verdana');
        label.setFontSize(16);
        label.setFontStyle(data.bold ? 'bold' : 'normal');
        label.setFill(data.color || '#fff');
        var strokeThickness = ige.game.data.settings
            .addStrokeToNameAndAttributes !== false ? 4 : 0;
        label.setStroke('#000', strokeThickness);
        label.setText(data.text || '');
        this.updateLabelOffset();
    };
    PhaserUnit.prototype.showLabel = function () {
        console.log('PhaserUnit show-label', this.entity.id()); // TODO remove
        this.getLabel().visible = true;
    };
    PhaserUnit.prototype.hideLabel = function () {
        console.log('PhaserUnit hide-label', this.entity.id()); // TODO remove
        this.getLabel().visible = false;
    };
    PhaserUnit.prototype.fadingText = function (data) {
        console.log('PhaserUnit fading-text', this.entity.id()); // TODO remove
        new PhaserFloatingText(this.scene, {
            text: data.text || '',
            x: 0,
            y: 0,
            color: data.color || '#fff'
        }, this);
    };
    PhaserUnit.prototype.getAttributesContainer = function () {
        if (!this.attributesContainer) {
            this.attributesContainer = this.scene.add.container(0, 0);
            this.updateAttributesOffset();
            this.gameObject.add(this.attributesContainer);
        }
        return this.attributesContainer;
    };
    PhaserUnit.prototype.renderAttributes = function (data) {
        var _this = this;
        console.log('PhaserUnit render-attributes', data); // TODO remove
        // creating attributeContainer on the fly,
        // only for units that have attribute bars
        this.getAttributesContainer();
        var attributes = this.attributes;
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
    };
    PhaserUnit.prototype.updateAttribute = function (data) {
        console.log('PhaserUnit update-attribute', data); // TODO remove
        var attributes = this.attributes;
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
            a = PhaserAttributeBar.get(this);
            attributes.push(a);
        }
        a.render(data.attr);
    };
    PhaserUnit.prototype.renderChat = function (text) {
        console.log('create-chat', text); // TODO remove
        if (this.chat) {
            this.chat.showMessage(text);
        }
        else {
            this.chat = new PhaserChatBubble(this.scene, text, this);
        }
    };
    PhaserUnit.prototype.scaleElements = function (height) {
        var _a, _b;
        var defaultZoom = ((_b = (_a = ige.game.data.settings.camera) === null || _a === void 0 ? void 0 : _a.zoom) === null || _b === void 0 ? void 0 : _b.default) || 1000;
        var targetScale = height / defaultZoom;
        this.scene.tweens.add({
            targets: [this.label, this.attributesContainer, this.chat],
            duration: 1000,
            ease: Phaser.Math.Easing.Quadratic.Out,
            scale: targetScale,
        });
    };
    PhaserUnit.prototype.destroy = function () {
        if (this.chat) {
            this.chat.destroy();
            this.chat = null;
        }
        // release all instantiated attribute bars
        this.attributes.forEach(function (a) {
            PhaserAttributeBar.release(a);
        });
        this.attributes.length = 0;
        this.attributesContainer = null;
        this.attributes = null;
        this.label = null;
        this.scene = null;
        _super.prototype.destroy.call(this);
    };
    return PhaserUnit;
}(PhaserAnimatedEntity));
//# sourceMappingURL=PhaserUnit.js.map