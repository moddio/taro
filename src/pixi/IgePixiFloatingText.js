var IgePixiFloatingText = IgeEntity.extend({
    classId: 'IgePixiFloatingText',
    componentId: 'pixiFloatingText',

    init: function (text, config) {
        if (!config) config = {};

        var depthForMyEntities = 3;
        var depthForOtherPlayerEntities = 2;

        var defaultFontSize = 12;
        var defaultBoldValue = false;
        var defaultMinLimit = 300;
        var defaultColor = '#fff';

        config.shouldBeBold = config && config.shouldBeBold || defaultBoldValue;
        config.fontSize = config && config.fontSize || defaultFontSize;
        config.minLimit = config && config.minLimit || defaultMinLimit;
        config.color = config && config.color || defaultColor;

        var textStyleConfig = {
            fontFamily: "Verdana",
            fontSize: 16,
            fontWeight: 'bold' || config.shouldBeBold,
            fill: config.color,
        }
        if (ige.game.data.settings.addStrokeToNameAndAttributes === undefined || ige.game.data.settings.addStrokeToNameAndAttributes) {
            textStyleConfig.stroke = 'black';
            textStyleConfig.strokeThickness = 4;
        }

        const style = new PIXI.TextStyle(textStyleConfig);
        // set stats because getOwner uses it
        this._stats = config;

        var parentUnit = this.getOwner();
        var selectedUnit = ige.client.myPlayer && ige.client.myPlayer.getSelectedUnit();
        var addLayer = (selectedUnit && parentUnit && selectedUnit.id() == parentUnit.id()) ? 2 : 1;

        var body = parentUnit && parentUnit._stats.currentBody;
        var defaultLayer = 4;
        var defaultDepth = 0;
        var bodyZIndex = body && body['z-index'];
        var depth = (bodyZIndex ? bodyZIndex.depth : defaultDepth) + addLayer;
        var layer = bodyZIndex ? bodyZIndex.layer : defaultLayer;

        this._id = this.id();

        text = typeof text === 'string' && text.toString() || '';

        var name = new PIXI.Text(text, style);
        name.zIndex = layer;
        name.depth = depth;
        name.anchor.set(0.5);


        ige.pixi.trackEntityById[this._id] = name;
        this._pixiText = name;
        this._pixiText._category = 'floating_text';
        this.category('floatingLabel');

        if (config.isFadeUp) {
            name.x = 0;
            name.y = -30;
        } else {
            // ige.pixi.world.addChild(name);
            // return name;
        }

        this.updateScale();
        this.updatePosition();
        return this;
    },

    setText: function (text) {
        this._pixiText.text = text;
    },

    getOwner: function () {
        return this._stats.parentUnit ?
            ige.$(this._stats.parentUnit) :
            undefined;
    },

    colorOverlay: function (color) {
        this._pixiText._style.fill = color;
        return this;
    },

    fadeUp: function () {
        var self = this;
        var duration = 2000;
        var step = duration / 60;
        var opacityStep = 1 / (step * 5);
        var displacementPerStep = - 20 / step;

        this.interval = setInterval(function () {
            if (self._pixiText) {
                self._pixiText.y += displacementPerStep;
                self._pixiText.alpha -= opacityStep;
            }
        }, 1000 / 60);

        setTimeout(function () {
            clearInterval(self.interval)
            delete ige.pixi.trackEntityById[self.id];
            if (self._pixiText) {
                self._pixiText.destroy();
            }
            self.destroy();
        }, duration);

        return this;
    },

    updateScale: function () {
        this.scaleTo(
            1 / ige.pixi.viewport.scale.x,
            1 / ige.pixi.viewport.scale.y,
            1 / ige.pixi.viewport.scale.z
        )
    },

    updatePosition: function () {
        if(this.getOwner()) {
            this._pixiText.y = - 3 - (this.getOwner().height() / 2) - (17 / ige.pixi.viewport.scale.y)
        } else {
            this._pixiText.y -= 3;
        }
    },

    layer: function (layer) {
        this._pixiText.zIndex = layer;
        return this;
    },
    depth: function (depth) {
        this._pixiText.depth = depth;
        return this;
    },
    mount: function (mount) {
        mount.addChild(this._pixiText);
        return this;
    },
    destroy: function () {
        var self = this;
        var parentUnit = self.getOwner();

        if (parentUnit && parentUnit.gluedEntities) {
            var index = -1;

            parentUnit.gluedEntities.forEach(function (gluedEntity, arrayIndex) {
                if (gluedEntity.id === self.id()) {
                    index = arrayIndex
                }
            });

            if (index > -1) {
                var glueEntity = parentUnit.gluedEntities[index];
                ige.pixi.trackEntityById[glueEntity.id] && ige.pixi.trackEntityById[glueEntity.id].destroy(true);
                parentUnit.gluedEntities.splice(index, 1);
            }
        }

        IgeEntity.prototype.destroy.call(self);
    }
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgePixiFloatingText; }