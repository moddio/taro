var AttributeBarsContainerComponent = IgeEntity.extend({
    classId: 'AttributeBarsContainerComponent',
    componentId: 'attributeBarsContainer',

    init: function (parentEntity) {
        var self = this

        self.id()
        self._entity = parentEntity;

        self._entity._stats.attributeBarContainer = {
            id: self.id()
        };

        self.drawContainer();
    },

    // creates attribute bar container from scratch and destroys existing container (if it exists)
    drawContainer: function (forceRedraw) {
        var self = this;
        var shouldRedraw = false;
        var visibleAttributeIds = [];
        var visibleAttributes = JSON.parse(JSON.stringify(self._entity._stats.attributes || {}));

        for (var attrId in visibleAttributes) {
            var attribute = visibleAttributes[attrId];
            // if dev does not want to display this attribute then dont render it
            if (!attribute.isVisible || !attribute.isVisible.length || !self._shouldBeRendered(self._entity, attribute)) {
                delete visibleAttributes[attrId];
            }
        }

        for (var key in visibleAttributes) {
            visibleAttributeIds.push(key);
        }

        shouldRedraw = forceRedraw || self._shouldRedrawContainer(visibleAttributeIds);

        if (shouldRedraw) {
            self.destroyContainer()
            self._uiEntity = new AttributeBarsContainer(self._entity, visibleAttributes);
        }
    },

    /**
     * @param {string[]} list of attribute ids that should get displayed
     * 
     * this function will decide whether attribute bar container needs to be redrawn from scratch or not
     */
    _shouldRedrawContainer: function (visibleAttributeIds) {
        var self = this;
        var attributesBeingRendered = self._uiEntity && self._uiEntity.visibleAttributes ?
            Object.keys(self._uiEntity.visibleAttributes) :
            [];

        if (attributesBeingRendered.length !== visibleAttributeIds.length) {
            return true;
        }

        for (var i = 0; i > attributesBeingRendered.length; i++) {
            if (visibleAttributeIds.indexOf(attributesBeingRendered[i]) === -1) {
                return true;
            }
        }

        return false;
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

        if (self._uiEntity) {
            self._uiEntity.updateZIndex(layer, depth);
        }
    },

    /**
     * @param {number} width
     * 
     * sets width of attribute bar container to {width} pixels
     */
    setContainerWidth: function (width) {
        var self = this;

        if (self._uiEntity) {
            self._uiEntity.setContainerWidth(width);
        }
    },

    /**
     * @param {number} unitX
     * @param {number} unitY
     * 
     * translates attribute bar container to provided x,y location
     */
    translateTo: function (unitX, unitY) {
        if (this._uiEntity) {
            this._uiEntity.translateTo(unitX, unitY)
        }
    },

    /**
     * destroys all attribute bars and attribute bar container
     */
    destroyContainer: function () {
        var self = this;

        if (self._uiEntity) {
            self._uiEntity.destroyAllBars();
            self._uiEntity.destroy();
        }
    },

    remove: function () {
        var self = this;

        self.destroyContainer();
        self.destroy();
    },

    /**
     * @param {string} attributeId
     * @param {object} attributeData
     * 
     * update UI of of attribute bar based on new attribute data
     */
    updateBar: function (attributeId, attributeData) {
        if (this._uiEntity) {
            this._uiEntity.updateBar(attributeId, attributeData)
        }
    },

    /**
     * @param {object} entity
     * @param {object} attributeData
     * 
     * decides whether the attribute represented by {attributeData} should be displayed 
     * to owner of {entity} or not
     */
    _shouldBeRendered: function (entity, attributeData) {
        var self = this;
        var ownerPlayer = self._getOwnerPlayer(entity);
        var myPlayer = ige.client.myPlayer;

        if (!ownerPlayer || !myPlayer) {
            return false;
        }

        // loop though all visibility options set for this attribute
        for (var i = 0; i < attributeData.isVisible.length; i++) {
            var isVisibleValue = attributeData.isVisible[i];
            var shouldRender = false;

            // if all firendly players can see the attribute bar
            if (isVisibleValue === 'unitBarFriendly') {
                shouldRender = ownerPlayer.isFriendlyTo(myPlayer)
            }
            // if all neutral players can see the attribute bar
            else if (isVisibleValue === 'unitBarNeutral') {
                shouldRender = ownerPlayer.isNeutralTo(myPlayer)
            }
            // if all firendly players can see the attribute bar
            else if (isVisibleValue === 'unitBarHostile') {
                shouldRender = ownerPlayer.isHostileTo(myPlayer, true)
            }

            if (shouldRender) {
                return true;
            }
        }

        return false;
    },

    /**
     * @param {object} entity
     * @return IgePlayer
     * 
     * returns owner player based on provided {entity}
     */
    _getOwnerPlayer: function (entity) {
        var ownerUnit = null;

        switch (entity._category) {
            case 'unit': {
                return entity.getOwner();
            }
            case 'item': {
                ownerUnit = entity.getOwner();
                return ownerUnit && ownerUnit.getOwner();
            }
            case 'projectile': {
                ownerUnit = null;

                if (entity._stats.sourceUnitId) {
                    var unit = ige.$(entity._stats.sourceUnitId);
                    if (unit) {
                        ownerUnit = unit;
                    }
                }

                if (!ownerUnit) {
                    var ownerItem = entity.getOwner();
                    ownerUnit = ownerItem && owneritem.getOwnerUnit();
                }

                return ownerUnit && ownerUnit.getOwner();
            }
            default: {
                return undefined;
            }
        }
    }
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
    module.exports = AttributeBarsContainerComponent;
}
