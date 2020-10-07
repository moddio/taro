var MapComponent = IgeEntity.extend({
	classId: 'MapComponent',
	componentId: 'map',

	init: function (entity, options) {
		var self = this;
		self.minimapLayers = [];
		self.debrisProperty = [
			'x', 'y', 'height', 'width', 'rotation', 'visible', 'type', 'id', 'name', 'gid', 'type', 'density', 'friction', 'restitution'
		];
		self.layersZIndex = {
			floor: 0,
			floor2: 1,
			walls: 3,
			trees: 4
		}
		if (ige.isClient) {
			//Declared events for debris modal
			if (mode === 'sandbox') {
				$('#debris-form').on("submit", function (e) {
					e.preventDefault();
					self.onSubmit();
				});

				$('#debris-form').on("keypress", function (e) {
					if (e.charCode === 13) {
						e.preventDefault();
						self.onSubmit();
					}
				});

				$('#debris-delete').on("click", function (e) {
					e.preventDefault();
					var updatedDebris = {
						deleteId: $('#debris-id').val(),
					};
					self.updateDebrisToDb(updatedDebris);
				});
			}
		}
	},

	load: function (data) {
		var self = this;

		if (data.layers) {
			for (var i = 0; i < data.layers.length; i++) {
				var layer = data.layers[i];
				if (layer.name === 'debris' && layer.objects) {
					for (var j = 0; j < layer.objects.length; j++) {
						var debris = layer.objects[j];
						if (!debris.type) {
							debris.type = 'dynamic';
						}
					}
				}
			}
		}

		self.data = data;
		// ige.addComponent(IgeTiledComponent)
		// 	.tiled.loadJson(self.data, function (layerArray, layersById) {

		if (ige.isServer) {
			ige.addComponent(IgeTiledComponent)
				.tiled.loadJson(self.data, function (layerArray, layersById) {
					self.minimapLayers = _.cloneDeep(layerArray);

					if (ige.isServer || (ige.isClient && ige.physics)) {
						console.log("load staticsFromMap")
						ige.physics.staticsFromMap(layersById.walls);
					}
					var mapArray = layersById.floor.map._gameData;

					// create debris
					if (layersById.debris != undefined && (ige.isServer || mode === "sandbox")) {
						self.debrisLayer = layersById.debris.objects
						self.createDebris(layersById.debris.objects)
					}
					if (ige.isServer || mode === "sandbox") {
						self.createRegions();
					}

					//}

					if (ige.isClient) {

						$.when(ige.client.igeEngineStarted).done(function () {
							// We can add all our layers to our main scene by looping the
							// array or we can pick a particular layer via the layersById
							// object. Let's give an example:
							if (mode === "sandbox") {
								var mapHeight = ige.game.data.map.height * ige.game.data.map.tileheight;
								var mapWidth = ige.game.data.map.width * ige.game.data.map.tilewidth;
								var region = new RegionUi({ height: mapHeight, width: mapWidth });
								region.depth(3)
									.layer(3)
									.drawBoundsData(false)
									.drawBounds(false)
									.mount(ige.client.rootScene)
									.translateTo(0 + (mapWidth / 2), 0 + (mapHeight / 2), 0)
									.height(mapHeight)
									.width(mapWidth)
									.bounds2d(mapWidth, mapHeight, 0);
							}

							if (layerArray[i].name !== 'debris') {
								ige.devLog("layer " + i)
								layerArray[i]
									.layer(self.layersZIndex[layerArray[i].name])
									.autoSection(20)
									.drawBounds(false)
									.drawBoundsData(false)
									.drawBounds(false)
									.mount(ige.client.rootScene)
									.translateTo(0 + (mapWidth / 2), 0 + (mapHeight / 2), 0)
									.height(mapHeight)
									.width(mapWidth)
									.bounds2d(mapWidth, mapHeight, 0);
							}
							ige.client.mapLoaded.resolve();
						});
					}
				})
		}
		else if (ige.isClient) {
			ige.addComponent(IgeTiledComponent)
				.tiled.loadJson(self.data, function (IgeLayerArray, IgeLayersById) {
					ige.addComponent(IgePixiMap)
						.pixiMap.loadJson(self.data, function (layerArray, layersById) {
							self.minimapLayers = _.cloneDeep(layerArray);

							if (ige.isServer || (ige.isClient && ige.physics)) {
								ige.physics.staticsFromMap(IgeLayersById.walls);
							}
							self.createRegions();
							// We can add all our layers to our main scene by looping the
							// array or we can pick a particular layer via the layersById
							// object. Let's give an example:
							if (mode === "sandbox") {
								var mapHeight = ige.game.data.map.height * ige.game.data.map.tileheight;
								var mapWidth = ige.game.data.map.width * ige.game.data.map.tilewidth;
								var region = new RegionUi({ height: mapHeight, width: mapWidth });
								region.depth(3)
									.layer(3)
									.drawBoundsData(false)
									.drawBounds(false)
									.mount(ige.client.rootScene)
									.translateTo(0 + (mapWidth / 2), 0 + (mapHeight / 2), 0)
									.height(mapHeight)
									.width(mapWidth)
									.bounds2d(mapWidth, mapHeight, 0);
							}
							ige.client.mapLoaded.resolve();
						});
				});
		}
	},
	createRegions: function () {
		var regions = {};
		for (var i in ige.game.data.variables) {
			var variable = ige.game.data.variables[i];
			if (variable.dataType == 'region') regions[i] = variable
		}
		ige.$$('region').forEach((region) => {
			region.deleteRegion();
		});
		for (var regionName in regions) {
			if (!ige.regionManager.getRegionById(regionName)) {
				var data = regions[regionName];
				if (data) {
					data.id = regionName;
					new Region(data);
				}
			}
		}
	},
	createDebris: function (debrisLayer) {
		var self = this

		//if debrisLayer not present return;
		if (!debrisLayer) return;

		// debris cell sheets
		var cellSheets = [];
		for (var i = 0; i < self.data.tilesets.length; i++) {
			var tileset = self.data.tilesets[i];
			var imageUrl = tileset.image

			cellSheets.push([
				imageUrl, // temporary until images locations are converted to URL
				tileset.imagewidth / tileset.tilewidth,
				tileset.imageheight / tileset.tileheight,
				tileset.firstgid
			])
		}

		for (var i = 0; i < debrisLayer.length; i++) {
			var gid = debrisLayer[i].gid;

			//dont display debris which has visible as false
			// if(!debrisLayer[i].visible) return;
			// find texture
			var cellSheet = cellSheets[cellSheets.length - 1]
			for (var j = 0; j < cellSheets.length - 1; j++) {
				var currentCellSheet = cellSheets[j];
				var nextCellSheet = cellSheets[j + 1];
				if (currentCellSheet[3] <= gid && gid < nextCellSheet[3]) {
					var cellSheet = currentCellSheet;
				}
			}

			var original = JSON.parse(JSON.stringify(debrisLayer[i]))
			original["cellSheet"] = cellSheet
			original.defaultData = {
				translate: { x: original.x, y: original.y },
				rotate: Math.radians(original.rotation)
			}
			var debris = new Debris(original);

			debrisLayer[i].igeId = debris.id() // for future reference for script's conditional checks (e.g. if debrisVariable == triggeringDebris)

			if (ige.isClient && typeof mode === 'string' && mode === 'sandbox') {
				debris
					.mount(ige.client.rootScene)
					.drawBoundsData(false);
				if (ige.game.data.isDeveloper) {
					debris.drawMouse(true)
						.mouseDown(function (event, evc) {
							var isMiniMapClicked = ige.mapEditor.checkIfClickedMiniMap(event.pageX, event.pageY);

							if (!$('#eraser').hasClass('editordiv-hover') &&
								!$('#brush').hasClass('editordiv-hover') &&
								!$('#add_region').hasClass('editordiv-hover') &&
								event.which === 1 && !isMiniMapClicked) {
								this.openDebrisModal();
							}
						});
				}
			}
		}
	},
	onSubmit: function () {
		var self = this;
		var updatedDebris = {};
		for (var i = 0; i < ige.map.debrisProperty.length; i++) {
			var value = '';
			if (ige.map.debrisProperty[i] === 'visible') {
				value = $('#visible-true').hasClass('active');
			}
			else {
				value = $('#debris-' + ige.map.debrisProperty[i]).val();
			}

			if (Number(value)) {
				value = Number(value);
			}

			if (ige.map.debrisProperty[i] === 'type' && value == '') {
				value = 'static';
			}
			updatedDebris[ige.map.debrisProperty[i]] = value;
		}
		self.updateDebrisToDb(updatedDebris);
	},
	updateDebrisToDb: function (updatedDebris) {
		var self = this;
		if (!updatedDebris || Object.keys(updatedDebris).length <= 0) return;
		$.ajax({
			url: "/api/game-client/" + gameId + "/updatedebris/" + ige.game.data.releaseId,
			dataType: "html",
			type: 'POST',
			dataType: "json",
			data: { data: JSON.stringify(updatedDebris) },
			success: function (data) {
				if (data.status === 'success') {
					$('#debris-modal').modal('hide');
					if (updatedDebris.deleteId) {
						var debris = self.getDebrisData(updatedDebris.deleteId);
						debris.destroy();
					}
					else {
						var debris = self.getDebrisData(updatedDebris.id);
						if (debris && debris._stats) {
							for (var i = 0; i < ige.map.debrisProperty.length; i++) {
								var property = ige.map.debrisProperty[i];
								if (updatedDebris[property]) {
									debris._stats[property] = updatedDebris[property];
								}
							}
							debris.resetPosition();
						}
					}
					window.updateReactGameState(false, updatedDebris);
					self.updateDebrisToMapObject(updatedDebris);
				}
			}
		})
	},
	// Note. We're using ID of debris given by map editor. Not igeId
	getDebrisData: function (id) {
		return ige.$$('debris').find(function (debris) {
			return debris._stats && debris._stats.id == id
		});
	},

	updateDebrisToMapObject: function (updatedDebris) {
		var layers = ige.map.data.layers;
		var debris = layers.find(function (layer) {
			if (layer.name == "debris") return true;
		});
		if (debris) {
			if (updatedDebris.deleteId) {
				var index = debris.objects.findIndex(function (debri) {
					return debri.id == updatedDebris.deleteId
				});
				debris.objects.splice(index, 1);
			} else {
				debris.objects.forEach(function (debri, key) {
					if (debri.id == updatedDebris.id) {
						for (var i in debri) {
							if (updatedDebris[i] != undefined) {
								debri[i] = updatedDebris[i];
							}
						}
					}
				});
			}
		}
	},

	getDimensions: function () {
		return {

		}
	}
});


if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = MapComponent; }