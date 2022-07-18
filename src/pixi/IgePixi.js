var IgeInitPixi = IgeEventingClass.extend({
	classId: 'IgeInitPixi',
	componentId: 'pixi',

	init: function () {

		ige.addComponent(IgeInputComponent);
		var forceCanvas = JSON.parse(localStorage.getItem('forceCanvas')) || {};

		this.app = new PIXI.Application({
			width: 800, // default: 800
			height: 600, // default: 600
			antialias: true, // default: false
			transparent: false, // default: false
			resolution: 1, // default: 1,
			autoResize: true,
			forceCanvas: forceCanvas[gameId] || false
			// backgroundColor: 0xff00cc,
		});
		this.app.ticker.maxFPS = 60;
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
		PIXI.settings.ROUND_PIXELS = true;

		this.timeStamp = Date.now();
		this.app.view.id = 'igeFrontBuffer';
		document.getElementById('game-div').appendChild(this.app.view);
		// PIXI.settings.PRECISION_FRAGMENT = 'highp';
		this.app.renderer.autoDensity = true;
		this.initialWindowWidth = 800;
		this.initialWindowHeight = 600;

		this.world = new PIXI.Container();
		this.box2dDebug = new PIXI.Container();
		this.box2dDebug.zIndex = 10;
		this.box2dDebug.tileMap = true;
		this.world.addChild(this.box2dDebug);

		this.ticker = PIXI.Ticker.shared;
		this.loader = PIXI.Loader ? PIXI.Loader.shared : PIXI.loader;

		this.app.ticker.stop();
		PIXI.Ticker.system.autoStart = false;
		PIXI.Ticker.system.stop();

		var self = this;

		// this is the client clock
		var frameTick = function () {
			ige.client.emit('tick');
			self.frameTick();
		};
		this.ticker.add(frameTick);

		// a hack to call resize only when browser 'finishes' resizing.
		// calling resize() on window.resize event creates CPU bottleneck
		$(window).on('resize', function (e) {
			self.resizeQueuedAt = ige._currentTime;
		});

		if (typeof ga != 'undefined' && ige.env != 'local') {
			var renderingEngine = 'canvas';
			if (this.app.renderer.context.gl) {
				renderingEngine = `webgl-${this.app.renderer.context.webGLVersion}`;
			}
			ga('send', {
				hitType: 'event',
				eventCategory: 'Rendering Engine',
				eventAction: renderingEngine
			});
		}

		// TODO remove all event emits for client
		ige.client.on('show', function (e) {
			ige.pixi.show(e);
		});
		ige.client.on('hide', function (e) {
			ige.pixi.hide(e);
		});
		ige.client.on('width', function (e) {
			ige.pixi.width(e);
		});
		ige.client.on('height', function (e) {
			ige.pixi.height(e);
		});
		ige.client.on('scale', function (e) {
			ige.pixi.scale(e);
		});
		ige.client.on('mount', function (e) {
			ige.pixi.mount(e);
		});
		ige.client.on('unMount', function (e) {
			ige.pixi.unMount(e);
		});
		ige.client.on('setDepth', function (e){
			ige.pixi.setDepth(e);
		});
		ige.client.on('setLayer', function (e) {
			ige.pixi.setLayer(e);
		});
		ige.client.on('followUnit', function (e) {
			ige.pixi.followUnit(e);
		});
	},

	frameTick: function () {

		if (this.resizeQueuedAt && this.resizeQueuedAt < ige._currentTime - 250) {
			this.resize();
			this.resizeQueuedAt = undefined;
		}

		if (ige.pixi.viewport.dirty && ige._cullCounter % 4 == 0) {
			ige.pixi.cull.cull(ige.pixi.viewport.getVisibleBounds());
			ige.pixi.viewport.dirty = false;
		}

		ige._cullCounter++;

		ige.pixi.app.render();
	},

	resize: function () {
		if (ige.pixi.viewport && ige.pixi.viewport.scale) {
			var currentWindowHeight = window.innerHeight;
			var currentWindowWidth = window.innerWidth;
			var currentScale = ige.pixi.viewport.scale.x;
			var ratioOfCurrentWindow = currentWindowWidth / ige.pixi.initialWindowWidth;
			currentScale = currentScale * ratioOfCurrentWindow;

			// Resize the renderer
			ige.pixi.viewport.resize(currentWindowWidth, currentWindowHeight);
			ige.pixi.viewport.scale.set(currentScale);
			ige.pixi.app.renderer.resize(currentWindowWidth, currentWindowHeight);
			ige.pixi.initialWindowWidth = currentWindowWidth;
			ige.pixi.initialWIndowHeight = currentWindowHeight;
		}
	},
	viewport: function () {
		var self = this;
		var offset = 0;
		// PIXI.extras.Viewport = Viewport;
		var viewport = new PIXI.extras.Viewport({
			screenWidth: 800,
			screenHeight: 600,
			worldWidth: this.world.worldWidth,
			worldHeight: this.world.worldHeight,
			interaction: this.app.renderer.plugins.interaction // the interaction module is important for wheel() to work properly when renderer.view is placed or scaled
		})
			.decelerate()
			.on('drag-start', function (e) {
				console.log(e.world);
				// ige.pixi._mouseCord = {
				//     x: e.world.x,
				//     y: e.world.y,
				// }
			});
		// .clamp({
		//     left: -offset,
		//     right: this.world.worldWidth + offset,
		//     top: - offset,
		//     bottom: this.world.worldHeight + offset
		// })
		// .drag();

		viewport.on('snap-zoom-start', function () {
			ige.client.isZooming = true;
		});

		viewport.on('snap-zoom-end', function () {
			ige.client.isZooming = false;
		});

		viewport.addChild(this.world);
		this.app.stage.addChild(viewport);

		var cull = new PIXI.extras.cull.Simple();
		cull.addList(this.world.children);
		cull.cull(viewport.getVisibleBounds());

		this.cull = cull;
		this.viewport = viewport;
		ige.pixi.resize();
	},

	zoom: function (value) {
		ige.pixi.viewport.snapZoom({ height: value, ease: 'easeOutQuad' }, true);
	},

	show: function (entity) {
		var pixiEntity = entity._pixiText || entity._pixiTexture;
		if (pixiEntity) {
			pixiEntity.visible = true;
		}
	},

	hide: function (entity) {
		var pixiEntity = entity._pixiText || entity._pixiTexture;
		if (pixiEntity) {
			pixiEntity.visible = false;
		}
	},

	width: function (info) {
		// set width
		var  { entity, px } = info;

		if (entity._pixiTexture && !entity._pixiTexture._destroyed) {
			entity._pixiTexture.width = px;

		} else if (entity._pixiContainer && !entity._pixiContainer._destroyed) {
			entity._pixiContainer.width = px;

		} else if (entity._pixiText && !entity._pixiText._destroyed) {
			entity._pixiText.width = px;
		}
	},

	height: function (info) {
		// set height
		var  { entity,	px } = info;

		if (entity._pixiTexture && !entity._pixiTexture._destroyed) {
			entity._pixiTexture.height = px;

		} else if (entity._pixiContainer && !entity._pixiContainer._destroyed) {
			entity._pixiContainer.height = px;

		} else if (entity._pixiText && !entity._pixiText._destroyed) {
			entity._pixiText.height = px;
		}
	},

	scale: function (info) {
		var { entity, x, y } = info;

		if (x !== undefined && y !== undefined) {
			if (entity._pixiTexture && !entity._pixiTexture._destroyed) {
				entity._pixiTexture.scale.set(x, y);

			} else if (entity._pixiText && !entity._pixiText._destroyed) {
				entity._pixiText.scale.set(x, y);

			} else if (entity._pixiContainer && !entity._pixiContainer._destroyed) {
				entity._pixiContainer.scale.set(x, y);
			}
		}
	},

	mount: function (info) {
		var { entity, parent } = info;

		if (entity._pixiContainer && !entity._pixiContainer._destroyed) {

			if (entity._pixiContainer.parent) {
				entity.unMount();
			}
			// let pixiEntity = parent._pixiContainer || parent;
			parent.addChild(entity._pixiContainer);
		}
	},

	unMount: function (entity) {
		if (entity._pixiContainer) {

			if (entity._pixiContainer.parent && entity.entityId) {

				if (entity._pixiTexture.parent.children) {
					var index = entity._pixiContainer.parent.children.findIndex(
						function (child) {
							return child.entityId === entity.entityId;
						});

					if (index > -1) {
						entity._pixiContainer.parent.removeChildAt(index);
					}
				}
			}
		}
	},

	setDepth: function (info) {
		var { entity, depth } = info;

		if (entity._pixiContainer) {
			entity._pixiContainer.depth = depth;
		}
	},

	setLayer: function (info) {
		var { entity, layer } = info;

		if (entity._pixiContainer) {
			entity._pixiContainer.zIndex = layer;
		}
	},

	followUnit: function (entity) {
		if (
			entity._pixiContainer &&
			ige.entitiesToRender.trackEntityById[entity._id]._pixiContainer
		) {
			ige.pixi.viewport.follow(ige.entitiesToRender.trackEntityById[entity._id]._pixiContainer);
		}
	},

	loadMapJson: function (map, callback) {
		var layersById = {};
		var layersByKey = {};

		map.tilewidth = parseFloat(map.tilewidth);
		map.tileheight = parseFloat(map.tileheight);
		map.width = parseFloat(map.width);
		map.height = parseFloat(map.height);

		ige.pixi.world.tileWidth = map.tilewidth;
		ige.pixi.world.tileHeight = map.tileheight;

		ige.pixi.world.worldWidth = map.width * map.tilewidth;
		ige.pixi.world.worldHeight = map.height * map.tileheight;

		// create viewport
		ige.pixi.viewport();

		if (ige.pixi.world.worldWidth % 2) {
			ige.pixi.world.worldWidth--;
		}
		if (ige.pixi.world.worldHeight % 2) {
			ige.pixi.world.worldheight--;
		}

		ige.pixi.world.worldScreenHeight = 600;
		ige.pixi.world.worldScreenWidth = 400;

		ige.pixi.world.widthInTiles = map.width;
		ige.pixi.world.heightInTiles = map.height;

		ige.pixi.world.objects = [];

		map.layers.forEach(function (tiledLayer, i) {
			layersById[tiledLayer.name] = tiledLayer;
			layersByKey[i] = tiledLayer;
		});

		ige.pixi.viewport.moveCenter(ige.pixi.world.width / 2, ige.pixi.world.height / 2);

		callback(layersByKey, layersById);
	}

});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = IgeInitPixi;
}
