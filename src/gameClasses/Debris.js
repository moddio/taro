var Debris = IgeEntityBox2d.extend({
	classId: 'Debris',

	init: function (data, entityIdFromServer) {

		var self = this;

		IgeEntityBox2d.prototype.init.call(this, data.defaultData);
		if (ige.isClient) {
			this._pixiContainer = new PIXI.Container();
		}
		this.id(entityIdFromServer);

		this.category('debris')

		if (ige.isServer) {
			this.mount(ige.$('baseScene'));
		}

		self._stats = data;

		if (ige.isServer) {
			this.streamMode(1)

		}
		else if (ige.isClient) {
			var cellSheet = self._stats.cellSheet;
			// var cell = new IgePixiTexture(cellSheet[0], cellSheet[1], cellSheet[2], this);

			// cellsheet[0] = columns cellsheet[1] = rows
			// cellSheet[3] = first grid Id in cellsheet
			var log = false;
			// if (self._stats.name == 'big box 1') {
			// 	console.log(cellSheet[1], cellSheet[2], self._stats.gid - cellSheet[3])
			// 	log = true;
			// }
			this._stats.cellSheet = {
				url: cellSheet[0],
				columnCount: cellSheet[1],
				rowCount: cellSheet[2]
			}
			this.entityId = entityIdFromServer;
			this.createPixiTexture(self._stats.gid - cellSheet[3]);
			this.mount(ige.pixi.world);
			// ige.pixi.world.addChild(this._pixiTexture);
			// Define the texture this entity will use
			// self
			// 	.depth(3)
			// 	.layer(1)
			// Assign the sprite sheet texture to the entity.
			// Notice we are using the gameTexture[1] instead of the
			// gameTexture[0] as in the entity above. This allows us
			// to use the cell ids that were defined via the
			// IgeSpriteSheet definition on line 20 using cellById()
			// instead of specifying the cell index via cell()
			// Apply the dimensions from the cell to the entity
			// so that the entity's width and height now match that
			// of the cell being used
			// .texture(texture)

		}

		// if debris has custom fixture setup
		var body = {
			type: self._stats.type ? self._stats.type : "dynamic",
			width: self._stats.width,
			height: self._stats.height,
			linearDamping: 5,
			angularDamping: 5,
			allowSleep: false,
			gravitic: true,
			bullet: false,
			fixedRotation: false,
			collidesWith: { walls: true, units: true, debris: true, items: true, projectiles: true },
			fixtures: [{
				density: parseFloat(self._stats.density) || 1,
				friction: parseFloat(self._stats.friction) || 0.01,
				restitution: parseFloat(self._stats.restitution) || 0,
				isSensor: false,
				shape: {
					type: self._stats.shape || 'rectangle'
				}
			}]
		};

		self._stats.currentBody = body;

		this.updateBody(data.defaultData)

		this.addBehaviour('debrisBehaviour', this._behaviour);
	},

	setTexture: function (sheets) {
		this.cellSheets = sheets;
	},

	hide: function () {
		this.drawBounds(false).opacity(0);
	},

	show: function () {
		this.drawBounds(true).opacity(1);
	},

	resetPosition: function () {
		if (this._stats.x == undefined || this._stats.y == undefined || this._stats.rotation == undefined)
			return;

		this.translateTo(this._stats.x, this._stats.y, 0)
		this.rotateTo(0, 0, Math.radians(this._stats.rotation))

		// this.targetTransform = [ige.currentTime(), [this._stats.x, this._stats.y, this._stats.rotation]];
	},
	openDebrisModal: function () {
		var displayKeys = ige.map.debrisProperty;

		for (var i = 0; i < displayKeys.length; i++) {
			var property = displayKeys[i];
			if (i === 'visible') {
				if (!this._stats[property]) {
					$('#visible-false').addClass('active');
					$('#visible-true').removeClass('active');
				}
				else {
					$('#visible-false').removeClass('active');
					$('#visible-true').addClass('active');
				}
			}
			else {
				$('#debris-' + property).val(this._stats[property] || 0);
			}
		}
		$('#debris-modal').modal();
	},
	/**
	 * Called every frame by the engine when this entity is mounted to the
	 * scenegraph.
	 * @param ctx The canvas context to render to.
	 */
	_behaviour: function (ctx) {
		this.processBox2dQueue();
	},

	tick: function (ctx) {
		IgeEntity.prototype.tick.call(this, ctx);
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = Debris; }