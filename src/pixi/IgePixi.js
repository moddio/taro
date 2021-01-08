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
            forceCanvas: forceCanvas[gameId] || false,
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
        this.initialWindowWidth = 2048;
        this.initialWindowHeight = 786;
        this.currentZoomValue = 0;

        this.trackEntityById = {};
        this.world = new PIXI.Container();
        this.box2dDebug = new PIXI.Container();
        this.mobileControls = new PIXI.Container();
        this.mobileControls.zIndex = 10;
        this.box2dDebug.zIndex = 10;
        this.box2dDebug.tileMap = true;
        this.world.addChild(this.box2dDebug);
        //this.world.addChild(this.mobileControls);
        this.isUpdateLayersOrderQueued = false;
		

		// make the mobileControls container fit to width and anchored to bottom
		this.mobileControls.y = window.innerHeight - 540;
		var scaleToFit = window.innerWidth/960;
		this.mobileControls.scale.set(scaleToFit,scaleToFit);
		
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
        var frameTick = function () {
            self.frameTick();
        };
        this.ticker.add(frameTick);
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

        window.onresize = this.resize;
        if (typeof ga != 'undefined' && ige.env != 'local') {
            var renderingEngine = 'canvas';
            if (this.app.renderer.context.gl) {
                renderingEngine = 'webgl-' + this.app.renderer.context.webGLVersion;
            }
            ga('send', {
                hitType: 'event',
                eventCategory: 'Rendering Engine',
                eventAction: renderingEngine,
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
            interaction: this.app.renderer.plugins.interaction, // the interaction module is important for wheel() to work properly when renderer.view is placed or scaled
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

    frameTick: function () {
        ige.engineStep();
        ige.input.processInputOnEveryFps();
        this.timeStamp = Date.now();

        if (this && this.updateAllEntities) {
            this.updateAllEntities();

            if (this.isUpdateLayersOrderQueued) {
                this.app.stage.updateLayersOrder();
                this.isUpdateLayersOrderQueued = false;
            }
            ige._renderFrames++;
        }
        if (ige.pixi.viewport.dirty && ige._cullCounter % 4 == 0) {
            ige.pixi.cull.cull(ige.pixi.viewport.getVisibleBounds());
            ige.pixi.viewport.dirty = false;
        }

        ige._cullCounter++;

        ige.pixi.app.render();
    },
    updateAllEntities: function (timeStamp) {
        var self = this;
        var currentTime = Date.now();
        if (!ige.lastTickTime) ige.lastTickTime = currentTime;
        var tickDelta = currentTime - ige.lastTickTime;

        // var entityCount = {unit: 0, item:0, player:0, wall:0, projectile: 0, undefined: 0, floatingLabel: 0}
        for (var entityId in ige.pixi.trackEntityById) {
            if (ige.pixi.trackEntityById[entityId]._destroyed) {
                delete ige.pixi.trackEntityById[entityId];
                break;
            }

            var entity = ige.$(entityId);
            if (entity) {
                // while zooming in/out, scale both unit name labels, attribute bars, and chatBubble
                if (self.viewport.isZooming) {
                    if (entity.unitNameLabel) {
                        entity.unitNameLabel.updateScale();
                        entity.unitNameLabel.updatePosition();
                    }

                    if (entity.attributeBars) {
                        _.forEach(entity.attributeBars, function (attributeBar) {
                            var bar = ige.$(attributeBar.id);
                            bar.updateScale();
                            bar.updatePosition();
                        });
                    }

                    if (openChatBubble[entityId]) {
                        var chatBubble = ige.$(openChatBubble[entityId]);
                        chatBubble.updateScale();
                        chatBubble.updatePosition();
                    }
                }

                // handle entity behaviour and transformation offsets
                if (ige.gameLoopTickHasExecuted) {
                    if (entity._deathTime !== undefined && entity._deathTime <= ige._tickStart) {
                        // Check if the deathCallBack was set
                        if (entity._deathCallBack) {
                            entity._deathCallBack.apply(entity);
                            delete entity._deathCallback;
                        }
                        entity.destroy();
                    }

                    if (entity._behaviour && !entity.isHidden()) {
                        entity._behaviour();
                    }

                    // handle streamUpdateData
                    if (ige.client.myPlayer) {
                        var updateQueue = ige.client.entityUpdateQueue[entityId];
                        if (updateQueue && updateQueue.length > 0) {
                            var nextUpdate = updateQueue[0];
                            if (
                                // Don't run if we're updating item's state/owner unit, but its owner doesn't exist yet
                                entity._category == 'item' &&
                                ((nextUpdate.ownerUnitId && ige.$(nextUpdate.ownerUnitId) == undefined) || // updating item's owner unit, but the owner hasn't been created yet
                                    ((nextUpdate.stateId == 'selected' || nextUpdate.stateId == 'unselected') && entity.getOwnerUnit() == undefined)) // changing item's state to selected/unselected, but owner doesn't exist yet
                            ) {
                                // console.log("detected update for item that don't have owner unit yet", entity.id(), nextUpdate)
                            } else {
                                // console.log("entityUpdateQueue", entityId, nextUpdate)
                                entity.streamUpdateData([nextUpdate]);
                                ige.client.entityUpdateQueue[entityId].shift();
                            }
                        }
                    }
                }
                // return if entity is culled
                // if (entity.isCulled) {
                //     continue;
                // }
                // update transformation using incoming network stream
                if (ige.network.stream && ige._renderLatency != undefined) {
                    entity._processTransform();
                }

                if (entity._translate && !entity.isHidden()) {
                    var x = entity._translate.x;
                    var y = entity._translate.y;
                    var rotate = entity._rotate.z;

                    if (entity._category == 'item') {
                        var ownerUnit = entity.getOwnerUnit();
                        if (ownerUnit) {
                            ownerUnit._processTransform(); // if ownerUnit's transformation hasn't been processed yet, then it'll cause item to drag behind. so we're running it now
                            
                            // immediately rotate items for my own unit
                            if (ownerUnit == ige.client.selectedUnit) {
                                if (entity._stats.currentBody && entity._stats.currentBody.jointType == 'weldJoint') {
                                    rotate = ownerUnit._rotate.z;
                                } else if (ownerUnit == ige.client.selectedUnit) {
                                    rotate = ownerUnit.angleToTarget; // angleToTarget is updated at 60fps
                                }
                            }

                            entity.anchoredOffset = entity.getAnchoredOffset(rotate);
                            if (entity.anchoredOffset) {
                                x = ownerUnit._translate.x + entity.anchoredOffset.x;
                                y = ownerUnit._translate.y + entity.anchoredOffset.y;
                                rotate = entity.anchoredOffset.rotate;
                            }
                        }
                    }

                    if (entity.tween && entity.tween.isTweening) {
                        entity.tween.update();
                        x += entity.tween.offset.x;
                        y += entity.tween.offset.y;
                        rotate += entity.tween.offset.rotate;
                    }

                    entity.transformPixiEntity(x, y, rotate);

                    // handle animation
                    if (entity.pixianimation) {
                        if (entity.pixianimation.animating) {
                            if (!entity.pixianimation.fpsCount) {
                                entity.pixianimation.fpsCount = 0;
                            }

                            if (entity.pixianimation.fpsCount > entity.pixianimation.fpsSecond) {
                                entity.pixianimation.animationTick();
                                entity.pixianimation.fpsCount = 0;
                            }
                            entity.pixianimation.fpsCount += tickDelta;
                        }
                    }
                }
            }
        }

        ige.lastTickTime = currentTime;

        if (ige.gameLoopTickHasExecuted) {
            ige.gameLoopTickHasExecuted = false;
        }
    },
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = IgePixiMap;
}
