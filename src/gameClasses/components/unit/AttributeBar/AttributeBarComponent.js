var AttributeBarComponent = IgeEntity.extend({
    classId: 'AttributeBarComponent',
    componentId: 'attributeBar',

    init: function (containerId, attribute, index) {
        var self = this

        self.id()

        self._drawAttributeBar(containerId, attribute, index);
        self._stats = {
            desiredFrameFrequency: 60,
            desiredAnimationDuration: 1000
        };
    },

    /**
     * creates an instance of AttributeBar
     */
    _drawAttributeBar: function (containerId, attributeData, index) {
        var self = this;
        var verticalOffset = AttributeBar.prototype.barHeight() * index
        self._uiEntity = new AttributeBar(containerId, attributeData, verticalOffset);
    },

    /**
     * @param {object} attributeData
     * 
     * updates attribute bar based on provided {attributeData} data
     */
    updateBar: function (attributeData) {
        var self = this;

        if (self._uiEntity) {
            self._uiEntity.updateBar(attributeData);
        }
    },

    /**
     * destroys attribute bar
     */
    destroyBar: function () {
        var self = this;

        self._uiEntity.attributeBarContainer.destroy();
        self._uiEntity.attributeBar.destroy();

        if (self._uiEntity.attributeBarText) {
            self._uiEntity.attributeBarText.destroy();
        }

        self._uiEntity.destroy();

        self.destroy();
    }
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
    module.exports = AttributeBarComponent;
}
