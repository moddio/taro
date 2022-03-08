/*
 * The engine's crash component class.
 */

var PhysicsComponent = IgeEventingClass.extend({
	classId: 'PhysicsComponent',
	componentId: 'physics',

	init: function (entity, options) {
		// Check that the engine has not already started
		// as this will mess everything up if it has
		this.engine = 'CRASH';
		if (ige._state !== 0) {
			console.log('Cannot add box2d physics component to the ige instance once the engine has started!', 'error');
		}

		this.crash = new Crash();
		this.crash.rbush.toBBox = function (item) {
			item.minX = item.aabb.x1;
			item.minY = item.aabb.y1;
			item.maxX = item.aabb.x2;
			item.maxY = item.aabb.y2;

			return item;
		};
		this.totalBodiesCreated = 0;
		this.physicsTickDuration = 0;
		this.lastSecondAt = Date.now();
		this.totalDisplacement = 0;
		this.totalTimeElapsed = 0;
		this.avgPhysicsTickDuration = 0;

		var listener = function(a, b, res, cancel) {
			// console.log(res, cancel)
			// console.log(a, b)
			// console.log('player', a.pos.x, a.pos.y);
			if (b.data.entity._category == 'unit') {
				console.log('Oh my, we crashed!'/*, a.data*/);
				a.pos.x = a.lastPos.x;
				a.pos.y = a.lastPos.y;
				a.data.entity._translate.x = a.lastPos.x;
				a.data.entity._translate.y = a.lastPos.y;
				a.data.entity._velocity.x = 0;
				a.data.entity._velocity.y = 0;
			}
			/* else {
				console.log('enter region', b.data.entity._stats.id)
			} */
		};

		var contactDetails = function (a, b, res, cancel) {
			ige.trigger._beginContactCallback({
				m_fixtureA: {
					m_body: {
						_entity: a.data.entity,
					}
				},
				m_fixtureB: {
					m_body: {
						_entity: b.data.entity,
					}
				}
			});
		};

		this.crash.onCollision(contactDetails);

		this.crash.onCollision(listener);
	},

	createWorld: function () {
		console.log('create world');
		this._world = {};
		this._world.m_stack = [];
		this._world.m_bodies = [];
		this._world.m_contacts = [];
		this._world.m_joints = [];
		this._world.isLocked = function () { return false; };
	},

	/**
	 * Creates a Box2d body and attaches it to an IGE entity
	 * based on the supplied body definition.
	 * @param {IgeEntity} entity
	 * @param {Object} body
	 * @return {b2Body}
	 */
	createBody: function (entity, body, isLossTolerant) {
		if (entity.body) { return; }
		// console.log('CRASH BODY CREATION');
		this.totalBodiesCreated++;
		// body.fixtures.length is 1 for all objects in my game, can sometimes it be more then 1?
		var type = body.fixtures[0].shape.type;
		// console.log(body.fixtures[0].shape.type);

		var crashBody;
		var x = entity._translate.x;
		var y = entity._translate.y;
		// console.log(entity);
		var igeId = body.fixtures[0].igeId;
		if (type === 'circle') {
			var radius = entity._bounds2d.x / 2;
			// console.log('radius', radius)
			// entity.fixtures[0].shape.data = this.crash.Circle(new this.crash.Vector(x, y), radius, true, { igeId: igeId });
			crashBody = new this.crash.Circle(new this.crash.Vector(x, y), radius, false, { igeId: igeId, entity: entity });

			// console.log(crashBody);
			// later check if added to .__moved()
		}
		else if (type === 'rectangle') {
			var width = entity._bounds2d.x;
			var height = entity._bounds2d.y;
			// console.log('width and height', width, height, x, y, entity)
			crashBody = new this.crash.Box(new this.crash.Vector(x , y), width, height, false, { igeId: igeId, entity: entity, uid: Math.floor(Math.random() * 100) });
			crashBody.sat.setOffset ({x: -(width / 2), y: -(height / 2)});
			crashBody.sat.rotate (entity._rotate.z);
		}
		else {
			console.log('body shape is wrong');
			// added return here
			return;
		}
		// Store the entity that is linked to self body
		// crashBody._entity = entity;
		entity.body = body;
		// Add the body to the world with the passed fixture
		entity.body.fixtures[0].shape.data = crashBody;

		console.log('crash insert...', crashBody.data.entity._category, crashBody.data.igeId, crashBody.data.uid);
		this.crash.insert(entity.body.fixtures[0].shape.data);

		// temporary movement logic, we should add functions like setLinearVelocity for our crash bodies somewhere
		// entity.body._velocity = {x: 0, y: 0};
		entity.body.setLinearVelocity = function (info) {
			// console.log('set linear velocity run', info);
			entity._velocity.x = info.x;
			entity._velocity.y = info.y;
		};
		entity.addBehaviour('crash behaviour', entity._behaviourCrash, false);

		// return entity.fixtures[0].shape.data;
		return crashBody;
	},

	destroyBody: function (body, entity = null) {
		// I think we need this in case we're destroying a body not linked to an entity
		if (body.fixtures || (entity && entity.body)) {
			this.crash.remove(body.fixtures[0].shape.data);
		} else {
			console.log('failed to destroy body - body doesn\'t exist.');
		}
	},

	gravity: function (x, y) {
		// for now let's just set to 0,0
		console.log('Gravity temporarily unavailable...');
	},

	contactListener: function (cb1, cb2) {

	},

	start: function () {
		this.crash.checkAll();
		console.log('CrashComponent.start()');

		if (!this._active) {
			this._active = true;

			/*if (!this._networkDebugMode) {
				if (this._mode === 0) {
					// Add the box2d behaviour to the ige
					// console.log('starting box2d', this._entity.id(), this._entity._category);
					// this._entity.addBehaviour('box2dStep', this._behaviour);
				} else {
					// this._intervalTimer = setInterval(this._behaviour, 1000 / 60);
					// console.log('b2d start');
					// this._intervalTimer = setInterval(this._behaviour, ige._tickDelta);
				}
			}*/
		}
	},

	update: function () {
		let timeStart = ige.now;
		this.crash.check();
		ige._physicsFrames++;

		// Get stats for dev panel;
		var timeEnd = Date.now();
		this.physicsTickDuration += timeEnd - timeStart;

		if (timeEnd - this.lastSecondAt > 1000) {
			this.lastSecondAt = timeEnd;
			this.avgPhysicsTickDuration = this.physicsTickDuration / ige._fpsRate;
			this.totalDisplacement = 0;
			this.totalTimeElapsed =  0;
			this.physicsTickDuration = 0;
		}

	},

	/* setLinearVelocity: function () {
		console.log ('set linear velocity run');
	}, */

	staticsFromMap: function (mapLayer, callback) {
		// No idea what this does so we're going to comment it out
		// if (mapLayer == undefined) {
		// 	ige.server.unpublish('PhysicsComponent#51');
		// }

		if (mapLayer.map) {
			var tileWidth = ige.scaleMapDetails.tileWidth || mapLayer.tileWidth();
			var tileHeight = ige.scaleMapDetails.tileHeight || mapLayer.tileHeight();
			var rectArray; var rectCount; var rect;

			// Get the array of rectangle bounds based on the map's data
			rectArray = mapLayer.scanRects(callback);
			rectCount = rectArray.length;

			while (rectCount--) {
				rect = rectArray[rectCount];

				var defaultData = {
					translate: {
						x: rect.x * tileWidth,
						y: rect.y * tileHeight
					}
				};

				// we can chain these methods because they return the entity
				var wall = new IgeEntityPhysics(defaultData)
					.width(rect.width * tileWidth)
					.height(rect.height * tileHeight)
					.drawBounds(false)
					.drawBoundsData(false)
					.category('wall');

				// {copied comment}
				// walls must be created immediately because there isn't an actionQueue for walls

				ige.physics.createBody(wall, {
					type: 'static',
					linearDamping: 0,
					angularDamping: 0,
					allowSleep: true,
					fixtures: [{
						friction: 0.5,
						restitution: 0,
						shape: {
							type: 'rectangle'
						},
						filter: {
							// i am
							filterCategoryBits: 0x0001,
							// i collide with everything except other walls
							filterMaskBits: 0x0002 | 0x0004 | 0x0008 | 0x0010 | 0x0020
						},
						igeId: wall.id()
					}]
				});

				if (ige.isServer) {
					ige.server.totalWallsCreated++;
				}
			}
		} else {
			PhysicsComponent.prototype.log('Cannot extract static bodies from map data because passed map does not have a .map property.', 'error');
		}
	},

	// temprorary for testing crash engine
	getInfo: function () {
		console.log('TOTAL in rbush.all(): ', this.crash.rbush.all().length);
		// console.log('TOTAL in crash.__moved: ', this.crash.__moved.length);
	},

	/**
	 * Gets / sets the current engine to box2d scaling ratio.
	 * @param val
	 * @return {*}
	 */
	 scaleRatio: function (val) {
		if (val !== undefined) {
			this._scaleRatio = val;
			return this._entity;
		}

		return this._scaleRatio;
	},

	getBodiesInRegion: function (region) {
		var regionCollider;
		if (!region.body) {
			// this is a bad hack to not crash server on melee swing.
			regionCollider = new this.crash.Circle(new this.crash.Vector(region.x, region.y), region.width);
		} else {
			regionCollider = region.body.fixtures[0].shape.data;
		}

		var entities = [];
		var foundColliders = this.crash.search(regionCollider);
		var collider;

		for (collider of foundColliders) {
			var entity = ige.$(collider.data.igeId);
			if (entity) {
				entities.push(entity);
			}
		}

		return entities;
	},

	queueAction: function (action) {
		this._actionQueue.push(action);
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = PhysicsComponent; }
