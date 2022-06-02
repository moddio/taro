var Region = IgeEntityPhysics.extend({
	classId: 'Region',
	componentId: 'region',

	init: function (data, entityIdFromServer) {
		IgeEntityPhysics.prototype.init.call(this);

		// on server regions are offsetted by 2 tile. So adding offset just server
		// making region work fine on both side

		// TODO: look into the above comment and confirm or deny.

		this.id(entityIdFromServer);

		var self = this;
		var regionName = typeof data.id === 'string' ? data.id : null;

		if (data && regionName) {
			self._stats = data;

			self.category('region');

			if (ige.isServer) {
				self.mount(ige.$('baseScene'));
			}

			this._stats.currentBody = {
				type: 'static',
				linearDamping: 1,
				angularDamping: 5,
				allowSleep: false,
				bullet: false,
				fixedRotation: false,
				fixtures: [{
					density: 0,
					friction: 0,
					restitution: 0,
					isSensor: true,
					shape: {
						type: 'rectangle'
					}
				}],
				collidesWith: { walls: true, units: true, projectiles: true, items: true, debris: true },
				// Refactor TODO: width & height should've been assigned into "currentBody". not int "default".
				// Region is only one doing this (not unit/item/projectile). I shouldn't have to do below:
				width: self._stats.default.width,
				height: self._stats.default.height
			};

			var regionDimension = self._stats.default;

			if (ige.physics && ige.physics.engine === 'CRASH') {
				self._translate.x = regionDimension.x;
				self._translate.y = regionDimension.y;
			}
			else {
				self._translate.x = regionDimension.x + (regionDimension.width / 2);
				self._translate.y = regionDimension.y + (regionDimension.height / 2);
			}

			self.updateBody({
				translate: { x: self._translate.x, y: self._translate.y}
			});

			// will leave this for a little while longer. this is sloont's from
			// drawing Crash Colliders

			// if (ige.isClient) {
			// 	this._pixiContainer = new PIXI.Container();
			// 	this.drawCrashCollider(regionDimension);
			// }

			//

			if (ige.isServer) {
				// IgeEntity.streamMode(val)
				// 1 is 'automatic' streaming
				self.streamMode(1);
			} else if (ige.isClient) {
				if ((mode === 'play' && self._stats.default.inside) || mode === 'sandbox') {
					// o.O TODO: Remove /refactor
					ige.pixi.trackEntityById[entityIdFromServer] = this;
					ige.client.emit('create-region', this);
				}

				if (typeof mode === 'string' && mode === 'sandbox') {
					delete self._stats.value;

					if (ige.game.data.isDeveloper) {
						// creating region click handler if user is developer
						// /
						// need to see if we can do this with simple region instead
						// of using regionUi because we want to remove it entirely
						// /

						// IgeObject method
						self.drawMouse(true)
							// IgeEntity method (IgeUiEntity extends...)
							.mouseDown(function (event, evc) {
								if (
									ige.mapEditor.selectEntities &&
									event.which === 1 &&
									!ige.mapEditor.mouseDownOnMiniMap &&
									!ige.mapEditor.checkIfClickedMiniMap(event.pageX, event.pageY)
								) {
									var selectedRegion = self;
									if (selectedRegion._stats && selectedRegion._stats.id) {
										ige.regionManager.openRegionModal(selectedRegion._stats, selectedRegion._stats.id, false);
									}
								}
							});
					}
				}
				// removing references to regionUi.
				// /
				// self.regionUi = new RegionUi(JSON.parse(JSON.stringify(self._stats)), regionName, this);
				// /

				// self.regionUi.depth(10)
				//     .layer(2)
				//     .drawBoundsData(false)
				//     .drawBounds(false)
				//     .translateTo(self._stats.default.x + (self._stats.default.width / 2), self._stats.default.y + (self._stats.default.height / 2), 0)
				//     .height(self._stats.default.height)
				//     .width(self._stats.default.width)
				//     .bounds2d(self._stats.default.width, self._stats.default.height, 0)
				// .mount(ige.client.rootScene);

				// TODO? I am concerned about these references to 'FloatingText' and not 'igePixiFloatingText'
				// Only other reference is AttributeComponent.js:init
				// self.font = new FloatingText(regionName);
				// self.font.colorOverlay('#fff')
				// 	.translateTo(self._stats.default.x, self._stats.default.y, 0)
				// 	.mount(ige.client.rootScene)
				// 	.drawBounds(false);
			}
		}
	},
	updateDimension: function () {
		var regionCordinates = this._stats.default;
		this.translateTo(regionCordinates.x + (regionCordinates.width / 2), regionCordinates.y + (regionCordinates.height / 2), 0);
		this.width(regionCordinates.width);
		this.height(regionCordinates.height);

		if (ige.isServer) {
			var shapeData = {};
			var normalizer = 0.45;
			shapeData.width = regionCordinates.width * normalizer;
			shapeData.height = regionCordinates.height * normalizer;
			// shapeData.x = regionCordinates.x;
			// shapeData.y = regionCordinates.y;
			this._stats.currentBody.fixtures[0].shape.data = shapeData;
			this.physicsBody(this._stats.currentBody);

		} else { // isClient
			this.emit('update-region-dimensions');
		}

		// if (this.regionUi) {
		// 	this.regionUi.translateTo(regionCordinates.x, regionCordinates.y, 0);
		// 	this.regionUi.width(regionCordinates.width);
		// 	this.regionUi.height(regionCordinates.height);
		// }

		// if (this.font) {
		// 	this.font.translateTo(regionCordinates.x + (this._stats.id.length / 2 * 11), regionCordinates.y + 15, 0);
		// }
	},

	streamUpdateData: function (queuedData) {
		IgeEntity.prototype.streamUpdateData.call(this, queuedData);

		for (var i = 0; i < queuedData.length; i++) {
			var data = queuedData[i];

			for (attrName in data) {
				var newValue = data[attrName];
				this._stats.default[attrName] = newValue;
			}
		}

		this.updateDimension();
	},

	deleteRegion: function () {
		// if (this.font) {
		// 	this.font.destroy();
		// }
		// if (this.regionUi) {
		// 	this.regionUi.destroy();
		// }
		this.destroy();
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = Region; }
