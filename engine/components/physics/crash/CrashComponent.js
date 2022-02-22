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
		console.log('CRASH ENGINE INIT', this.crash);
	},

	createWorld: function () {
		console.log('create world');
		this._world = {};
		this._world.m_stack = [];
		this._world.m_bodies = [];
		this._world.m_contacts = [];
		this._world.m_joints = [];
	},

	/**
	 * Creates a Box2d body and attaches it to an IGE entity
	 * based on the supplied body definition.
	 * @param {IgeEntity} entity
	 * @param {Object} body
	 * @return {b2Body}
	 */
	createBody: function (entity, body, isLossTolerant) {
		// console.log('CRASH BODY CREATION');
		this.totalBodiesCreated++;
		// body.fixtures.length is 1 for all objects in my game, can sometimes it be more then 1?
		var type = body.fixtures[0].shape.type;
		// console.log(body.fixtures[0].shape.type);
		// console.log(entity, body);
		var crashBody;
		var x = entity._translate.x;
		var y = entity._translate.y;
		var igeId = body.fixtures[0].igeId;
		if (type === 'circle') {
			var radius = entity._bounds2d.x;
			// entity.fixtures[0].shape.data = this.crash.Circle(new this.crash.Vector(x, y), radius, true, { igeId: igeId });
			crashBody = this.crash.Circle(new this.crash.Vector(x, y), radius, true, { igeId: igeId });
		}
		else if (type === 'rectangle') {
			var width = entity._bounds2d.x;
			var height = entity._bounds2d.y;
			// entity.fixtures[0].shape.data = this.crash.Box(new this.crash.Vector(x, y), width, height, true, { igeId: igeId });
			crashBody = this.crash.Box(new this.crash.Vector(x, y), width, height, true, { igeId: igeId });
		}
		else {
			console.log('body shape is wrong');
			// added return here
			return;
		}
		// Store the entity that is linked to self body
		crashBody._entity = entity;

		// Add the body to the world with the passed fixture
		entity.body = crashBody;

		//temporary movement logic, we should add functions like setLinearVelocity for our crash bodies somewhere
		crashBody.setLinearVelocity =  function (info) {
			console.log ('set linear velocity run', info);
		};

		// return entity.fixtures[0].shape.data;
		return crashBody;
	},

	gravity: function (x, y) {
		// for now let's just set to 0,0
		console.log('Gravity temporarily unavailable...');
	},

	contactListener: function (cb1, cb2) {

	},

	update: function () {

	},

	/* setLinearVelocity: function () {
		console.log ('set linear velocity run');
	}, */

	staticsFromMap: function () {

	},

	// temprorary for testing crash engine
	getInfo: function() {
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
		var regionCollider = region.fixtures[0].shape.data;
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
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = PhysicsComponent; }
