/**
 * Creates a new entity with crash integration.
 */
var IgeEntityPhysics = IgeEntity.extend({
	classId: 'IgeEntityPhysics',

	init: function (defaultData = {}) {
		IgeEntity.prototype.init.call(this, defaultData);
		var self = this;

		// this._b2dRef = ige.physics;

		if (ige.isClient) {
			self.addComponent(IgeAnimationComponent);
			// don't create body on clientside if CSP is disabled
		}

		// Check if crash is enabled in the engine
		/* if (ige.isServer && ige.physics) {
			if (!this._b2dRef._networkDebugMode) {
				// Store the existing transform methods
				this._translateToProto = this.translateTo;
				this._translateByProto = this.translateBy;
				this._rotateToProto = this.rotateTo;
				this._rotateByProto = this.rotateBy;
				// Take over the transform methods
				this.translateTo = this._translateTo;
				this.translateBy = this._translateBy;
				this.rotateTo = this._rotateTo;
				this.rotateBy = this._rotateBy;
			} else {
				this._translateToProto = function () { };
				this._translateByProto = function () { };
				this._rotateToProto = function () { };
				this._rotateByProto = function () { };
				this._updateProto = this.update;
				// Make sure box2d is kept up to date by the engine
				// this.update = this._update;
			}
			this.jointsAttached = {};
			this.isOutOfBounds = false;
		} */
		if (ige.isServer && ige.physics) {
			this._translateToProto = this.translateTo;
			this._translateByProto = this.translateBy;
			this._rotateToProto = this.rotateTo;
			this._rotateByProto = this.rotateBy;
			// Take over the transform methods
			this.translateTo = this._translateTo;
			this.translateBy = this._translateBy;
			this.rotateTo = this._rotateTo;
			this.rotateBy = this._rotateBy;
		}

		// this._actionQueue = [];

		if (ige.isClient) {
			self.addComponent(IgePixiTexture);
			self.addComponent(IgePixiAnimation);
			self.addComponent(IgePixiCollider);
		}
	},

	updateBody: function (defaultData, isLossTolerant) {
		var self = this;

		// console.log("updatebody", defaultData, this._stats.currentBody.type)

		body = this._stats.currentBody;
		if (!body) {
			return;
		}

		if (body.type === 'none' || body.type === 'spriteOnly') {
			self.destroyBody();
			this.body = body;
			return;
		}

		this.width(parseFloat(body.width) * this._scale.x);
		this.height(parseFloat(body.height) * this._scale.y);

		var filterCategoryBits = 0x0002;
		if (this._category === 'units') {
			filterCategoryBits = 0x0002;
		} else if (this._category === 'debris') {
			filterCategoryBits = 0x0004;
		} else if (this._category === 'item') {
			filterCategoryBits = 0x0008;
		} else if (this._category === 'projectile') {
			filterCategoryBits = 0x0010;
		} else if (this._category === 'region') {
			filterCategoryBits = 0x0020;
		} else if (this._category === 'sensor') {
			filterCategoryBits = 0x0040;
		}

		var collidesWith = body.collidesWith || {};
		// this mask bit are hex so it wonnt incremented by power of 2
		var body = {
			type: body.type || 'dynamic',
			linearDamping: parseFloat(body.linearDamping) || 0,
			angularDamping: parseFloat(body.angularDamping) || 0,
			allowSleep: false,
			bullet: body.bullet,
			fixedRotation: body.fixedRotation,
			affectedByGravity: body.affectedByGravity != false, // we want undefined to be considered as true for backward compatibility
			fixtures: [{
				density: body.fixtures ? parseFloat(body.fixtures[0].density) : 0,
				friction: body.fixtures ? parseFloat(body.fixtures[0].friction) : 0,
				restitution: body.fixtures ? body.fixtures[0].restitution : 0,
				isSensor: body.fixtures ? (body.fixtures[0].isSensor || false) : false,
				filter: {
					filterGroupIndex: 0,
					filterCategoryBits: filterCategoryBits,
					filterMaskBits: ((collidesWith.walls) ? 0x0001 : 0) |
						((collidesWith.units) ? 0x0002 : 0) |
						((collidesWith.debris) ? 0x0004 : 0) |
						((collidesWith.items) ? 0x0008 : 0) |
						((collidesWith.projectiles) ? 0x0010 : 0) |
						((this._category != 'sensor') ? 0x0020 : 0) | // all entities aside from sensor will collide with regions
						((this._category == 'unit' || this._category == 'item') ? 0x0040 : 0) // units & items will collide with sensors

				},
				shape: {
					type: (body.fixtures && body.fixtures[0] && body.fixtures[0].shape && body.fixtures[0].shape.type) ? body.fixtures[0].shape.type : 'rectangle',
					data: (body.fixtures && body.fixtures[0] && body.fixtures[0].shape && body.fixtures[0].shape.data) ? body.fixtures[0].shape.data : undefined
				},
				igeId: this.id() // in box2dbody, add reference to this entity
			}]
		};

		// console.log("collidesWith", this._category, filterCategoryBits, collidesWith, body)

		this.physicsBody(body, isLossTolerant);
		// if (this._category === 'item') {
		//     this.previousState = this._stats && this._stats.states && this._stats.states[this._stats.stateId] || {};
		//     console.log('setting previous sate', this.previousState);
		// }
		// if initialTranform variable's provided, then transform this entity immediately after body creation
		if (defaultData) {
			var rotate = defaultData.rotate;

			// immediately apply rotate.z if facingAngle is assigned
			if (!isNaN(rotate)) {
				// console.log("rotate ", defaultData.rotate)
				// if (isLossTolerant)
				//     this.rotateToLT(rotate);
				// else
				this.rotateTo(0, 0, rotate);
			}

			if (defaultData.translate) {
				var x = defaultData.translate.x;
				var y = defaultData.translate.y;

				// immediately translate entity if position is assigned
				if (!isNaN(x) && !isNaN(y)) {
					// if (isLossTolerant)
					//     this.translateToLT(x, y, 0)
					// else
					this.translateTo(x, y, 0);
				}
			}

			// immediately apply speed if assigned
			if (defaultData.velocity && !isNaN(defaultData.velocity.x) && !isNaN(defaultData.velocity.y)) {
				switch (defaultData.velocity.deployMethod) {
					case 'applyForce':
						this.applyForce(defaultData.velocity.x, defaultData.velocity.y);
						break;

					case 'applyImpulse':
						this.applyImpulse(defaultData.velocity.x, defaultData.velocity.y);
						break;

					case 'setVelocity':
					default:
						this.setLinearVelocity(defaultData.velocity.x, defaultData.velocity.y, 0, isLossTolerant);
						break;
				}
			}
		}
	},

	/**
	 * Gets / sets the box2d body's active flag which determines
	 * if it will be included as part of the physics simulation
	 * or not.
	 * @param {Boolean=} val Set to true to include the body in
	 * the physics simulation or false for it to be ignored.
	 * @return {*}
	 */
	box2dActive: function (val) {
		if (this.body) {
			if (val !== undefined) {
				this.body.setActive(val);
				return this;
			}

			return this.body.isActive();
		}

		return this;
	},

	/**
	 * Gets / sets the physics body definition. When setting the
	 * definition the physics body will also be created automatically
	 * from the supplied definition.
	 * @param def
	 * @return {*}
	 */
	physicsBody: function (def, isLossTolerant) {
		if (def) {
			this.bodyDef = def;

			// def object example
			/* {
				type: 'dynamic',
				linearDamping: 0,
				angularDamping: 0,
				allowSleep: false,
				bullet: true,
				fixedRotation: true,
				affectedByGravity: true,
				fixtures: [
				  {
					density: 0,
					friction: 0,
					restitution: 0,
					isSensor: true,
					filter: [Object],
					shape: [Object],
					igeId: '23b8f525'
				  }
				]
			  } */

			// console.log('crash body', def);

			// Check that the crash component exists
			if (ige.physics && !this.body) {
				// if (isLossTolerant) {
					// crash havent createBody, so we need write it for crash
					ige.physics.createBody(this, def, isLossTolerant);
				/* } else {
					this.destroyBody();
					// will we use queueAction?
					ige.physics.queueAction({ type: 'createBody', entity: this, def: def });
				} */
			} else {
				// IgeEntityBox2d.prototype.log('You are trying to create a box2d entity but you have not added the box2d component to the ige instance!', 'error');
			}

			return this;
		}

		return this.bodyDef;
	},

	_behaviourCrash: function () {
		// update position based on its velocity, collision, and damping
		if ((Math.floor(Math.abs(this._velocity.x)) != 0 || Math.floor(Math.abs(this._velocity.y)) != 0) && this.body.type != 'spriteOnly') {
			this.body.fixtures[0].shape.data.move(this._velocity.x, this._velocity.y);
			var damping = this.body.linearDamping;
			if (damping === 0) damping = 1;
			this._velocity.x = this._velocity.x / damping;
			this._velocity.y = this._velocity.y / damping;

			this._translate.x = this.body.fixtures[0].shape.data.pos.x;
			this._translate.y = this.body.fixtures[0].shape.data.pos.y;
		}
	},

	destroyBody: function () {
		// IgeEntityBox2d.prototype.log('destroyBody');
		if (ige.physics) {
			ige.physics.destroyBody(this.body, this);
		}
		// ige.physics && ige.physics.queueAction({ type: 'destroyBody', entity: this, body: this.body });
	},
	/**
	 * Gets / sets the box2d body's gravitic value. If set to false,
	 * this entity will not be affected by gravity. If set to true it
	 * will be affected by gravity.
	 * @param {Boolean=} val True to allow gravity to affect this entity.
	 * @returns {*}
	 */
	gravitic: function (val) {
		if (this.body) {
			if (val !== undefined) {
				this.body.m_nonGravitic = !val;
				this.body.m_gravityScale = !val ? 0 : 1;
				// this.bodyDef.gravitic = val;

				// Wake up the body
				this.body.setAwake(true);
				return this;
			}

			return !this.body.m_nonGravitic;
		}
	},

	//on: function () {
		// if (arguments.length === 3) {
		// 	var evName = arguments[0];
		// 	var target = arguments[1];
		// 	var callback = arguments[2];
		// 	var type;

		// 	switch (target.substr(0, 1)) {
		// 		case '#':
		// 			type = 0;
		// 			break;

		// 		case '.':
		// 			type = 1;
		// 			break;
		// 	}

		// 	target = target.substr(1, target.length - 1);

		// 	switch (evName) {
		// 		case 'collisionStart':
		// 			this._collisionStartListeners = this._collisionStartListeners || [];
		// 			this._collisionStartListeners.push({
		// 				type: type,
		// 				target: target,
		// 				callback: callback
		// 			});

		// 			if (!this._contactListener) {
		// 				// Setup contact listener
		// 				this._contactListener = this._setupContactListeners();
		// 			}
		// 			break;

		// 		case 'collisionEnd':
		// 			this._collisionEndListeners = this._collisionEndListeners || [];
		// 			this._collisionEndListeners.push({
		// 				type: type,
		// 				target: target,
		// 				callback: callback
		// 			});

		// 			if (!this._contactListener) {
		// 				// Setup contact listener
		// 				this._contactListener = this._setupContactListeners();
		// 			}
		// 			break;

		// 		default:
		// 			// IgeEntityBox2d.prototype.log(`Cannot add event listener, event type ${evName} not recognised`, 'error');
		// 			break;
		// 	}
		// } else {
		// 	IgeEntity.prototype.on.apply(this, arguments);
		// }
	//},

	/*off: function () {
		if (arguments.length === 3) {

		} else {
			IgeEntity.prototype.off.apply(this, arguments);
		}
	},*/

	// move entity in front of the unit, and then create joint between them
	/*attachTo: function (entityB, anchorA, anchorB) {
		// Check if the entity has a box2d body attached
		// and if so, is it updating or not
		for (entityId in this.jointsAttached) {
			this.detachEntity(entityId);
		}
		var self = this;
		/*ige.physics.queueAction({
			type: 'createJoint',
			entityA: self,
			entityB: entityB,
			anchorA: anchorA,
			anchorB: anchorB
		});*/
	//},

	detachEntity: function (entityId) {
		console.log('detach entity is not working now')
		/*var attachedEntity = ige.$(entityId);
		if (entityId && attachedEntity) {*/
			// IgeEntityBox2d.prototype.log(`detachEntity ${this._stats.name} ${attachedEntity._stats.name}`);

			/*ige.physics.queueAction({
				type: 'destroyJoint',
				entityA: this,
				entityB: attachedEntity
			});
		}*/
	},
	applyTorque: function (torque) {
		console.log('apply torque is disabled for now')
		//if (ige.physics._world.isLocked() || this.body == undefined) {
			/*this.queueAction({
				type: 'applyTorque',
				torque: torque
			});*/
		/*} else {
			//this.applyTorqueLT(torque);
		}*/
	},

	setLinearVelocity: function (x, y, z, isLossTolerant) {
		if ((this.body != undefined)) {
			ige.physicsTickCount++;
			if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
				// client side's predicted physics is weaker than the server's, so buff it up!
				// if (ige.isClient && this == ige.client.selectedUnit) {
				//     x *= 1.2737
				//     y *= 1.2737
				// }
				this.body.setLinearVelocity(new IgePoint3d(x, y, 0));
			}
		} 
	},

	// lossless applyForce
	applyForce: function (x, y) {
		console.log('apply force is disabled for now')
		// if body doesn't exist yet, queue
		/*if (!ige.physics) return;

		if (!ige.physics._world.isLocked() && this.body != undefined) {
			//this.applyForceLT(x, y);
		} */
	},

	// lossless applyForce
	applyImpulse: function (x, y) {
		console.log('apply impulse is disabled for now')
		// if body doesn't exist yet, queue

		/*if (!ige.physics._world.isLocked() && this.body != undefined) {
			this.applyImpulseLT(x, y);
		}*/
	},

	/*_setupContactListeners: function () {
		var self = this;

		ige.physics.contactListener(
			// Listen for when contact's begin
			function (contact) {
				// Loop the collision listeners and check for a match
				var arr = self._collisionStartListeners;

				if (arr) {
					self._checkContact(contact, arr);
				}
			},
			// Listen for when contact's end
			function (contact) {
				// Loop the collision listeners and check for a match
				var arr = self._collisionEndListeners;

				if (arr) {
					self._checkContact(contact, arr);
				}
			}
		);
	},*/

	// _checkContact: function (contact, arr) {
	// 	var self = this;
	// 	var arrCount = arr.length;
	// 	var otherEntity;
	// 	var listener;
	// 	var i;

	// 	if (contact.igeEntityA()._id === self._id) {
	// 		otherEntity = contact.igeEntityB();
	// 	} else if (contact.igeEntityB()._id === self._id) {
	// 		otherEntity = contact.igeEntityA();
	// 	} else {
	// 		// This contact has nothing to do with us
	// 		return;
	// 	}

	// 	for (i = 0; i < arrCount; i++) {
	// 		listener = arr[i];

	// 		if (listener.type === 0) {
	// 			// Listener target is an id
	// 			if (otherEntity._id === listener.target) {
	// 				// Contact with target established, fire callback
	// 				listener.callback(contact);
	// 			}
	// 		}

	// 		if (arr[i].type === 1) {
	// 			// Listener target is a category
	// 			if (otherEntity._category === listener.target) {
	// 				// Contact with target established, fire callback
	// 				listener.callback(contact);
	// 			}
	// 		}
	// 	}
	// },

	/**
	 * Takes over translateTo calls and processes box2d movement as well.
	 * @param x
	 * @param y
	 * @param z
	 * @return {*}
	 * @private
	 */
	_translateTo: function (x, y) {
		if (isNaN(x) || isNaN(y)) {
			return;
		}
		this._translateToProto(x, y);

		if (ige.isServer) {
			if (this.body) {
				if (this._hasMoved && this.body.type != 'spriteOnly') {
					// console.log('crash translate to', x, y);
					this.translateColliderTo(x, y);
				}
			} 
		}

		return this;
	},

	/**
	 * Takes over translateBy calls and processes box2d movement as well.
	 * @param x
	 * @param y
	 * @private
	 */
	_translateBy: function (x, y, z) {
		this._translateTo(this._translate.x + x, this._translate.y + y);
	},

	/**
	 * Takes over translateTo calls and processes box2d movement as well.
	 * @param x
	 * @param y
	 * @param z
	 * @return {*}
	 * @private
	 */
	_rotateTo: function (x, y, z) {
		if (isNaN(x) || isNaN(y) || isNaN(z)) {
			return;
		}
		// Call the original method
		this._rotateToProto(x, y, z);

		body = this._stats.currentBody;
		// we have to take this._hasMoved out of the conditional to apply rotations on another body
		if (ige.isServer && body && body.type !== 'none' && body.type !== 'spriteOnly') {
			if (this.body) {
				// console.log("this.body", this.body)
				this.rotateCollider(z);
			}
		}

		return this;
	},

	_scaleTexture: function () {
		var self = this;
		var currentState = this._stats.states && this._stats.states[this._stats.stateId] || { body: 'none' };
		var body = {};
		if (!currentState) {
			var defaultStateId = self.getDefaultStateId();
			currentState = self._stats.states && self._stats.states[defaultStateId] || { body: 'none' };
		}
		if (currentState && this._stats.bodies) {
			body = this._stats.bodies[currentState.body];
		}
		// console.log(self._stats.name,'->',self._stats.scale)
		var newWidth = (body && body.width || 1) * (self._stats.scale);
		var newHeight = (body && body.height || 1) * (self._stats.scale);

		self.width(newWidth, false);
		self.height(newHeight, false);

		// var attributeBarContainer = self.getAttributeBarContainer();
		// if (attributeBarContainer) {
		//     attributeBarContainer.setContainerWidth(newWidth);
		// }
	},

	/*_scaleBox2dBody: function (scale) {
		var self = this;
		var body = this._stats.currentBody;

		if (!body) {
			return;
		}

		var shapeType = body.fixtures[0].shape && body.fixtures[0].shape.type || 'rectangle';
		var shapeData = {};

		switch (shapeType) {
			case 'circle': {
				var normalizer = 0.5;
				shapeData.radius = body.width * (scale) * normalizer;
				break;
			}
			case 'rectangle': {
				var normalizer = 0.45;
				shapeData.width = body.width * (scale) * normalizer;
				shapeData.height = body.height * (scale) * normalizer;
				break;
			}
		}

		body.fixtures[0].shape.data = shapeData;
		self.updateBody();
	},*/

	/**
	 * Takes over translateBy calls and processes box2d movement as well.
	 * @param x
	 * @param y
	 * @param z
	 * @private
	 */
	_rotateBy: function (x, y, z) {
		this._rotateTo(this._rotate.x + x, this._rotate.y + y, this._rotate.z + z);
		// this.body.setAngle(this._rotate.z + z);
		// this.body.setAwake(true);
	},

	/**
	 * Purely for networkDebugMode handling, ensures that an entity's transform is
	 * not taken over by the physics simulation and is instead handled by the engine.
	 * @param ctx
	 * @private
	 */
	/*_update: function (ctx) {
		// Call the original method
		this._updateProto(ctx);

		this._translateTo(this._translate.x, this._translate.y, this._translate.z, '_update');
		this._rotateTo(this._rotate.x, this._rotate.y, this._rotate.z);

		// IgeEntity.prototype.update.call(this, ctx);
	},*/

	/**
	 * If true, disabled box2d debug shape drawing for this entity.
	 * @param {Boolean} val
	 */
	/*box2dNoDebug: function (val) {
		if (val !== undefined) {
			this._box2dNoDebug = val;
			return this;
		}

		return this._box2dNoDebug;
	},*/

	remove: function () {
		// if (this.body) {
		//     this.queueAction({ type: "destroy" });
		// }
		// else {
		//     this.destroy();
		// }

		this._isBeingRemoved = true;
		this.destroy();

		if (this.body) {
			ige.physics.destroyBody(this.body);
		}

		if (ige.isClient) {
			this.clearAllPointers();
		}
	},

	/**
	 * Destroys the physics entity and the box2d body that
	 * is attached to it.
	 */
	destroy: function () {
		this._alive = false;
		this.destroyBody();
		IgeEntity.prototype.destroy.call(this);
		// delete this._actionQueue;
	},

	translateColliderTo: function (x, y) {
		// console.log('moveTo');
		this.body.fixtures[0].shape.data.moveTo(x, y);
	},

	rotateCollider: function (angle) {
		if (this.body.fixtures[0].shape.data && this.body.fixtures[0].shape.type != 'circle') {
			// console.log(Object.getPrototypeOf(this.body.fixtures[0].shape.data).rotate);
			this.body.fixtures[0].shape.data.rotate(angle * -1);
			// var sat = this.body.fixtures[0].shape.data.sat;
			// console.log(angle);
			// var data = { calcPoints: [], points: [], offset: sat.offset };
			// for (var i = 0; i < sat.points.length; i++) {
			// 	data.calcPoints.push(sat.calcPoints[i]);
			// 	data.points.push(sat.points[i]);
			// }
			// console.log(data.offset);
			// for (i = 0; i < sat.points.length; i++) {
			// 	console.log(sat);
			// 	console.log('calcPoint: ', data.calcPoints[i]);
			// 	console.log('atan2 calcPoint: ', Math.atan2(data.calcPoints[i].y, data.calcPoints[i].x));

			// }
		}
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgeEntityPhysics; }
