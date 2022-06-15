var IgeInitPixi = IgeEventingClass.extend({
	classId: 'IgeInitPixi',
	componentId: 'pixi',

	init: function () {
		var self = this;

		ige.addComponent(IgeInputComponent);
		ige.addComponent(IgePixiTexture);
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
		ige.createFrontBuffer(true);
		// PIXI.settings.PRECISION_FRAGMENT = 'highp';
		this.app.renderer.autoDensity = true;
		this.initialWindowWidth = 800;
		this.initialWindowHeight = 600;
		this.currentZoomValue = 0;

		this.world = new PIXI.Container();
		this.box2dDebug = new PIXI.Container();
		this.mobileControls = new PIXI.Container();
		this.mobileControls.zIndex = 10;
		this.box2dDebug.zIndex = 10;
		this.box2dDebug.tileMap = true;
		this.world.addChild(this.box2dDebug);
		// this.world.addChild(this.mobileControls);
		this.isUpdateLayersOrderQueued = false;

		this.resizeCount = 0;

		// make the mobileControls container fit to width and anchored to bottom
		this.mobileControls.y = window.innerHeight - 540;
		var scaleToFit = window.innerWidth / 960;
		this.mobileControls.scale.set(scaleToFit, scaleToFit);

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
		//
		var sort = function (children) {
			children.sort(function (a, b) {
				a.zIndex = a.zIndex || 0;
				b.zIndex = b.zIndex || 0;

				if (a.children && a.children.length > 0) sort(a.children);
				if (b.children && b.children.length > 0) sort(b.children);
				if (a.zIndex == b.zIndex) {
					return a.depth - b.depth;
				}
				return a.zIndex - b.zIndex;
			});
		};
		this.app.stage.updateLayersOrder = function () {
			sort(self.app.stage.children);
			sort(self.world.children);
		};

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

		ige.client.on('show', function (e) {
			ige.pixi.show(e);
		});
		ige.client.on('hide', function (e) {
			ige.pixi.hide(e);
		});
		ige.client.on('applyAnimation', function (e) {
			ige.pixi.applyAnimation(e);
		});
		ige.client.on('createTexture', function (e) {
			ige.pixi.createTexture(e);
		});
		ige.client.on('updateTexture', function () {
			ige.pixi.updateTexture();
		});
		ige.client.on('destroyTexture', function (e) {
			ige.pixi.destroyTexture(e);
		});
		ige.client.on('width', function (e) {
			ige.pixi.width(e);
		});
		ige.client.on('height', function (e) {
			ige.pixi.height(e);
		});
		ige.client.on('transformTexture', function (e) {
			ige.pixi.transformTexture(e);
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
		ige.client.on('playAnimation', function (e) {
			ige.pixi.playAnimation(e);
		});
		ige.client.on('flipTexture', function (e) {
			ige.pixi.flipTexture(e);
		});
	},

	frameTick: function () {

		if (this.resizeQueuedAt && this.resizeQueuedAt < ige._currentTime - 250) {
			this.resize();
			this.resizeQueuedAt = undefined;
		}

		if (this.isUpdateLayersOrderQueued) {
			this.app.stage.updateLayersOrder();
			this.isUpdateLayersOrderQueued = false;
		}

		if (ige.pixi.viewport.dirty && ige._cullCounter % 4 == 0) {
			ige.pixi.cull.cull(ige.pixi.viewport.getVisibleBounds());
			ige.pixi.viewport.dirty = false;
		}

		ige._cullCounter++;

		ige.pixi.app.render();
		// this.resizeCount = 0;
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

			// mobile controls anchor
			ige.pixi.mobileControls.y = window.innerHeight - 540;
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

		// mobile controls should not follow the viewport...
		this.app.stage.addChild(this.mobileControls);

		var cull = new PIXI.extras.cull.Simple();
		cull.addList(this.world.children);
		cull.cull(viewport.getVisibleBounds());

		this.cull = cull;
		this.viewport = viewport;
		ige.pixi.resize();
	},

	zoom: function (value) {
		// value = -value;
		// ige.pixi.viewport.zoom(-this.currentZoomValue);
		ige.pixi.currentZoomValue = value;
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

	applyAnimation: function (info) {
		var {
			entity,
			cellSheet,
			animation,
			animationId
		} = info;

		var url = cellSheet.url;
		var rows = cellSheet.rowCount;
		var columns = cellSheet.columnCount;

		cellSheetAnimId = cellSheet.url;
		var fps = animation.framesPerSecond || 15;
		var loopCount = animation.loopCount - 1; // Subtract 1 for Jaeyun convention on front end

		ige.client.cellSheets[cellSheetAnimId] = entity.pixianimation.define(
			url,
			columns,
			rows,
			cellSheetAnimId,
			animationId
		);

		entity.pixianimation.select(
			animation.frames,
			fps,
			loopCount,
			cellSheetAnimId,
			animation.name
		);
	},

	createTexture: function (info) {
		var {
			entity,
			defaultSprite,
			defaultData
		} = info;

		var texture = new IgePixiTexture(
			entity._stats.cellSheet.url,
			entity._stats.cellSheet.columnCount,
			entity._stats.cellSheet.rowCount,
			entity
		);

		texture = texture.spriteFromCellSheet(defaultSprite);

		if (!texture) return;

		texture.width = (
			entity._stats.currentBody && entity._stats.currentBody.width
		) ||
			entity._stats.width;

		texture.height = (
			entity._stats.currentBody && entity._stats.currentBody.height
		) ||
			entity._stats.height;

		if (texture.anchor) {
			texture.anchor.set(0.5);
		}
		entity._pixiContainer.zIndex = (
			entity._stats.currentBody &&
			entity._stats.currentBody['z-index'] &&
			entity._stats.currentBody['z-index'].layer
		) ||
			3;

		entity._pixiContainer.depth = (
			entity._stats.currentBody &&
			entity._stats.currentBody['z-index'] &&
			entity._stats.currentBody['z-index'].depth
		) ||
			3;

		entity._pixiContainer.depth += parseInt(Math.random() * 1000) / 1000;
		entity._pixiContainer.entityId = entity.entityId;
		entity._pixiContainer._category = entity._category;
		entity._pixiTexture = texture;
		entity._pixiContainer.addChild(texture);

		if (defaultData) {
			entity._pixiContainer.x = defaultData.translate.x;
			entity._pixiContainer.y = defaultData.translate.y;
			entity._pixiTexture.rotation = defaultData.rotate;
		}

		ige.entitiesToRender.trackEntityById[entity.entityId] = entity;
	},

	updateTexture: function () {
		this.isUpdateLayersOrderQueued = true;
	},

	destroyTexture: function (entity) {
		// distinction made for UiEntities
		var entityId = entity.entityId || entity.id();

		if (
			ige.entitiesToRender.trackEntityById[entityId] &&
			(
				ige.entitiesToRender.trackEntityById[entityId]._pixiContainer ||
				ige.entitiesToRender.trackEntityById[entityId]._pixiText
			)
		) {
			// entity.destroy()
			// ige.pixi.viewport.follow();
			if (
				ige.client.myPlayer &&
				ige.client.myPlayer.currentFollowUnit == entity.id()
			) {
				ige.pixi.viewport.removePlugin('follow');
			}

			var texture;

			if (ige.entitiesToRender.trackEntityById[entityId]._pixiContainer) {
				texture = ige.entitiesToRender.trackEntityById[entityId]._pixiContainer._pixiTexture ||
					ige.entitiesToRender.trackEntityById[entityId]._pixiContainer._pixiText ||
					ige.entitiesToRender.trackEntityById[entityId]._pixiContainer;

			} else if (ige.entitiesToRender.trackEntityById[entityId]._pixiText) {
				texture = ige.entitiesToRender.trackEntityById[entityId]._pixiText;
			}
			// its not instance of ige
			if (
				texture &&
				!texture.componentId &&
				!texture._destroyed
			) {
				ige.pixi.world.removeChild(texture);
				// this is PIXI's destroy method
				texture.destroy({ children: true, texture: true });

				if (ige.pixiMap.layersGroup && !ige.pixiMap.layersGroup.floor.parent && !ige.isLog) {
					ige.isLog = true;
				}
			}

			if (ige.entitiesToRender.trackEntityById[entityId]._pixiContainer) {
				ige.entitiesToRender.trackEntityById[entityId]._pixiContainer._destroyed = true;
			}

			delete ige.entitiesToRender.trackEntityById[entityId];
		}

		if (entity.attributeBars) {
			for (var attributeBarInfo of entity.attributeBars) {
				var pixiBarId = attributeBarInfo.id;
				var pixiBar = ige.$(pixiBarId);
				pixiBar.destroy();
			}
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

	transformTexture: function (info) {
		var {
			entity,
			type,
			x,
			y,
			z // actually a rotation
		} = info;

		var pixiEntity = entity._pixiText || entity._pixiContainer;

		if (pixiEntity && !pixiEntity._destroyed) {
			if (entity._pixiTexture) {
				entity._pixiTexture.rotation = z;
			}

			if (!type) {
				pixiEntity.x = x;
				pixiEntity.y = y;
			}

			pixiEntity.dirty = true;

			if (ige.pixi.viewport) {
				ige.pixi.viewport.dirty = true;
			}
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

	playAnimation: function (info) {
		var {
			entity,
			tickDelta
		} = info;

		if (entity.pixianimation && entity.pixianimation.animating) {

			if (!entity.pixianimation.fpsCount) {
				entity.pixianimation.fpsCount = 0;
			}

			if (entity.pixianimation.fpsCount > entity.pixianimation.fpsSecond) {
				entity.pixianimation.animationTick();
				entity.pixianimation.fpsCount = 0;
			}

			entity.pixianimation.fpsCount += tickDelta;
		}
	},

	flipTexture: function (info) {
		var entityTexture = info.entity._pixiTexture;
		var flip = info.flip;

		if (entityTexture) {
			var x = Math.abs(entityTexture.scale.x);
			var y = Math.abs(entityTexture.scale.y);

			if (flip === 0) {
				entityTexture.scale.set(x, y);
			}

			if (flip === 1) {
				entityTexture.scale.set(-x, y);
			}

			if (flip === 2) {
				entityTexture.scale.set(x, -y);
			}

			if (flip === 3) {
				entityTexture.scale.set(-x, -y);
			}
		}
	}

});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = IgeInitPixi;
}
