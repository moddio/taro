var IgePixiCollider = IgeClass.extend({
	classId: 'IgePixiCollider',
	componentId: 'pixicollider',

	init: function (entity) {
		this._entity = entity;
	},

	formatCollider: function () {
		var entity = this._entity;
		this.shape = entity.bodyDef.fixtures[0].shape.type;
		return {
			id: entity.entityId,
			type: entity.bodyDef.type,
			shape: entity.bodyDef.fixtures[0].shape.type,
			dimensions:
				entity.bodyDef.fixtures[0].shape.type == 'circle' ?
					{ radius: entity.width() / 2 } :
					{ width: entity.width(), height: entity.height() }
		};

	},

	drawCollider: function () {
		var collider = new PIXI.Graphics();
		var formattedData = this.formatCollider();
		var dimensions = formattedData.dimensions;
		collider.lineStyle(2, 0x000000, 0.7)
			.beginFill(0xFFFFFF, 0.3);

		formattedData.shape == 'circle' ?
			collider.drawCircle(0, 0, dimensions.radius) :
			collider.drawRect(
				0 - dimensions.width / 2,
				0 - dimensions.height / 2,
				dimensions.width,
				dimensions.height
			);

		collider.endFill();

		collider.zIndex = 10;
		return collider;
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgePixiCollider; }
