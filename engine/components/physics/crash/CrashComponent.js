/*
 * The engine's crash component class.
 */

var PhysicsComponent = IgeEventingClass.extend({
	classId: 'PhysicsComponent',
	componentId: 'physics',

	init: function (entity, options) {
		// Check that the engine has not already started
		// as this will mess everything up if it has
		if (ige._state !== 0) {
			console.log('Cannot add box2d physics component to the ige instance once the engine has started!', 'error');
		}
	},

    /**
	 * Creates a Box2d body and attaches it to an IGE entity
	 * based on the supplied body definition.
	 * @param {IgeEntity} entity
	 * @param {Object} body
	 * @return {b2Body}
	 */
	createBody: function (entity, body, isLossTolerant) {
        console.log('CRASH BODY CREATION');
		this.totalBodiesCreated++;

        return ige.entity.physics.Circle (new crash.Vector(5,2),  10);
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
		
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = PhysicsComponent; }
