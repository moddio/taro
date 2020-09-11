var RegionUi = IgeEntity.extend({
	classId: 'RegionUi',

	init: function (region, regionName, entity) {

		IgeUiEntity.prototype.init.call(this);

		var self = this;
		self._stats = region;
		self._stats.id = regionName;

		self.category('regionUi');

		if ((mode === 'play' && (region.default.inside || region.default.outside)) || mode === 'sandbox') {

			var graphic = new PIXI.Graphics();
			// graphic.lineStyle(3, 0x000000, 0.7);
			graphic.beginFill(0xFF0000, 0.4);
			graphic.drawRect(0, 0, 50, 50);
			graphic.endFill();
			graphic.isSprite = true;
			this._pixiContainer = graphic;
			this._pixiContainer.x = region.default.x;
			this._pixiContainer.y = region.default.y;
			this._pixiContainer.height = region.default.height;
			this._pixiContainer.width = region.default.width;
			this._pixiContainer.zIndex = 10;
			this._pixiContainer._category = 'region';
			this._pixiContainer.name = regionName;
			this.mount(ige.pixi.world);
			ige.pixi.trackEntityById[entity._id] = entity;
		}
	},
	translateTo: function (x, y, z) {
		this._pixiContainer.position.set(x, y);
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = RegionUi; }