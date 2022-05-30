// var app, viewport, world;
var IgeInitPixi = IgeClass.extend({
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

		/*
		var test1 = new PIXI.Sprite.from('https://cache.modd.io/asset/spriteImage/1516038135827_guide.png', { crossOrigin: true });
		test1.alpha = 0.2;
		this.mobileControls.addChild(test1);
		*/

		this.ticker = PIXI.Ticker.shared;
		this.loader = PIXI.Loader ? PIXI.Loader.shared : PIXI.loader;

		// this.ticker.autoStart = false;
		// this.ticker.stop();
		this.app.ticker.stop();
		PIXI.Ticker.system.autoStart = false;
		PIXI.Ticker.system.stop();

		var self = this;

		// highjacking pixi ticker to call our new frameTick()
		var frameTick = function () {
			ige.entityTrack.frameTick();
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
			self.viewport.isZooming = true;
		});

		viewport.on('snap-zoom-end', function () {
			self.viewport.isZooming = false;
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
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = IgePixiMap;
}
