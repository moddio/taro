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
        var label = _this.label = scene.add.text(0, 0, 'cccccc');
        label.setOrigin(0.5);
        _this.gameObject.add(label);
        _this.gameObject.setName('unit');
        Object.assign(_this.evtListeners, {
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
        return _this;
    }
    PhaserUnit.prototype.transform = function (data) {
        _super.prototype.transform.call(this, data);
        if (this.chat) {
            this.chat.updatePosition(this.gameObject.x, this.gameObject.y);
        }
        var flip = this.entity._stats.flip;
        this.sprite.setFlip(flip % 2 === 1, flip > 1);
    };
    PhaserUnit.prototype.scale = function (data) {
        this.sprite.setScale(data.x, data.y);
    };
    PhaserUnit.prototype.follow = function () {
        console.log('PhaserUnit follow', this.entity.id()); // TODO remove
        var camera = this.scene.cameras.main;
        if (camera._follow === this.gameObject) {
            return;
        }
        camera.startFollow(this.gameObject, true, 0.05, 0.05);
    };
    PhaserUnit.prototype.stopFollow = function () {
        console.log('PhaserUnit stop-follow', this.entity.id()); // TODO remove
        this.scene.cameras.main.stopFollow();
    };
    PhaserUnit.prototype.updateLabel = function (data) {
        console.log('PhaserUnit update-label', this.entity.id()); // TODO remove
        var label = this.label;
        label.visible = true;
        label.setFontFamily('Verdana');
        label.setFontSize(16);
        label.setFontStyle(data.bold ? 'bold' : 'normal');
        label.setFill(data.color || '#fff');
        var strokeThickness = ige.game.data.settings
            .addStrokeToNameAndAttributes !== false ? 4 : 0;
        label.setStroke('#000', strokeThickness);
        label.setText(data.text || '');
        label.y = -25 -
            Math.max(this.sprite.displayHeight, this.sprite.displayWidth) / 2;
        label.setScale(1.25);
    };
    PhaserUnit.prototype.showLabel = function () {
        console.log('PhaserUnit show-label', this.entity.id()); // TODO remove
        this.label.visible = true;
    };
    PhaserUnit.prototype.hideLabel = function () {
        console.log('PhaserUnit hide-label', this.entity.id()); // TODO remove
        this.label.visible = false;
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
    PhaserUnit.prototype.renderAttributes = function (data) {
        var _this = this;
        console.log('PhaserUnit render-attributes', data); // TODO remove
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
        this.attributes = null;
        this.label = null;
        this.scene = null;
        _super.prototype.destroy.call(this);
    };
    return PhaserUnit;
}(PhaserAnimatedEntity));
//# sourceMappingURL=PhaserUnit.js.map