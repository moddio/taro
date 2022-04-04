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
		if (formattedData.shape != 'circle') {
			collider.lineStyle(2, 0xFF00FF, 0.9)
				.moveTo(0 - dimensions.width / 2, 0)
				.lineTo(dimensions.width / 2, 0)
				.lineStyle(2, 0x00FF00, 0.9)
				.moveTo(0, 0 - dimensions.height / 2)
				.lineTo(0, dimensions.height / 2);
		}

		// // testing offset
		// if (this._entity.bodyDef.type == 'dynamic') {
		// 	collider.lineStyle(2, 0x00FFFF, 0.7)
		// 		.beginFill(0x00FFFF, 0.3)
		// 		.drawRect(
		// 			0,
		// 			0,
		// 			dimensions.width,
		// 			dimensions.height
		// 		)
		// 		.endFill();
		// }

		return collider;
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgePixiCollider; }
