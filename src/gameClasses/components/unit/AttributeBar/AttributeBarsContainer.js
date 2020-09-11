var AttributeBarsContainer = IgeEntity.extend({
    classId: 'AttributeBarsContainer',

    init: function (parentEntity, visibleAttributes) {
        var self = this;

        IgeEntity.prototype.init.call(self);

        self.category('attributeBarContainer')
        self.id();
        self._entity = parentEntity;
        self.visibleAttributes = visibleAttributes;
        self.CONTAINER_WIDTH = self._getValidWidth(self._entity.width());

        self.attributeBars = {};

        self.bottomPadding = 3;
        self.height = AttributeBar.prototype.barHeight() * Object.keys(self.visibleAttributes).length;
        self.width = self.CONTAINER_WIDTH;

        // if container belongs to then give it more depth
        var body = parentEntity._stats.currentBody;
        var defaultLayer = 4;
        var defaultDepth = 0;
        var addLayer = (ige.client.selectedUnit && parentEntity && ige.client.selectedUnit.id() == parentEntity.id()) ? 2 : 1;
        var bodyZIndex = body && body['z-index'];
        var depth = (bodyZIndex ? bodyZIndex.depth : defaultDepth) + addLayer;
        var layer = bodyZIndex ? bodyZIndex.layer : defaultLayer;

        // UI for container itself
        // this entity is mounted on rootScene and not mainScene because
        // when this entity is mounted on mainScene then it shakes the player's camera
        self.container = new IgeEntity()
            .category('attributeBarsContainer')
            .layer(layer)
            .depth(depth)
            .width(self.width)
            .height(self.height + (2 * self.bottomPadding))
            .mount(ige.client.mainScene)

        self.container._stats = {
            parentUnit: parentEntity.id()
        };

        self.containerId = self.container.id();

        // push and sort glueEntity based on order
        if (!self._entity.gluedEntities) {
            self._entity.gluedEntities = [];
        }

        self._entity.gluedEntities.push({
            type: 'attributeBarsContainer',
            id: self.containerId,
            order: -1
        });
        self._entity.gluedEntities.sort(function (gluedEntityA, gluedEntityB) {
            return gluedEntityA.order - gluedEntityB.order;
        });

        self._drawAttributeBars();
    },

    /**
     * @param {number} unitX
     * @param {number} unitY
     * 
     * translates attribute bar container to provided x,y location
     */
    translateTo: function (unitX, unitY) {
        var self = this;
        var boxX = unitX;
        var boxY = unitY - (self.height + self.bottomPadding);
        var container = this.containerId && ige.$(this.containerId);

        if (container) {
            container.translateTo(boxX, boxY, 0);
        }
    },

    /**
     * @param {number} width
     * 
     * updates width of attribute container UI and updates all attributes accordingly
     */
    setContainerWidth: function (width) {
        var self = this;
        self.CONTAINER_WIDTH = self._getValidWidth(width);
        self.width = self.CONTAINER_WIDTH;

        // change width of attribute bar container
        self.container.width(self.width);

        // change height and width of all attribute bars (both grey and colored section)
        // to match them with new width of attribute bar container
        for (var attributeId in self.attributeBars) {
            var attributeBarComponentId = self.attributeBars[attributeId];
            var attributeData = self.visibleAttributes[attributeId];
            var attributeBarComponent = attributeBarComponentId && ige.$(attributeBarComponentId);

            if (attributeBarComponent) {
                var attributeBar = attributeBarComponent._uiEntity;
                var progressValueInPercent = (attributeData.value / attributeData.max) * 100;
                progressValueInPercent = Math.max(0, Math.min(100, progressValueInPercent));

                // change height and width of grey section of attribute bar
                attributeBar.attributeBarContainer.applyStyle({
                    width: '100%',
                    height: attributeBar.barHeight(),
                });

                // change height and width of colored section of attribute bar
                attributeBar.attributeBar.applyStyle({
                    height: attributeBar.barHeight(),
                    width: progressValueInPercent + '%'
                });
            }
        }
    },

    /**
     * creates an instance of AttributeBarComponent for all visible attributes
     * and keeps their ige id in attributeBars object
     */
    _drawAttributeBars: function () {
        var self = this;

        var index = 0;
        for (var attributeId in self.visibleAttributes) {
            var attribute = self.visibleAttributes[attributeId];
            attribute.key = attributeId;
            var attributeBar = new AttributeBarComponent(self.containerId, attribute, index++);

            self.attributeBars[attributeId] = attributeBar.id()
        }
    },

    /**
     * @param {string} attributeId
     * @param {object} attributeData
     * 
     * updates attribute bar which represents {attributeId} as per data provided in {attributeData}
     */
    updateBar: function (attributeId, attributeData) {
        var self = this;
        var attributeBarComponentId = self.attributeBars && self.attributeBars[attributeId];

        if (attributeBarComponentId && ige.$(attributeBarComponentId)) {
            var attributeBarComponent = ige.$(attributeBarComponentId);
            self.visibleAttributes[attributeId] = attributeData;
            attributeBarComponent.updateBar(attributeData);
        }
    },

    /**
     * @param {number} layer
     * @param {number} depth
     * 
     * sets z-index of attribute bar container in canvas, 
     * z-index in ige is calculated based on depth and layer
     */
    updateZIndex: function (layer, depth) {
        var self = this;

        if (depth && layer) {
            self.container
                .layer(layer)
                .depth(depth);
        }
    },

    /** 
     * destroys all attribute bars and removes entry of attirbute bar container from parent entity's 
     * gluedEntities list
    */
    destroyAllBars: function () {
        var self = this;

        for (var barId in self.attributeBars) {
            var attributeBarComponentId = self.attributeBars[barId];
            var attributeBarComponent = attributeBarComponentId && ige.$(attributeBarComponentId);

            if (attributeBarComponent) {
                attributeBarComponent.destroyBar();
            }
        }

        if (self.container) {
            if (self._entity.gluedEntities) {
                var index = -1;

                self._entity.gluedEntities.forEach(function (gluedEntity, arrayIndex) {
                    if (gluedEntity.id === self.container.id()) {
                        index = arrayIndex;
                    }
                });

                if (index > -1) {
                    self._entity.gluedEntities.splice(index, 1);
                }
            }

            self.container.destroy();
        }
    },

    /**
     * @param {number} width
     * @return {number}
     * 
     * returns valid width for provided {width} value (i.e. width that is in range of 40 to 128)
     */
    _getValidWidth: function (width) {
        var MAX_WIDTH = 128;
        var cameraScale = ige.client.vp1.camera._scale.x;
        var MIN_WIDTH = 50 / cameraScale;

        if (width < MIN_WIDTH) {
            width = MIN_WIDTH;
        }
        else if (width > MAX_WIDTH) {
            width = MAX_WIDTH;
        }

        return width;
    }
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
    module.exports = AttributeBarsContainer;
}
