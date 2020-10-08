var TriggerComponent = IgeEntity.extend({
	classId: 'TriggerComponent',
	componentId: 'trigger',

	init: function () {
		var self = this
		if (ige.isServer || (ige.isClient && ige.physics)) {
			self._enableContactListener();
		}
	},

	// Listen for when contact's begin
	_beginContactCallback: function (contact) {
		var entityA = contact.m_fixtureA.m_body._entity
		var entityB = contact.m_fixtureB.m_body._entity
		if (!entityA || !entityB)
			return;

		if (entityA._stats && entityB._stats) {
			
			// a unit's sensor detected another unit
			
			if (entityB._category == 'sensor') {
				var tempEntity = entityA;
				entityA = entityB;
				entityB = tempEntity;
			}
			if (entityA._category == 'sensor') {
				var ownerUnit = entityA.getOwnerUnit();
				if (ownerUnit) {
					if (entityB._category == 'unit') {
						if (ownerUnit && ownerUnit != entityB) {
							ownerUnit.ai.registerSensorDetection(entityB)
						}
					} else if (entityB._category == 'item') {
						ige.trigger.fire("whenItemEntersSensor", {
							unitId: ownerUnit.id(),
							sensorId: entityA.id(),
							itemId: entityB.id()
						});
					}
				}
				return;
			}
			

			// ensure entityA is prioritized by this order: region, unit, item, projectile, wall
			// this is to ensure that contact event is fired once when two entities touch each other. instead of this event being called twice.
			if (
				entityB._category == 'region' || (
					entityA._category != 'region' && (
						entityB._category == 'unit' || (
							entityA._category != 'unit' && (
								entityB._category == 'item' || (
									entityA._category != 'item' && (
										entityB._category == 'projectile' ||
										entityB._category == undefined										
									)
								)
							)
						)
					)
				)
			) {
				var entityA = contact.m_fixtureB.m_body._entity
				var entityB = contact.m_fixtureA.m_body._entity
			}

			switch (entityA._category) {
				case 'region':
					var region = ige.variable.getValue({
						function: "getVariable",
						variableName: entityA._stats.id
					});

					switch (entityB._category) {
						case 'unit':
							ige.trigger.fire("unitEntersRegion", {
								unitId: entityB.id(),
								region: region
							});
							break;

						case 'item':
							ige.trigger.fire("itemEntersRegion", {
								itemId: entityB.id(),
								region: region
							});
							break;

						case 'debris':
							ige.trigger.fire("debrisEntersRegion", {
								debrisId: entityB.id(),
								region: region
							});
							break;
					}
					break;

				case 'unit':
					var triggeredBy = {
						unitId: entityA.id()
					}
					ige.game.lastTouchingUnitId = entityA.id()
					ige.game.lastTouchedUnitId = entityB.id()
							
					switch (entityB._category) {

						case 'unit':
							ige.trigger.fire("unitTouchesUnit", triggeredBy) // handle unitA touching unitB
							triggeredBy.unitId = entityB.id();
							ige.game.lastTouchingUnitId = entityB.id()
							ige.game.lastTouchedUnitId = entityA.id()
							ige.trigger.fire("unitTouchesUnit", triggeredBy) // handle unitB touching unitA
							break;

						case 'debris':
							triggeredBy.debrisId = entityB.id()
							ige.game.lastTouchedDebrisId = entityB.id()
							ige.trigger.fire("unitTouchesDebris", triggeredBy)
							break;

						case 'item':
							triggeredBy.itemId = entityB.id()
							ige.game.lastTouchedItemId = entityB.id()
							// don't trigger if item is owned by the unit
							if (entityB._stats.ownerUnitId == entityA.id())
								return;

							ige.trigger.fire("unitTouchesItem", triggeredBy)

							break;

						case 'projectile':
							// console.log(entityA._category, entityA._stats.name, entityA.id())
							triggeredBy.projectileId = entityB.id();
							triggeredBy.collidingEntity = entityA.id();
							ige.game.lastTouchedProjectileId = entityB.id()
							triggeredBy.projectileId = entityB.id();
							ige.game.lastAttackingUnitId = entityB._stats.sourceUnitId;
							ige.game.lastAttackedUnitId = entityA.id()
							ige.trigger.fire("unitTouchesProjectile", triggeredBy);
							
							break;

						case undefined:
						case 'wall':
							ige.game.lastTouchingUnitId = entityA.id();
							var triggeredBy = { unitId: entityA.id() }
							ige.trigger.fire("unitTouchesWall", triggeredBy)
							break;
					}
					break;

				case 'item':
					switch (entityB._category) {
						case 'projectile':
							var triggeredBy = {
								projectileId: entityB.id(),
								itemId: entityA.id(),
								collidingEntity: entityA.id(),
							};
							ige.trigger.fire("projectileTouchesItem", triggeredBy);
							break;
					}
					break;
							
				case 'projectile':
					switch (entityB._category) {

						case 'debris':
							var triggeredBy = {
								projectileId: entityA.id(),
								debrisId: entityB.id(),
								collidingEntity: entityB.id(),
							};
							ige.trigger.fire("projectileTouchesDebris", triggeredBy);
							break;
						case undefined:
						case 'wall':
							var triggeredBy = {
								projectileId: entityA.id(),
								collidingEntity: entityB.id()
							}
							ige.trigger.fire("projectileTouchesWall", triggeredBy)
							break;
					}
					break;
				case undefined: // something touched wall
				case 'wall':
					switch (entityB._category) {
						case 'projectile':
							var triggeredBy = {
								projectileId: entityB.id(),
								collidingEntity: entityA.id()
							}
							ige.trigger.fire("projectileTouchesWall", triggeredBy)
							break;

						case 'item':
							var triggeredBy = { itemId: entityB.id() }
							ige.trigger.fire("itemTouchesWall", triggeredBy)
							break;
					}
					break;
			}

		}

	},

	_endContactCallback: function(contact) {
		
	},

	_enableContactListener: function () {
		// Set the contact listener methods to detect when
		// contacts (collisions) begin and end
		ige.physics.contactListener(this._beginContactCallback, this.endContactCallback)
	},

	/*
		fire trigger and run all of the corresponding script(s)
	*/
	fire: function (triggerName, triggeredBy) {
		// console.log("trigger fire", triggerName, triggeredBy)
		// look for script that has a matching trigger

		if (ige.isServer || (ige.isClient && ige.physics)) {
			for (scriptId in ige.game.data.scripts) {
				var script = ige.game.data.scripts[scriptId]
				var triggered = false;
	
				// look for matching trigger within the script's triggers
	
				if (script && script.triggers) {
					for (j = 0; j < script.triggers.length; j++) {
						var scriptTrigger = script.triggers[j]
						if (scriptTrigger.type == triggerName) {
							triggered = true;
						}
					}
	
					if (triggered) {
						ige.script.scriptLog('\ntrigger: ' + triggerName)
	
						var localVariables = {
							triggeredBy: triggeredBy
						}
						ige.script.runScript(scriptId, localVariables)
					}
				}
	
			}
		}
		
		if (triggeredBy && triggeredBy.projectileId) {
			var projectile = ige.$(triggeredBy.projectileId);
			if (projectile) {
				switch (triggerName) {
					case 'unitTouchesProjectile':				
						var attackedUnit = ige.$(ige.game.lastTouchingUnitId);
						if (attackedUnit) {
							var damageHasBeenInflicted = attackedUnit.inflictDamage(projectile._stats.damageData);
							
							if (projectile._stats.destroyOnContactWith && projectile._stats.destroyOnContactWith['units'] && damageHasBeenInflicted) {
								projectile.destroy();
							}
						}
						break;
					case 'projectileTouchesDebris':
						if (projectile._stats.destroyOnContactWith && projectile._stats.destroyOnContactWith['debris']) {
							projectile.destroy();
						}
						break;
					case 'projectileTouchesItem':
						if (projectile._stats.destroyOnContactWith && projectile._stats.destroyOnContactWith['items']) {
							projectile.destroy();
						}
						break;
					case 'projectileTouchesWall':
						if (projectile._stats.destroyOnContactWith && projectile._stats.destroyOnContactWith['walls']) {
							projectile.destroy();
						}
						break;	
				}
			}
		}		
	}
});


if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = TriggerComponent; }