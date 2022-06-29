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
        var _this = _super.call(this, scene, unit, "unit/".concat(unit._stats.type)) || this;
        _this.unit = unit;
        _this.attributes = [];
        _this.scene = scene;
        var translate = unit._translate;
        _this.gameObject = scene.add.container(translate.x, translate.y, [_this.sprite]);
        var label = _this.label = scene.add.text(0, 0, 'cccccc');
        label.setOrigin(0.5);
        _this.gameObject.add(label);
        var attributes = _this.attributes;
        Object.assign(_this.evtListeners, {
            followListener: unit.on('follow', _this.followListener, _this),
            stopFollowListener: unit.on('stop-follow', _this.stopFollowListener, _this),
            updateLabelListener: unit.on('update-label', _this.updateLabelListener, _this),
            hideLabelListener: unit.on('hide-label', _this.hideLabelListener, _this),
            renderAttributesListener: unit.on('render-attributes', _this.renderAttributesListener, _this),
            updateAttributeListener: unit.on('update-attribute', _this.updateAttributeListener, _this),
        });
        /*this.renderAttributesListener =
            unit.on('render-attributes', (data: {
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
        return _this;
        /*this.renderChatListener = unit.on('render-chat-bubble', (text) => {
            console.log('create-chat', text); // TODO remove
            if (this.chat) {
                this.chat.showMessage(text);
            } else {
                this.chat = new PhaserChatBubble(scene, text, this);
            }
        });*/
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
    }
    PhaserUnit.prototype.transform = function (data) {
        this.gameObject.setPosition(data.x, data.y);
        this.sprite.rotation = data.rotation;
    };
    PhaserUnit.prototype.scale = function (data) {
        this.sprite.setScale(data.x, data.y);
    };
    PhaserUnit.prototype.followListener = function () {
        console.log('PhaserUnit follow', this.unit.id()); // TODO remove
        var camera = this.scene.cameras.main;
        if (camera._follow === this.gameObject) {
            return;
        }
        camera.startFollow(this.gameObject, true, 0.05, 0.05);
    };
    PhaserUnit.prototype.stopFollowListener = function () {
        console.log('PhaserUnit stop-follow', this.unit.id()); // TODO remove
        this.scene.cameras.main.stopFollow();
    };
    PhaserUnit.prototype.updateLabelListener = function (config) {
        console.log('PhaserUnit update-label', this.unit.id()); // TODO remove
        var label = this.label;
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
            Math.max(this.sprite.displayHeight, this.sprite.displayWidth) / 2;
        label.setScale(1.25);
    };
    PhaserUnit.prototype.hideLabelListener = function () {
        console.log('PhaserUnit hide-label', this.unit.id()); // TODO remove
        this.label.visible = false;
    };
    PhaserUnit.prototype.renderAttributesListener = function (data) {
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
    PhaserUnit.prototype.updateAttributeListener = function (data) {
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
    return PhaserUnit;
}(PhaserAnimatedEntity));
//# sourceMappingURL=PhaserUnit.js.map