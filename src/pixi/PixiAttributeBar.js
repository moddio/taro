var PixiAttributeBar = IgeEntity.extend({
	classId: 'PixiAttributeBar',


	init: function (parentEntityId, attributeData, config) {
		var self = this;

		IgeEntity.prototype.init.call(self);
		self.id();
		self.category('pixiBar')

		config = config || {};

		self._stats = {
			parentId: parentEntityId,
		};

		if (typeof attributeData.index !== 'number') {
			console.log('attribute data', attributeData, 'does not have index information');
		}
		if (attributeData.index < 0) {
			console.log('attribute data', attributeData, 'have invalid index information');
		}

		var container = new PIXI.Container();
		var entity = ige.$(self._stats.parentId);
		self.index = attributeData.index;
		self.borderThickness = 2

		self.pixiBarBorder = new PIXI.Graphics();
		self.pixiBarMask = new PIXI.Graphics();
		self.pixiBar = new PIXI.Graphics();
		self.renderPixiBar(attributeData);

		var progressValueInPercent = (attributeData.value / attributeData.max) * 100;
		progressValueInPercent = Math.max(0, Math.min(100, progressValueInPercent));
		self.lastValue = {
			value: typeof attributeData.value === 'number' ? attributeData.value.toFixed(0) : 0,
			max: attributeData.max,
			progressValueInPercent: progressValueInPercent
		};

		if (attributeData.displayValue) {
			// create floating label for attribute value
			self.pixiBarText = new PIXI.Text('testing', self.getTextStyle());
			self.renderPixiBarTextValue(attributeData);
			self.pixiBar.addChild(self.pixiBarText);
			self.pixiBarText.anchor.set(0.5, 0.1);
		}

		container.addChild(self.pixiBarBorder);
		container.addChild(self.pixiBarMask);
		container.addChild(self.pixiBar);

		entity._pixiContainer.addChild(container);
		self._pixiContainer = container;
		self.updatePosition();
		self.updateScale();
	},

	showValueAndFadeOut: function (fadeOutDuration) {
		var self = this;
		
		if (self.showBarTimeout) {
			self._pixiContainer.alpha = 1;
			clearTimeout(self.showBarTimeout);
			clearTimeout(self.destroyTimeout);
			clearInterval(self.updateOpacityInterval)
		}

		self.showBarTimeout = setTimeout(function () {
			self.fadeOut(fadeOutDuration || 500);
		}, 1000);
	},

	fadeOut: function (duration) {
        duration = duration || 2000;
		
		var self = this;
        var step = duration / 60;
        var opacityStep = 1 / (step * 5);
        
        self.updateOpacityInterval = setInterval(function () {
			self._pixiContainer.alpha -= opacityStep;
        }, 1000 / 60);

        self.destroyTimeout = setTimeout(function () {
            clearInterval(self.updateOpacityInterval)
			
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
			fontFamily: "Arial",
			fill: "#000000",
			fontSize: 11,
			fontWeight: "bold"
		};
	},

	getOwner: function () {
		return ige.$(this._stats.parentId);
	},

	updateScale: function () {
		this.scaleTo(
			1 / ige.pixi.viewport.scale.x,
			1 / ige.pixi.viewport.scale.y,
			1 / ige.pixi.viewport.scale.z
		)
	},

	updatePosition: function () {
		this._pixiContainer.y = 3 + (this.getOwner().height() / 2) + (12 * this.index / ige.pixi.viewport.scale.y)

	},

	renderPixiBar: function (attributeData) {
		var self = this;
		var color = PIXI.utils.string2hex(attributeData.color);
		var progressValueInPercent = (attributeData.value / attributeData.max);

		if (typeof attributeData.index !== 'number') {
			console.error('attribute data does not includes "index" field, index of attribute bar is the number of attribute bar that is being rendered from unit head');
		}

		var width = self.barWidth();
		var height = self.barHeight();
		var borderRadius = self.borderRadius();

		self.pixiBarBorder.clear();
		self.pixiBarBorder.lineStyle(2, 0x000000, 1);
		self.pixiBarBorder.drawRoundedRect(
			-width/2,
			0,
			width,
			height,
			borderRadius,
		);

		self.pixiBar.clear();
		self.pixiBar.beginFill(color);
		self.pixiBar.drawRoundedRect(
			-width / 2,
			0,
			width * progressValueInPercent,
			height,
			borderRadius,
		);
		self.pixiBar.endFill();

		// console.log('progressValueInPercent', progressValueInPercent);
		self.pixiBarMask.clear();
		self.pixiBarMask.beginFill(0x000000); // this color does not matter
		self.pixiBarMask.drawRoundedRect(
			-width/2,
			0,
			width,
			height,
			borderRadius,
		);
		self.pixiBarMask.endFill();

		self.pixiBar.mask = self.pixiBarMask;
	},

	renderPixiBarTextValue: function (attributeData) {
		var self = this;
		self.pixiBarText.text = self.lastValue.value;
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
			self.renderPixiBar(attributeData);
		}

		if (self.pixiBarText) {
			self.pixiBarText.text = self.lastValue.value;
		}

		var showOnlyWhenValueChanged = attributeData.showWhen instanceof Array && attributeData.showWhen.indexOf("valueChanges") > -1;
		if (showOnlyWhenValueChanged) {
			self.showValueAndFadeOut();
		}
	},

	destroy: function () {
		var self = this;

		if (self.pixiBar && !self.pixiBar._destroyed) {
			self.pixiBar && self.pixiBar.destroy();
		}
		if (self.pixiBarBorder && !self.pixiBarBorder._destroyed) {
			self.pixiBarBorder && self.pixiBarBorder.destroy();
		}
		if (self.pixiBarMask && !self.pixiBarMask._destroyed) {
			self.pixiBarMask && self.pixiBarMask.destroy();
		}
		if (self.pixiBarText && !self.pixiBarText._destroyed) {
			self.pixiBarText.destroy();
		}
		if (self._pixiContainer && !self._pixiContainer._destroyed) {
			self._pixiContainer.destroy();
		}

		IgeEntity.prototype.destroy.call(self);
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
	module.exports = PixiAttributeBar;
}
