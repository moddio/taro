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
		// this.crash.Collider.prototype.setLinearVelocity = function (point) {
		// 	this.velocity = {
		// 		x: point.x,
		// 		y: point.y
		// 	};
		// 	console.log('this', this, 'setting linear velocity to: ', this.velocity);
		// };
		console.log('CRASH ENGINE INIT', this.crash);

		this._actionQueue = [];
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
	 * Creates a Crash Collider and attaches it to an IGE entity
	 * based on the supplied body definition.
	 * @param {IgeEntity} entity
	 * @param {Object} body
	 * @return {Collider}
	 */
	createBody: function (entity, body, isLossTolerant) {
		// console.log('CRASH BODY CREATION');
		this.totalBodiesCreated++;
		// body.fixtures.length is 1 for all objects in my game, can sometimes it be more then 1?
		var type = body.fixtures[0].shape.type;
		// console.log(body.fixtures[0].shape.type);
		// console.log(entity, body);
		// var crashBody;
		entity.body = body;

		var x = entity._translate.x;
		var y = entity._translate.y;
		var igeId = body.fixtures[0].igeId;
		if (type === 'circle') {
			var radius = entity._bounds2d.x;
			entity.body.fixtures[0].shape.data = new this.crash.Circle(new this.crash.Vector(x, y), radius, true, { igeId: igeId });
			// crashBody = this.crash.Circle(new this.crash.Vector(x, y), radius, true, { igeId: igeId });
		} else if (type === 'rectangle') {
			var width = entity._bounds2d.x;
			var height = entity._bounds2d.y;
			// crashBody = this.crash.Box(new this.crash.Vector(x, y), width, height, true, { igeId: igeId });
			entity.body.fixtures[0].shape.data = new this.crash.Box(new this.crash.Vector(x, y), width, height, true, { igeId: igeId });
		} else {
			console.log('body shape is wrong');
			// added return here
			return;
		}
		// Store the entity that is linked to self body
		//
		// This seems like too much data to store on a crash collider
		// We are already storing a reference to the entity in Collider.data.igeId
		//

		// crashBody._entity = entity;

		// Add the body to the world with the passed fixture
		//
		// I think this will remove all fixture information and we don't want that
		//

		// Let's do this instead for now
		// entity.body.fixtures[0].shape.data = crashBody;
		// temporary movement logic, we should add functions like setLinearVelocity for our crash bodies somewhere
		// crashBody.setLinearVelocity = function (info) {
		// 	console.log('set linear velocity run', info);
		// };

		return entity.body.fixtures[0].shape.data;
		// return crashBody;
	},

	destroyBody: function (entity, body) {
		// I think we need this in case we're destroying a body not linked to an entity
		if (body || (entity && entity.body)) {
			this.crash.remove(entity.body.fixtures[0].shape.data);
			entity.body = null;
		} else {
			PhysicsComponent.prototype.log('failed to destroy body - body doesn\'t exist.');
		}
	},

	gravity: function (x, y) {
		// for now let's just set to 0,0
		console.log('Gravity temporarily unavailable...');
	},

	contactListener: function (cb1, cb2) {

	},

	update: function () {

	},

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
		console.log('TOTAL CRASH BODIES', this.crash.all().length);
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