/**
 * Creates an entity and handles the entity's life cycle and
 * all related entity actions / methods.
 */
var IgeEntity = IgeObject.extend({
	classId: 'IgeEntity',

	init: function (defaultData = {}) {
		IgeObject.prototype.init.call(this);

		// Register the IgeEntity special properties handler for
		// serialise and de-serialise support
		var translateX = defaultData.translate && defaultData.translate.x ? defaultData.translate.x : 0;
		var translateY = defaultData.translate && defaultData.translate.y ? defaultData.translate.y : 0;
		var rotate = defaultData.rotate || 0;

		this._specialProp.push('_texture');
		this._specialProp.push('_eventListeners');
		this._specialProp.push('_aabb');

		this._anchor = new IgePoint2d(0, 0);
		this._renderPos = { x: 0, y: 0 };

		this._computedOpacity = 1;
		this._opacity = 1;
		this._cell = 1;

		this._flip = 0; // texture flip code 1=horiz 2=vert 3=both

		this._deathTime = undefined;
		this._bornTime = ige._currentTime;

		this._translate = new IgePoint3d(translateX, translateY, rotate);
		this._oldTranform = [];
		this._hasMoved = true;

		this._rotate = new IgePoint3d(0, 0, rotate);

		this._scale = new IgePoint3d(1, 1, 1);
		this._origin = new IgePoint3d(0.5, 0.5, 0.5);

		this._bounds2d = new IgePoint2d(40, 40);
		this._bounds3d = new IgePoint3d(0, 0, 0);

		this._oldBounds2d = new IgePoint2d(40, 40);
		this._oldBounds3d = new IgePoint3d(0, 0, 0);

		this._highlight = false;
		this._mouseEventsActive = false;

		this._velocity = new IgePoint3d(0, 0, 0);

		this._localMatrix = new IgeMatrix2d();
		this._worldMatrix = new IgeMatrix2d();
		this._oldWorldMatrix = new IgeMatrix2d();

		this._lastSeenBy = {};

		this._inView = true;
		this._hidden = false;

		this._stats = {};
		this._streamDataQueued = [];
		this._isBeingRemoved = false;
		// this ensures entity is spawning at a correct position initially. particularily useful for projectiles

		this._keyFrames = [];
		this.prevKeyFrame = [ige.now, [this._translate.x, this._translate.y, this._rotate.z]];
		this._lastTransformAt = null;
		this.lastServerStreamedPosition = null;
		this.lastTeleportedAt = 0;

		if (ige.isClient) {
			this.anchorOffset = { x: 0, y: 0, rotate: 0 };
			this.addComponent(TweenComponent);
		}

		// this.compositeCache(true);

		/* CEXCLUDE */
		if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
			// Set the stream floating point precision to 2 as default
			this.streamFloatPrecision(0);
		}
		/* CEXCLUDE */

		// Set the default stream sections as just the transform data
		this.streamSections(['transform']);
	},

	/**
     * Sets the entity as visible and able to be interacted with.
     * @example #Show a hidden entity
     *     entity.show();
     * @return {*} The object this method was called from to allow
     * method chaining.
     */
	show: function () {
		var self = this;

		if (ige.isServer) {
			// self._hidden = false; // never hide it, because it'll stop processing stream queue
			this.streamUpdateData([{ isHidden: false }]);
		} else if (ige.isClient) {
			// this.disableInterpolation(false)
			// add a little bit of delay before showing the item, so we don't see item translating from old location to new location
			self._hidden = false;
			ige.client.emit('show', this);
		}

		return this;
	},

	// update item's body & texture based on stateId given
	setState: function (stateId, defaultData) {
		var self = this;

		// if invalid stateId is given, set state to default state
		if (stateId == undefined || self._stats.states == undefined || self._stats.states[stateId] == undefined) {
			stateId = this.getDefaultStateId();
		}

		var newState = (self._stats.states && self._stats.states[stateId]) || {};
		if (newState && newState.body) {

			/*
			* if state is 'unselected' newState.body = 'none'
				will evaluate to currentBody = undefined

			*/
			self._stats.currentBody = self._stats.bodies[newState.body];
		}

		if (ige.isServer) {
			self.streamUpdateData([{ stateId: stateId }]);
		} else if (ige.isClient) {
			self._stats.stateId = stateId;
			if (newState.sound) {
				for (var soundId in newState.sound) {
					var sound = newState.sound[soundId];
					ige.sound.playSound(sound, this._translate, soundId);
				}
			}
		}

		self.previousState = newState;
		self.updateBody(defaultData);
	},

	/**
     * Sets the entity as hidden and cannot be interacted with.
     * @example #Hide a visible entity
     *     entity.hide();
     * @return {*} The object this method was called from to allow
     * method chaining.
     */
	hide: function () {
		var self = this;

		if (ige.isServer) {
			// self._hidden = true; // never hide it, because it'll stop processing stream queue
			this.streamUpdateData([{ isHidden: true }]);
		} else if (ige.isClient) {
			// this.disableInterpolation(true)

			self._hidden = true;
			ige.client.emit('hide', this);
			self.texture('');
		}
		return this;
	},

	/**
     * Checks if the entity is hidden.
     * @returns {boolean} True if the entity is hidden.
     */
	isHidden: function () {
		return this._hidden === true;
	},

	/* Checks if entity should be invisible depending on diplomacy status of the owner player of this entity */
	shouldBeInvisible: function (playerA, playerB) {
		return playerA && playerB && ((playerA.isHostileTo(playerB) && this._stats.isInvisible == true) || (playerA.isFriendlyTo(playerB) && this._stats.isInvisibleToFriendly == true) || (playerA.isNeutralTo(playerB) && this._stats.isInvisibleToNeutral == true));
	},

	imageUrlToHash: function (url) {
		var hash = 0;
		if (url.length == 0) {
			return hash;
		}
		for (var i = 0; i < url.length; i++) {
			var char = url.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	},

	updateLayer: function () {
		var self = this;
		var defaultLayer = {
			depth: 0,
			layer: 0
		};
		// parseFloat(Math.random().toFixed(4))
		if (self._category == 'unit') {
			defaultLayer.layer = 3;
			defaultLayer.depth = 3;
		} else if (self._category == 'item') {
			if (self.getOwnerUnit()) {
				defaultLayer.layer = 3;
				defaultLayer.depth = 3;
			} else {
				// doesn't have owner. show it above floor2
				defaultLayer.layer = 2;
				defaultLayer.depth = 5;
			}
		} else if (self._category == 'projectile') {
			defaultLayer.layer = 3;
			defaultLayer.depth = 3;
		}

		var body = self._stats.currentBody;

		if (body && !body['z-index']) {
			body['z-index'] = defaultLayer;
		}

		if (isNaN(body['z-index'].depth)) {
			body['z-index'].depth = defaultLayer.depth;
		}
		if (isNaN(body['z-index'].layer)) {
			body['z-index'].layer = defaultLayer.layer;
		}
		self.layer(body['z-index'].layer) // above "floor 2 layer", but under "trees layer"
			.depth(body['z-index'].depth);
	},

	applyAnimationById: function (animationId) {
		var self = this;
		var animation = null;

		if (self._stats.stateId && self._stats.states && self._stats.states[self._stats.stateId] && self._stats.animations[animationId]) {
			animation = self._stats.animations[animationId];
		}
		var cellSheet = null;

		cellSheet = self._stats.cellSheet;
		if (animation && cellSheet) {
			// cell sheet animation id will be concatenation of unit type and animation id
			// default loop to undefined;
			// TODO: FIX DUPLICATE
			this.pixianimation.select(animation.frames, fps, loopCount, cellSheetAnimId, animation.name);

			this.emit('play-animation', animationId);
			ige.client.emit('applyAnimation', {entity: this, animation: animation, cellSheet: cellSheet, animationId: animationId});
		}
	},

	applyAnimationForState: function (stateId) {
		var self = this;

		// players can purchase unit skins
		// these custom cellsheets override the default unit cellsheet
		// they should also therefore be geometrically compatible
		var state = ige.game.data.states[stateId];

		// unit or item state config (overrides if present)
		if (self._stats && self._stats.states && self._stats.states[stateId]) {
			state = self._stats.states[stateId];
		}

		if (state) {
			var animationId = state.animation;
			if (animationId) {
				self.applyAnimationById(animationId);
			}
			// if (state.sound) {
			// 	for (var soundKey in state.sound) {
			// 		var sound = state.sound[soundKey];
			// 		ige.sound.playSound(sound, self._translate, soundKey);
			// 	}
			// }
		}
	},

	updateTexture: function () {
		var stateId = this._stats.stateId;
		// if state not explicitly set, use default state
		if (stateId == null) {
			stateId = this.getDefaultStateId();
		}

		if (stateId) {
			this.applyAnimationForState(stateId);
		}

		ige.client.emit('updateTexture');
	},

	getDefaultStateId: function () {
		var defaultStateId = null;

		var states = this._stats.states;
		for (i in states) {
			var state = states[i];
			if (!state) {
				continue;
			}
			if (this._category === 'item') {
				if (state.name == 'dropped') {
					defaultStateId = i;
				}
			} else {
				if (state.name == 'default') {
					defaultStateId = i;
				}
			}
		}

		return defaultStateId;
	},

	/**
     * Gets / sets the cache flag that determines if the entity's
     * texture rendering output should be stored on an off-screen
     * canvas instead of calling the texture.render() method each
     * tick. Useful for expensive texture calls such as rendering
     * fonts etc. If enabled, this will automatically disable advanced
     * composite caching on this entity with a call to
     * compositeCache(false).
     * @param {Boolean=} val True to enable caching, false to
     * disable caching.
     * @example #Enable entity caching
     *     entity.cache(true);
     * @example #Disable entity caching
     *     entity.cache(false);
     * @example #Get caching flag value
     *     var val = entity.cache();
     * @return {*}
     */
	cache: function (val) {
		if (val !== undefined) {
			this._cache = val;

			if (val) {
				// Create the off-screen canvas
				if (ige.isClient) {
					// Use a real canvas
					this._cacheCanvas = document.createElement('canvas');
				} else {
					// Use dummy objects for canvas and context
					this._cacheCanvas = new IgeDummyCanvas();
				}

				this._cacheCtx = this._cacheCanvas.getContext('2d');
				this._cacheDirty = true;

				// Set smoothing mode
				var smoothing = this._cacheSmoothing !== undefined ? this._cacheSmoothing : ige._globalSmoothing;
				if (!smoothing) {
					this._cacheCtx.imageSmoothingEnabled = false;
					// this._cacheCtx.webkitImageSmoothingEnabled = false;
					this._cacheCtx.mozImageSmoothingEnabled = false;
				} else {
					this._cacheCtx.imageSmoothingEnabled = true;
					// this._cacheCtx.webkitImageSmoothingEnabled = true;
					this._cacheCtx.mozImageSmoothingEnabled = true;
				}

				// Switch off composite caching
				if (this.compositeCache()) {
					this.compositeCache(false);
				}
			} else {
				// Remove the off-screen canvas
				delete this._cacheCanvas;
			}

			return this;
		}

		return this._cache;
	},

	/**
     * When using the caching system, this boolean determines if the
     * cache canvas should have image smoothing enabled or not. If
     * not set, the ige global smoothing setting will be used instead.
     * @param {Boolean=} val True to enable smoothing, false to disable.
     * @returns {*}
     */
	cacheSmoothing: function (val) {
		if (val !== undefined) {
			this._cacheSmoothing = val;
			return this;
		}

		return this._cacheSmoothing;
	},

	/**
     * Gets / sets composite caching. Composite caching draws this entity
     * and all of it's children (and their children etc) to a single off
     * screen canvas so that the entity does not need to be redrawn with
     * all it's children every tick. For composite entities where little
     * change occurs this will massively increase rendering performance.
     * If enabled, this will automatically disable simple caching on this
     * entity with a call to cache(false).
     * @param {Boolean=} val
     * @example #Enable entity composite caching
     *     entity.compositeCache(true);
     * @example #Disable entity composite caching
     *     entity.compositeCache(false);
     * @example #Get composite caching flag value
     *     var val = entity.cache();
     * @return {*}
     */
	compositeCache: function (val) {
		if (ige.isClient) {
			if (val !== undefined) {
				if (val) {
					// Switch off normal caching
					this.cache(false);

					// Create the off-screen canvas
					this._cacheCanvas = document.createElement('canvas');
					this._cacheCtx = this._cacheCanvas.getContext('2d');
					this._cacheDirty = true;

					// Set smoothing mode
					var smoothing = this._cacheSmoothing !== undefined ? this._cacheSmoothing : ige._globalSmoothing;
					if (!smoothing) {
						this._cacheCtx.imageSmoothingEnabled = false;
						this._cacheCtx.webkitImageSmoothingEnabled = false;
						this._cacheCtx.mozImageSmoothingEnabled = false;
					} else {
						this._cacheCtx.imageSmoothingEnabled = true;
						this._cacheCtx.webkitImageSmoothingEnabled = true;
						this._cacheCtx.mozImageSmoothingEnabled = true;
					}
				}

				// Loop children and set _compositeParent to the correct value
				this._children.each(function () {
					if (val) {
						this._compositeParent = true;
					} else {
						delete this._compositeParent;
					}
				});

				this._compositeCache = val;
				return this;
			}

			return this._compositeCache;
		} else {
			return this;
		}
	},

	/**
     * Gets / sets the cache dirty flag. If set to true this will
     * instruct the entity to re-draw it's cached image from the
     * assigned texture. Once that occurs the flag will automatically
     * be set back to false. This works in either standard cache mode
     * or composite cache mode.
     * @param {Boolean=} val True to force a cache update.
     * @example #Get cache dirty flag value
     *     var val = entity.cacheDirty();
     * @example #Set cache dirty flag value
     *     entity.cacheDirty(true);
     * @return {*}
     */
	cacheDirty: function (val) {
		if (val !== undefined) {
			this._cacheDirty = val;

			// Check if the entity is a child of a composite or composite
			// entity chain and propagate the dirty cache up the chain
			if (val && this._compositeParent && this._parent) {
				this._parent.cacheDirty(val);

				if (!this._cache && !this._compositeCache) {
					// Set clean immediately as no caching is enabled on this child
					this._cacheDirty = false;
				}
			}

			return this;
		}

		return this._cacheDirty;
	},

	/**
     * Gets the position of the mouse relative to this entity's
     * center point.
     * @param {IgeViewport=} viewport The viewport to use as the
     * base from which the mouse position is determined. If no
     * viewport is specified then the current viewport the engine
     * is rendering to is used instead.
     * @example #Get the mouse position relative to the entity
     *     // The returned value is an object with properties x, y, z
     *     var mousePos = entity.mousePos();
     * @return {IgePoint3d} The mouse point relative to the entity
     * center.
     */
	mousePos: function (viewport) {
		viewport = viewport || ige._currentViewport;
		if (viewport) {
			var mp = viewport._mousePos.clone();
			var cam;

			if (this._ignoreCamera) {
				/* cam = ige._currentCamera;
				mp.thisMultiply(1 / cam._scale.x, 1 / cam._scale.y, 1 / cam._scale.z);
				//mp.thisRotate(-cam._rotate.z);
				mp.thisAddPoint(cam._translate); */
			}

			mp.x += viewport._translate.x;
			mp.y += viewport._translate.y;
			this._transformPoint(mp);
			return mp;
		} else {
			return new IgePoint3d(0, 0, 0);
		}
	},

	/**
     * Gets the position of the mouse relative to this entity not
     * taking into account viewport translation.
     * @param {IgeViewport=} viewport The viewport to use as the
     * base from which the mouse position is determined. If no
     * viewport is specified then the current viewport the engine
     * is rendering to is used instead.
     * @example #Get absolute mouse position
     *     var mousePosAbs = entity.mousePosAbsolute();
     * @return {IgePoint3d} The mouse point relative to the entity
     * center.
     */
	mousePosAbsolute: function (viewport) {
		viewport = viewport || ige._currentViewport;
		if (viewport) {
			var mp = viewport._mousePos.clone();
			this._transformPoint(mp);
			return mp;
		}

		return new IgePoint3d(0, 0, 0);
	},

	/**
     * Gets the position of the mouse in world co-ordinates.
     * @param {IgeViewport=} viewport The viewport to use as the
     * base from which the mouse position is determined. If no
     * viewport is specified then the current viewport the engine
     * is rendering to is used instead.
     * @example #Get mouse position in world co-ordinates
     *     var mousePosWorld = entity.mousePosWorld();
     * @return {IgePoint3d} The mouse point relative to the world
     * center.
     */
	mousePosWorld: function (viewport) {
		viewport = viewport || ige._currentViewport;
		var mp = this.mousePos(viewport);
		this.localToWorldPoint(mp, viewport);

		if (this._ignoreCamera) {
			// viewport.camera._worldMatrix.getInverse().transform([mp]);
		}

		return mp;
	},

	/**
     * Rotates the entity to point at the target point around the z axis.
     * @param {IgePoint3d} point The point in world co-ordinates to
     * point the entity at.
     * @example #Point the entity at another entity
     *     entity.rotateToPoint(otherEntity.worldPosition());
     * @example #Point the entity at mouse
     *     entity.rotateToPoint(ige._currentViewport.mousePos());
     * @example #Point the entity at an arbitrary point x, y
     *     entity.rotateToPoint(new IgePoint3d(x, y, 0));
     * @return {*}
     */
	rotateToPoint: function (point) {
		var worldPos = this.worldPosition();
		this.rotateTo(
			this._rotate.x,
			this._rotate.y,
			this._rotate.z
			// (Math.atan2(worldPos.y - point.y, worldPos.x - point.x) - this._parent._rotate.z) + Math.radians(270)
		);

		return this;
	},

	/**
     * Gets / sets the texture to use as the background
     * pattern for this entity.
     * @param {IgeTexture} texture The texture to use as
     * the background.
     * @param {String=} repeat The type of repeat mode either: "repeat",
     * "repeat-x", "repeat-y" or "none".
     * @param {Boolean=} trackCamera If set to true, will track the camera
     * translation and "move" the background with the camera.
     * @param {Boolean=} isoTile If true the tiles of the background will
     * be treated as isometric and will therefore be drawn so that they are
     * layered seamlessly in isometric view.
     * @example #Set a background pattern for this entity with 2d tiling
     *     var texture = new IgeTexture('path/to/my/texture.png');
     *     entity.backgroundPattern(texture, 'repeat', true, false);
     * @example #Set a background pattern for this entity with isometric tiling
     *     var texture = new IgeTexture('path/to/my/texture.png');
     *     entity.backgroundPattern(texture, 'repeat', true, true);
     * @return {*}
     */
	backgroundPattern: function (texture, repeat, trackCamera, isoTile) {
		if (texture !== undefined) {
			this._backgroundPattern = texture;
			this._backgroundPatternRepeat = repeat || 'repeat';
			this._backgroundPatternTrackCamera = trackCamera;
			this._backgroundPatternIsoTile = isoTile;
			this._backgroundPatternFill = null;
			return this;
		}

		return this._backgroundPattern;
	},
	createTexture: function (defaultSprite = 0, defaultData) {
		ige.client.emit('createTexture', {entity: this, defaultSprite: defaultSprite, defaultData: defaultData});
	},

	/**
     * Set the object's width to the number of tile width's specified.
     * @param {Number} val Number of tiles.
     * @param {Boolean=} lockAspect If true, sets the height according
     * to the texture aspect ratio and the new width.
     * @example #Set the width of the entity based on the tile width of the map the entity is mounted to
     *     // Set the entity width to the size of 1 tile with
     *     // lock aspect enabled which will automatically size
     *     // the height as well so as to maintain the aspect
     *     // ratio of the entity
     *     entity.widthByTile(1, true);
     * @return {*} The object this method was called from to allow
     * method chaining.
     */
	widthByTile: function (val, lockAspect) {
		if (this._parent && this._parent._tileWidth !== undefined && this._parent._tileHeight !== undefined) {
			var tileSize = this._mode === 0 ? this._parent._tileWidth : this._parent._tileWidth * 2;
			var ratio;

			this.width(val * tileSize);

			if (lockAspect) {
				if (this._texture) {
					// Calculate the height based on the new width
					ratio = this._texture._sizeX / this._bounds2d.x;
					this.height(this._texture._sizeY / ratio);
				} else {
					IgeEntity.prototype.log('Cannot set height based on texture aspect ratio and new width because no texture is currently assigned to the entity!', 'error');
				}
			}
		} else {
			IgeEntity.prototype.log('Cannot set width by tile because the entity is not currently mounted to a tile map or the tile map has no tileWidth or tileHeight values.', 'warning');
		}

		return this;
	},

	/**
     * Set the object's height to the number of tile height's specified.
     * @param {Number} val Number of tiles.
     * @param {Boolean=} lockAspect If true, sets the width according
     * to the texture aspect ratio and the new height.
     * @example #Set the height of the entity based on the tile height of the map the entity is mounted to
     *     // Set the entity height to the size of 1 tile with
     *     // lock aspect enabled which will automatically size
     *     // the width as well so as to maintain the aspect
     *     // ratio of the entity
     *     entity.heightByTile(1, true);
     * @return {*} The object this method was called from to allow
     * method chaining.
     */
	heightByTile: function (val, lockAspect) {
		if (this._parent && this._parent._tileWidth !== undefined && this._parent._tileHeight !== undefined) {
			var tileSize = this._mode === 0 ? this._parent._tileHeight : this._parent._tileHeight * 2;
			var ratio;

			this.height(val * tileSize);

			if (lockAspect) {
				if (this._texture) {
					// Calculate the width based on the new height
					ratio = this._texture._sizeY / this._bounds2d.y;
					this.width(this._texture._sizeX / ratio);
				} else {
					IgeEntity.prototype.log('Cannot set width based on texture aspect ratio and new height because no texture is currently assigned to the entity!', 'error');
				}
			}
		} else {
			IgeEntity.prototype.log('Cannot set height by tile because the entity is not currently mounted to a tile map or the tile map has no tileWidth or tileHeight values.', 'warning');
		}

		return this;
	},

	/**
     * Adds the object to the tile map at the passed tile co-ordinates. If
     * no tile co-ordinates are passed, will use the current tile position
     * and the tileWidth() and tileHeight() values.
     * @param {Number=} x X co-ordinate of the tile to occupy.
     * @param {Number=} y Y co-ordinate of the tile to occupy.
     * @param {Number=} width Number of tiles along the x-axis to occupy.
     * @param {Number=} height Number of tiles along the y-axis to occupy.
     */
	occupyTile: function (x, y, width, height) {
		// Check that the entity is mounted to a tile map
		if (this._parent && this._parent.IgeTileMap2d) {
			if (x !== undefined && y !== undefined) {
				this._parent.occupyTile(x, y, width, height, this);
			} else {
				// Occupy tiles based upon tile point and tile width/height
				var trPoint = new IgePoint3d(this._translate.x - (this._tileWidth / 2 - 0.5) * this._parent._tileWidth, this._translate.y - (this._tileHeight / 2 - 0.5) * this._parent._tileHeight, 0);
				var tilePoint = this._parent.pointToTile(trPoint);

				if (this._parent._mountMode === 1) {
					tilePoint.thisToIso();
				}

				this._parent.occupyTile(tilePoint.x, tilePoint.y, this._tileWidth, this._tileHeight, this);
			}
		}
		return this;
	},

	/**
     * Removes the object from the tile map at the passed tile co-ordinates.
     * If no tile co-ordinates are passed, will use the current tile position
     * and the tileWidth() and tileHeight() values.
     * @param {Number=} x X co-ordinate of the tile to un-occupy.
     * @param {Number=} y Y co-ordinate of the tile to un-occupy.
     * @param {Number=} width Number of tiles along the x-axis to un-occupy.
     * @param {Number=} height Number of tiles along the y-axis to un-occupy.
     * @private
     */
	unOccupyTile: function (x, y, width, height) {
		// Check that the entity is mounted to a tile map
		if (this._parent && this._parent.IgeTileMap2d) {
			if (x !== undefined && y !== undefined) {
				this._parent.unOccupyTile(x, y, width, height);
			} else {
				// Un-occupy tiles based upon tile point and tile width/height
				var trPoint = new IgePoint3d(this._translate.x - (this._tileWidth / 2 - 0.5) * this._parent._tileWidth, this._translate.y - (this._tileHeight / 2 - 0.5) * this._parent._tileHeight, 0);
				var tilePoint = this._parent.pointToTile(trPoint);

				if (this._parent._mountMode === 1) {
					tilePoint.thisToIso();
				}

				this._parent.unOccupyTile(tilePoint.x, tilePoint.y, this._tileWidth, this._tileHeight);
			}
		}
		return this;
	},

	/**
     * Returns an array of tile co-ordinates that the object is currently
     * over, calculated using the current world co-ordinates of the object
     * as well as it's 3d geometry.
     * @private
     * @return {Array} The array of tile co-ordinates as IgePoint3d instances.
     */
	overTiles: function () {
		// Check that the entity is mounted to a tile map
		if (this._parent && this._parent.IgeTileMap2d) {
			var x;
			var y;
			var tileWidth = this._tileWidth || 1;
			var tileHeight = this._tileHeight || 1;
			var tile = this._parent.pointToTile(this._translate);
			var tileArr = [];

			for (x = 0; x < tileWidth; x++) {
				for (y = 0; y < tileHeight; y++) {
					tileArr.push(new IgePoint3d(tile.x + x, tile.y + y, 0));
				}
			}

			return tileArr;
		}
	},

	/**
     * Gets / sets the anchor position that this entity's texture
     * will be adjusted by.
     * @param {Number=} x The x anchor value.
     * @param {Number=} y The y anchor value.
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	anchor: function (x, y) {
		if (x !== undefined && y !== undefined) {
			this._anchor = new IgePoint2d(x, y);
			return this;
		}

		return this._anchor;
	},

	/**
     * Gets / sets the geometry x value.
     * @param {Number=} px The new x value in pixels.
     * @example #Set the width of the entity
     *     entity.width(40);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	width: function (px, lockAspect) {
		if (px !== undefined) {
			if (lockAspect) {
				// Calculate the height from the change in width
				var ratio = px / this._bounds2d.x;
				this.height(this._bounds2d.y * ratio);
			}
			this._bounds2d.x = px;
			this._bounds2d.x2 = px / 2;
			if (ige.isClient) {
				ige.client.emit('width', {entity: this, px: px});
			}

			return this;
		}
		if (this._pixiTexture) {
			return this._pixiTexture.width;
		} else if (this._pixiContainer) {
			return this._pixiContainer.width;
		} else if (this._pixiText) {
			return this._pixiText.width;
		}

		return this._bounds2d.x;
	},

	/**
     * Gets / sets the geometry y value.
     * @param {Number=} px The new y value in pixels.
     * @example #Set the height of the entity
     *     entity.height(40);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	height: function (px, lockAspect) {
		if (px !== undefined) {
			if (lockAspect) {
				// Calculate the width from the change in height
				var ratio = px / this._bounds2d.y;
				this.width(this._bounds2d.x * ratio);
			}
			this._bounds2d.y = px;
			this._bounds2d.y2 = px / 2;
			if (ige.isClient) {
				ige.client.emit('height', {entity: this, px: px});
			}

			return this;
		}

		if (this._pixiTexture) {
			return this._pixiTexture.height;
		} else if (this._pixiContainer) {
			return this._pixiContainer.height;
		} else if (this._pixiText) {
			return this._pixiText.height;
		}
		return this._bounds2d.y;
	},

	/**
     * Gets / sets the 2d geometry of the entity. The x and y values are
     * relative to the center of the entity. This geometry is used when
     * rendering textures for the entity and positioning in world space as
     * well as UI positioning calculations. It holds no bearing on isometric
     * positioning.
     * @param {Number=} x The new x value in pixels.
     * @param {Number=} y The new y value in pixels.
     * @example #Set the dimensions of the entity (width and height)
     *     entity.bounds2d(40, 40);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	bounds2d: function (x, y) {
		if (x !== undefined && y !== undefined) {
			this._bounds2d = new IgePoint2d(x, y, 0);
			return this;
		}

		if (x !== undefined && y === undefined) {
			// x is considered an IgePoint2d instance
			this._bounds2d = new IgePoint2d(x.x, x.y);
		}

		return this._bounds2d;
	},

	getBounds: function () {
		// for entities with bodies like unit/item/projectile/etc
		var bounds = {
			x: this._translate.x - this.width() / 2,
			y: this._translate.y - this.height() / 2,
			width: this.width(),
			height: this.height()
		};

		// get bounds of spriteOnly item carried by unit
		if (this._category == 'item') {
			var ownerUnit = this.getOwnerUnit();
			if (ownerUnit && this._stats && this._stats.currentBody.type == 'spriteOnly' && !this.body) {
				bounds = {
					x: ownerUnit._translate.x + this.anchorOffset.x - this._stats.currentBody.width / 2,
					y: ownerUnit._translate.y + this.anchorOffset.y - this._stats.currentBody.height / 2,
					width: this._stats.currentBody.width,
					height: this._stats.currentBody.height
				};
			}
		}

		return bounds;
	},

	/**
     * Gets / sets the 3d geometry of the entity. The x and y values are
     * relative to the center of the entity and the z value is wholly
     * positive from the "floor". Used to define a 3d bounding cuboid for
     * the entity used in isometric depth sorting and hit testing.
     * @param {Number=} x The new x value in pixels.
     * @param {Number=} y The new y value in pixels.
     * @param {Number=} z The new z value in pixels.
     * @example #Set the dimensions of the entity (width, height and length)
     *     entity.bounds3d(40, 40, 20);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	bounds3d: function (x, y, z) {
		if (x !== undefined && y !== undefined && z !== undefined) {
			this._bounds3d = new IgePoint3d(x, y, z);
			return this;
		}

		return this._bounds3d;
	},

	/**
     * @deprecated Use bounds3d instead
     * @param x
     * @param y
     * @param z
     */
	size3d: function (x, y, z) {
		IgeEntity.prototype.log('size3d has been renamed to bounds3d but is exactly the same so please search/replace your code to update calls.', 'warning');
	},

	/**
     * Gets / sets the life span of the object in milliseconds. The life
     * span is how long the object will exist for before being automatically
     * destroyed.
     * @param {Number=} milliseconds The number of milliseconds the entity
     * will live for from the current time.
     * @param {Function=} deathCallback Optional callback method to call when
     * the entity is destroyed from end of lifespan.
     * @example #Set the lifespan of the entity to 2 seconds after which it will automatically be destroyed
     *     entity.lifeSpan(2000);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	lifeSpan: function (milliseconds, deathCallback) {
		if (milliseconds != undefined) {
			this.deathTime(ige._currentTime + milliseconds, deathCallback);
			return this;
		}

		return this.deathTime() - ige._currentTime;
	},

	/**
     * Gets / sets the timestamp in milliseconds that denotes the time
     * that the entity will be destroyed. The object checks it's own death
     * time during each tick and if the current time is greater than the
     * death time, the object will be destroyed.
     * @param {Number=} val The death time timestamp. This is a time relative
     * to the engine's start time of zero rather than the current time that
     * would be retrieved from new Date().getTime(). It is usually easier
     * to call lifeSpan() rather than setting the deathTime directly.
     * @param {Function=} deathCallback Optional callback method to call when
     * the entity is destroyed from end of lifespan.
     * @example #Set the death time of the entity to 60 seconds after engine start
     *     entity.deathTime(60000);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	deathTime: function (val, deathCallback) {
		this._deathTime = val;

		if (val !== undefined) {
			if (deathCallback !== undefined) {
				this._deathCallBack = deathCallback;
			}
			return this;
		}

		return this._deathTime;
	},

	/**
     * Gets / sets the entity opacity from 0.0 to 1.0.
     * @param {Number=} val The opacity value.
     * @example #Set the entity to half-visible
     *     entity.opacity(0.5);
     * @example #Set the entity to fully-visible
     *     entity.opacity(1.0);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	opacity: function (val) {
		if (val !== undefined) {
			this._opacity = val;
			return this;
		}

		return this._opacity;
	},

	/**
     * Gets / sets the noAabb flag that determines if the entity's axis
     * aligned bounding box should be calculated every tick or not. If
     * you don't need the AABB data (for instance if you don't need to
     * detect mouse events on this entity or you DO want the AABB to be
     * updated but want to control it manually by calling aabb(true)
     * yourself as needed).
     * @param {Boolean=} val If set to true will turn off AABB calculation.
     * @returns {*}
     */
	noAabb: function (val) {
		if (val !== undefined) {
			this._noAabb = val;
			return this;
		}

		return this._noAabb;
	},

	/**
     * Gets / sets the texture to use when rendering the entity.
     * @param {IgeTexture=} texture The texture object.
     * @example #Set the entity texture (image)
     *     var texture = new IgeTexture('path/to/some/texture.png');
     *     entity.texture(texture);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	texture: function (texture) {
		if (texture !== undefined) {
			this._texture = texture;
			return this;
		}

		return this._texture;
	},

	/**
     * Gets / sets the current texture cell used when rendering the game
     * object's texture. If the texture is not cell-based, this value is
     * ignored.
     * @param {Number=} val The cell index.
     * @example #Set the entity texture as a 4x4 cell sheet and then set the cell to use
     *     var texture = new IgeCellSheet('path/to/some/cellSheet.png', 4, 4);
     *     entity.texture(texture)
     *         .cell(3);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	cell: function (val) {
		if (val > 0 || val === null) {
			this._cell = val;
			return this;
		}

		return this._cell;
	},

	/**
     * Gets / sets the current texture cell used when rendering the game
     * object's texture. If the texture is not cell-based, this value is
     * ignored. This differs from cell() in that it accepts a string id
     * as the cell
     * @param {Number=} val The cell id.
     * @example #Set the entity texture as a sprite sheet with cell ids and then set the cell to use
     *     var texture = new IgeSpriteSheet('path/to/some/cellSheet.png', [
     *         [0, 0, 40, 40, 'robotHead'],
     *         [40, 0, 40, 40, 'humanHead'],
     *     ]);
     *
     *     // Assign the texture, set the cell to use and then
     *     // set the entity to the size of the cell automatically!
     *     entity.texture(texture)
     *         .cellById('robotHead')
     *         .dimensionsFromCell();
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	cellById: function (val) {
		if (val !== undefined) {
			if (this._texture) {
				// Find the cell index this id corresponds to
				var i;
				var tex = this._texture;
				var cells = tex._cells;

				for (i = 1; i < cells.length; i++) {
					if (cells[i][4] === val) {
						// Found the cell id so assign this cell index
						this.cell(i);
						return this;
					}
				}

				// We were unable to find the cell index from the cell
				// id so produce an error
				IgeEntity.prototype.log(`Could not find the cell id "${val}" in the assigned entity texture ${tex.id()}, please check your sprite sheet (texture) cell definition to ensure the cell id "${val}" has been assigned to a cell!`, 'error');
			} else {
				IgeEntity.prototype.log('Cannot assign cell index from cell ID until an IgeSpriteSheet has been set as the texture for this entity. Please set the texture before calling cellById().', 'error');
			}
		}

		return this._cell;
	},

	/**
     * Sets the geometry of the entity to match the width and height
     * of the assigned texture.
     * @param {Number=} percent The percentage size to resize to.
     * @example #Set the entity dimensions based on the assigned texture
     *     var texture = new IgeTexture('path/to/some/texture.png');
     *
     *     // Assign the texture, and then set the entity to the
     *     // size of the texture automatically!
     *     entity.texture(texture)
     *         .dimensionsFromTexture();
     * @return {*} The object this method was called from to allow
     * method chaining.
     */
	dimensionsFromTexture: function (percent) {
		if (this._texture) {
			if (percent === undefined) {
				this.width(this._texture._sizeX);
				this.height(this._texture._sizeY);
			} else {
				this.width(Math.floor((this._texture._sizeX / 100) * percent));
				this.height(Math.floor((this._texture._sizeY / 100) * percent));
			}

			// Recalculate localAabb
			this.localAabb(true);
		}

		return this;
	},

	/**
     * Sets the geometry of the entity to match the width and height
     * of the assigned texture cell. If the texture is not cell-based
     * the entire texture width / height will be used.
     * @param {Number=} percent The percentage size to resize to.
     * @example #Set the entity dimensions based on the assigned texture and cell
     *     var texture = new IgeSpriteSheet('path/to/some/cellSheet.png', [
     *         [0, 0, 40, 40, 'robotHead'],
     *         [40, 0, 40, 40, 'humanHead'],
     *     ]);
     *
     *     // Assign the texture, set the cell to use and then
     *     // set the entity to the size of the cell automatically!
     *     entity.texture(texture)
     *         .cellById('robotHead')
     *         .dimensionsFromCell();
     * @return {*} The object this method was called from to allow
     * method chaining
     */
	dimensionsFromCell: function (percent) {
		if (this._texture) {
			if (this._texture._cells && this._texture._cells.length) {
				if (percent === undefined) {
					this.width(this._texture._cells[this._cell][2]);
					this.height(this._texture._cells[this._cell][3]);
				} else {
					this.width(Math.floor((this._texture._cells[this._cell][2] / 100) * percent));
					this.height(Math.floor((this._texture._cells[this._cell][3] / 100) * percent));
				}

				// Recalculate localAabb
				this.localAabb(true);
			}
		}

		return this;
	},

	/**
     * Gets / sets the highlight mode. True is on false is off.
     * @param {Boolean} val The highlight mode true or false.
     * @example #Set the entity to render highlighted
     *     entity.highlight(true);
     * @example #Get the current highlight state
     *     var isHighlighted = entity.highlight();
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	highlight: function (val) {
		if (val !== undefined) {
			this._highlight = val;
			return this;
		}

		return this._highlight;
	},

	/**
     * Returns the absolute world position of the entity as an
     * IgePoint3d.
     * @example #Get the world position of the entity
     *     var wordPos = entity.worldPosition();
     * @return {IgePoint3d} The absolute world position of the
     * entity.
     */
	worldPosition: function () {
		return new IgePoint3d(this._worldMatrix.matrix[2], this._worldMatrix.matrix[5], 0);
	},

	/**
     * Returns the absolute world rotation z of the entity as a
     * value in radians.
     * @example #Get the world rotation of the entity's z axis
     *     var wordRot = entity.worldRotationZ();
     * @return {Number} The absolute world rotation z of the
     * entity.
     */
	worldRotationZ: function () {
		return this._worldMatrix.rotationRadians();
	},

	/**
     * Converts an array of points from local space to this entity's
     * world space using it's world transform matrix. This will alter
     * the points passed in the array directly.
     * @param {Array} points The array of IgePoints to convert.
     */
	localToWorld: function (points, viewport, inverse) {
		viewport = viewport || ige._currentViewport;

		if (this._adjustmentMatrix) {
			// Apply the optional adjustment matrix
			this._worldMatrix.multiply(this._adjustmentMatrix);
		}

		if (!inverse) {
			this._worldMatrix.transform(points, this);
		} else {
			this._localMatrix.transform(points, this);
			// this._worldMatrix.getInverse().transform(points, this);
		}

		if (this._ignoreCamera) {
			// viewport.camera._worldMatrix.transform(points, this);
		}
	},

	/**
     * Converts a point from local space to this entity's world space
     * using it's world transform matrix. This will alter the point's
     * data directly.
     * @param {IgePoint3d} point The IgePoint3d to convert.
     */
	localToWorldPoint: function (point, viewport) {
		viewport = viewport || ige._currentViewport;
		this._worldMatrix.transform([point], this);
	},

	/**
     * Returns the screen position of the entity as an IgePoint3d where x is the
     * "left" and y is the "top", useful for positioning HTML elements at the
     * screen location of an IGE entity. This method assumes that the top-left
     * of the main canvas element is at 0, 0. If not you can adjust the values
     * yourself to allow for offset.
     * @example #Get the screen position of the entity
     *     var screenPos = entity.screenPosition();
     * @return {IgePoint3d} The screen position of the entity.
     */
	screenPosition: function () {
		return new IgePoint3d(Math.floor((this._worldMatrix.matrix[2] - ige._currentCamera._translate.x) * ige._currentCamera._scale.x + ige._bounds2d.x2), Math.floor((this._worldMatrix.matrix[5] - ige._currentCamera._translate.y) * ige._currentCamera._scale.y + ige._bounds2d.y2), 0);
	},

	/**
     * @deprecated Use bounds3dPolygon instead
     */
	localIsoBoundsPoly: function () {},

	localBounds3dPolygon: function (recalculate) {
		if (this._bounds3dPolygonDirty || !this._localBounds3dPolygon || recalculate) {
			var geom = this._bounds3d;
			var poly = new IgePoly2d();
			// Bottom face
			var bf2 = Math.toIso(+geom.x2, -geom.y2, -geom.z2);
			var bf3 = Math.toIso(+geom.x2, +geom.y2, -geom.z2);
			var bf4 = Math.toIso(-geom.x2, +geom.y2, -geom.z2);
			// Top face
			var tf1 = Math.toIso(-geom.x2, -geom.y2, geom.z2);
			var tf2 = Math.toIso(+geom.x2, -geom.y2, geom.z2);
			var tf4 = Math.toIso(-geom.x2, +geom.y2, geom.z2);

			poly.addPoint(tf1.x, tf1.y).addPoint(tf2.x, tf2.y).addPoint(bf2.x, bf2.y).addPoint(bf3.x, bf3.y).addPoint(bf4.x, bf4.y).addPoint(tf4.x, tf4.y).addPoint(tf1.x, tf1.y);

			this._localBounds3dPolygon = poly;
			this._bounds3dPolygonDirty = false;
		}

		return this._localBounds3dPolygon;
	},

	/**
     * @deprecated Use bounds3dPolygon instead
     */
	isoBoundsPoly: function () {},

	bounds3dPolygon: function (recalculate) {
		if (this._bounds3dPolygonDirty || !this._bounds3dPolygon || recalculate) {
			var poly = this.localBounds3dPolygon(recalculate).clone();

			// Convert local co-ordinates to world based on entities world matrix
			this.localToWorld(poly._poly);

			this._bounds3dPolygon = poly;
		}

		return this._bounds3dPolygon;
	},

	/**
     * @deprecated Use mouseInBounds3d instead
     */
	mouseInIsoBounds: function () {},

	mouseInBounds3d: function (recalculate) {
		var poly = this.localBounds3dPolygon(recalculate);
		var mp = this.mousePos();

		return poly.pointInside(mp);
	},

	/**
     * Calculates and returns the current axis-aligned bounding box in
     * world co-ordinates.
     * @param {Boolean=} recalculate If true this will force the
     * recalculation of the AABB instead of returning a cached
     * value.
     * @example #Get the entity axis-aligned bounding box dimensions
     *     var aabb = entity.aabb();
     *
     *     IgeEntity.prototype.log(aabb.x);
     *     IgeEntity.prototype.log(aabb.y);
     *     IgeEntity.prototype.log(aabb.width);
     *     IgeEntity.prototype.log(aabb.height);
     * @example #Get the entity axis-aligned bounding box dimensions forcing the engine to update the values first
     *     var aabb = entity.aabb(true); // Call with true to force update
     *
     *     IgeEntity.prototype.log(aabb.x);
     *     IgeEntity.prototype.log(aabb.y);
     *     IgeEntity.prototype.log(aabb.width);
     *     IgeEntity.prototype.log(aabb.height);
     * @return {IgeRect} The axis-aligned bounding box in world co-ordinates.
     */
	aabb: function (recalculate, inverse) {
		if (this._aabbDirty || !this._aabb || recalculate) {
			//  && this.newFrame()
			var poly = new IgePoly2d();
			var minX;
			var minY;
			var maxX;
			var maxY;
			var box;
			var anc = this._anchor;
			var ancX = anc.x;
			var ancY = anc.y;
			var geom;
			var geomX2;
			var geomY2;
			var x;
			var y;

			geom = this._bounds2d;
			geomX2 = geom.x2;
			geomY2 = geom.y2;

			x = geomX2;
			y = geomY2;

			poly.addPoint(-x + ancX, -y + ancY);
			poly.addPoint(x + ancX, -y + ancY);
			poly.addPoint(x + ancX, y + ancY);
			poly.addPoint(-x + ancX, y + ancY);

			this._renderPos = { x: -x + ancX, y: -y + ancY };

			// Convert the poly's points from local space to world space
			this.localToWorld(poly._poly, null, inverse);

			// Get the extents of the newly transformed poly
			minX = Math.min(poly._poly[0].x, poly._poly[1].x, poly._poly[2].x, poly._poly[3].x);

			minY = Math.min(poly._poly[0].y, poly._poly[1].y, poly._poly[2].y, poly._poly[3].y);

			maxX = Math.max(poly._poly[0].x, poly._poly[1].x, poly._poly[2].x, poly._poly[3].x);

			maxY = Math.max(poly._poly[0].y, poly._poly[1].y, poly._poly[2].y, poly._poly[3].y);

			box = new IgeRect(minX, minY, maxX - minX, maxY - minY);

			this._aabb = box;
			this._aabbDirty = false;
		}

		return this._aabb;
	},

	/**
     * Calculates and returns the local axis-aligned bounding box
     * for the entity. This is the AABB relative to the entity's
     * center point.
     * @param {Boolean=} recalculate If true this will force the
     * recalculation of the local AABB instead of returning a cached
     * value.
     * @example #Get the entity local axis-aligned bounding box dimensions
     *     var aabb = entity.localAabb();
     *
     *     IgeEntity.prototype.log(aabb.x);
     *     IgeEntity.prototype.log(aabb.y);
     *     IgeEntity.prototype.log(aabb.width);
     *     IgeEntity.prototype.log(aabb.height);
     * @example #Get the entity local axis-aligned bounding box dimensions forcing the engine to update the values first
     *     var aabb = entity.localAabb(true); // Call with true to force update
     *
     *     IgeEntity.prototype.log(aabb.x);
     *     IgeEntity.prototype.log(aabb.y);
     *     IgeEntity.prototype.log(aabb.width);
     *     IgeEntity.prototype.log(aabb.height);
     * @return {IgeRect} The local AABB.
     */
	localAabb: function (recalculate) {
		if (!this._localAabb || recalculate) {
			var aabb = this.aabb();
			this._localAabb = new IgeRect(-Math.floor(aabb.width / 2), -Math.floor(aabb.height / 2), Math.floor(aabb.width), Math.floor(aabb.height));
		}

		return this._localAabb;
	},

	/**
     * Calculates the axis-aligned bounding box for this entity, including
     * all child entity bounding boxes and returns the final composite
     * bounds.
     * @example #Get the composite AABB
     *     var entity = new IgeEntity(),
     *         aabb = entity.compositeAabb();
     * @return {IgeRect}
     */
	compositeAabb: function (inverse) {
		var arr = this._children;
		var arrCount;
		var rect;

		if (inverse) {
			rect = this.aabb(true, inverse).clone();
		} else {
			rect = this.aabb().clone();
		}

		// Now loop all children and get the aabb for each of them
		// them add those bounds to the current rect
		if (arr) {
			arrCount = arr.length;

			var x = 0;
			while (arrCount--) {
				x++;
				if (x > 10000) {
					IgeEntity.prototype.log('IgeEntity 1255');
					break;
				} // for detecting infinite loops
				rect.thisCombineRect(arr[arrCount].compositeAabb(inverse));
			}
		}

		return rect;
	},

	/**
     * Gets / sets the composite stream flag. If set to true, any objects
     * mounted to this one will have their streamMode() set to the same
     * value as this entity and will also have their compositeStream flag
     * set to true. This allows you to easily automatically stream any
     * objects mounted to a root object and stream them all.
     * @param val
     * @returns {*}
     */
	compositeStream: function (val) {
		if (val !== undefined) {
			this._compositeStream = val;
			return this;
		}

		return this._compositeStream;
	},

	/**
     * Override the _childMounted method and apply entity-based flags.
     * @param {IgeEntity} child
     * @private
     */
	_childMounted: function (child) {
		// Check if we need to set the compositeStream and streamMode
		if (this.compositeStream()) {
			child.compositeStream(true);
			child.streamMode(this.streamMode());
			child.streamControl(this.streamControl());
		}

		IgeObject.prototype._childMounted.call(this, child);

		// Check if we are compositeCached and update the cache
		if (this.compositeCache()) {
			this.cacheDirty(true);
		}
	},

	/**
     * Takes two values and returns them as an array where index [0]
     * is the y argument and index[1] is the x argument. This method
     * is used specifically in the 3d bounds intersection process to
     * determine entity depth sorting.
     * @param {Number} x The first value.
     * @param {Number} y The second value.
     * @return {Array} The swapped arguments.
     * @private
     */
	_swapVars: function (x, y) {
		return [y, x];
	},

	_internalsOverlap: function (x0, x1, y0, y1) {
		var tempSwap;

		if (x0 > x1) {
			tempSwap = this._swapVars(x0, x1);
			x0 = tempSwap[0];
			x1 = tempSwap[1];
		}

		if (y0 > y1) {
			tempSwap = this._swapVars(y0, y1);
			y0 = tempSwap[0];
			y1 = tempSwap[1];
		}

		if (x0 > y0) {
			tempSwap = this._swapVars(x0, y0);
			x0 = tempSwap[0];
			y0 = tempSwap[1];

			tempSwap = this._swapVars(x1, y1);
			x1 = tempSwap[0];
			y1 = tempSwap[1];
		}

		return y0 < x1;
	},

	_projectionOverlap: function (otherObject) {
		var thisG3d = this._bounds3d;
		var thisMin = {
			x: this._translate.x - thisG3d.x / 2,
			y: this._translate.y - thisG3d.y / 2,
			z: this._translate.z - thisG3d.z
		};
		var thisMax = {
			x: this._translate.x + thisG3d.x / 2,
			y: this._translate.y + thisG3d.y / 2,
			z: this._translate.z + thisG3d.z
		};
		var otherG3d = otherObject._bounds3d;
		var otherMin = {
			x: otherObject._translate.x - otherG3d.x / 2,
			y: otherObject._translate.y - otherG3d.y / 2,
			z: otherObject._translate.z - otherG3d.z
		};
		var otherMax = {
			x: otherObject._translate.x + otherG3d.x / 2,
			y: otherObject._translate.y + otherG3d.y / 2,
			z: otherObject._translate.z + otherG3d.z
		};

		return this._internalsOverlap(thisMin.x - thisMax.y, thisMax.x - thisMin.y, otherMin.x - otherMax.y, otherMax.x - otherMin.y) && this._internalsOverlap(thisMin.x - thisMax.z, thisMax.x - thisMin.z, otherMin.x - otherMax.z, otherMax.x - otherMin.z) && this._internalsOverlap(thisMin.z - thisMax.y, thisMax.z - thisMin.y, otherMin.z - otherMax.y, otherMax.z - otherMin.y);
	},

	/**
     * Compares the current entity's 3d bounds to the passed entity and
     * determines if the current entity is "behind" the passed one. If an
     * entity is behind another, it is drawn first during the scenegraph
     * render phase.
     * @param {IgeEntity} otherObject The other entity to check this
     * entity's 3d bounds against.
     * @example #Determine if this entity is "behind" another entity based on the current depth-sort
     *     var behind = entity.isBehind(otherEntity);
     * @return {Boolean} If true this entity is "behind" the passed entity
     * or false if not.
     */
	isBehind: function (otherObject) {
		var thisG3d = this._bounds3d;
		var otherG3d = otherObject._bounds3d;
		var thisTranslate = this._translate.clone();
		var otherTranslate = otherObject._translate.clone();

		// thisTranslate.thisToIso();
		// otherTranslate.thisToIso();

		if (this._origin.x !== 0.5 || this._origin.y !== 0.5) {
			thisTranslate.x += this._bounds2d.x * (0.5 - this._origin.x);
			thisTranslate.y += this._bounds2d.y * (0.5 - this._origin.y);
		}
		if (otherObject._origin.x !== 0.5 || otherObject._origin.y !== 0.5) {
			otherTranslate.x += otherObject._bounds2d.x * (0.5 - otherObject._origin.x);
			otherTranslate.y += otherObject._bounds2d.y * (0.5 - otherObject._origin.y);
		}

		var thisX = thisTranslate.x;
		var thisY = thisTranslate.y;
		var otherX = otherTranslate.x;
		var otherY = otherTranslate.y;
		var thisMin = new IgePoint3d(thisX - thisG3d.x / 2, thisY - thisG3d.y / 2, this._translate.z);
		var thisMax = new IgePoint3d(thisX + thisG3d.x / 2, thisY + thisG3d.y / 2, this._translate.z + thisG3d.z);
		var otherMin = new IgePoint3d(otherX - otherG3d.x / 2, otherY - otherG3d.y / 2, otherObject._translate.z);
		var otherMax = new IgePoint3d(otherX + otherG3d.x / 2, otherY + otherG3d.y / 2, otherObject._translate.z + otherG3d.z);

		if (thisMax.x <= otherMin.x) {
			return false;
		}

		if (otherMax.x <= thisMin.x) {
			return true;
		}

		if (thisMax.y <= otherMin.y) {
			return false;
		}

		if (otherMax.y <= thisMin.y) {
			return true;
		}

		if (thisMax.z <= otherMin.z) {
			return false;
		}

		if (otherMax.z <= thisMin.z) {
			return true;
		}

		return thisX + thisY + this._translate.z > otherX + otherY + otherObject._translate.z;
	},

	/**
     * Get / set the flag determining if this entity will respond
     * to mouse interaction or not. When you set a mouse* event e.g.
     * mouseUp, mouseOver etc this flag will automatically be reset
     * to true.
     * @param {Boolean=} val The flag value true or false.
     * @example #Set entity to ignore mouse events
     *     entity.mouseEventsActive(false);
     * @example #Set entity to receive mouse events
     *     entity.mouseEventsActive(true);
     * @example #Get current flag value
     *     var val = entity.mouseEventsActive();
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	mouseEventsActive: function (val) {
		if (val !== undefined) {
			this._mouseEventsActive = val;
			return this;
		}

		return this._mouseEventsActive;
	},

	/**
     * Sets the _ignoreCamera internal flag to the value passed for this
     * and all child entities down the scenegraph.
     * @param val
     */
	ignoreCameraComposite: function (val) {
		var i;
		var arr = this._children;
		var arrCount = arr.length;

		this._ignoreCamera = val;

		for (i = 0; i < arrCount; i++) {
			if (arr[i].ignoreCameraComposite) {
				arr[i].ignoreCameraComposite(val);
			}
		}
	},

	/**
     * Determines if the frame alternator value for this entity
     * matches the engine's frame alternator value. The entity's
     * frame alternator value will be set to match the engine's
     * after each call to the entity.tick() method so the return
     * value of this method can be used to determine if the tick()
     * method has already been run for this entity.
     *
     * This is useful if you have multiple viewports which will
     * cause the entity tick() method to fire once for each viewport
     * but you only want to execute update code such as movement etc
     * on the first time the tick() method is called.
     *
     * @example #Determine if the entity has already had it's tick method called
     *     var tickAlreadyCalled = entity.newFrame();
     * @return {Boolean} If false, the entity's tick method has
     * not yet been processed for this tick.
     */
	newFrame: function () {
		return ige._frameAlternator !== this._frameAlternatorCurrent;
	},

	/**
     * Sets the canvas context transform properties to match the the game
     * object's current transform values.
     * @param {CanvasRenderingContext2D} ctx The canvas context to apply
     * the transformation matrix to.
     * @example #Transform a canvas context to the entity's local matrix values
     *     var canvas = document.createElement('canvas');
     *     canvas.width = 800;
     *     canvas.height = 600;
     *
     *     var ctx = canvas.getContext('2d');
     *     entity._transformContext(ctx);
     * @private
     */
	_transformContext: function (ctx, inverse) {
		if (this._parent) {
			ctx.globalAlpha = this._computedOpacity = this._parent._computedOpacity * this._opacity;
		} else {
			ctx.globalAlpha = this._computedOpacity = this._opacity;
		}

		if (!inverse) {
			this._localMatrix.transformRenderingContext(ctx);
		} else {
			this._localMatrix.getInverse().transformRenderingContext(ctx);
		}
	},

	mouseAlwaysInside: function (val) {
		if (val !== undefined) {
			this._mouseAlwaysInside = val;
			return this;
		}

		return this._mouseAlwaysInside;
	},

	/**
     * Processes the updates required each render frame. Any code in the update()
     * method will be called ONCE for each render frame BEFORE the tick() method.
     * This differs from the tick() method in that the tick method can be called
     * multiple times during a render frame depending on how many viewports your
     * simulation is being rendered to, whereas the update() method is only called
     * once. It is therefore the perfect place to put code that will control your
     * entity's motion, AI etc.
     * @param {CanvasRenderingContext2D} ctx The canvas context to render to.
     */
	update: function (ctx, tickDelta, isForOrphans) {
		// var category = this._category || 'etc';
		// if (ige.updateCount[category] == undefined)
		// 	ige.updateCount[category] = 0;
		// ige.updateCount[category]++;

		// if (ige.physics.engine === 'CRASH' && this.body) {
		// 	this._behaviourCrash();
		// }

		if (this._deathTime !== undefined && this._deathTime <= ige._tickStart) {
			// Check if the deathCallBack was set
			if (this._deathCallBack) {
				this._deathCallBack.apply(this);
				delete this._deathCallback;
			}

			this.destroy();
		} else {
			// Check that the entity has been born
			if (this._bornTime === undefined || ige._currentTime >= this._bornTime) {
				// Remove the stream data cache
				delete this._streamDataCache;

				if (!isForOrphans && ige.gameLoopTickHasExecuted) {
					// Process any behaviours assigned to the entity
					this._processUpdateBehaviours(ctx, tickDelta);
				}

				// Update this object's current frame alternator value
				// which allows us to determine if we are still on the
				// same frame
				this._frameAlternatorCurrent = ige._frameAlternator;
			} else {
				// sometimes when user returns to the game's tab/window, this._parent is set to null and causing errors
				if (this._parent) {
					// The entity is not yet born, unmount it and add to the spawn queue
					this._birthMount = this._parent.id();
				}
				this.unMount();

				ige.spawnQueue(this);
			}
		}

		// dont process super class if its from orphan. bcz orphan only need to update stream data and its translate
		if (!isForOrphans) {
			// Process super class
			IgeObject.prototype.update.call(this, ctx, tickDelta);
		}
	},

	// convert numbers stored as string in database to int
	parseEntityObject: function (stats) {
		var self = this;
		if (typeof stats === 'object') {
			for (var key in stats) {
				if (typeof stats[key] === 'object') {
					self.parseEntityObject(stats[key]);
				} else if (/^-?\d+$/.test(stats[key])) {
					stats[key] = parseFloat(stats[key]);
				}
			}
		}
	},

	/**
     * Processes the actions required each render frame.
     * @param {CanvasRenderingContext2D} ctx The canvas context to render to.
     * @param {Boolean} dontTransform If set to true, the tick method will
     * not transform the context based on the entity's matrices. This is useful
     * if you have extended the class and want to process down the inheritance
     * chain but have already transformed the entity in a previous overloaded
     * method.
     */
	tick: function (ctx, dontTransform) {
		if (this._inView) ige.inViewCount++;
		if ((!this._hidden && this._inView && (!this._parent || this._parent._inView)) || mode != 'play') {
			// var category = this._category || 'etc';
			// if (ige.tickCount[category] == undefined)
			// 	ige.tickCount[category] = 0;
			// ige.tickCount[category]++;
			ige.tickCount++;

			// Process any behaviours assigned to the entity
			this._processTickBehaviours(ctx);

			// Process any mouse events we need to do

			if (this._mouseEventsActive) {
				if (this._processTriggerHitTests()) {
					// Point is inside the trigger bounds
					ige.input.queueEvent(this, this._mouseInTrigger, null);
				} else {
					if (ige.input.mouseMove) {
						// There is a mouse move event but we are not inside the entity
						// so fire a mouse out event (_handleMouseOut will check if the
						// mouse WAS inside before firing an out event).
						this._handleMouseOut(ige.input.mouseMove);
					}
				}
			}

			// _dontRender doesn't exist anywhere! ??? - jaeyun
			if (!this._dontRender) {
				// Check for cached version
				if (this._cache || this._compositeCache) {
					// Caching is enabled
					if (this._cacheDirty) {
						// The cache is dirty, redraw it
						this._refreshCache(dontTransform);
					}

					// Now render the cached image data to the main canvas
					this._renderCache(ctx);
				} else {
					// Non-cached output
					// Transform the context by the current transform settings
					if (!dontTransform) {
						this._transformContext(ctx);
					}

					// Render item below unit currently disabled
					// if (this._category === 'unit') {
					// 	if (this._compositeCache) {
					// 		if (this._cacheDirty) {
					// 			// Process children
					// 			IgeObject.prototype.tick.call(this, this._cacheCtx, true);
					// 			this._renderCache(ctx);
					// 			this._cacheDirty = false;
					// 		}
					// 	} else {
					// 		// Process children
					// 		IgeObject.prototype.tick.call(this, ctx, true);
					// 	}
					// }
					this._renderEntity(ctx, dontTransform);
				}
			}

			// Process any automatic-mode stream updating required
			if (this._streamMode === 1 || this._streamMode === 2) {
				this.streamSync();
			}

			if (this._compositeCache) {
				if (this._cacheDirty) {
					// Process children
					IgeObject.prototype.tick.call(this, this._cacheCtx);
					this._renderCache(ctx);
					this._cacheDirty = false;
				}
			} else {
				// Process children
				IgeObject.prototype.tick.call(this, ctx);
			}
		}
	},
	playEffect: function (type) {
		if (this._stats && this._stats.effects && this._stats.effects[type]) {
			var effect = this._stats.effects[type];

			if (ige.isServer) {
				if (type == 'move' || type == 'idle' || type == 'none') {
					this.streamUpdateData([{ effect: type }]);
				}
			} else if (ige.isClient) {
				if (this._pixiContainer && this._pixiContainer._destroyed) {
					return;
				}
				var position = this._translate;

				if (this._category === 'item' && this._stats.currentBody && (this._stats.currentBody.type === 'spriteOnly' || this._stats.currentBody.type === 'none')) {
					var ownerUnit = this.getOwnerUnit();
					position = (ownerUnit && ownerUnit._pixiContainer) || position;
				}

				// if animation is assigned to effect, play it
				if (effect.animation != undefined && effect.animation != 'none' && effect.animation != '') {
					this.applyAnimationById(effect.animation);
				}

				if (effect.projectileType) {
					var projectile = ige.game.getAsset('projectileTypes', effect.projectileType);
					if (projectile) {
						var position = ige.game.lastProjectileHitPosition || (this.body && this.body.getPosition()) || this._translate;
						if (this.body) {
							position.x *= this._b2dRef._scaleRatio;
							position.y *= this._b2dRef._scaleRatio;
						}
						projectile.defaultData = {
							//type: effect.projectileType,
							translate: {
								x: position.x,
								y: position.y
							},
							rotate: this._rotate.z
						};
						//fix added for correct phaser projectile texture
						projectile.type = effect.projectileType;
						new Projectile(projectile);
					}
				}

				var shouldRepeat = type === 'move';
				var isAlreadyPlaying = false;
				if (this.isPlayingSound) {
					this.isPlayingSound.loop = shouldRepeat;
					if (shouldRepeat) {
						isAlreadyPlaying = true;
						this.isPlayingSound.play();
					}
				}
				if (effect.sound) {
					for (var soundKey in effect.sound) {
						if (!isAlreadyPlaying) {
							this.isPlayingSound = ige.sound.playSound(effect.sound[soundKey], position, soundKey, shouldRepeat);
							if (this.isPlayingSound) {
								this.isPlayingSound.effect = effect.sound[soundKey];
							}
						}
					}
				}

				var angle = this._rotate.z;
				if (type == 'attacked') {
					// get angle between attacked unit and attacking unit
					var attacker = this.lastAttackedBy;
					if (attacker) {
						angle = Math.atan2(attacker._translate.y - this._translate.y, attacker._translate.x - this._translate.x) + Math.radians(90);
					}
				}

				this.tween.start(effect.tween, angle);
			} else if (ige.isServer) {
				if (effect.runScript) {
					ige.script.runScript(effect.runScript, {});
				}
			}
		}
	},
	_processTriggerHitTests: function () {
		var mp, mouseTriggerPoly;

		if (ige._currentViewport) {
			if (!this._mouseAlwaysInside) {
				mp = this.mousePosWorld();

				if (mp) {
					// Use the trigger polygon if defined
					if (this._triggerPolygon && this[this._triggerPolygon]) {
						mouseTriggerPoly = this[this._triggerPolygon](mp);
					} else {
						// Default to either aabb or bounds3dPolygon depending on entity parent mounting mode
						if (this._parent && this._parent._mountMode === 1) {
							// Use bounds3dPolygon
							mouseTriggerPoly = this.bounds3dPolygon();
						} else {
							// Use aabb
							mouseTriggerPoly = this.aabb();
						}
					}

					// Check if the current mouse position is inside this aabb
					return mouseTriggerPoly.xyInside(mp.x, mp.y);
				}
			} else {
				return true;
			}
		}

		return false;
	},

	_refreshCache: function (dontTransform) {
		// The cache is not clean so re-draw it
		// Render the entity to the cache
		var _canvas = this._cacheCanvas;
		var _ctx = this._cacheCtx;

		if (this._compositeCache) {
			// Get the composite entity AABB and alter the internal canvas
			// to the composite size so we can render the entire entity
			var aabbC = this.compositeAabb(true);

			this._compositeAabbCache = aabbC;

			if (aabbC.width > 0 && aabbC.height > 0) {
				_canvas.width = Math.ceil(aabbC.width);
				_canvas.height = Math.ceil(aabbC.height);
			} else {
				// We cannot set a zero size for a canvas, it will
				// cause the browser to freak out
				_canvas.width = 2;
				_canvas.height = 2;
			}

			// Translate to the center of the canvas
			_ctx.translate(-aabbC.x, -aabbC.y);

			/**
             * Fires when the entity's composite cache is ready.
             * @event IgeEntity#compositeReady
             */
			this.emit('compositeReady');
		} else {
			if (this._bounds2d.x > 0 && this._bounds2d.y > 0) {
				_canvas.width = this._bounds2d.x;
				_canvas.height = this._bounds2d.y;
			} else {
				// We cannot set a zero size for a canvas, it will
				// cause the browser to freak out
				_canvas.width = 1;
				_canvas.height = 1;
			}

			// Translate to the center of the canvas
			_ctx.translate(this._bounds2d.x2, this._bounds2d.y2);

			this._cacheDirty = false;
		}

		// Transform the context by the current transform settings
		if (!dontTransform) {
			this._transformContext(_ctx);
		}

		this._renderEntity(_ctx, dontTransform);
	},

	flip: function (flip) {
		// if (this._category == 'item') {
		// 	if (flip == 1)
		// 	console.trace()
		// console.log("flip", flip)
		// }
		// execute below iff flip orientation changes
		if (ige.isServer) {
			if (flip != this._stats.flip) {
				// if (this._category == 'unit' && this._stats.name != 'm0dE')
				// 	console.log(flip)
				this.streamUpdateData([{ flip: flip }]);
			}
		} else if (ige.isClient) {
			if (this._stats.flip != flip) {
				// if (this._category =='unit' && this._stats.name != 'm0dE')
				// 	console.log("wtf", flip)

				var entity = this._pixiTexture;
				if (entity) {
					var x = Math.abs(entity.scale.x);
					var y = Math.abs(entity.scale.y);
					if (flip == 0) {
						entity.scale.set(x, y);
					}
					if (flip == 1) {
						entity.scale.set(-x, y);
					}
					if (flip == 2) {
						entity.scale.set(x, -y);
					}
					if (flip == 3) {
						entity.scale.set(-x, -y);
					}
				}
			}
		}
		this._stats.flip = flip;
	},

	/**
     * Handles calling the texture.render() method if a texture
     * is applied to the entity. This part of the tick process has
     * been abstracted to allow it to be overridden by an extending
     * class.
     * @param {CanvasRenderingContext2D} ctx The canvas context to render
     * the entity to.
     * @private
     */
	_renderEntity: function (ctx) {
		if (this._opacity > 0) {
			// Check if the entity has a background pattern
			if (this._backgroundPattern) {
				if (!this._backgroundPatternFill) {
					// We have a pattern but no fill produced
					// from it. Check if we have a context to
					// generate a pattern from
					if (ctx) {
						// Produce the pattern fill
						this._backgroundPatternFill = ctx.createPattern(this._backgroundPattern.image, this._backgroundPatternRepeat);
					}
				}

				if (this._backgroundPatternFill) {
					// Draw the fill
					ctx.save();
					ctx.fillStyle = this._backgroundPatternFill;

					// TODO: When firefox has fixed their bug regarding negative rect co-ordinates, revert this change

					// This is the proper way to do this but firefox has a bug which I'm gonna report
					// so instead I have to use ANOTHER translate call instead. So crap!
					// ctx.rect(-this._bounds2d.x2, -this._bounds2d.y2, this._bounds2d.x, this._bounds2d.y);
					ctx.translate(-this._bounds2d.x2, -this._bounds2d.y2);
					ctx.rect(0, 0, this._bounds2d.x, this._bounds2d.y);
					if (this._backgroundPatternTrackCamera) {
						ctx.translate(-ige._currentCamera._translate.x, -ige._currentCamera._translate.y);
						ctx.scale(ige._currentCamera._scale.x, ige._currentCamera._scale.y);
					}
					ctx.fill();
					ige._drawCount++;

					if (this._backgroundPatternIsoTile) {
						ctx.translate(-Math.floor(this._backgroundPattern.image.width) / 2, -Math.floor(this._backgroundPattern.image.height / 2));
						ctx.fill();
						ige._drawCount++;
					}

					ctx.restore();
				}
			}

			var texture = this._texture;

			// Check if the entity is visible based upon its opacity
			if (texture && texture._loaded) {
				// Draw the entity image

				// flip texture horizontally/vertically if requested
				if (this._stats.flip == 1) {
					ctx.save();
					ctx.scale(-1, 1);
				}
				if (this._stats.flip == 2) {
					ctx.save();
					ctx.scale(1, -1);
				}
				if (this._stats.flip == 3) {
					ctx.save();
					ctx.scale(-1, -1);
				}

				texture.render(ctx, this, ige._tickDelta);

				if (this._stats.flip > 0) {
					ctx.restore();
				}

				if (this._highlight) {
					ctx.globalCompositeOperation = 'lighter';
					texture.render(ctx, this);
				}
			}

			if (this._compositeCache && ige._currentViewport._drawCompositeBounds) {
				// IgeEntity.prototype.log('moo');
				ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
				ctx.fillRect(-this._bounds2d.x2, -this._bounds2d.y2, this._bounds2d.x, this._bounds2d.y);
				ctx.fillStyle = '#ffffff';
				ctx.fillText('Composite Entity', -this._bounds2d.x2, -this._bounds2d.y2 - 15);
				ctx.fillText(this.id(), -this._bounds2d.x2, -this._bounds2d.y2 - 5);
			}
		}
	},

	/**
     * Draws the cached off-screen canvas image data to the passed canvas
     * context.
     * @param {CanvasRenderingContext2D} ctx The canvas context to render
     * the entity to.
     * @private
     */
	_renderCache: function (ctx) {
		ctx.save();
		if (this._compositeCache) {
			var aabbC = this._compositeAabbCache;
			ctx.translate(this._bounds2d.x2 + aabbC.x, this._bounds2d.y2 + aabbC.y);

			if (this._parent && this._parent._ignoreCamera) {
				// Translate the entity back to negate the scene translate
				var cam = ige._currentCamera;
				// ctx.translate(-cam._translate.x, -cam._translate.y);
				/* this.scaleTo(1 / cam._scale.x, 1 / cam._scale.y, 1 / cam._scale.z);
				this.rotateTo(-cam._rotate.x, -cam._rotate.y, -cam._rotate.z); */
			}
		}

		// We have a clean cached version so output that
		ctx.drawImage(this._cacheCanvas, -this._bounds2d.x2, -this._bounds2d.y2);

		if (ige._currentViewport._drawCompositeBounds) {
			ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
			ctx.fillRect(-this._bounds2d.x2, -this._bounds2d.y2, this._cacheCanvas.width, this._cacheCanvas.height);
			ctx.fillStyle = '#ffffff';
			ctx.fillText('Composite Cache', -this._bounds2d.x2, -this._bounds2d.y2 - 15);
			ctx.fillText(this.id(), -this._bounds2d.x2, -this._bounds2d.y2 - 5);
		}

		ige._drawCount++;

		if (this._highlight) {
			ctx.globalCompositeOperation = 'lighter';
			ctx.drawImage(this._cacheCanvas, -this._bounds2d.x2, -this._bounds2d.y2);

			ige._drawCount++;
		}
		ctx.restore();
	},

	/**
     * Transforms a point by the entity's parent world matrix and
     * it's own local matrix transforming the point to this entity's
     * world space.
     * @param {IgePoint3d} point The point to transform.
     * @example #Transform a point by the entity's world matrix values
     *     var point = new IgePoint3d(0, 0, 0);
     *     entity._transformPoint(point);
     *
     *     IgeEntity.prototype.log(point);
     * @return {IgePoint3d} The transformed point.
     * @private
     */
	_transformPoint: function (point) {
		if (this._parent) {
			var tempMat = new IgeMatrix2d();
			// Copy the parent world matrix
			tempMat.copy(this._parent._worldMatrix);
			// Apply any local transforms
			tempMat.multiply(this._localMatrix);
			// Now transform the point
			tempMat.getInverse().transformCoord(point, this);
		} else {
			this._localMatrix.transformCoord(point, this);
		}

		return point;
	},

	/**
     * Helper method to transform an array of points using _transformPoint.
     * @param {Array} points The points array to transform.
     * @private
     */
	_transformPoints: function (points) {
		var point;
		var pointCount = points.length;

		var x = 0;
		while (pointCount--) {
			x++;
			if (x > 10000) {
				IgeEntity.prototype.log('IgeEntity 1964');
				break;
			} // for detecting infinite loops
			point = points[pointCount];
			if (this._parent) {
				var tempMat = new IgeMatrix2d();
				// Copy the parent world matrix
				tempMat.copy(this._parent._worldMatrix);
				// Apply any local transforms
				tempMat.multiply(this._localMatrix);
				// Now transform the point
				tempMat.getInverse().transformCoord(point, this);
			} else {
				this._localMatrix.transformCoord(point, this);
			}
		}
	},

	/**
     * Generates a string containing a code fragment that when
     * evaluated will reproduce this object's properties via
     * chained commands. This method will only check for
     * properties that are directly related to this class.
     * Other properties are handled by their own class method.
     * @return {String} The string code fragment that will
     * reproduce this entity when evaluated.
     */
	_stringify: function (options) {
		// Make sure we have an options object
		if (options === undefined) {
			options = {};
		}

		// Get the properties for all the super-classes
		var str = IgeObject.prototype._stringify.call(this, options);
		var i;

		// Loop properties and add property assignment code to string
		for (i in this) {
			if (this.hasOwnProperty(i) && this[i] !== undefined) {
				switch (i) {
					case '_opacity':
						str += `.opacity(${this.opacity()})`;
						break;
					case '_texture':
						str += `.texture(ige.$('${this.texture().id()}'))`;
						break;
					case '_cell':
						str += `.cell(${this.cell()})`;
						break;
					case '_translate':
						if (options.transform !== false && options.translate !== false) {
							str += `.translateTo(${this._translate.x}, ${this._translate.y}, ${this._translate.z})`;
						}
						break;
					case '_rotate':
						if (options.transform !== false && options.rotate !== false) {
							str += `.rotateTo(${this._rotate.x}, ${this._rotate.y}, ${this._rotate.z})`;
						}
						break;
					case '_scale':
						if (options.transform !== false && options.scale !== false) {
							str += `.scaleTo(${this._scale.x}, ${this._scale.y}, ${this._scale.z})`;
						}
						break;
					case '_origin':
						if (options.origin !== false) {
							str += `.originTo(${this._origin.x}, ${this._origin.y}, ${this._origin.z})`;
						}
						break;
					case '_anchor':
						if (options.anchor !== false) {
							str += `.anchor(${this._anchor.x}, ${this._anchor.y})`;
						}
						break;
					case '_width':
						if (typeof this.width() === 'string') {
							str += `.width('${this.width()}')`;
						} else {
							str += `.width(${this.width()})`;
						}
						break;
					case '_height':
						if (typeof this.height() === 'string') {
							str += `.height('${this.height()}')`;
						} else {
							str += `.height(${this.height()})`;
						}
						break;
					case '_bounds3d':
						str += `.bounds3d(${this._bounds3d.x}, ${this._bounds3d.y}, ${this._bounds3d.z})`;
						break;
					case '_deathTime':
						if (options.deathTime !== false && options.lifeSpan !== false) {
							str += `.deathTime(${this.deathTime()})`;
						}
						break;
					case '_highlight':
						str += `.highlight(${this.highlight()})`;
						break;
				}
			}
		}

		return str;
	},

	/**
     * Destroys the entity by removing it from the scenegraph,
     * calling destroy() on any child entities and removing
     * any active event listeners for the entity. Once an entity
     * has been destroyed it's this._alive flag is also set to
     * false.
     * @example #Destroy the entity
     *     entity.destroy();
     */
	destroy: function (destroyOrphan) {
		IgeEntity.prototype.log(`igeEntity: destroy ${this._category} ${this.id()}`);

		this._alive = false;
		/* CEXCLUDE */
		// Check if the entity is streaming
		if (ige.isServer) {
			if (this._streamMode === 1 || this._streamMode === 2) {
				delete this._streamDataCache;
				this.streamDestroy();
			}
		}

		/* CEXCLUDE */
		if (this.gluedEntities && this.gluedEntities.length > 0) {
			this.gluedEntities.forEach(function (glueEntity) {
				var entity = ige.$(glueEntity.id);
				if (entity && (entity._pixiText || entity._pixiTexture)) {
					var texture = entity._pixiText || entity._pixiTexture;
					entity.unMount();
					entity.destroy();
					// texture.destroy({ children: true, texture: true });

					delete ige.entityTrack.trackEntityById[glueEntity.id];
				}
			});
		}

		if (ige.isClient) {
			var entityId = this.entityId || this.id();
			if (ige.entityTrack.trackEntityById[entityId]) {
				// entity.destroy()
				// ige.pixi.viewport.follow();
				if (ige.client.myPlayer && ige.client.myPlayer.currentFollowUnit == this.id()) {
					ige.pixi.viewport.removePlugin('follow');
					this.emit('stop-follow');
				}
				var texture = ige.entityTrack.trackEntityById[entityId]._pixiTexture || ige.entityTrack.trackEntityById[entityId]._pixiText; // removing this || ige.entityTrack.trackEntityById[entityId];
				// its not instance of ige
				if (texture && !texture.componentId && !texture._destroyed) {
					ige.pixi.world.removeChild(texture);
					texture.destroy({ children: true, texture: true });

					if (ige.pixiMap.layersGroup && !ige.pixiMap.layersGroup.floor.parent && !ige.isLog) {
						ige.isLog = true;
					}
				}
				ige.entityTrack.trackEntityById[entityId]._destroyed = true;
				delete ige.entityTrack.trackEntityById[entityId];
			}

			// destory attribute bars
			if (this.attributeBars) {
				for (var attributeBarInfo of this.attributeBars) {
					var pixiBarId = attributeBarInfo.id;
					var pixiBar = ige.$(pixiBarId);

					pixiBar.destroy();
				}
			}
			ige.client.emit('destroyTexture', this);
		}

		/**
         * Fires when the entity has been destroyed.
         * @event IgeEntity#destroyed
         * @param {IgeEntity} The entity that has been destroyed.
         */
		for (var region in ige.regionManager.entitiesInRegion) {
			delete ige.regionManager.entitiesInRegion[region][this.id()];
		}

		IgeEntity.prototype.log(`entity destroyed ${this.id()} category: ${this._category} ${this._stats ? this._stats.name : ''}`);
		this.emit('destroyed', this);

		// Call IgeObject.destroy()
		IgeObject.prototype.destroy.call(this);

		if (ige.isClient && ige.$('baseScene')._orphans) {
			delete ige.$('baseScene')._orphans[this._id];
		}
	},

	// remove all pointers referencing to this entity
	clearAllPointers: function () {
		var keysToDelete = ['ability', 'animation', 'attribute', 'attributeBarsContainer', 'fadingTextContainer', 'inventory', 'minimapUnit', 'unitNameLabel', 'unitUi', '_aabb', '_bounds2d', '_bounds3d', '_rotate', '_velocity'];
		for (var i = 0; i < keysToDelete.length; i++) {
			var key = keysToDelete[i];
			if (this[key] && typeof this[key].destroy === 'function') {
				this[key].destroy();
				delete this[key];
			}
		}
	},

	saveSpecialProp: function (obj, i) {
		switch (i) {
			case '_texture':
				if (obj._texture) {
					return { _texture: obj._texture.id() };
				}
				break;

			default:
				// Call super-class saveSpecialProp
				return IgeObject.prototype.saveSpecialProp.call(this, obj, i);
				break;
		}

		return undefined;
	},

	loadSpecialProp: function (obj, i) {
		switch (i) {
			case '_texture':
				return { _texture: ige.$(obj[i]) };
				break;

			default:
				// Call super-class loadSpecialProp
				return IgeObject.prototype.loadSpecialProp.call(this, obj, i);
				break;
		}

		return undefined;
	},

	/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// INTERACTION
	/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
     * Gets / sets the callback that is fired when a mouse
     * move event is triggered.
     * @param {Function=} callback
     * @example #Hook the mouse move event and stop it propagating further down the scenegraph
     *     entity.mouseMove(function (event, control) {
     *         // Mouse moved with button
     *         IgeEntity.prototype.log('Mouse move button: ' + event.button);
     *
     *         // Stop the event propagating further down the scenegraph
     *         control.stopPropagation();
     *
     *         // You can ALSO stop propagation without the control object
     *         // reference via the global reference:
     *         ige.input.stopPropagation();
     *     });
     * @return {*}
     */
	mouseMove: function (callback) {
		if (callback) {
			this._mouseMove = callback;
			this._mouseEventsActive = true;
			return this;
		}

		return this._mouseMove;
	},

	/**
     * Gets / sets the callback that is fired when a mouse
     * over event is triggered.
     * @param {Function=} callback
     * @example #Hook the mouse over event and stop it propagating further down the scenegraph
     *     entity.mouseOver(function (event, control) {
     *         // Mouse over with button
     *         IgeEntity.prototype.log('Mouse over button: ' + event.button);
     *
     *         // Stop the event propagating further down the scenegraph
     *         control.stopPropagation();
     *
     *         // You can ALSO stop propagation without the control object
     *         // reference via the global reference:
     *         ige.input.stopPropagation();
     *     });
     * @return {*}
     */
	mouseOver: function (callback) {
		if (callback) {
			this._mouseOver = callback;
			this._mouseEventsActive = true;
			return this;
		}

		return this._mouseOver;
	},

	/**
     * Gets / sets the callback that is fired when a mouse
     * out event is triggered.
     * @param {Function=} callback
     * @example #Hook the mouse out event and stop it propagating further down the scenegraph
     *     entity.mouseOut(function (event, control) {
     *         // Mouse out with button
     *         IgeEntity.prototype.log('Mouse out button: ' + event.button);
     *
     *         // Stop the event propagating further down the scenegraph
     *         control.stopPropagation();
     *
     *         // You can ALSO stop propagation without the control object
     *         // reference via the global reference:
     *         ige.input.stopPropagation();
     *     });
     * @return {*}
     */
	mouseOut: function (callback) {
		if (callback) {
			this._mouseOut = callback;
			this._mouseEventsActive = true;
			return this;
		}

		return this._mouseOut;
	},

	/**
     * Gets / sets the callback that is fired when a mouse
     * up event is triggered.
     * @param {Function=} callback
     * @example #Hook the mouse up event and stop it propagating further down the scenegraph
     *     entity.mouseUp(function (event, control) {
     *         // Mouse up with button
     *         IgeEntity.prototype.log('Mouse up button: ' + event.button);
     *
     *         // Stop the event propagating further down the scenegraph
     *         control.stopPropagation();
     *
     *         // You can ALSO stop propagation without the control object
     *         // reference via the global reference:
     *         ige.input.stopPropagation();
     *     });
     * @return {*}
     */
	mouseUp: function (callback) {
		if (callback) {
			this._mouseUp = callback;
			this._mouseEventsActive = true;
			return this;
		}

		return this._mouseUp;
	},

	/**
     * Gets / sets the callback that is fired when a mouse
     * down event is triggered.
     * @param {Function=} callback
     * @example #Hook the mouse down event and stop it propagating further down the scenegraph
     *     entity.mouseDown(function (event, control) {
     *         // Mouse down with button
     *         IgeEntity.prototype.log('Mouse down button: ' + event.button);
     *
     *         // Stop the event propagating further down the scenegraph
     *         control.stopPropagation();
     *
     *         // You can ALSO stop propagation without the control object
     *         // reference via the global reference:
     *         ige.input.stopPropagation();
     *     });
     * @return {*}
     */
	mouseDown: function (callback) {
		if (callback) {
			this._mouseDown = callback;
			this._mouseEventsActive = true;
			return this;
		}

		return this._mouseDown;
	},

	/**
     * Gets / sets the callback that is fired when a mouse
     * wheel event is triggered.
     * @param {Function=} callback
     * @example #Hook the mouse wheel event and stop it propagating further down the scenegraph
     *     entity.mouseWheel(function (event, control) {
     *         // Mouse wheel with button
     *         IgeEntity.prototype.log('Mouse wheel button: ' + event.button);
     *         IgeEntity.prototype.log('Mouse wheel delta: ' + event.wheelDelta);
     *
     *         // Stop the event propagating further down the scenegraph
     *         control.stopPropagation();
     *
     *         // You can ALSO stop propagation without the control object
     *         // reference via the global reference:
     *         ige.input.stopPropagation();
     *     });
     * @return {*}
     */
	mouseWheel: function (callback) {
		if (callback) {
			this._mouseWheel = callback;
			this._mouseEventsActive = true;
			return this;
		}

		return this._mouseWheel;
	},

	/**
     * Removes the callback that is fired when a mouse
     * move event is triggered.
     */
	mouseMoveOff: function () {
		delete this._mouseMove;

		return this;
	},

	/**
     * Removes the callback that is fired when a mouse
     * over event is triggered.
     */
	mouseOverOff: function () {
		delete this._mouseOver;

		return this;
	},

	/**
     * Removes the callback that is fired when a mouse
     * out event is triggered.
     */
	mouseOutOff: function () {
		delete this._mouseOut;

		return this;
	},

	/**
     * Removes the callback that is fired when a mouse
     * up event is triggered.
     */
	mouseUpOff: function () {
		delete this._mouseUp;

		return this;
	},

	/**
     * Removes the callback that is fired when a mouse
     * down event is triggered if the listener was registered
     * via the mouseDown() method.
     */
	mouseDownOff: function () {
		delete this._mouseDown;

		return this;
	},

	/**
     * Removes the callback that is fired when a mouse
     * wheel event is triggered.
     */
	mouseWheelOff: function () {
		delete this._mouseWheel;

		return this;
	},

	triggerPolygon: function (poly) {
		if (poly !== undefined) {
			this._triggerPolygon = poly;
			return this;
		}

		return this._triggerPolygon;
	},

	/**
     * Gets / sets the shape / polygon that the mouse events
     * are triggered against. There are two options, 'aabb' and
     * 'isoBounds'. The default is 'aabb'.
     * @param val
     * @returns {*}
     * @deprecated
     */
	mouseEventTrigger: function (val) {
		IgeEntity.prototype.log('mouseEventTrigger is no longer in use. Please see triggerPolygon() instead.', 'warning');
		/* if (val !== undefined) {
			// Set default value
			this._mouseEventTrigger = 0;

			switch (val) {
				case 'isoBounds':
					this._mouseEventTrigger = 1;
					break;

				case 'custom':
					this._mouseEventTrigger = 2;
					break;

				case 'aabb':
					this._mouseEventTrigger = 0;
					break;
			}
			return this;
		}

		return this._mouseEventTrigger === 0 ? 'aabb' : 'isoBounds'; */
	},

	/**
     * Handler method that determines which mouse-move event
     * to fire, a mouse-over or a mouse-move.
     * @private
     */
	_handleMouseIn: function (event, evc, data) {
		// Check if the mouse move is a mouse over
		if (!this._mouseStateOver) {
			this._mouseStateOver = true;
			if (this._mouseOver) {
				this._mouseOver(event, evc, data);
			}

			/**
             * Fires when the mouse moves over the entity.
             * @event IgeEntity#mouseOver
             * @param {Object} The DOM event object.
             * @param {Object} The IGE event control object.
             * @param {*} Any further event data.
             */
			this.emit('mouseOver', [event, evc, data]);
		}

		if (this._mouseMove) {
			this._mouseMove(event, evc, data);
		}
		this.emit('mouseMove', [event, evc, data]);
	},

	/**
     * Handler method that determines if a mouse-out event
     * should be fired.
     * @private
     */
	_handleMouseOut: function (event, evc, data) {
		// The mouse went away from this entity so
		// set mouse-down to false, regardless of the situation
		this._mouseStateDown = false;

		// Check if the mouse move is a mouse out
		if (this._mouseStateOver) {
			this._mouseStateOver = false;
			if (this._mouseOut) {
				this._mouseOut(event, evc, data);
			}

			/**
             * Fires when the mouse moves away from the entity.
             * @event IgeEntity#mouseOut
             * @param {Object} The DOM event object.
             * @param {Object} The IGE event control object.
             * @param {*} Any further event data.
             */
			this.emit('mouseOut', [event, evc, data]);
		}
	},

	/**
     * Handler method that determines if a mouse-wheel event
     * should be fired.
     * @private
     */
	_handleMouseWheel: function (event, evc, data) {
		if (this._mouseWheel) {
			this._mouseWheel(event, evc, data);
		}

		/**
         * Fires when the mouse wheel is moved over the entity.
         * @event IgeEntity#mouseWheel
         * @param {Object} The DOM event object.
         * @param {Object} The IGE event control object.
         * @param {*} Any further event data.
         */
		this.emit('mouseWheel', [event, evc, data]);
	},

	/**
     * Handler method that determines if a mouse-up event
     * should be fired.
     * @private
     */
	_handleMouseUp: function (event, evc, data) {
		// Reset the mouse-down flag
		this._mouseStateDown = false;
		if (this._mouseUp) {
			this._mouseUp(event, evc, data);
		}

		/**
         * Fires when a mouse up occurs on the entity.
         * @event IgeEntity#mouseUp
         * @param {Object} The DOM event object.
         * @param {Object} The IGE event control object.
         * @param {*} Any further event data.
         */
		this.emit('mouseUp', [event, evc, data]);
	},

	/**
     * Handler method that determines if a mouse-down event
     * should be fired.
     * @private
     */
	_handleMouseDown: function (event, evc, data) {
		if (!this._mouseStateDown) {
			this._mouseStateDown = true;
			if (this._mouseDown) {
				this._mouseDown(event, evc, data);
			}

			/**
             * Fires when a mouse down occurs on the entity.
             * @event IgeEntity#mouseDown
             * @param {Object} The DOM event object.
             * @param {Object} The IGE event control object.
             * @param {*} Any further event data.
             */
			this.emit('mouseDown', [event, evc, data]);
		}
	},

	/**
     * Checks mouse input types and fires the correct mouse event
     * handler. This is an internal method that should never be
     * called externally.
     * @param {Object} evc The input component event control object.
     * @param {Object} data Data passed by the input component into
     * the new event.
     * @private
     */
	_mouseInTrigger: function (evc, data) {
		if (ige.input.mouseMove) {
			// There is a mouse move event
			this._handleMouseIn(ige.input.mouseMove, evc, data);
		}

		if (ige.input.mouseDown) {
			// There is a mouse down event
			this._handleMouseDown(ige.input.mouseDown, evc, data);
		}

		if (ige.input.mouseUp) {
			// There is a mouse up event
			this._handleMouseUp(ige.input.mouseUp, evc, data);
		}

		if (ige.input.mouseWheel) {
			// There is a mouse wheel event
			this._handleMouseWheel(ige.input.mouseWheel, evc, data);
		}
	},

	/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// TRANSFORM
	/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
     * Enables tracing calls which inadvertently assign NaN values to
     * transformation properties. When called on an entity this system
     * will break with a debug line when a transform property is set
     * to NaN allowing you to step back through the call stack and
     * determine where the offending value originated.
     * @returns {IgeEntity}
     */
	debugTransforms: function () {
		ige.traceSet(this._translate, 'x', 1, function (val) {
			return isNaN(val);
		});

		ige.traceSet(this._translate, 'y', 1, function (val) {
			return isNaN(val);
		});

		ige.traceSet(this._translate, 'z', 1, function (val) {
			return isNaN(val);
		});

		ige.traceSet(this._rotate, 'x', 1, function (val) {
			return isNaN(val);
		});

		ige.traceSet(this._rotate, 'y', 1, function (val) {
			return isNaN(val);
		});

		ige.traceSet(this._rotate, 'z', 1, function (val) {
			return isNaN(val);
		});

		ige.traceSet(this._scale, 'x', 1, function (val) {
			return isNaN(val);
		});

		ige.traceSet(this._scale, 'y', 1, function (val) {
			return isNaN(val);
		});

		ige.traceSet(this._scale, 'z', 1, function (val) {
			return isNaN(val);
		});

		return this;
	},

	velocityTo: function (x, y, z) {
		if (x !== undefined && y !== undefined && z !== undefined) {
			this._velocity.x = x;
			this._velocity.y = y;
			this._velocity.z = z;
		} else {
			IgeEntity.prototype.log('velocityTo() called with a missing or undefined x, y or z parameter!', 'error');
		}

		return this._entity || this;
	},

	velocityBy: function (x, y, z) {
		if (x !== undefined && y !== undefined && z !== undefined) {
			this._velocity.x += x;
			this._velocity.y += y;
			this._velocity.z += z;
		} else {
			IgeEntity.prototype.log('velocityBy() called with a missing or undefined x, y or z parameter!', 'error');
		}

		return this._entity || this;
	},

	/**
     * Translates the entity by adding the passed values to
     * the current translation values.
     * @param {Number} x The x co-ordinate.
     * @param {Number} y The y co-ordinate.
     * @param {Number} z The z co-ordinate.
     * @example #Translate the entity by 10 along the x axis
     *     entity.translateBy(10, 0, 0);
     * @return {*}
     */
	translateBy: function (x, y, z) {
		if (!isNaN(x) && !isNaN(y) && !isNaN(z) && x !== undefined && y !== undefined && z !== undefined) {
			this._translate.x += x;
			this._translate.y += y;
			this._translate.z += z;
		} else {
			IgeEntity.prototype.log('translateBy() called with a missing or undefined x, y or z parameter!', 'error');
		}

		return this._entity || this;
	},

	/**
     * Translates the entity to the passed values.
     * @param {Number} x The x co-ordinate.
     * @param {Number} y The y co-ordinate.
     * @param {Number} z The z co-ordinate.
     * @example #Translate the entity to 10, 0, 0
     *     entity.translateTo(10, 0, 0);
     * @return {*}
     */
	translateTo: function (x, y) {
		// console.log('start translate', x, y)
		if (x !== undefined && y !== undefined) {
			// console.log('non-crash translate', this._translate)
			/* if (ige.physics && ige.physics.engine == 'CRASH') {
				console.log('crash translate');
				this.translateColliderTo(x, y);
			} */
			if (this._translate) {
				this._translate.x = x;
				this._translate.y = y;
			}

			// ensure this entity is created at its latest position to the new clients. (instead of spawnPosition)
			// this.defaultData.translate = this._translate;
		} else {
			IgeEntity.prototype.log('translateTo() called with a missing or undefined x, y or z parameter!', 'error');
		}

		return this._entity || this;
	},

	transformTexture: function (x, y, z, type) {
		if (!ige.isClient) return;
		ige.client.emit('transformTexture', {entity: this, x: x, y: y, z: z, type: type});
		return this;
	},

	teleportTo: function (x, y, rotate) {
		// console.log("teleporting to ", x, y);

		this.translateTo(x, y);
		if (rotate != undefined) {
			this.rotateTo(0, 0, rotate);
		}

		if (ige.isServer) {
			ige.network.send('teleport', { entityId: this.id(), position: [x, y] });
			this.clientStreamedPosition = undefined;
			//////////////////////////////////////////
			if (ige.physics && ige.physics.engine == 'CRASH') {
				this.translateColliderTo(x, y);
			}
			///////////////////////////////////////////
		} else if (ige.isClient) {
			this.lastServerStreamedPosition = undefined;
			if (this.body) {
				this.body.setPosition({ x: x / this._b2dRef._scaleRatio, y: y / this._b2dRef._scaleRatio });
				if (rotate != undefined) {
					this.body.setAngle(rotate);
				}
			}
		}

		this.discrepancyCount = 0;
		this.lastTeleportedAt = ige._currentTime;

		if (this._category == 'unit') {
			// teleport unit's attached items
			for (entityId in this.jointsAttached) {
				if ((attachedEntity = ige.$(entityId))) {
					if (attachedEntity._category == 'item') {
						// to prevent infinite loop, only move items that are attached to unit
						attachedEntity.teleportTo(attachedEntity._translate.x + offsetX, attachedEntity._translate.y + offsetY, attachedEntity._rotate.z);
					}
				}
			}
		}
	},

	isInVP: function (rect2) {
		var vp = ige.pixi.viewport.getVisibleBounds();
		var rect1 = {
			x1: vp.x,
			y1: vp.y,
			x2: vp.x + vp.width,
			y2: vp.y + vp.height
		};
		if (rect1.x1 >= rect2.x2 || rect2.x1 >= rect1.x2) {
			return false;
		}

		// If one rectangle is above other
		if (rect1.y1 >= rect2.y2 || rect2.y1 >= rect1.y2) {
			return false;
		}

		return true;
	},

	/**
     * Translates the entity to the passed point.
     * @param {IgePoint3d} point The point with co-ordinates.
     * @example #Translate the entity to 10, 0, 0
     *     var point = new IgePoint3d(10, 0, 0),
     *         entity = new IgeEntity();
     *
     *     entity.translateToPoint(point);
     * @return {*}
     */
	translateToPoint: function (point) {
		if (point !== undefined) {
			this._translate.x = point.x;
			this._translate.y = point.y;
			this._translate.z = point.z;
		} else {
			IgeEntity.prototype.log('translateToPoint() called with a missing or undefined point parameter!', 'error');
		}

		return this._entity || this;
	},

	/**
     * Translates the object to the tile co-ordinates passed.
     * @param {Number} x The x tile co-ordinate.
     * @param {Number} y The y tile co-ordinate.
     * @param {Number=} z The z tile co-ordinate.
     * @example #Translate entity to tile
     *     // Create a tile map
     *     var tileMap = new IgeTileMap2d()
     *         .tileWidth(40)
     *         .tileHeight(40);
     *
     *     // Mount our entity to the tile map
     *     entity.mount(tileMap);
     *
     *     // Translate the entity to the tile x:10, y:12
     *     entity.translateToTile(10, 12, 0);
     * @return {*} The object this method was called from to allow
     * method chaining.
     */
	translateToTile: function (x, y, z) {
		if (this._parent && this._parent._tileWidth !== undefined && this._parent._tileHeight !== undefined) {
			var finalZ;

			// Handle being passed a z co-ordinate
			if (z !== undefined) {
				finalZ = z * this._parent._tileWidth;
			} else {
				finalZ = this._translate.z;
			}

			this.translateTo(x * this._parent._tileWidth + this._parent._tileWidth / 2, y * this._parent._tileHeight + this._parent._tileWidth / 2, finalZ);
		} else {
			IgeEntity.prototype.log('Cannot translate to tile because the entity is not currently mounted to a tile map or the tile map has no tileWidth or tileHeight values.', 'warning');
		}

		return this;
	},

	/**
     * Gets the translate accessor object.
     * @example #Use the translate accessor object to alter the y co-ordinate of the entity to 10
     *     entity.translate().y(10);
     * @return {*}
     */
	translate: function () {
		if (arguments.length) {
			IgeEntity.prototype.log('You called translate with arguments, did you mean translateTo or translateBy instead of translate?', 'warning');
		}

		this.x = this._translateAccessorX;
		this.y = this._translateAccessorY;
		this.z = this._translateAccessorZ;

		return this._entity || this;
	},

	/**
     * The translate accessor method for the x axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.translate().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_translateAccessorX: function (val) {
		if (val !== undefined) {
			this._translate.x = val;
			return this._entity || this;
		}

		return this._translate.x;
	},

	/**
     * The translate accessor method for the y axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.translate().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_translateAccessorY: function (val) {
		if (val !== undefined) {
			this._translate.y = val;
			return this._entity || this;
		}

		return this._translate.y;
	},

	/**
     * The translate accessor method for the z axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.translate().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_translateAccessorZ: function (val) {
		// TODO: Do we need to do anything to the matrix here for iso views?
		// this._localMatrix.translateTo(this._translate.x, this._translate.y);
		if (val !== undefined) {
			this._translate.z = val;
			return this._entity || this;
		}

		return this._translate.z;
	},

	/**
     * Rotates the entity by adding the passed values to
     * the current rotation values.
     * @param {Number} x The x co-ordinate.
     * @param {Number} y The y co-ordinate.
     * @param {Number} z The z co-ordinate.
     * @example #Rotate the entity by 10 degrees about the z axis
     *     entity.rotateBy(0, 0, Math.radians(10));
     * @return {*}
     */
	rotateBy: function (x, y, z) {
		if (!isNaN(x) && !isNaN(y) && !isNaN(z) && x !== undefined && y !== undefined && z !== undefined) {
			this._rotate.x += x;
			this._rotate.y += y;
			this._rotate.z += z;
			this.transformTexture(0, 0, z, 'rotateBy');
		} else {
			IgeEntity.prototype.log('rotateBy() called with a missing or undefined x, y or z parameter!', 'error');
		}

		return this._entity || this;
	},

	/**
     * Rotates the entity to the passed values.
     * @param {Number} x The x co-ordinate.
     * @param {Number} y The y co-ordinate.
     * @param {Number} z The z co-ordinate.
     * @example #Rotate the entity to 10 degrees about the z axis
     *     entity.rotateTo(0, 0, Math.radians(10));
     * @return {*}
     */
	rotateTo: function (x, y, z) {
		// if (this._category == 'item')
		// 	console.log("asdf!", z)
		if (!isNaN(x) && !isNaN(y) && !isNaN(z) && x !== undefined && y !== undefined && z !== undefined) {
			this._rotate.x = x;
			this._rotate.y = y;
			this._rotate.z = z;
		} else {
			IgeEntity.prototype.log('rotateTo() called with a missing or undefined x, y or z parameter!', 'error');
		}

		return this._entity || this;
	},

	/**
     * Gets the translate accessor object.
     * @example #Use the rotate accessor object to rotate the entity about the z axis 10 degrees
     *     entity.rotate().z(Math.radians(10));
     * @return {*}
     */
	rotate: function () {
		if (arguments.length) {
			IgeEntity.prototype.log('You called rotate with arguments, did you mean rotateTo or rotateBy instead of rotate?', 'warning');
		}

		this.x = this._rotateAccessorX;
		this.y = this._rotateAccessorY;
		this.z = this._rotateAccessorZ;

		return this._entity || this;
	},

	/**
     * The rotate accessor method for the x axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.rotate().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_rotateAccessorX: function (val) {
		if (val !== undefined) {
			this._rotate.x = val;
			return this._entity || this;
		}

		return this._rotate.x;
	},

	/**
     * The rotate accessor method for the y axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.rotate().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_rotateAccessorY: function (val) {
		if (val !== undefined) {
			this._rotate.y = val;
			return this._entity || this;
		}

		return this._rotate.y;
	},

	/**
     * The rotate accessor method for the z axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.rotate().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_rotateAccessorZ: function (val) {
		if (val !== undefined) {
			this._rotate.z = val;
			return this._entity || this;
		}

		return this._rotate.z;
	},

	/**
     * Scales the entity by adding the passed values to
     * the current scale values.
     * @param {Number} x The x co-ordinate.
     * @param {Number} y The y co-ordinate.
     * @param {Number} z The z co-ordinate.
     * @example #Scale the entity by 2 on the x axis
     *     entity.scaleBy(2, 0, 0);
     * @return {*}
     */
	scaleBy: function (x, y, z) {
		if (x !== undefined && y !== undefined && z !== undefined) {
			this._scale.x += x;
			this._scale.y += y;
			this._scale.z += z;
		} else {
			IgeEntity.prototype.log('scaleBy() called with a missing or undefined x, y or z parameter!', 'error');
		}

		return this._entity || this;
	},

	/**
     * Scale the entity to the passed values.
     * @param {Number} x The x co-ordinate.
     * @param {Number} y The y co-ordinate.
     * @param {Number} z The z co-ordinate.
     * @example #Set the entity scale to 1 on all axes
     *     entity.scaleTo(1, 1, 1);
     * @return {*}
     */
	scaleTo: function (x, y, z) {
		if (ige.isClient) ige.client.emit('scale', {entity: this, x: x, y: y});
		if (this._scale && x !== undefined && y !== undefined && z !== undefined) {
			this._scale.x = x;
			this._scale.y = y;
			this._scale.z = z;
			// IgeEntity.prototype.log("scaling to ", this._scale)
		} else {
			IgeEntity.prototype.log('scaleTo() called with a missing or undefined x, y or z parameter!', 'error');
		}

		return this._entity || this;
	},
	scaleDimensions: function (width, height) {
		if (this._stats.scaleDimensions) {
			var originalWidth = this.width();
			var originalHeight = this.height();
			var scaleX = width / originalWidth;
			var scaleY = height / originalHeight;

			if (ige.isServer) {
				this.scaleTo(scaleX, scaleY, 0);
				this.updateBody(undefined, false, true);
			} else {
				this.height(height);
				this.width(width);
			}
		}
	},

	/**
     * Gets the scale accessor object.
     * @example #Use the scale accessor object to set the scale of the entity on the x axis to 1
     *     entity.scale().x(1);
     * @return {*}
     */
	scale: function () {
		if (arguments.length) {
			IgeEntity.prototype.log('You called scale with arguments, did you mean scaleTo or scaleBy instead of scale?', 'warning');
		}

		this.x = this._scaleAccessorX;
		this.y = this._scaleAccessorY;
		this.z = this._scaleAccessorZ;

		return this._entity || this;
	},

	/**
     * The scale accessor method for the x axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.scale().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_scaleAccessorX: function (val) {
		if (val !== undefined) {
			this._scale.x = val;
			return this._entity || this;
		}

		return this._scale.x;
	},

	/**
     * The scale accessor method for the y axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.scale().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_scaleAccessorY: function (val) {
		if (val !== undefined) {
			this._scale.y = val;
			return this._entity || this;
		}

		return this._scale.y;
	},

	/**
     * The scale accessor method for the z axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.scale().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_scaleAccessorZ: function (val) {
		if (val !== undefined) {
			this._scale.z = val;
			return this._entity || this;
		}

		return this._scale.z;
	},

	/**
     * Sets the origin of the entity by adding the passed values to
     * the current origin values.
     * @param {Number} x The x co-ordinate.
     * @param {Number} y The y co-ordinate.
     * @param {Number} z The z co-ordinate.
     * @example #Add 0.5 to the origin on the x axis
     *     entity.originBy(0.5, 0, 0);
     * @return {*}
     */
	originBy: function (x, y, z) {
		if (x !== undefined && y !== undefined && z !== undefined) {
			this._origin.x += x;
			this._origin.y += y;
			this._origin.z += z;
		} else {
			IgeEntity.prototype.log('originBy() called with a missing or undefined x, y or z parameter!', 'error');
		}

		return this._entity || this;
	},

	/**
     * Set the origin of the entity to the passed values.
     * @param {Number} x The x co-ordinate.
     * @param {Number} y The y co-ordinate.
     * @param {Number} z The z co-ordinate.
     * @example #Set the entity origin to 0.5 on all axes
     *     entity.originTo(0.5, 0.5, 0.5);
     * @return {*}
     */
	originTo: function (x, y, z) {
		if (x !== undefined && y !== undefined && z !== undefined) {
			this._origin.x = x;
			this._origin.y = y;
			this._origin.z = z;
		} else {
			IgeEntity.prototype.log('originTo() called with a missing or undefined x, y or z parameter!', 'error');
		}

		return this._entity || this;
	},

	/**
     * Gets the origin accessor object.
     * @example #Use the origin accessor object to set the origin of the entity on the x axis to 1
     *     entity.origin().x(1);
     * @return {*}
     */
	origin: function () {
		this.x = this._originAccessorX;
		this.y = this._originAccessorY;
		this.z = this._originAccessorZ;

		return this._entity || this;
	},

	/**
     * The origin accessor method for the x axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.origin().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_originAccessorX: function (val) {
		if (val !== undefined) {
			this._origin.x = val;
			return this._entity || this;
		}

		return this._origin.x;
	},

	/**
     * The origin accessor method for the y axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.origin().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_originAccessorY: function (val) {
		if (val !== undefined) {
			this._origin.y = val;
			return this._entity || this;
		}

		return this._origin.y;
	},

	/**
     * The origin accessor method for the z axis. This
     * method is not called directly but is accessed through
     * the accessor object obtained by calling entity.origin().
     * @param {Number=} val The new value to apply to the co-ordinate.
     * @return {*}
     * @private
     */
	_originAccessorZ: function (val) {
		if (val !== undefined) {
			this._origin.z = val;
			return this._entity || this;
		}

		return this._origin.z;
	},

	_rotatePoint: function (point, radians, origin) {
		var cosAngle = Math.cos(radians);
		var sinAngle = Math.sin(radians);

		return {
			x: origin.x + (point.x - origin.x) * cosAngle + (point.y - origin.y) * sinAngle,
			y: origin.y - (point.x - origin.x) * sinAngle + (point.y - origin.y) * cosAngle
		};
	},

	/**
     * Checks the current transform values against the previous ones. If
     * any value is different, the appropriate method is called which will
     * update the transformation matrix accordingly.
     */
	updateTransform: function () {
		ige.updateTransform++;
		this._localMatrix.identity();

		if (this._mode === 0) {
			// 2d translation
			this._localMatrix.multiply(this._localMatrix._newTranslate(this._translate.x, this._translate.y));
		}

		if (this._mode === 1) {
			if (!isNaN(this._translate.x) && !isNaN(this._translate.y)) {
				// iso translation
				var isoPoint = (this._translateIso = new IgePoint3d(this._translate.x, this._translate.y, this._translate.z + this._bounds3d.z / 2).toIso());

				if (this._parent && this._parent._bounds3d.z) {
					// This adjusts the child entity so that 0, 0, 0 inside the
					// parent is the center of the base of the parent
					isoPoint.y += this._parent._bounds3d.z / 1.6;
				}

				this._localMatrix.multiply(this._localMatrix._newTranslate(isoPoint.x, isoPoint.y));
			} else {
				console.log('localMatrix translate error: ', this._category, this._translate);
				if (ige.chat) ige.chat.postMessage({ text: `localMatrix translate error: ${this._category}${this._stats}` ? this._stats.name : '' });
			}
		}

		ige.matrixEntityId = this.id();
		ige.matrixAngle = this._rotate.z;

		this._localMatrix.rotateBy(this._rotate.z);
		this._localMatrix.scaleBy(this._scale.x, this._scale.y);

		// Adjust local matrix for origin values if not at center
		if (this._origin.x !== 0.5 || this._origin.y !== 0.5) {
			this._localMatrix.translateBy(this._bounds2d.x * (0.5 - this._origin.x), this._bounds2d.y * (0.5 - this._origin.y));
		}

		// TODO: If the parent and local transforms are unchanged, we should used cached values
		if (this._parent) {
			this._worldMatrix.copy(this._parent._worldMatrix);
			this._worldMatrix.multiply(this._localMatrix);
		} else {
			this._worldMatrix.copy(this._localMatrix);
		}

		// Check if the world matrix has changed and if so, set a few flags
		// to allow other methods to know that a matrix change has occurred
		if (!this._worldMatrix.compare(this._oldWorldMatrix)) {
			this._oldWorldMatrix.copy(this._worldMatrix);
			this._transformChanged = true;
			this._aabbDirty = true;
			this._bounds3dPolygonDirty = true;
		} else {
			this._transformChanged = false;
		}

		// Check if the geometry has changed and if so, update the aabb dirty
		if (!this._oldBounds2d.compare(this._bounds2d)) {
			this._aabbDirty = true;

			// Record the new geometry to the oldGeometry data
			this._oldBounds2d.copy(this._bounds2d);
		}

		if (!this._oldBounds3d.compare(this._bounds3d)) {
			this._bounds3dPolygonDirty = true;

			// Record the new geometry to the oldGeometry data
			this._oldBounds3d.copy(this._bounds3d);
		}

		return this;
	},

	/**
     * Gets / sets the disable interpolation flag. If set to true then
     * stream data being received by the client will not be interpolated
     * and will be instantly assigned instead. Useful if your entity's
     * transformations should not be interpolated over time.
     * @param val
     * @returns {*}
     */
	disableInterpolation: function (val) {
		if (val !== undefined) {
			this._disableInterpolation = val;
			return this;
		}

		return this._disableInterpolation;
	},

	/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// STREAM
	/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
     * Gets / sets the array of sections that this entity will
     * encode into its stream data.
     * @param {Array=} sectionArray An array of strings.
     * @example #Define the sections this entity will use in the network stream. Use the default "transform" section as well as a "custom1" section
     *     entity.streamSections('transform', 'custom1');
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	streamSections: function (sectionArray) {
		if (sectionArray !== undefined) {
			this._streamSections = sectionArray;
			return this;
		}

		return this._streamSections;
	},

	/**
     * Adds a section into the existing streamed sections array.
     * @param {String} sectionName The section name to add.
     */
	streamSectionsPush: function (sectionName) {
		this._streamSections = this._streamSections || [];
		this._streamSections.push(sectionName);

		return this;
	},
	getPersistentData: function (type) {
		var self = this;
		var dataToBeSaved = {};
		var variables = {};
		var unit = null;
		var player = null;
		var isUnitExists = false;

		dataToBeSaved[type] = {};

		if (type == 'player') {
			player = self;
			unit = ige.$(player._stats.selectedUnitId);

			if (!player || !player._stats) return;
		} else if (type == 'unit') {
			unit = self;
			player = unit.getOwner();

			if (!unit || !unit._stats) return;
		}

		isUnitExists = !!(unit && unit._stats);

		var variablesToBeIgnored = ['unit', 'item', 'player', 'playerGroup', 'itemGroup', 'unitGroup', 'projectile', 'region'];
		for (var variablesId in self.variables) {
			var variable = self.variables[variablesId];
			if (!variablesToBeIgnored.includes(variable.dataType)) {
				variables[variablesId] = JSON.parse(JSON.stringify(variable));
			}
		}

		if (isUnitExists) {
			// remove all passive attributes applyed to this unit
			unit._stats.itemIds.forEach(function (itemId) {
				if (itemId) {
					var item = ige.$(itemId);
					if (item._stats.bonus && item._stats.bonus.passive) {
						if (item._stats.slotIndex < unit._stats.inventorySize || item._stats.bonus.passive.isDisabledInBackpack != true) {
							unit.updateStats(itemId, true);
						}
					} else {
						unit.updateStats(itemId, true);
					}
				}
			});
		}

		dataToBeSaved[type] = {
			attributes: _.cloneDeep(self._stats.attributes),
			variables: variables
		};

		if (isUnitExists) {
			// add all passive attributes applyed to this unit
			unit._stats.itemIds.forEach(function (itemId) {
				if (itemId) {
					var item = ige.$(itemId);
					if (item._stats.bonus && item._stats.bonus.passive) {
						if (item._stats.slotIndex < unit._stats.inventorySize || item._stats.bonus.passive.isDisabledInBackpack != true) {
							unit.updateStats(itemId);
						}
					} else {
						unit.updateStats(itemId);
					}
				}
			});
		}

		if (isUnitExists && type == 'unit' && unit._stats.itemIds) {
			var inventoryItems = unit._stats.itemIds.reduce(function (pv, cv) {
				if (cv) {
					var item = ige.$(cv);
					if (item) {
						var itemVariable = {};
						for (var variablesId in item.variables) {
							var variable = item.variables[variablesId];
							if (!variablesToBeIgnored.includes(variable.dataType)) {
								itemVariable[variablesId] = JSON.parse(JSON.stringify(variable));
							}
						}
						var itemStatsToBeSaved = {
							itemTypeId: item._stats.itemTypeId,
							attributes: _.cloneDeep(item._stats.attributes),
							variables: _.cloneDeep(itemVariable),
							quantity: item._stats.quantity
						};

						pv.push(itemStatsToBeSaved);
					}
				}
				return pv;
			}, []);
			dataToBeSaved[type].inventoryItems = inventoryItems;
		}

		return _.cloneDeep(dataToBeSaved[type]);
	},

	updateStats: function (itemId, removeAttributes) {
		var self = this;
		var item = ige.$(itemId);
		if (!ige.isServer) return;
		// 1. store the unit's current attribute values. let's say we had 500/600 HP (base max 100hp)
		var currentType = this._category === 'unit' ? 'unitTypes' : 'playerTypes';
		var bonusType = this._category === 'unit' ? 'unitAttribute' : 'playerAttribute';
		var currentEntityTypeId = this._category === 'unit' ? 'type' : 'playerTypeId';
		var baseEntityStats = ige.game.getAsset(currentType, this._stats[currentEntityTypeId]);

		if (!baseEntityStats) {
			return;
		}

		var unit = self;
		if (currentType === 'playerTypes') {
			unit = this.getSelectedUnit();
		}

		if (item && item._stats.bonus && item._stats.bonus.passive && unit && (unit.canUseItem(item._stats) || removeAttributes)) {
			var attributePassiveBonuses = item._stats.bonus.passive[bonusType];

			if (attributePassiveBonuses) {
				for (var attrId in attributePassiveBonuses) {
					var selectedAttribute = this._stats.attributes[attrId];
					var bonus = attributePassiveBonuses[attrId];

					if (selectedAttribute && bonus) {
						var currentAttributeValue = parseFloat(selectedAttribute.value) || 1;
						var maxValue = parseFloat(selectedAttribute.max);

						if (currentAttributeValue != undefined) {
							if (removeAttributes) {
								if (bonus.type === 'percentage') {
									var newValue = currentAttributeValue / (1 + parseFloat(bonus.value) / 100);
									var newMax = maxValue / (1 + parseFloat(bonus.value) / 100);
								} else {
									var newMax = maxValue - parseFloat(bonus.value);
									var newValue = Math.min(newMax, Math.max(selectedAttribute.min, currentAttributeValue));
								}
							} else {
								if (bonus.type === 'percentage') {
									var newValue = currentAttributeValue * (1 + parseFloat(bonus.value) / 100);
									var newMax = maxValue * (1 + parseFloat(bonus.value) / 100);
								} else {
									var newMax = maxValue + parseFloat(bonus.value);
									var newValue = Math.min(newMax, Math.max(selectedAttribute.min, currentAttributeValue));
								}
							}
							// this._stats.attributes[attrId].value = newValue;
							// this._stats.attributes[attrId].max = newMax;
							// updatedAttributes[attrId] = newValue;
							// updatedAttributes[attrId] = newMax;
							this.attribute.setMax(attrId, newMax);
							this.attribute.update(attrId, newValue, true);
						}
					}
				}
			}
		}
		// update player attributes;
		if (currentType === 'unitTypes') {
			var player = this.getOwner();
			player && player.updateStats(itemId, removeAttributes);
		}
	},

	loadPersistentData: function (persistData) {
		var self = this;

		if (persistData) {
			var attributes = persistData.attributes;
			var variables = persistData.variables;
			var max = {};
			var min = {};
			var regSpeed = {};
			var keysToStream = ['min', 'max', 'regenerateSpeed', 'value'];
			for (var attrKey in attributes) {
				var persistAttribute = attributes[attrKey];
				var playerAttribute = self._stats && self._stats.attributes && self._stats.attributes[attrKey];
				if (playerAttribute) {
					for (var i = 0; i < keysToStream.length; i++) {
						var key = keysToStream[i];
						switch (key) {
							// we are persisting min, max and regenerating speed for
							// consumed item giving any bonuses
							case 'min':
								playerAttribute.min = persistAttribute[key];
								min[attrKey] = persistAttribute[key];
								break;
							case 'max':
								playerAttribute.max = persistAttribute[key];
								max[attrKey] = persistAttribute[key];
								break;
							case 'regenerateSpeed':
								playerAttribute.regenerateSpeed = persistAttribute[key];
								regSpeed[attrKey] = persistAttribute[key];
								break;
							case 'value':
								var newValue = Math.max(playerAttribute.min, Math.min(persistAttribute[key], playerAttribute.max));
								self.attribute.update(attrKey, newValue, true);
								break;
						}
					}
				}
			}
			self.streamUpdateData([{ attributesMax: max }, { attributesMin: min }, { attributesRegenerateRate: regSpeed }]);

			for (var variableKey in variables) {
				var persistVariable = variables[variableKey];

				if (self && self.variables && self.variables[variableKey]) {
					self.variables[variableKey] = persistVariable;
				}
			}
		}
	},
	mouseEvents: function (defaultData) {
		var self = this;
		if (typeof mode === 'string' && mode === 'sandbox') {
			IgeObject.prototype.mount.call(this, ige.client.rootScene);
			self.mount(ige.client.rootScene);
			self.drawMouse(true)
				.drawBoundsData(false)
				.mouseDown(function (event, evc) {
					if (event.which === 1 && ige.mapEditor.selectEntities) {
						this.onMouseDown = true;
						this.onMouseMove = false;
					}
				})
				.mouseMove(function (event) {
					if (this.onMouseDown && ige.mapEditor.selectEntities) {
						this.onMouseMove = true;
						this.translateTo(ige.mapEditor.mouseCoordinatesWRTVp.x, ige.mapEditor.mouseCoordinatesWRTVp.y, 0);
					}
				})
				.mouseUp(function (event) {
					if (this.onMouseDown === true) {
						if (this.onMouseMove === true) {
							self.scriptValues.x = ige.mapEditor.mouseCoordinatesWRTVp.x;
							self.scriptValues.y = ige.mapEditor.mouseCoordinatesWRTVp.y;
							ige.mapEditor.upsertMapEntities(self.scriptValues, parseInt(self.scriptValues.index));
						} else if (this.onMouseMove === false && ige.mapEditor.selectEntities && event.which === 1) {
							ige.mapEditor.openEntitiesModal(self.scriptValues, true);
							this.selectedEntityForMovement = true;
						}
					}

					this.onMouseDown = false;
					this.onMouseMove = false;
				});
		}
	},
	// use to apply max,min value before attributes value
	// orderData: function (data) {
	// 	var attributes = data.attributes && _.cloneDeep(data.attributes);
	// 	var attributesMax = data.attributesMax && _.cloneDeep(data.attributesMax);
	// 	var attributesMin = data.attributesMin && _.cloneDeep(data.attributesMin);
	// 	if (attributesMax) {
	// 		delete data.attributesMax;
	// 		data.attributesMax = attributesMax;
	// 	}
	// 	if (attributesMin) {
	// 		delete data.attributesMin;
	// 		data.attributesMin = attributesMin;
	// 	}
	// 	if (attributes) {
	// 		delete data.attributes;
	// 		data.attributes = attributes;
	// 	}
	// 	return data;
	// },

	streamUpdateData: function (queuedData) {
		var oldStats = {};
		if (queuedData != undefined) {
			for (var i = 0; i < queuedData.length; i++) {
				var data = queuedData[i];
				for (attrName in data) {
					var newValue = data[attrName];
					// console.log(this._category, this.id(), attrName, newValue)
					switch (attrName) {
						case 'attributes':
							// only on client side to prevent circular recursion
							if (ige.isClient) {
								var attributesObject = _.cloneDeep(this._stats.attributes);
								if (attributesObject) {
									for (var attributeTypeId in data.attributes) {
										var attributeData = attributesObject[attributeTypeId];

										if (attributeData) {
											var newAttributeValue = data.attributes[attributeTypeId];
											var oldAttributeValue = attributeData.value;

											attributeData.hasChanged = newAttributeValue !== oldAttributeValue;
											attributeData.value = newAttributeValue;
											attributeData.type = attributeTypeId;

											this.attribute.update(attributeTypeId, attributeData.value);

											if (this._category === 'unit') {
												this.updateAttributeBar(attributeData);
											}
										}
										// update attribute if entity has such attribute
									}
								}
							} else if (ige.isServer) {
								for (var attributeTypeId in data.attributes) {
									// prevent attribute being passed to client if it is invisible
									if (this._stats.attributes && this._stats.attributes[attributeTypeId]) {
										var attribute = this._stats.attributes[attributeTypeId];
										if (
											((attribute.isVisible && typeof attribute.isVisible === 'boolean' && attribute.isVisible == false) || // will be deprecated.
                                                (attribute.isVisible && attribute.isVisible.constructor === Array && attribute.isVisible.length == 0)) &&
                                            attributeTypeId !== ige.game.data.settings.scoreAttributeId
										) {
											delete data[attrName];
										}
									}
								}
							}
							break;

						case 'attributesMax':
							if (this._stats.attributes) {
								// only on client side to prevent circular recursion
								for (var attributeTypeId in data.attributesMax) {
									if (this._stats.attributes && this._stats.attributes[attributeTypeId]) {
										this._stats.attributes[attributeTypeId].max = data.attributesMax[attributeTypeId];
									}

									// update attribute if entity has such attribute
									if (ige.isClient) {
										if (this._category === 'unit') {
											// this.updateAttributeBar(this._stats.attributes[attributeTypeId]);
											this.unitUi && this.unitUi.updateAttributeBar(this._stats.attributes[attributeTypeId]);
										}
									}
								}
							}
							break;

						case 'attributesMin':
							// only on client side to prevent circular recursion
							for (var attributeTypeId in data.attributesMin) {
								if (this._stats.attributes && this._stats.attributes[attributeTypeId]) {
									this._stats.attributes[attributeTypeId].min = data.attributesMin[attributeTypeId];

									// update attribute if entity has such attribute
									if (ige.isClient) {
										if (this._category === 'unit') {
											this.updateAttributeBar(this._stats.attributes[attributeTypeId]);
											this.unitUi && this.unitUi.updateAttributeBar(this._stats.attributes[attributeTypeId]);
										}
									}
								}
							}
							break;

						case 'attributesRegenerateRate':
							// only on client side to prevent circular recursion
							for (var attributeTypeId in data.attributesRegenerateRate) {
								if (this._stats.attributes && this._stats.attributes[attributeTypeId]) {
									this._stats.attributes[attributeTypeId].regenerateSpeed = data.attributesRegenerateRate[attributeTypeId];
								}
							}
							break;

						case 'depth':
							if (ige.isClient) {
								this.depth(data.depth);
							}
							break;

						case 'flip':
							// ignore flip command from server for my own unit, because it's already done locally
							if (ige.isClient && this != ige.client.selectedUnit && !(this._category == 'item' && this.getOwnerUnit() == ige.client.selectedUnit)) {
								this.flip(newValue);
							}
							break;

						case 'isBeingUsed':
							// this case is in igeEntity.js instead of item.js, because if it's in item.js,
							// we cannot prevent updating my own unit's isBeingUsed, and item._stats.isBeingUsed will be updated regardless.
							if (ige.isClient) {
								if (this.getOwnerUnit() != ige.client.selectedUnit) {
									this._stats.isBeingUsed = newValue;
									if (newValue == false) {
										this.playEffect('none');
									}
								}
							}
							break;

						case 'stopUsing':
							// This will only be called when we stop the unit from using an item from the server side, to prevent issues.
							if (ige.isClient) {
								this._stats.isBeingUsed = newValue;
								if (newValue == false) {
									this.playEffect('none');
								}
							}
							break;

						default:
							// setting oldownerId b4 owner change
							if (attrName === 'ownerId') {
								this.oldOwnerId = this._stats[attrName];
							}
							this._stats[attrName] = newValue;
							break;
					}

					if (ige.isServer) {
						// keys that will stream even if its new value is same as the previous value
						var forceStreamKeys = ['anim', 'coin', 'stateId', 'ownerId', 'name', 'slotIndex', 'newItemId', 'quantity', 'spriteOnly', 'setFadingText', 'playerJoinedAgain', 'use', 'hidden'];
						if (typeof this.queueStreamData === 'function') {
							if (data[attrName] != oldStats[attrName] || forceStreamKeys.includes(attrName)) {
								// console.log("queueStreamData", attrName, data[attrName])
								var streamData = {};
								streamData[attrName] = data[attrName];
								this.queueStreamData(streamData);
							}
						}
					} else if (ige.isClient) {
						switch (attrName) {
							case 'stateId':
								// console.log('stateId', this.id(), this._stats.name, newValue);
								break;
							case 'effect':
								// don't use streamed effect call for my own unit or its items
								if (this == ige.client.selectedUnit || (this._category == 'item' && this.getOwnerUnit() == ige.client.selectedUnit))
									return;
								this.playEffect(newValue);
								break;
							case 'makePlayerSelectUnit':
								// this unit was queued to be selected by a player
								ige.client.myPlayer.selectUnit(this.id());
								break;
							case 'makePlayerCameraTrackUnit':
								// this unit was queued to be tracked by a player's camera
								ige.client.myPlayer.cameraTrackUnit(this);
								break;
							case 'hideUnit':
								this.hide();
								break;
							case 'showUnit':
								this.show();
								break;
							case 'hideNameLabel':
								this.unitNameLabel && this.unitNameLabel.hide();
								break;
							case 'showNameLabel':
								this.unitNameLabel && this.unitNameLabel.show();
								break;
						}
					}
				}
			}
		}
	},

	// combine all data that'll be sent to the client, and send them altogether at the tick
	queueStreamData: function (data) {
		this._streamDataQueued = this._streamDataQueued.concat(data);
		ige.server.bandwidthUsage[this._category] += JSON.stringify(this._streamDataQueued).length;
	},

	/**
     * Removes a section into the existing streamed sections array.
     * @param {String} sectionName The section name to remove.
     */
	streamSectionsPull: function (sectionName) {
		if (this._streamSections) {
			this._streamSections.pull(sectionName);
		}

		return this;
	},

	/**
     * Gets / sets a streaming property on this entity. If set, the
     * property's new value is streamed to clients on the next packet.
     *
     * @param {String} propName The name of the property to get / set.
     * @param {*=} propVal Optional. If provided, the property is set
     * to this value.
     * @return {*} "this" when a propVal argument is passed to allow method
     * chaining or the current value if no propVal argument is specified.
     */
	streamProperty: function (propName, propVal) {
		this._streamProperty = this._streamProperty || {};
		// this._streamPropertyChange = this._streamPropertyChange || {};

		if (propName !== undefined) {
			if (propVal !== undefined) {
				// this._streamPropertyChange[propName] = this._streamProperty[propName] !== propVal;
				this._streamProperty[propName] = propVal;

				return this;
			}

			return this._streamProperty[propName];
		}

		return undefined;
	},

	/**
     * Gets / sets the data for the specified data section id. This method
     * is usually not called directly and instead is part of the network
     * stream system. General use case is to write your own custom streamSectionData
     * method in a class that extends IgeEntity so that you can control the
     * data that the entity will send and receive over the network stream.
     * @param {String} sectionId A string identifying the section to
     * handle data get / set for.
     * @param {*=} data If present, this is the data that has been sent
     * from the server to the client for this entity.
     * @param {Boolean=} bypassSmoothing If true, will assign transform
     * directly to entity instead of adding the values to the time stream.
     * @return {*} "this" when a data argument is passed to allow method
     * chaining or the current value if no data argument is specified.
     */
	streamSectionData: function (sectionId, data) {
		switch (sectionId) {
			case 'transform':
				if (ige.isServer) {
					var x = this._translate.x.toFixed(0);
					var y = this._translate.y.toFixed(0);
					var angle = ((this._rotate.z % (2 * Math.PI)) * 1000).toFixed(0);

					if (x == this._oldTranform[0] && y == this._oldTranform[1] && angle == this._oldTranform[2]) {
						this._hasMoved = false;
					} else {
						this._hasMoved = true;
						this._oldTranform = [x, y, angle];

						// var distanceTravelled = x - ige.lastX;
						// console.log(this.id(), ige._currentTime - ige.lastSnapshotTime, ige._currentTime, x,  distanceTravelled / (ige._currentTime - ige.lastSnapshotTime))
						// ige.lastX = x
						// ige.lastSnapshotTime = ige._currentTime;

						let buffArr = [];
						buffArr.push(Number(x));
						buffArr.push(Number(y));
						buffArr.push(Number(angle));

						// IgeEntity.prototype.log(this._size, this._translate, this._rotate)
						if (this.bypassSmoothing) {
							buffArr.push(1);
							// ige.devLog("streamData", buff)
							this.bypassSmoothing = false;
						}

						buffArr = buffArr.map(item => item.toString(16));

						this._streamSectionData = buffArr;
					}
				}
				break;

			case 'depth':
				if (data !== undefined) {
					if (ige.isClient) {
						this.depth(parseInt(data));
					}
				} else {
					return String(this.depth());
				}
				break;

			case 'layer':
				if (data !== undefined) {
					if (ige.isClient) {
						this.layer(parseInt(data));
					}
				} else {
					return String(this.layer());
				}
				break;

			case 'bounds2d':
				if (data !== undefined) {
					if (ige.isClient) {
						var geom = data.split(',');
						this.bounds2d(parseFloat(geom[0]), parseFloat(geom[1]));
					}
				} else {
					return String(`${this._bounds2d.x},${this._bounds2d.y}`);
				}
				break;

			case 'bounds3d':
				if (data !== undefined) {
					if (ige.isClient) {
						var geom = data.split(',');
						this.bounds3d(parseFloat(geom[0]), parseFloat(geom[1]), parseFloat(geom[2]));
					}
				} else {
					return String(`${this._bounds3d.x},${this._bounds3d.y},${this._bounds3d.z}`);
				}
				break;

			case 'hidden':
				if (data !== undefined) {
					if (ige.isClient) {
						if (data == 'true') {
							this.hide();
						} else {
							this.show();
						}
					}
				} else {
					return String(this.isHidden());
				}
				break;

			case 'mount':
				if (data !== undefined) {
					if (ige.isClient) {
						if (data) {
							var newParent = ige.$(data);

							if (newParent) {
								this.mount(newParent);
							}
						} else {
							// Unmount
							this.unMount();
						}
					}
				} else {
					var parent = this.parent();

					if (parent) {
						return this.parent().id();
					} else {
						return '';
					}
				}
				break;

			case 'origin':
				if (data !== undefined) {
					if (ige.isClient) {
						var geom = data.split(',');
						this.origin(parseFloat(geom[0]), parseFloat(geom[1]), parseFloat(geom[2]));
					}
				} else {
					return String(`${this._origin.x},${this._origin.y},${this._origin.z}`);
				}
				break;

			case 'props':
				var newData, changed, i;

				if (data !== undefined) {
					if (ige.isClient) {
						var props = JSON.parse(data);

						// Update properties that have been sent through
						for (i in props) {
							changed = false;
							if (props.hasOwnProperty(i)) {
								if (this._streamProperty[i] != props[i]) {
									changed = true;
								}
								this._streamProperty[i] = props[i];

								this.emit('streamPropChange', [i, props[i]]);
							}
						}
					}
				} else {
					newData = {};

					for (i in this._streamProperty) {
						if (this._streamProperty.hasOwnProperty(i)) {
							// if (this._streamPropertyChange[i]) {
							newData[i] = this._streamProperty[i];
							// this._streamPropertyChange[i] = false;
							// }
						}
					}

					return JSON.stringify(newData);
				}
				break;
		}
	},
	getQueuedStreamData: function () {
		return this._streamDataQueued;
	},

	/**
     * Gets / sets the stream mode that the stream system will use when
     * handling pushing data updates to connected clients.
     * @param {Number=} val A value representing the stream mode.
     * @example #Set the entity to disable streaming
     *     entity.streamMode(0);
     * @example #Set the entity to automatic streaming
     *     entity.streamMode(1);
     * @example #Set the entity to manual (advanced mode) streaming
     *     entity.streamMode(2);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	streamMode: function (val) {
		// console.log("streamMode (" + val + ")", (this._stats) ? this._stats.name : this._category)
		if (val !== undefined) {
			this._streamMode = val;
			return this;
		}

		return this._streamMode;
	},

	/**
     * Gets / sets the stream control callback function that will be called
     * each time the entity tick method is called and stream-able data is
     * updated.
     * @param {Function=} method The stream control method.
     * @example #Set the entity's stream control method to control when this entity is streamed and when it is not
     *     entity.streamControl(function (clientId) {
     *         // Let's use an example where we only want this entity to stream
     *         // to one particular client with the id 4039589434
     *         if (clientId === '4039589434') {
     *             // Returning true tells the network stream to send data
     *             // about this entity to the client
     *             return true;
     *         } else {
     *             // Returning false tells the network stream NOT to send
     *             // data about this entity to the client
     *             return false;
     *         }
     *     });
     *
     * Further reading: [Controlling Streaming](http://www.isogenicengine.com/documentation/isogenic-game-engine/versions/1-1-0/manual/networking-multiplayer/realtime-network-streaming/stream-modes-and-controlling-streaming/)
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	streamControl: function (method) {
		if (method !== undefined) {
			this._streamControl = method;
			return this;
		}

		return this._streamControl;
	},

	/**
     * Gets / sets the stream sync interval. This value
     * is in milliseconds and cannot be lower than 16. It will
     * determine how often data from this entity is added to the
     * stream queue.
     * @param {Number=} val Number of milliseconds between adding
     * stream data for this entity to the stream queue.
     * @param {String=} sectionId Optional id of the stream data
     * section you want to set the interval for. If omitted the
     * interval will be applied to all sections.
     * @example #Set the entity's stream update (sync) interval to 1 second because this entity's data is not highly important to the simulation so save some bandwidth!
     *     entity.streamSyncInterval(1000);
     * @example #Set the entity's stream update (sync) interval to 16 milliseconds because this entity's data is very important to the simulation so send as often as possible!
     *     entity.streamSyncInterval(16);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	streamSyncInterval: function (val, sectionId) {
		if (val !== undefined) {
			if (!sectionId) {
				if (val < 16) {
					delete this._streamSyncInterval;
				} else {
					this._streamSyncDelta = 0;
					this._streamSyncInterval = val;
				}
			} else {
				this._streamSyncSectionInterval = this._streamSyncSectionInterval || {};
				this._streamSyncSectionDelta = this._streamSyncSectionDelta || {};
				if (val < 16) {
					delete this._streamSyncSectionInterval[sectionId];
				} else {
					this._streamSyncSectionDelta[sectionId] = 0;
					this._streamSyncSectionInterval[sectionId] = val;
				}
			}
			return this;
		}

		return this._streamSyncInterval;
	},

	/**
     * Gets / sets the precision by which floating-point values will
     * be encoded and sent when packaged into stream data.
     * @param {Number=} val The number of decimal places to preserve.
     * @example #Set the float precision to 2
     *     // This will mean that any data using floating-point values
     *     // that gets sent across the network stream will be rounded
     *     // to 2 decimal places. This helps save bandwidth by not
     *     // having to send the entire number since precision above
     *     // 2 decimal places is usually not that important to the
     *     // simulation.
     *     entity.streamFloatPrecision(2);
     * @return {*} "this" when arguments are passed to allow method
     * chaining or the current value if no arguments are specified.
     */
	streamFloatPrecision: function (val) {
		if (val !== undefined) {
			this._streamFloatPrecision = val;

			var i;
			var floatRemove = '\\.';

			// Update the floatRemove regular expression pattern
			for (i = 0; i < this._streamFloatPrecision; i++) {
				floatRemove += '0';
			}

			// Add the trailing comma
			floatRemove += ',';

			// Create the new regexp
			this._floatRemoveRegExp = new RegExp(floatRemove, 'g');

			return this;
		}

		return this._streamFloatPrecision;
	},

	/**
     * Override this method if your entity should send data through to
     * the client when it is being created on the client for the first
     * time through the network stream. The data will be provided as the
     * first argument in the constructor call to the entity class so
     * you should expect to receive it as per this example:
     * @example #Using and Receiving Stream Create Data
     *     var MyNewClass = IgeEntity.extend({
     *         classId: 'MyNewClass',
     *
     *         // Define the init with the parameter to receive the
     *         // data you return in the streamCreateData() method
     *         init: function (myCreateData) {
     *             this._myData = myCreateData;
     *         },
     *
     *         streamCreateData: function () {
     *             return this._myData;
     *         }
     *     });
     *
     * Valid return values must not include circular references!
     */
	streamCreateData: function (clientId) {
		if (ige.isServer) {
			// remove _stats which are static and can be added from client as well. which will save our bandwidth
			var keys = ige.server.keysToRemoveBeforeSend.slice();

			if (this._category === 'debris' && keys.indexOf('cellSheet') > -1) {
				keys.splice(keys.indexOf('cellSheet'), 1);
				keys = keys.concat(['rotation', 'type', 'density', 'friction', 'restitution', 'rotation', 'y', 'x']);
			} else if (this._category === 'region') {
				keys = keys.concat('value');
			}

			const statKeys = Object.keys(this._stats);
			const data = {};

			statKeys.forEach(key => {
				if (!keys.includes(key)) {
					data[key] = this._stats[key];
				}
			});

			return data;
		}
	},

	/**
     * Gets / sets the stream emit created flag. If set to true this entity
     * emit a "streamCreated" event when it is created by the stream, but
     * after the id and initial transform are set.
     * @param val
     * @returns {*}
     */
	streamEmitCreated: function (val) {
		if (val !== undefined) {
			this._streamEmitCreated = val;
			return this;
		}

		return this._streamEmitCreated;
	},

	/**
     * Queues stream data for this entity to be sent to the
     * specified client id or array of client ids.
     * @param {Array} clientId An array of string IDs of each
     * client to send the stream data to.
     * @return {IgeEntity} "this".
     */
	streamSync: function (clientId) {
		if (this._streamMode === 1 || this._streamMode === 2) {
			// Check if we have a stream sync interval
			if (this._streamSyncInterval) {
				this._streamSyncDelta += ige._tickDelta;

				if (this._streamSyncDelta < this._streamSyncInterval) {
					// The stream sync interval is still higher than
					// the stream sync delta so exit without calling the
					// stream sync method
					return this;
				} else {
					// We've reached the delta we want so zero it now
					// ready for the next loop
					this._streamSyncDelta = 0;
				}
			}

			this._streamSync();
			return this;
		}

		// if (this._streamMode === 2) {
		// 	// Stream mode is advanced
		// 	this._streamSync(clientId, this._streamRoomId);

		// 	return this;
		// }

		recipientArr = null;
		return this;
	},

	/**
     * Asks the stream system to queue the stream data to the specified
     * client id or array of ids.
     * @param {Array} recipientArr The array of ids of the client(s) to
     * queue stream data for. The stream data being queued
     * is returned by a call to this._streamData().
     * @param {String} streamRoomId The id of the room the entity belongs
     * in (can be undefined or null if no room assigned).
     * @private
     */
	_streamSync: function () {
		var recipientArr = ige.network.clientIds;
		var arrCount = recipientArr.length;
		var arrIndex;
		var clientId;
		var thisId = this.id();
		var createResult = true; // We set this to true by default

		var data = this._streamData();
		// Loop the recipient array
		for (arrIndex = 0; arrIndex < arrCount; arrIndex++) {
			clientId = recipientArr[arrIndex];

			// Check if the client has already received a create
			// command for this entity
			if (!ige.network.stream._streamClientCreated[thisId]) {
				ige.network.stream._streamClientCreated[thisId] = {};
			}

			if (!ige.network.stream._streamClientCreated[thisId][clientId]) {
				createResult = this.streamCreate(clientId);
				this._hasMoved = true;
			}
		}

		if (data && recipientArr.length && this._streamMode === 1 && this._hasMoved) {
			ige.server.bandwidthUsage[this._category] += data.length;
			ige.network.stream.queue(thisId, data, recipientArr);
		}
	},

	/**
     * Issues a create entity command to the passed client id
     * or array of ids. If no id is passed it will issue the
     * command to all connected clients. If using streamMode(1)
     * this method is called automatically.
     * @param {*} clientId The id or array of ids to send
     * the command to.
     * @example #Send a create command for this entity to all clients
     *     entity.streamCreate();
     * @example #Send a create command for this entity to an array of client ids
     *     entity.streamCreate(['43245325', '326755464', '436743453']);
     * @example #Send a create command for this entity to a single client id
     *     entity.streamCreate('43245325');
     * @return {Boolean}
     */
	streamCreate: function (clientId) {
		// IgeEntity.prototype.log("streamCreate")

		if (this._parent && ige.network.stream._streamClientCreated !== undefined) {
			var thisId = this.id();
			var arr;
			var i;

			// Send the client an entity create command first
			var streamCreateData = this.streamCreateData(clientId);
			this.streamSectionData('transform'); // prepare this._streamSectionData
			ige.network.send('_igeStreamCreate', [this.classId(), thisId, this._parent.id(), this._streamSectionData, streamCreateData], clientId);
			ige.server.bandwidthUsage[this._category] += JSON.stringify(streamCreateData).length;
			ige.network.stream._streamClientCreated[thisId] = ige.network.stream._streamClientCreated[thisId] || {};

			if (clientId) {
				// Mark the client as having received a create
				// command for this entity
				ige.network.stream._streamClientCreated[thisId][clientId] = true;
			} else {
				// Mark all clients as having received this create
				arr = ige.network.clients();

				for (i in arr) {
					if (arr.hasOwnProperty(i)) {
						ige.network.stream._streamClientCreated[thisId][i] = true;
					}
				}
			}

			return true;
		}

		return false;
	},

	/**
     * Issues a destroy entity command to the passed client id
     * or array of ids. If no id is passed it will issue the
     * command to all connected clients. If using streamMode(1)
     * this method is called automatically.
     * @param {*} clientId The id or array of ids to send
     * the command to.
     * @example #Send a destroy command for this entity to all clients
     *     entity.streamDestroy();
     * @example #Send a destroy command for this entity to an array of client ids
     *     entity.streamDestroy(['43245325', '326755464', '436743453']);
     * @example #Send a destroy command for this entity to a single client id
     *     entity.streamDestroy('43245325');
     * @return {Boolean}
     */
	streamDestroy: function (clientId) {
		var thisId = this.id();
		var arr;
		var i;

		// Send clients the stream destroy command for this entity
		ige.network.send('_igeStreamDestroy', [ige._currentTime, thisId], clientId);

		if (!ige.network.stream) return true;

		ige.network.stream._streamClientCreated[thisId] = ige.network.stream._streamClientCreated[thisId] || {};

		if (clientId) {
			// Mark the client as having received a destroy
			// command for this entity
			ige.network.stream._streamClientCreated[thisId][clientId] = false;
		} else {
			// Mark all clients as having received this destroy
			arr = ige.network.clients();

			delete ige.network.stream._streamClientCreated[thisId];
		}

		return true;
	},

	/**
     * Generates and returns the current stream data for this entity. The
     * data will usually include only properties that have changed since
     * the last time the stream data was generated. The returned data is
     * a string that has been compressed in various ways to reduce network
     * overhead during transmission.
     * @return {String} The string representation of the stream data for
     * this entity.
     * @private
     */
	_streamData: function () {
		// Check if we already have a cached version of the streamData
		if (this._streamDataCache) {
			return this._streamDataCache;
		} else {
			// Let's generate our stream data
			var sectionDataString = '';
			var sectionData;
			var sectionIndex;
			var sectionId;

			// Only send further data if the entity is still "alive"
			if (this._alive) {
				// Now loop the data sections array and compile the rest of the
				// data string from the data section return data
				for (sectionIndex = 0; sectionIndex < this._streamSections.length; sectionIndex++) {
					sectionData = '';
					sectionId = this._streamSections[sectionIndex];
					// if (this._streamMode === 2 && sectionId === 'transform') break;
					// Stream section sync intervals allow individual stream sections
					// to be streamed at different (usually longer) intervals than other
					// sections so you could for instance reduce the number of updates
					// a particular section sends out in a second because the data is
					// not that important compared to updated transformation data
					if (this._streamSyncSectionInterval && this._streamSyncSectionInterval[sectionId]) {
						// Check if the section interval has been reached
						this._streamSyncSectionDelta[sectionId] += ige._tickDelta;

						if (this._streamSyncSectionDelta[sectionId] >= this._streamSyncSectionInterval[sectionId]) {
							// Get the section data for this section id
							this.streamSectionData(sectionId);
							// Reset the section delta
							this._streamSyncSectionDelta[sectionId] = 0;
						}
					} else {
						// Get the section data for this section id
						this.streamSectionData(sectionId);
					}
				}

				if (this._streamSectionData !== undefined) {
					// Add the section start designator character. We do this
					// regardless of if there is actually any section data because
					// we want to be able to identify sections in a serial fashion
					// on receipt of the data string on the client
					// // sectionDataString += ige.network.stream._sectionDesignator;

					// Add any custom data to the stream string at this point

					streamData = this.encodedStreamData();

					// Remove any .00 from the string since we don't need that data
					// TODO: What about if a property is a string with something.00 and it should be kept?
					// // streamData = streamData.replace(this._floatRemoveRegExp, ',');

					// Store the data in cache in case we are asked for it again this tick
					// the update() method of the IgeEntity class clears this every tick
					this._streamDataCache = streamData;

					return streamData;
				}
			}
		}
	},

	encodedStreamData: function () {
		var data = this.id();
		return [data].concat(this._streamSectionData).join('&');
	},

	/* CEXCLUDE */

	/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// INTERPOLATOR
	/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/**
     * Calculates the current value based on the time along the
     * value range.
     * @param {Number} startValue The value that the interpolation started from.
     * @param {Number} endValue The target value to be interpolated to.
     * @param {Number} startTime The time the interpolation started.
     * @param {Number} currentTime The current time.
     * @param {Number} endTime The time the interpolation will end.
     * @return {Number} The interpolated value.
     */
	interpolateValue: function (startValue, endValue, startTime, currentTime, endTime) {
		var totalValue = endValue - startValue;
		var dataDelta = endTime - startTime;
		var offsetDelta = currentTime - startTime;
		var deltaTime = offsetDelta / dataDelta;

		// Clamp the current time from 0
		if (deltaTime < 0) {
        	deltaTime = 0;
		}

		return totalValue * deltaTime + startValue;
	},

	reconcileValue: function (startValue, endValue, startTime, currentTime, endTime) {
		var totalValue = endValue - startValue;
		var dataDelta = endTime - startTime;
		var offsetDelta = currentTime - startTime;
		var t = Math.abs(offsetDelta / dataDelta);
		var deltaTime = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad (acceleration until halfway, then deceleration)

		return totalValue * deltaTime + startValue;
	},

	/**
     * Processes the time stream for the entity.
     * @param {Number} renderTime The time that the time stream is
     * targeting to render the entity at.
     */
	_processTransform: function () {
		if (
		// prevent igePixi calling this function multiple times for a same entity
			this._lastTransformAt == ige._currentTime ||
            // entity has no body
            this._translate == undefined ||
            this._stats.currentBody == undefined ||
            // ignore server stream of my own unit's sprite-only item
            (this._stats.currentBody && this._stats.currentBody.type == 'spriteOnly' && (this.getOwnerUnit && this.getOwnerUnit()) == ige.client.selectedUnit)
		) {
			return;
		}

		// interpolate projectiles using data provided by physicsComponent. as snapshot data isn't streamed from server.
		var x = this._translate.x;
		var y = this._translate.y;
		var rotate = this._rotate.z;
		var prevKeyFrame = null;
		var nextKeyFrame = null;

		if (ige.nextSnapshot) {
			var nextTransform = ige.nextSnapshot[1][this.id()];
			if (nextTransform) {
				nextKeyFrame = [ige.nextSnapshot[0], nextTransform];
			}
		}

		// by default, prevTransform is where this unit currently is

		if (ige.prevSnapshot) {
			// Set variables up to store the previous and next data
			var prevTransform = ige.prevSnapshot[1][this.id()];
			if (prevTransform) {
				prevKeyFrame = [ige.prevSnapshot[0], prevTransform];
			}
		}

		// interpolate using client side's physics frames. (this doesn't use snapshot streamed from the server)
		// this is necessary, because physics don't run at 60 fps on clientside
		if (
			ige.physics && (
			// 1. we're using cspMovement (experimental) for my own unit OR
				(ige.game.cspEnabled && ige.client.selectedUnit == this) ||
                // 2. item-fired projectiles
                (this._category == 'projectile' && this._stats.sourceItemId != undefined && !this._streamMode)
			)
		) {
			if (this.nextPhysicsFrame) {
				if (this.prevPhysicsFrame) {
					// interpolate using prev/next physics key frames provided by physicsComponent
					x = this.interpolateValue(this.prevPhysicsFrame[1][0], this.nextPhysicsFrame[1][0], this.prevPhysicsFrame[0], ige._currentTime, this.nextPhysicsFrame[0]);
					y = this.interpolateValue(this.prevPhysicsFrame[1][1], this.nextPhysicsFrame[1][1], this.prevPhysicsFrame[0], ige._currentTime, this.nextPhysicsFrame[0]);

					if (this == ige.client.selectedUnit) {
						rotate = this.interpolateValue(this.prevPhysicsFrame[1][2], this.nextPhysicsFrame[1][2], this.prevPhysicsFrame[0], ige._currentTime, this.nextPhysicsFrame[0]);
					}

				} else {
					// unit is teleporting
					x = this.nextPhysicsFrame[1][0];
					y = this.nextPhysicsFrame[1][1];
					rotate = this.nextPhysicsFrame[1][2];
					// console.log("teleport")
				}

				// for debugging my unit's x-movement interpolation
			}
		}

		// interpolate using snapshots streamed from the server.
		if (prevTransform != undefined && nextTransform != undefined &&
            prevKeyFrame[0] != nextKeyFrame[0] &&
            prevKeyFrame[0] < ige.renderTime && ige.renderTime < nextKeyFrame[0]
		) {
			targetX = this.interpolateValue(prevTransform[0], nextTransform[0], prevKeyFrame[0], ige.renderTime, nextKeyFrame[0]);
			targetY = this.interpolateValue(prevTransform[1], nextTransform[1], prevKeyFrame[0], ige.renderTime, nextKeyFrame[0]);

			// a hack to prevent rotational interpolation suddnely jumping by 2 PI (e.g. 0.01 to -6.27)
			var startValue = prevKeyFrame[1][2];
			var endValue = nextKeyFrame[1][2];

			if (Math.abs(endValue - startValue) > Math.PI) {
				if (endValue > startValue) startValue += Math.PI * 2;
				else startValue -= Math.PI * 2;
			}

			if (this == ige.client.selectedUnit && this.angleToTarget != undefined && !isNaN(this.angleToTarget) && this._stats.controls && this._stats.controls.mouseBehaviour.rotateToFaceMouseCursor && this._stats.currentBody && !this._stats.currentBody.fixedRotation) {
				targetRotate = this.angleToTarget;
			} else {
				targetRotate = this.interpolateValue(startValue, endValue, prevKeyFrame[0], ige.renderTime, nextKeyFrame[0]);
			}

			// don't set lastServerStreamedPosition unless more than 500ms has passed since last teleport.
			// this prevents teleported position data getting overwritten by latest streamed snapshot
			// console.log("this.lastReconciledAt != prevKeyFrame[0]", this.lastReconciledAt, prevKeyFrame[0])
			if (this == ige.client.selectedUnit && this.lastReconciledAt != prevKeyFrame[0]) {
				this.lastServerStreamedPosition = [targetX, targetY, targetRotate];
			}

			// apply rubberbanding to all non-player entities when csp is enabled
			if (ige.physics && ige.game.cspEnabled && this != ige.client.selectedUnit) {
				xDiff = targetX - x;
				yDiff = targetY - y;
				x += xDiff / 2;
				y += yDiff / 2;
			} else if (!ige.physics || !ige.game.cspEnabled || this != ige.client.selectedUnit) {
				// if physics isn't set, or csp is disabled, use server-streamed data to move entities
				x = targetX;
				y = targetY;
			}
			rotate = targetRotate;

			if (this._debugEntity) {
				this._debugEntity.position.set(targetX, targetY);
				this._debugEntity.rotation = targetRotate;
				this._debugEntity.pivot.set(this._debugEntity.width / 2, this._debugEntity.height / 2);
			}

			// // for debugging my unit's x-movement interpolation
			// if (this == ige.client.selectedUnit) {
			// 	let distanceTraveled = x - this.previousX
			// 	let timeElapsed = (ige.renderTime-this.previousRenderTime).toFixed(0)
			// 	console.log(ige.snapshots.length, 'x', prevTransform[0], x.toFixed(0), '(' + distanceTraveled.toFixed(1) + ')', nextTransform[0],
			// 		'time', prevKeyFrame[0], ige.renderTime.toFixed(0), '(' + timeElapsed + 'ms '+ ((ige.renderTime - prevKeyFrame[0]) / (nextKeyFrame[0] - prevKeyFrame[0]) * 100).toFixed(0) +'%)', nextKeyFrame[0], "speed", (distanceTraveled/timeElapsed).toFixed(2)
			// 		)
			// 	this.previousX = x;
			// 	this.previousRenderTime = ige.renderTime;
			// }
		}

		// instantly rotate unit to mouse cursor
		if (this == ige.client.selectedUnit) {
			var ownerPlayer = ige.$(this._stats.ownerId);
			if (ownerPlayer && ownerPlayer.control && ownerPlayer.control.input) {
				var mouse = ownerPlayer.control.input.mouse;
				if (mouse) {
					this.angleToTarget = Math.atan2(mouse.y - this._translate.y, mouse.x - this._translate.x) + Math.radians(90);
					if (this.angleToTarget != undefined && !isNaN(this.angleToTarget) && this._stats.controls && this._stats.controls.mouseBehaviour.rotateToFaceMouseCursor && this._stats.currentBody && !this._stats.currentBody.fixedRotation) {
						rotate = this.angleToTarget;
					}
				}
			}
		}

		if (this._stats.isStunned == undefined || this._stats.isStunned != true) {
			this.rotateTo(0, 0, rotate);
		}
		this.translateTo(x, y, 0);

		this._lastTransformAt = ige._currentTime;
	},

	getAttributeBarContainer: function () {
		var self = this;
		var attributeContainerId = self._stats && self._stats.attributeBarContainer && self._stats.attributeBarContainer.id;

		if (attributeContainerId) {
			return ige.$(attributeContainerId);
		}

		return null;
	}
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = IgeEntity;
}
