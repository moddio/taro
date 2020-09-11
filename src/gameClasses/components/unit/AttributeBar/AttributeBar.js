var AttributeBar = IgeEntity.extend({
    classId: 'AttributeBar',

    /**
     * @return {number} height of attribute bar
     * 
     * returns valid height of attribute bar based on current zoom level
     */
    barHeight: function () {
        var zoomLevel = ige.client.vp1.camera._scale.x;
        return 10 / (1.5 * zoomLevel);
    },

    borderRadius: function () {
        var zoomLevel = ige.client.vp1.camera._scale.x;
        return 5 / zoomLevel;
    },

    getTextWidth: function (value) {
        if (value === undefined || value === null || isNaN(+value)) {
            return 0;
        }

        var spacePerCharacter = 15;
        return value.toString().length * spacePerCharacter;
    },

    init: function (containerId, attributeData, verticalOffset) {
        var self = this;

        IgeEntity.prototype.init.call(self);
        self.id();

        var containerEntity = ige.$(containerId)
        var progressValueInPercent = (attributeData.value / attributeData.max) * 100;
        progressValueInPercent = Math.max(0, Math.min(100, progressValueInPercent));

        // create attribute bar container
        self.attributeBarContainer = new IgeStyledElement()
            .applyStyle({
                backgroundColor: '#ddd',
                bottom: verticalOffset,
                height: self.barHeight(),
                width: '100%',
                // borderRadius: self.borderRadius()
            })
            .mount(containerEntity)

        self.lastValue = {
            value: typeof attributeData.value === 'number' ? attributeData.value.toFixed(0) : 0,
            max: attributeData.max,
            progressValueInPercent: progressValueInPercent
        };

        if (attributeData.displayValue) {
            // create floating label for attirbute value
            self.attributeBarText = new FloatingText(self.lastValue.value, {
                fontSize: '8px',
                attributeBarContainer: containerId
            });
            self.attributeBarText
                .colorOverlay('black')
                .textAlignX(1)
                .width(self.getTextWidth(self.lastValue.value))
                .mount(self.attributeBarContainer);
        }

        // create value bar
        self.attributeBar = new IgeStyledElement()
            .applyStyle({
                left: 0,
                backgroundColor: attributeData.color,
                height: self.barHeight(),
                width: progressValueInPercent + '%',
                // borderRadius: self.borderRadius()
            })
            .mount(self.attributeBarContainer);

        self.tempId = self.attributeBar.id();
    },

    /**
     * @param {object} attributeData
     * 
     * sets width of value bar based on provided {attributeData} data and
     * updates text of value label if it exists
     */
    updateBar: function (attributeData) {
        var self = this;
        var progressValueInPercent = (attributeData.value / attributeData.max) * 100;

        var newValue = attributeData.value.toFixed ? attributeData.value.toFixed(0) : 0;

        if (self.lastValue.value && self.lastValue.value === newValue) {
            return;
        }

        progressValueInPercent = Math.max(0, Math.min(100, progressValueInPercent));
        progressValueInPercent = parseInt(progressValueInPercent);
        var shouldUpdateBar = self.lastValue.progressValueInPercent !== progressValueInPercent;

        self.lastValue = {
            value: newValue,
            max: attributeData.max,
            progressValueInPercent: progressValueInPercent
        };

        // sometimes this apply style does not work so I am updating the canvas in requestAnimationFrame
        if (shouldUpdateBar) {
            self.attributeBar
                .applyStyle({
                    width: progressValueInPercent + '%',
                    backgroundColor: progressValueInPercent ? attributeData.color : null,
                });
        }

        if (self.attributeBarText) {
            var width = self.getTextWidth(self.lastValue.value);

            self.attributeBarText.setText(self.lastValue.value);
            self.attributeBarText.width(width);
        }
    }
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
    module.exports = AttributeBar;
}
