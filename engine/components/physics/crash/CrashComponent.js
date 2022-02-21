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

    createWorld: function (){
        console.log ('create world');
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
		let shape = body.fixtures[0].shape.type;
		// console.log(body.fixtures[0].shape.type);
		// console.log(entity, body);
		let crashBody = {};
		let x = entity._translate.x;
		let y = entity._translate.y;
		let data = body.fixtures[0].igeId;
		if (shape === 'circle') {
			let radius = entity._bounds2d.x;
			crashBody = this.crash.Circle(new this.crash.Vector(x,y), radius, true, [data]);
		}
		else if (shape === 'rectangle') {
			let width = entity._bounds2d.x;
			let height = entity._bounds2d.y;
			crashBody = this.crash.Box(new this.crash.Vector(x,y), width, height, true, [data]);
		}
		else {
			console.log('body shape is wrong');
		}
		
		
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
	
	staticsFromMap: function () {
		
	},

	//temprorary for testing crash engine
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
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = PhysicsComponent; }
