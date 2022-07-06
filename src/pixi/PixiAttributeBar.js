var PixiAttributeBar = IgeEntity.extend({
	classId: 'PixiAttributeBar',

	init: function (parentEntityId, attributeData, config) {
		var self = this;

		IgeEntity.prototype.init.call(self);
		self.id();
		self.category('pixiBar');

		config = config || {};

		self._stats = {
			parentId: parentEntityId
		};

		if (typeof attributeData.index !== 'number') {
			console.log('attribute data', attributeData, 'does not have index information');
		}
		if (attributeData.index < 0) {
			console.log('attribute data', attributeData, 'have invalid index information');
		}

		self.index = attributeData.index;

		var progressValueInPercent = (attributeData.value / attributeData.max) * 100;
		progressValueInPercent = Math.max(0, Math.min(100, progressValueInPercent));
		self.lastValue = {
			value: typeof attributeData.value === 'number' ? attributeData.value.toFixed(0) : 0,
			max: attributeData.max,
			progressValueInPercent: progressValueInPercent
		};
	},

	fadeOut: function (duration) {
		duration = duration || 2000;

		var self = this;

		self.destroyTimeout = setTimeout(function () {

			var parentEntity = self.getOwner();

			if (parentEntity) {
				parentEntity.attributeBars = parentEntity.attributeBars.filter(function (bar) {
					return bar.id !== self.id();
				});
			}

			self.destroy();
		}, duration);

		return this;
	},

	/**
	 * @return {number} height of attribute bar
	 *
	 * returns valid height of attribute bar based on current zoom level
	 */
	barHeight: function () {
		return 11;
	},

	barWidth: function () {
		return 80;
	},

	borderRadius: function () {
		var self = this;
		return self.barHeight() / 2 - 1;
	},

	getTextStyle: function () {
		return {
			fontFamily: 'Arial',
			fill: '#000000',
			fontSize: 11,
			fontWeight: 'bold'
		};
	},

	getOwner: function () {
		return ige.$(this._stats.parentId);
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
	},

	destroy: function () {
		var self = this;

		IgeEntity.prototype.destroy.call(self);
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
	module.exports = PixiAttributeBar;
}
