var AbilityComponent = IgeEntity.extend({
	classId: 'AbilityComponent',
	componentId: 'ability',

	init: function (entity, options) {
		var self = this;
		self._entity = entity
	},

	moveUp: function () {
		if (this._entity.direction) {
			this._entity.direction.y = -1
			// entity.body.setLinearVelocity(new IgePoint3d(velocityX, velocityY, 0));
		}
	},

	moveLeft: function () {
		if (this._entity.direction) {
			this._entity.direction.x = -1
			// this._entity.body.setLinearVelocity(new IgePoint3d(velocityX, velocityY, 0));
		}
	},

	moveDown: function () {
		if (this._entity.direction) {
			this._entity.direction.y = 1
			// this._entity.body.setLinearVelocity(new IgePoint3d(velocityX, velocityY, 0));
		}
	},

	moveRight: function () {
		if (this._entity.direction) {
			this._entity.direction.x = 1
			// this._entity.body.setLinearVelocity(new IgePoint3d(velocityX, velocityY, 0));
		}
	},

	stopMovingY: function () {
		if (this._entity.direction) {
			this._entity.direction.y = 0

			// only velocity-based units will stop immediately
			// if (this._entity._stats.controls.movementMethod == 'velocity') {
			// 	this._entity.body.setLinearVelocity(new IgePoint3d(this._entity.body.getLinearVelocity().x, 0, 0));
			// }
		}
	},

	stopMovingX: function () {
		if (this._entity.direction) {
			this._entity.direction.x = 0

			// only velocity-based units will stop immediately
			// if (this._entity._stats.controls.movementMethod == 'velocity') {
			// 	this._entity.body.setLinearVelocity(new IgePoint3d(0, this._entity.body.getLinearVelocity().y, 0));
			// }
		}
	},

	startUsingItem: function () {

		var item = this._entity.getCurrentItem();
		if (item) {
			item.startUsing();
		}
	},

	stopUsingItem: function () {
		var item = this._entity.getCurrentItem();
		if (item) {
			item.stopUsing();
		}
	},

	pickupItem: function () {
		var self = this
		if (ige.isServer) {
			var region = {
				x: self._entity._translate.x - self._entity._bounds2d.x / 2,
				y: self._entity._translate.y - self._entity._bounds2d.y / 2,
				width: self._entity._bounds2d.x,
				height: self._entity._bounds2d.y
			};

			var entities = ige.physics.getBodiesInRegion(region).filter(({ _category }) => _category === "item");
			// pickup ownerLess items
			var unit = self._entity;
			unit.reasonForFailingToPickUpItem = undefined;
			
			if (unit && unit._category == 'unit') {
				for (var i = 0; i < entities.length; i++) {
					var item = entities[i];
					if (item && item._category === 'item' && !item.getOwnerUnit()) {
						// only pick 1 item up at a time
						if (unit.pickUpItem(item)) {
							return;
						}
					}
				}
				if (unit.reasonForFailingToPickUpItem) {
					unit.streamUpdateData([{ setFadingText: unit.reasonForFailingToPickUpItem, color: "red" }]);
				}
			}
		}
	},

	dropItem: function () {
		var self = this;

		if (self._entity && !isNaN(self._entity._stats.currentItemIndex)) {
			var item = self._entity.dropItem(self._entity._stats.currentItemIndex)
			if (item) {
				// slightly push item in front of the unit
				var vector = {
					x: (20 * Math.sin(self._entity._rotate.z)),
					y: -(20 * Math.cos(self._entity._rotate.z))
				};
				item.applyForce(vector.x, vector.y);
			}
			
		}
	},

	cast: function (handle) {
		var self = this

		if (handle == undefined)
			return;

		var ability = null;

		if (handle.cost && handle.scriptName) {
			ability = handle;
		}
		else {
			ability = ige.game.data.abilities[handle]
		}

		var player = self._entity.getOwner();
		if (ability != undefined) {
			var canAffordCost = true;

			if (ability.cost && ability.cost.unitAttributes) {
				// AbilityComponent.prototype.log("ability cost", ability.cost.cast)
				for (attrName in ability.cost.unitAttributes) {
					var cost = ability.cost.unitAttributes[attrName];

					if (cost && (self._entity._stats.attributes[attrName] == undefined || self._entity._stats.attributes[attrName].value < cost)) {
						canAffordCost = false
						break;
					}
				}
			}
			if (ability.cost && ability.cost.playerAttributes && canAffordCost && player && player._stats) {
				// AbilityComponent.prototype.log("ability cost", ability.cost.cast)
				for (attrName in ability.cost.playerAttributes) {
					var cost = ability.cost.playerAttributes[attrName];
					// AbilityComponent.prototype.log("attribute value", attrName, self._entity._stats.attributes[attrName])
					if (cost && (player._stats.attributes[attrName] == undefined ||
						player._stats.attributes[attrName].value < cost)
					) {
						canAffordCost = false
						break;
					}
				}
			}
			if (canAffordCost) {
				// process cost
				var unitAttr = { attributes: {} };
				if (ability.cost && ability.cost.unitAttributes) {
					for (attrName in ability.cost.unitAttributes) {
						if (self._entity._stats.attributes[attrName]) {
							self._entity._stats.attributes[attrName].value -= ability.cost.unitAttributes[attrName]
							unitAttr.attributes[attrName] = self._entity._stats.attributes[attrName].value;
						}
					}
				}
				var playerAttr = { attributes: {} };
				if (ability.cost && ability.cost.playerAttributes && player && player._stats) {
					for (attrName in ability.cost.playerAttributes) {
						if (player._stats.attributes[attrName]) {
							player._stats.attributes[attrName].value -= ability.cost.playerAttributes[attrName];
							playerAttr.attributes[attrName] = player._stats.attributes[attrName].value;
						}
					}
				}

				if (ige.isServer || ige.isClient && ige.physics) {
					if (ability.scriptName && ability.scriptName != '') {
						if (ige.game.data.scripts[ability.scriptName]) {
							AbilityComponent.prototype.log("ability cast: running script " + ige.game.data.scripts[ability.scriptName].name + " " + ability.scriptName)
						}

						if (ige.isServer) {
							//calling stream for unit because there is delay in transferring attributes data 
							if (Object.keys(unitAttr.attributes || []).length > 0) {
								self._entity.streamUpdateData(unitAttr)
							}

							if (Object.keys(playerAttr.attributes || []).length > 0) {
								player.streamUpdateData(playerAttr)
							}
						}

						ige.game.lastCastingUnitId = self._entity.id()
						ige.script.runScript(ability.scriptName, {
							triggeredBy: {
								unitId: self._entity.id()
							}
						})
					}
				}

			}
			else {
				AbilityComponent.prototype.log("can't afford cost")
			}

		}
		else {
			AbilityComponent.prototype.log("undefined ability " + handle)
		}

	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = AbilityComponent; }