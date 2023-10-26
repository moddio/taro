var VariableComponent = IgeEntity.extend({
	classId: 'VariableComponent',
	componentId: 'variable',

	init: function (entity, options) {
		var self = this;

		self.devLogs = {};
		self.secondCount = 0;
		self.updateStatusSecond = 5;
		self.streamingWarningShown = false;
		self.prevServerTime = 0;
		self.prevClientTime = 0;
	},

	roundOff: function (num, precision) {
		return Number(`${Math.round(`${num}e${precision}`)}e-${precision}`);
	},

	getRandomPositionInRegion: function (region) {
		if (region && region._stats && region._stats.default) {
			region = region._stats.default;
		}

		var randomX = Math.floor(Math.random() * ((region.x + region.width) - region.x) + region.x);
		var randomY = Math.floor(Math.random() * ((region.y + region.height) - region.y) + region.y);
		var position = { x: 0, y: 0 };

		if (!isNaN(randomX) || !isNaN(randomY)) {
			position.x = randomX;
			position.y = randomY;
		}

		return position;
	},

	isPositionInWall: function (position) {
		var wallLayer = null;

		for (var i = 0; i < ige.map.data.layers.length; i++) {
			var layer = ige.map.data.layers[i];
			if (layer.name === 'walls') {
				wallLayer = layer;
				break;
			}
		}

		if (!wallLayer || !position.x || isNaN(position.x) || !position.y || isNaN(position.y)) {
			return false;
		}

		var worldWidth = ige.map.data.width;
		var tileWidth = ige.scaleMapDetails.tileWidth || ige.game.data.map.tilewidth;
		var tileHeight = ige.scaleMapDetails.tileHeight || ige.game.data.map.tilewidth;

		var tile = {
			x: Math.floor(position.x / tileWidth),
			y: Math.floor(position.y / tileHeight)
		};

		var tileIndex = (tile.x) + ((tile.y) * worldWidth);
		return !!(wallLayer && wallLayer.data[tileIndex]);
	},

	isPositionInEntity: function (position) {
		var entityCategory = ['unit', 'debris'];
		var defaultArea = {
			height: 100,
			width: 100
		};

		var entities = ige.physics.getBodiesInRegion({
			x: position.x,
			y: position.y,
			width: defaultArea.width,
			height: defaultArea.height
		});

		var returnValue = _.some(entities, function (entity) {
			return entityCategory.indexOf(entity._category) > -1;
		});

		return returnValue;
	},

	getValue: function (text, vars) {
		var self = this;

		var arr = [];

		var returnValue = undefined;

		// just return raw numbers
		if (typeof text === 'number') {
			returnValue = parseFloat(text);
		}

		// if boolean, string, undefined, etc... return.
		if (typeof text !== 'object') {
			returnValue = text;
		} else if (text && text.function == undefined && text.x != undefined && text.y != undefined) // if point! (x, y)
		{
			returnValue = {
				x: self.getValue(text.x, vars),
				y: self.getValue(text.y, vars)
			};
		} else if (text == undefined) {
			returnValue = undefined;
		}

		if (typeof text === 'object') {
			var entity = self.getValue(text.entity, vars);

			switch (text.function) {
				/* boolean */

				case 'playersAreHostile':
					var playerA = self.getValue(text.playerA, vars);
					var playerB = self.getValue(text.playerB, vars);

					if (playerA && playerB) {
						returnValue = playerA.isHostileTo(playerB);
					}
					break;

				case 'playersAreFriendly':
					var playerA = self.getValue(text.playerA, vars);
					var playerB = self.getValue(text.playerB, vars);

					if (playerA && playerB) {
						returnValue = playerA.isFriendlyTo(playerB);
					}
					break;

				case 'playersAreNeutral':
					var playerA = self.getValue(text.playerA, vars);
					var playerB = self.getValue(text.playerB, vars);

					if (playerA && playerB) {
						returnValue = playerA.isNeutralTo(playerB);
					}
					break;

				case 'unitIsInRegion':
					var region = self.getValue(text.region, vars);
					var unit = self.getValue(text.unit, vars);

					returnValue = false;

					if (region && unit) {
						// if region is an instance of IgeRegion component
						if (region._stats) {
							var entitiesInRegion = ige.regionManager.entitiesInRegion &&
								ige.regionManager.entitiesInRegion[region._stats.id];

							if (entitiesInRegion) {
								returnValue = !!entitiesInRegion[unit.id()];
							}
						} else { // region is either dynamic or a variable with {x, y, height, width} properties
							returnValue = ige.physics.getBodiesInRegion(region)
								.filter(function (entity) {
									return entity.id() === unit.id();
								})
								.length;

							returnValue = !!returnValue;
						}
					}

					break;

				case 'isPositionInWall':
					var positionX = self.getValue(text.position.x, vars);
					var positionY = self.getValue(text.position.y, vars);

					returnValue = self.isPositionInWall({
						x: positionX,
						y: positionY
					});
					break;

				case 'regionOverlapsWithRegion':
					var regionA = self.getValue(text.regionA, vars);
					var regionB = self.getValue(text.regionB, vars);
					if (!regionA || !regionB) {
						returnValue = false;
						break;
					}
					if (regionA._category == 'region') {
						regionA = regionA.getBounds();
					}
					if (regionB._category == 'region') {
						regionB = regionB.getBounds();
					}
					if (regionA && regionB) {
						regionA = new IgeRect(regionA.x, regionA.y, regionA.width, regionA.height);
						regionB = new IgeRect(regionB.x, regionB.y, regionB.width, regionB.height);
						returnValue = regionA.intersects(regionB);
					}
					break;
				case 'itemIsInRegion':
					var region = self.getValue(text.region, vars);
					var item = self.getValue(text.item, vars);
					returnValue = false;

					returnValue = false;

					if (region && item) {
						// if region is an instance of IgeRegion component
						if (region._stats) {
							var entitiesInRegion = ige.regionManager.entitiesInRegion &&
								ige.regionManager.entitiesInRegion[region._stats.id];

							if (entitiesInRegion) {
								returnValue = !!entitiesInRegion[item.id()];
							}
						} else { // region is either dynamic or a variable with {x, y, height, width} properties
							returnValue = ige.physics.getBodiesInRegion(region)
								.filter(function (entity) {
									return entity.id() === item.id();
								})
								.length;

							returnValue = !!returnValue;
						}
					}

					break;

				case 'playerIsControlledByHuman':
					var player = self.getValue(text.player, vars);
					returnValue = player && player._stats.controlledBy == 'human';
					break;

				case 'isPlayerLoggedIn':
					var player = self.getValue(text.player, vars);
					returnValue = !!(player && player._stats.userId);
					break;

				case 'playerHasAdblockEnabled':
					var player = self.getValue(text.player, vars);
					returnValue = !!(player && player._stats.isAdBlockEnabled);
					break;

				case 'areEntitiesTouching':
					var sourceEntity = self.getValue(text.sourceEntity, vars);
					var targetEntity = self.getValue(text.targetEntity, vars);

					var sourceContactEntities = Object.keys(sourceEntity.bodiesInContact || {});

					returnValue = sourceContactEntities.includes(targetEntity.id());
					break;

				case 'subString':
					var sourceString = self.getValue(text.sourceString, vars);
					var patternString = self.getValue(text.patternString, vars);

					if (sourceString && patternString && typeof sourceString == 'string' && typeof patternString == 'string') {
						returnValue = sourceString.includes(patternString);
					}
					break;

				case 'getPlayerAttribute':
					if (entity && entity._category == 'player') {
						var attributeTypeId = self.getValue(text.attribute, vars);
						if (entity._stats.attributes && entity._stats.attributes[attributeTypeId]) {
							returnValue = entity._stats.attributes[attributeTypeId].value;
						}
					}
					break;
				case 'playerAttributeMax':
					var attributeTypeId = self.getValue(text.attribute, vars);
					if (entity && attributeTypeId) {
						var attributeType = entity._stats.attributes[attributeTypeId];
						if (attributeType) {
							returnValue = attributeType.max;
						}
					}
					break;
				case 'playerAttributeMin':
					var attributeTypeId = self.getValue(text.attribute, vars);
					if (entity && attributeTypeId) {
						var attributeType = entity._stats.attributes[attributeTypeId];
						if (attributeType) {
							returnValue = attributeType.min;
						}
					}
					break;
				case 'getPlayerName':
					if (entity && entity._category == 'player') {
						returnValue = entity._stats.name;
					}
					break;

				case 'getPlayerVariable':
					// console.log('text.variable', text.variable);
					returnValue = text.variable;
					break;

				case 'getValueOfPlayerVariable':
					var variableData = self.getValue(text.variable, vars);
					var player = self.getValue(text.player, vars);

					if (player && variableData) {
						var playerVariable = player.variables &&
							player.variables[variableData.key] &&
							player.variables[variableData.key];

						if (playerVariable) {
							returnValue = playerVariable.value;

							if (returnValue === null || returnValue == undefined) {
								returnValue = playerVariable.default;
							}
						}
					}

					break;

				case 'playerTypeOfPlayer':
					var player = self.getValue(text.player, vars);
					if (player && player._category == 'player') {
						returnValue = player._stats.playerTypeId;
					}
					break;

				case 'playerCustomInput':
					var player = self.getValue(text.player, vars);
					if (player && player._category == 'player') {
						returnValue = player.lastCustomInput;
					}
					break;

				case 'lastPlayerMessage':
					var player = self.getValue(text.player, vars);
					if (player && player._category == 'player') {
						returnValue = player.lastMessageSent;
					}
					break;

				case 'entityExists':
					returnValue = !!(entity && entity._id && ige.$(entity._id));
					break;

				case 'getTriggeringPlayer':
					if (vars && vars.triggeredBy && vars.triggeredBy.playerId) {
						var id = vars.triggeredBy.playerId;
						returnValue = ige.$(id);
					}
					break;

				case 'getTriggeringUnit':
					if (vars && vars.triggeredBy && vars.triggeredBy.unitId) {
						var id = vars.triggeredBy.unitId;
						returnValue = ige.$(id);
					}
					break;

				case 'getTriggeringDebris':
					if (vars && vars.triggeredBy && vars.triggeredBy.debrisId) {
						var debris = ige.$(vars.triggeredBy.debrisId);
						if (debris) {
							returnValue = debris;
						}
					}
					break;

				case 'getTriggeringRegion':
					if (vars && vars.triggeredBy && vars.triggeredBy.region) {
						returnValue = vars.triggeredBy.region;
					}
					break;

				case 'getTriggeringProjectile':
					if (vars && vars.triggeredBy && vars.triggeredBy.projectileId) {
						var id = vars.triggeredBy.projectileId;
						returnValue = ige.$(id);
					}
					break;

				case 'getTriggeringItem':
					if (vars && vars.triggeredBy && vars.triggeredBy.itemId) {
						var id = vars.triggeredBy.itemId;
						returnValue = ige.$(id);
					}
					break;

				case 'getTriggeringSensor':
					if (vars && vars.triggeredBy && vars.triggeredBy.sensorId) {
						var id = vars.triggeredBy.sensorId;
						returnValue = ige.$(id);
					}
					break;

				case 'getTriggeringAttribute':
					if (vars && vars.triggeredBy && vars.triggeredBy.attribute) {
						return vars.triggeredBy.attribute;
					}
					break;

				case 'getPlayerFromId':
					var id = self.getValue(text.string, vars);
					if (id) {
						returnValue = ige.$(id);
					}
					break;

				case 'getUnitFromId':
					var id = self.getValue(text.string, vars);
					if (id) {
						returnValue = ige.$(id);
					}
					break;

				case 'getAttributeTypeOfAttribute':
					if (entity) {
						returnValue = entity.type;
					}
					break;

				case 'getEntityAttribute':
					var attributeTypeId = self.getValue(text.attribute, vars);

					if (entity && ige.action.entityCategories.indexOf(entity._category) !== -1 && attributeTypeId) {
						var attributeType = entity._stats.attributes && entity._stats.attributes[attributeTypeId];
						if (attributeType) {
							var value = parseFloat(attributeType.value);
							returnValue = self.getValue(value, vars);
						} else {
							// ige.script.errorLog("attribute "+ attributeTypeId +" doesn't exist in unit "+((unit._stats)?unit._stats.name:''))
						}
					}

					break;

				case 'entityAttributeMax':
					var attributeTypeId = self.getValue(text.attribute, vars);
					if (entity && entity._stats.attributes && ige.action.entityCategories.indexOf(entity._category) > -1 && attributeTypeId) {
						var attributeType = entity._stats.attributes[attributeTypeId];
						if (attributeType) {
							returnValue = attributeType.max;
						}
					}
					break;

				case 'entityAttributeMin':
					var attributeTypeId = self.getValue(text.attribute, vars);
					if (entity && entity._stats.attributes && ige.action.entityCategories.indexOf(entity._category) > -1 && attributeTypeId) {
						var attributeType = entity._stats.attributes[attributeTypeId];
						if (attributeType) {
							returnValue = attributeType.min;
						}
					}
					break;

				case 'getItemQuantity':
					var item = self.getValue(text.item, vars);
					if (item && item._category == 'item') {
						// returnValue = item._stats.quantity || 1; // this was causing the bug where item with infinite (null) quantity was only being used once. we shouldn't be overwriting null value with 1 - Jaeyun sept 8, 2018
						returnValue = item._stats.quantity;
					}

					break;
				case 'getItemMaxQuantity':
					var item = self.getValue(text.item, vars);
					if (item && item._category == 'item') {
						returnValue = item._stats.maxQuantity;
					}

					break;

				case 'getQuantityOfItemTypeInItemTypeGroup':
					if (text.itemTypeGroup && text.itemType) {
						var variableObj = self.getVariable(text.itemTypeGroup.variableName);
						var itemType = self.getValue(text.itemType, vars);
						console.log(text.itemType, itemType, variableObj);
						if (variableObj && variableObj[itemType]) {
							returnValue = variableObj[itemType].quantity;
						}
					}

					break;
				case 'getQuantityOfUnitTypeInUnitTypeGroup':
					if (text.unitTypeGroup && text.unitType) {
						var variableObj = self.getVariable(text.unitTypeGroup.variableName);
						var unitType = self.getValue(text.unitType, vars);

						if (variableObj && variableObj[unitType]) {
							returnValue = variableObj[unitType].quantity;
						}
					}

					break;

				case 'dynamicRegion':
					var x = self.getValue(text.x, vars);
					var y = self.getValue(text.y, vars);
					var width = self.getValue(text.width, vars);
					var height = self.getValue(text.height, vars);

					returnValue = {
						x: x,
						y: y,
						width: width,
						height: height
					};

					break;

				case 'entityBounds':
					if (entity && ige.action.entityCategories.indexOf(entity._category) > -1) {
						// for sprite-only items that are carried by units
						returnValue = entity.getBounds();
					}

					break;

				case 'getProjectileAttribute':
					var attributeTypeId = self.getValue(text.attribute, vars);
					var projectile = entity;
					if (projectile && projectile._category == 'projectile' && attributeTypeId) {
						var attributeType = projectile._stats.attributes[attributeTypeId];
						if (attributeType) {
							var value = parseFloat(attributeType.value);
							returnValue = self.getValue(value, vars);
						} else {
							// ige.script.errorLog("attribute "+ attributeTypeId +" doesn't exist in unit "+((unit._stats)?unit._stats.name:''))
						}
					}

					break;

				case 'unitsFacingAngle':
					var unit = self.getValue(text.unit, vars);
					if (unit && unit._category == 'unit') {
						returnValue = unit._rotate && unit._rotate.z;
						returnValue = (returnValue != undefined) ? self.roundOff(returnValue, 3) : undefined;
					}
					break;

				case 'getUnitBody':
					var unit = self.getValue(text.unit, vars);
					if (unit && unit._category == 'unit') {
						returnValue = unit.body;
					}
					break;

				case 'toFixed':
					var num = self.getValue(text.value, vars);
					var precision = self.getValue(text.precision, vars);

					// toFixed() returns a string, so we have to parseFloat again
					returnValue = parseFloat(parseFloat(num).toFixed(precision));

					// nishant's code
					// num = typeof num === 'number' ? num : undefined;
					// precision = typeof precision === 'number' && precision > 0 ? precision : undefined;

					// returnValue = num && precision ? self.roundOff(num, precision) : undefined;

					break;
				case 'absoluteValueOfNumber':
					var num = self.getValue(text.number, vars);

					returnValue = Math.abs(num);
					break;

				case 'arctan':
					var angle = self.getValue(text.number, vars);

					if (angle !== undefined) {
						returnValue = Math.atan(angle);
					}

					break;

				case 'sin':
					var angle = self.getValue(text.angle, vars);

					if (angle !== undefined) {
						returnValue = Math.sin(angle);
					}

					break;

				case 'cos':
					var angle = self.getValue(text.angle, vars);

					if (angle !== undefined) {
						returnValue = Math.cos(angle);
					}

					break;

				case 'stringToNumber':
					var value = self.getValue(text.value, vars);
					var parsedValue = Number(value);

					if (!isNaN(parsedValue)) {
						returnValue = parsedValue;
					}

					break;
				case 'getEntityVelocityX':
					if (entity && entity.body) {
						var velocity = entity.body.m_linearVelocity && entity.body.m_linearVelocity.x;
						velocity = velocity && velocity.toFixed(2) || 0;
						returnValue = parseFloat(velocity);
					}
					break;
				case 'getEntityVelocityY':
					if (entity && entity.body) {
						var velocity = entity.body.m_linearVelocity && entity.body.m_linearVelocity.y;
						velocity = velocity && velocity.toFixed(2) || 0;
						returnValue = parseFloat(velocity);
					}
					break;
				case 'getOwner':
					if (entity && entity._category == 'unit') {
						returnValue = entity.getOwner();
					}
					break;

				case 'selectedPlayer':
				case 'getSelectedPlayer':
					if (vars && vars.selectedPlayer) {
						return vars.selectedPlayer;
					}
					break;

				case 'selectedUnit':
				case 'getSelectedUnit':
					if (vars && vars.selectedUnit) {
						return vars.selectedUnit;
					}
					break;

				case 'selectedItem':
				case 'getSelectedItem':
					if (vars && vars.selectedItem) {
						return vars.selectedItem;
					}
					break;

				case 'selectedProjectile':
				case 'getSelectedProjectile':
					if (vars && vars.selectedProjectile) {
						return vars.selectedProjectile;
					}
					break;

				case 'selectedDebris':
				case 'getSelectedDebris':
					if (vars && vars.selectedDebris) {
						return vars.selectedDebris;
					}
					break;

				case 'selectedEntity':
				case 'getSelectedEntity':
					if (vars && vars.selectedEntity) {
						return vars.selectedEntity;
					}
					break;

				case 'selectedRegion':
					if (vars && vars.selectedRegion) {
						return vars.selectedRegion;
					}
					break;

				case 'selectedItemType':
					if (vars && vars.selectedItemType) {
						return vars.selectedItemType;
					}

					break;

				case 'selectedUnitType':
					if (vars && vars.selectedUnitType) {
						return vars.selectedUnitType;
					}
					break;

				case 'getLastPurchasedUnit':
					var id = ige.game.lastPurchasedUnitId;
					unit = ige.$(id);
					if (unit && unit._category == 'unit') {
						return unit;
					}
					break;

				case 'getLastTouchingUnit':
					var id = ige.game.lastTouchingUnitId;
					unit = ige.$(id);
					if (unit && unit._category == 'unit') {
						return unit;
					}
					break;

				case 'getLastAttackingUnit':
					var id = ige.game.lastAttackingUnitId;
					unit = ige.$(id);
					if (unit && unit._category == 'unit') {
						return unit;
					}
					break;

				case 'getLastAttackedUnit':
					var id = ige.game.lastAttackedUnitId;
					unit = ige.$(id);
					if (unit && unit._category == 'unit') {
						return unit;
					}
					break;

				case 'getLastTouchedUnit':
					var id = ige.game.lastTouchedUnitId;
					unit = ige.$(id);
					if (unit && unit._category == 'unit') {
						returnValue = unit;
					}
					break;

				case 'getLastTouchedDebris':
					var id = ige.game.lastTouchedDebrisId;
					debris = ige.$(id);
					if (debris && debris._category == 'debris') {
						returnValue = debris;
					}
					break;

				case 'getLastTouchedItem':
					var id = ige.game.lastTouchedItemId;
					returnValue = ige.$(id);
					break;

				case 'getLastAttackingItem':
				 	var id = ige.game.lastAttackingItemId;
				 	item = ige.$(id);
					if (item && item._category == 'item') {
						returnValue = item;
					}
			 		break;

				case 'lastUsedItem':
				case 'getLastUsedItem': // will be deprecated soon
					var id = ige.game.lastUsedItemId;

					item = ige.$(id);
					if (item && item._category == 'item') {
						returnValue = item;
					}

					break;

				case 'getLastTouchedProjectile':
					var id = ige.game.lastTouchedProjectileId;

					projectile = ige.$(id);
					if (projectile && projectile._category == 'projectile') {
						returnValue = projectile;
					}
					break;

				case 'getSourceItemOfProjectile':
					if (entity && entity._category == 'projectile') {
						var item = entity.getSourceItem();
						if (item) {
							returnValue = item;
						}
					}
					break;

				case 'getSourceUnitOfProjectile':
					if (entity && entity._category == 'projectile') {
						var sourceUnitId = entity._stats.sourceUnitId;
						unit = ige.$(sourceUnitId);
						if (unit && unit._category == 'unit') {
							returnValue = unit;
						}
					}
					break;

				case 'getOwnerOfItem':
					if (entity && entity._category == 'item') {
						var owner = entity.getOwnerUnit();
						if (owner) {
							returnValue = owner;
						}
					}
					break;

				case 'getItemAtSlot':
					var unit = self.getValue(text.unit, vars);
					var slotIndex = self.getValue(text.slot, vars);

					if (unit && unit._category == 'unit') {
						var item = unit.inventory.getItemBySlotNumber(slotIndex);
						if (item) {
							returnValue = item;
						}
					}

					break;
				case 'getItemBody':
					var item = self.getValue(text.item, vars);
					if (item && item._category == 'item') {
						returnValue = item.body;
					}
					break;

				case 'lastCreatedItem':
					var id = ige.game.lastCreatedItemId;
					returnValue = ige.$(id);
					break;

				case 'ownerUnitOfSensor':
					var sensor = self.getValue(text.sensor, vars);
					if (sensor && sensor._category == 'sensor') {
						returnValue = ige.$(sensor.ownerUnitId);
					}
					break;

				case 'getLastCreatedProjectile':
					var id = ige.game.lastCreatedProjectileId;
					returnValue = ige.$(id);
					break;

				case 'getProjectileBody':
					var projectile = self.getValue(text.projectile, vars);
					if (projectile && projectile._category == 'projectile') {
						returnValue = projectile.body;
					}
					break;

				case 'getLastCreatedUnit':
					var id = ige.game.lastCreatedUnitId;
					returnValue = ige.$(id);
					break;

				case 'getLastPlayerSelectingDialogueOption':
					var id = ige.game.lastPlayerSelectingDialogueOption;
					returnValue = ige.$(id);
					break;

				case 'getLastCastingUnit':
					var id = ige.game.lastCastingUnitId;
					var unit = ige.$(id);
					if (unit && unit._category == 'unit') {
						returnValue = unit;
					}
					break;

				case 'getLastCreatedItem':
					var id = ige.game.lastCreatedItemId;
					returnValue = ige.$(id);
					break;

				case 'getItemCurrentlyHeldByUnit':
					if (entity && entity._category == 'unit') {
						returnValue = entity.getCurrentItem();
					}
					break;

				case 'getSensorOfUnit':
					var unit = self.getValue(text.unit, vars);
					if (unit && unit._category == 'unit') {
						returnValue = unit.sensor;
					}
					break;

				case 'getLastChatMessageSentByPlayer':
					returnValue = ige.game.lastChatMessageSentByPlayer;
					break;

				// doesn't work yet
				case 'getItemInInventorySlot':
					var slotIndex = self.getValue(text.slot, vars);
					if (entity && entity._category == 'unit') {
						var item = entity.inventory.getItemBySlotNumber(slotIndex);
						if (item) {
							returnValue = item;
						}
					}
					break;

				case 'allItemsDroppedOnGround':
					returnValue = ige.$$('item')
						.filter(function (item) {
							return !item.getOwnerUnit();
						});
					break;

				case 'allItemsOwnedByUnit':
					var unit = self.getValue(text.entity, vars);
					if (unit && unit._category == 'unit') {
						returnValue = ige.$$('item')
							.filter(function (item) {
								return item._stats.ownerUnitId == unit.id();
							});
					}
					break;

					// case 'getUnitInFrontOfUnit':
					// 	if (entity && entity._category == 'unit') {
					// 		var entities = ige.physics.getBodiesInRegion({
					// 			x: entity._translate.x - 7 + (35 * Math.cos(entity._rotate.z + Math.radians(-90))),
					// 			y: entity._translate.y - 7 + (35 * Math.sin(entity._rotate.z + Math.radians(-90))),
					// 			width: 14,
					// 			height: 14
					// 		},
					// 			entity.id()
					// 		)
					// 		for (i = 0; i < entities.length; i++) {
					// 			var entity = entities[i]
					// 			if (entity && entity._category == 'unit') {
					// 				return entity;
					// 			}
					// 		}
					// 	}
					// 	break;

				case 'calculate':
					returnValue = self.calculate(text.items, vars);
					break;

				case 'squareRoot':
					var numberValue = self.getValue(text.number, vars);

					if (!isNaN(numberValue)) {
						returnValue = Math.sqrt(numberValue);
					}

					break;

				case 'getPlayerCount':
					returnValue = ige.$$('player').filter(function (player) {
						return player._stats.controlledBy == 'human' && player._stats.playerJoined == true;
					}).length;
					break;

				case 'getNumberOfItemsPresent':
					returnValue = ige.$$('item').length;
					break;

				case 'getUnitCount':
					returnValue = ige.$$('unit').length;
					break;

				case 'getNumberOfUnitsOfUnitType':
					var unitType = self.getValue(text.unitType, vars);
					var units = ige.$$('unit').filter((unit) => {
						return unit._stats.type === unitType;
					});

					returnValue = units.length;
					break;

				case 'getNumberOfPlayersOfPlayerType':
					var playerType = self.getValue(text.playerType, vars);
					var players = ige.$$('player').filter((player) => {
						return player._stats.playerTypeId === playerType;
					});

					returnValue = players.length;
					break;

				case 'getRandomNumberBetween':
					var min = parseFloat(self.getValue(text.min, vars));
					var max = parseFloat(self.getValue(text.max, vars));
					var randomNumber = Math.floor(Math.random() * (max - min + 1) + min);
					returnValue = randomNumber;
					break;

				case 'getMapHeight':
					var worldHeight = ige.map.data.height;
					var tileHeight = ige.game.data.map.tileheight;
					returnValue = tileHeight * worldHeight;
					break;

				case 'getMapWidth':
					var worldWidth = ige.map.data.width;
					var tileWidth = 64 || ige.game.data.map.tilewidth;
					returnValue = tileWidth * worldWidth;
					break;

				case 'entityWidth':
					if (entity && ige.action.entityCategories.indexOf(entity._category) > -1) {
						// returnValue = entity._aabb.width;
						returnValue = entity.width();
						// console.log("entityWidth", returnValue);
					}

					break;

				case 'entityHeight':
					if (entity && ige.action.entityCategories.indexOf(entity._category) > -1) {
						// returnValue = entity._aabb.height;
						returnValue = entity.height();
					}

					break;
				case 'defaultQuantityOfItemType':
					var itemTypeId = self.getValue(text.itemType, vars);
					var itemType = ige.game.getAsset('itemTypes', itemTypeId);
					if (itemType) {
						returnValue = itemType.quantity;
					}
					break;
				case 'maxValueOfItemType':
					var itemTypeId = self.getValue(text.itemType, vars);
					var itemType = ige.game.getAsset('itemTypes', itemTypeId);

					if (itemType) {
						returnValue = itemType.maxQuantity;
					} else {
						returnValue = 0;
					}

					break;

				case 'allItemTypesInGame':
					var itemTypesObject = ige.game.data.itemTypes;

					if (itemTypesObject) {
						returnValue = itemTypesObject;
					}

					break;

				case 'allUnitTypesInGame':
					var unitTypesObject = ige.game.data.unitTypes;

					if (unitTypesObject) {
						returnValue = unitTypesObject;
					}

					break;

				case 'lastPlayedTimeOfPlayer':
					var player = self.getValue(text.player, vars);
					// console.log(player);
					returnValue = player && player._stats.lastPlayed;
					break;

				case 'currentTimeStamp':
					returnValue = Date.now();
					break;

				case 'getRandomPositionInRegion':
					var region = self.getValue(text.region, vars);

					if (region) {
						returnValue = self.getRandomPositionInRegion(region);
					}

					break;
				case 'nameOfUnit':
					var unit = self.getValue(text.unit, vars);
					if (unit) {
						returnValue = unit._stats && unit._stats.name;
					}

					break;
				case 'nameOfRegion':
					var region = self.getValue(text.region, vars);
					if (region) {
						returnValue = region._stats ? region._stats.id : region.key;
					}

					break;

				case 'centerOfRegion':
					var region = self.getValue(text.region, vars);

					if (region) {
						returnValue = {
							x: region._stats.default.x + (region._stats.default.width / 2),
							y: region._stats.default.y + (region._stats.default.height / 2)
						};
					}
					break;

				case 'getRandomPlayablePositionInRegion':
					var region = self.getValue(text.region, vars);
					var attempts = 20;

					if (region) {
						for (var i = 0; i < attempts; i++) {
							var position = self.getRandomPositionInRegion(region);
							var isPlayablePosition = !self.isPositionInEntity(position) &&
								!self.isPositionInWall(position);

							if (isPlayablePosition) {
								returnValue = {
									x: position.x,
									y: position.y
								};
								break;
							}
						}

						if (!returnValue) {
							ige.script.errorLog(`could not find valid position even after${attempts} attempts`);
						}
					}
					break;

				case 'mathFloor':
					var value = self.getValue(text.value, vars);
					if (!isNaN(value))
						return Math.floor(value);
					break;

				case 'getEntireMapRegion':
					var region = {
						x: ige.map.data.tilewidth * 2,
						y: ige.map.data.tileheight * 2,
						width: (ige.map.data.width * ige.map.data.tilewidth) - (ige.map.data.tilewidth * 2),
						height: (ige.map.data.height * ige.map.data.tileheight) - (ige.map.data.tileheight * 2)
					};

					returnValue = { _stats: { default: region } };
					break;

				case 'stringContains':
					var str = self.getValue(text.string, vars);
					var keyword = self.getValue(text.keyword, vars);
					if (str != undefined && str.indexOf(keyword) > -1) {
						returnValue = true;
					}
					returnValue = false;
					break;

				case 'getEntityPosition':
					entity = self.getValue(text.entity, vars);
					if (entity) {
						if (entity._category === 'item' && entity._stats && entity._stats.currentBody && entity._stats.currentBody.type === 'spriteOnly') {
							var ownerUnit = entity.getOwnerUnit();
							var unitPosition = _.cloneDeep(ownerUnit._translate);
							unitPosition.x = (ownerUnit._translate.x) + (entity._stats.currentBody.unitAnchor.y * Math.cos(ownerUnit._rotate.z + Math.radians(-90))) + (entity._stats.currentBody.unitAnchor.x * Math.cos(ownerUnit._rotate.z));
							unitPosition.y = (ownerUnit._translate.y) + (entity._stats.currentBody.unitAnchor.y * Math.sin(ownerUnit._rotate.z + Math.radians(-90))) + (entity._stats.currentBody.unitAnchor.x * Math.sin(ownerUnit._rotate.z));
							returnValue = JSON.parse(JSON.stringify(unitPosition));
						} else {
							if (entity.x != undefined && entity.y != undefined) {
								returnValue = JSON.parse(JSON.stringify(entity));
							} else if (entity._translate) {
								returnValue = _.cloneDeep(entity._translate);
							} else {
								returnValue = { x: 0, y: 0 };
							}
						}
					}

					break;
				case 'getPositionX':
					var position = self.getValue(text.position, vars);
					if (position) {
						returnValue = position.x;
					}
					break;
				case 'angleBetweenMouseAndWindowCenter':
					var player = ige.variable.getValue(text.player, vars);
					if (player) {
						returnValue = player.absoluteAngle || 0;
					}
					break;
				case 'getPositionY':
					var position = self.getValue(text.position, vars);
					if (position) {
						returnValue = position.y;
					}
					break;
				case 'entitiesCollidingWithLastRaycast': {
					returnValue = ige.game.entitiesCollidingWithLastRaycast;
					break;
				}
				case 'entityLastRaycastCollisionPosition':
					var entity = self.getValue(text.entity, vars);
					if (entity) {
						returnValue = entity.lastRaycastCollisionPosition;
					}
					break;
				case 'getMouseCursorPosition':
					var player = self.getValue(text.player, vars);
					if (player && player._category == 'player' && player.control) {
						if (player.control.input.mouse.x != undefined && player.control.input.mouse.y != undefined &&
							!isNaN(player.control.input.mouse.x) && !isNaN(player.control.input.mouse.y))
							returnValue = {
								x: parseInt(player.control.input.mouse.x),
								y: parseInt(player.control.input.mouse.y)
							};
					}
					break;

				case 'xyCoordinate':

					var x = self.getValue(text.x, vars);
					var y = self.getValue(text.y, vars);

					if (x != undefined && y != undefined) {
						returnValue = { x: x, y: y };
					}
					break;

				case 'distanceBetweenPositions':
					var positionA = self.getValue(text.positionA, vars);
					var positionB = self.getValue(text.positionB, vars);
					if (positionA && positionB) {
						var a = positionA.x - positionB.x;
						var b = positionA.y - positionB.y;
						returnValue = Math.sqrt(a * a + b * b);
					}
					break;

				case 'angleBetweenPositions':
					var positionA = self.getValue(text.positionA, vars);
					var positionB = self.getValue(text.positionB, vars);
					if (
						positionA != undefined && positionB != undefined &&
						(positionB.y - positionA.y != 0 || positionB.x - positionA.x != 0) // two positions should be different
					) {
						returnValue = Math.atan2(positionB.y - positionA.y, positionB.x - positionA.x);
						returnValue += Math.radians(90);
					}

					break;

				case 'getUnitType':
					returnValue = self.getValue(text.unitType, vars);
					break;

				case 'getUnitTypeName':
					var unitTypeId = self.getValue(text.unitType, vars);
					var unitType = ige.game.getAsset('unitTypes', unitTypeId);
					if (unitType) {
						returnValue = unitType.name;
					}
					break;

				case 'getItemTypeName':
					var itemTypeId = self.getValue(text.itemType, vars);
					var itemType = ige.game.getAsset('itemTypes', itemTypeId);
					if (itemType) {
						returnValue = itemType.name;
					}
					break;

				case 'getItemName':
					var item = self.getValue(text.item, vars);
					if (item) {
						returnValue = item._stats.name;
					}
          			break;

				case 'getItemDescription':
					var item = self.getValue(text.item, vars);
					if (item && item._category == 'item') {
						returnValue = item._stats.description;
					}

					break;

				case 'getItemType':
					returnValue = self.getValue(text.itemType, vars);
					break;

				case 'getProjectileType': // get projectile type from env
					returnValue = self.getValue(text.projectileType, vars);
					break;

				case 'getProjectileTypeOfProjectile': // get projectile type of projectile
					if (entity && entity._category == 'projectile') {
						returnValue = entity._stats.type;
					} else {
						VariableComponent.prototype.log('entity not defined');
					}

					break;

				case 'getAttributeType':
					returnValue = self.getValue(text.attributeType, vars);
					break;

				case 'getItemTypeOfItem':
					if (entity && entity._stats) {
						returnValue = entity._stats.itemTypeId;
					} else if (typeof entity == 'string') {
						// if itemTypeOfItem is key of unit
						returnValue = entity;
					}
					break;

				case 'getRandomItemTypeFromItemTypeGroup':
					if (text.itemTypeGroup) {
						var variableObj = self.getValue(text.itemTypeGroup);

						if (variableObj) {
							var itemTypes = _.map(variableObj, (itemTypeInfo, itemType) => {
								return {
									itemType,
									probability: itemTypeInfo.probability
								};
							});

							var totalProbability = itemTypes.reduce((partialSum, item) => {
								return partialSum + item.probability;
							}, 0);
							var randomNumber = _.random(0, totalProbability);
							var currentHead = 0;

							for (var i = 0; i < itemTypes.length; i++) {
								var itemType = itemTypes[i];
								if (_.inRange(randomNumber, currentHead, currentHead + itemType.probability)) {
									returnValue = itemType.itemType;
								}

								currentHead += itemType.probability;
							}

							// select last item type if nothings selected
							if (!returnValue) {
								returnValue = itemTypes[itemTypes.length - 1].itemType;
							}
						}
					}

					break;

				case 'getRandomUnitTypeFromUnitTypeGroup':
					if (text.unitTypeGroup) {
						var variableObj = self.getVariable(text.unitTypeGroup.variableName);

						if (variableObj) {
							var unitTypes = _.map(variableObj, (unitTypeInfo, unitType) => {
								return {
									unitType,
									probability: unitTypeInfo.probability
								};
							});

							var totalProbability = unitTypes.reduce((partialSum, unit) => {
								return partialSum + unit.probability;
							}, 0);
							var randomNumber = _.random(0, totalProbability);
							var currentHead = 0;

							for (var i = 0; i < unitTypes.length; i++) {
								var unitType = unitTypes[i];
								// console.log(randomNumber, currentHead, currentHead + unitType.probability, _.inRange(randomNumber, currentHead, currentHead + unitType.probability));
								if (_.inRange(randomNumber, currentHead, currentHead + unitType.probability)) {
									returnValue = unitType.unitType;
								}

								currentHead += unitType.probability;
							}

							// select last unit type if nothings selected
							if (!returnValue) {
								returnValue = unitTypes[unitTypes.length - 1].unitType;
							}
						}
					}

					break;

				case 'getItemTypeDamage':
					var itemTypeId = self.getValue(text.itemType, vars);
					var itemType = ige.game.getAsset('itemTypes', itemTypeId);
					if (itemType) {
						returnValue = parseFloat(itemType.damage);
					} else {
						returnValue = 0;
					}

					break;

				case 'getItemParticle':
					var particleTypeId = self.getValue(text.particleType, vars);
					if (entity && entity._category == 'item' && particleTypeId) {
						if (entity._stats.particles) {
							var particleType = entity._stats.particles[particleTypeId];
							// only return particleTypeId if particleType exists in the item
							if (particleType) {
								returnValue = particleTypeId;
								break;
							}
						}
					}
					break;

				case 'getUnitTypeOfUnit':
					// var unit = (entity && entity._category == 'unit') ? entity : vars.selectedUnit
					var unit = entity;

					if (unit && unit._category == 'unit') {
						returnValue = unit._stats.type;
					} else if (typeof unit == 'string') {
						// if unitTypeOfUnit is key of unit
						returnValue = unit;
					} else {
						VariableComponent.prototype.log('getUnitTypeOfUnit: entity not defined');
					}
					break;

				case 'lastPurchasedUnitTypetId':
					returnValue = ige.game.lastPurchasedUniTypetId;
					break;

				case 'getXCoordinateOfRegion':
					var region = self.getValue(text.region, vars);
					if (region) {
						returnValue = region._stats.default.x;
					} else {
						VariableComponent.prototype.log('getXCoordinateOfRegion: region not defined');
					}
					break;

				case 'getYCoordinateOfRegion':
					var region = self.getValue(text.region, vars);
					if (region && region._stats && region._stats.default) {
						returnValue = region._stats.default.y;
					} else {
						VariableComponent.prototype.log('getYCoordinateOfRegion: region not defined');
					}
					break;

				case 'getWidthOfRegion':
					var region = self.getValue(text.region, vars);
					if (region) {
						returnValue = region._stats.default.width;
					} else {
						VariableComponent.prototype.log('getWidthOfRegion: region not defined');
					}
					break;

				case 'getHeightOfRegion':
					var region = self.getValue(text.region, vars);
					if (region) {
						returnValue = region._stats.default.height;
					} else {
						VariableComponent.prototype.log('getHeightOfRegion: region not defined');
					}
					break;

				case 'getEntityState':
					entity = self.getValue(text.entity, vars);
					var entity = (entity && ige.action.entityCategories.indexOf(entity._category) > -1)
						? entity
						: vars.selectedEntity;

					if (entity && ige.action.entityCategories.indexOf(entity._category) > -1) {
						returnValue = entity._stats.stateId;
					} else {
						VariableComponent.prototype.log('getEntityState: entity not defined');
					}
					break;

				case 'getRotateSpeed':
					var unitTypeId = self.getValue(text.unitType, vars);
					var unitType = ige.game.getAsset('unitTypes', unitTypeId);
					if (unitType && unitType.body && unitType.body.rotationSpeed) {
						returnValue = unitType.body.rotationSpeed;
					}
					break;

				case 'getVariable':
					// below is until parth fixes his bug
					returnValue = self.getVariable(text.variableName);
					break;

				case 'getDebrisVariable':
					var debrisData = ige.map.getDebrisData(text.debrisId);
					if (debrisData && debrisData.igeId) {
						var debris = ige.$(debrisData.igeId);
						if (debris) {
							return debris;
						}
					}
					break;

				case 'getUnitData':
					var unit = ige.variable.getValue(text.unit, vars);
					var data = unit.getPersistentData('unit');
					if (data) {
						returnValue = JSON.stringify(data)
					}
					break;

				case 'getPlayerData':
					var player = ige.variable.getValue(text.player, vars);
					var data = player.getPersistentData('player');
					if (data) {
						returnValue = JSON.stringify(data)
					}
					break;

				case 'getPlayerId':
					var player = ige.variable.getValue(text.player, vars);
					if (player) {
						returnValue = player.id()
					}
					break;

				case 'getUnitId':
					var unit = ige.variable.getValue(text.unit, vars);
					if (unit) {
						returnValue = unit.id()
					}
					break;

				case 'getLengthOfString':
					var string = self.getValue(text.string, vars);
					if (string && !isNaN(string.length)) {
						returnValue = string.length;
					}
					break;

				case 'getStringArrayLength':
					var string = self.getValue(text.string, vars);
					if (string) {
						try {
							var array = JSON.parse(string);
						} catch (err) {
							console.error(err);
						}
						returnValue = array.length;
					}
					break;

				case 'getStringArrayElement':
					var string = self.getValue(text.string, vars);
					var index = self.getValue(text.number, vars);
					if (string && index != undefined) {
						try {
							var array = JSON.parse(string);
						} catch (err) {
							console.error(err);
						}
						returnValue = array[index];
					}
					break;

				case 'insertStringArrayElement':
					var string = self.getValue(text.string, vars);
					var value = self.getValue(text.value, vars);
					if (string && value) {
						try {
							var array = JSON.parse(string);
						} catch (err) {
							console.error(err);
						}
						array.push(value);
						returnValue = JSON.stringify(array);
					}
					break;

				case 'updateStringArrayElement':
					var string = self.getValue(text.string, vars);
					var index = self.getValue(text.number, vars);
					var value = self.getValue(text.value, vars);
					if (string && value && index != undefined) {
						try {
							var array = JSON.parse(string);
						} catch (err) {
							console.error(err);
						}
						array[index] = value;
						returnValue = JSON.stringify(array);
					}
					break;

				case 'removeStringArrayElement':
					var string = self.getValue(text.string, vars);
					var index = self.getValue(text.number, vars);
					if (string && index != undefined) {
						try {
							var array = JSON.parse(string);
						} catch (err) {
							console.error(err);
						}
						array.splice(index,1)
						returnValue = JSON.stringify(array);
					}
					break;

				case 'toLowerCase':
					var string = self.getValue(text.string, vars);
					if (string && !isNaN(string.length)) {
						returnValue = string.toLowerCase();
					}
					break;

				case 'substringOf':
					var string = self.getValue(text.string, vars);
					var fromIndex = self.getValue(text.fromIndex, vars);
					var toIndex = self.getValue(text.toIndex, vars);

					if (string && string.length) {
						// index for game devs is from 1 to n as they might not be familiar with
						// string starting from index 0
						fromIndex -= 1;

						fromIndex = Math.max(Math.min(fromIndex, string.length), 0);
						toIndex = Math.max(Math.min(toIndex, string.length), 0);

						// This looks like trying to force a start index from [0, +inf], but actually puts it in [-1, +inf]. Why is it subtracted two times? (once before, now the second time here)
						returnValue = string.substring(fromIndex - 1, toIndex);
					} else {
						returnValue = '';
					}

					break;
				case 'stringStartsWith':
					var sourceString = self.getValue(text.sourceString, vars);
					var patternString = self.getValue(text.patternString, vars);

					if (sourceString && patternString && typeof sourceString == 'string' && typeof patternString == 'string') {
						returnValue = sourceString.startsWith(patternString);
					}
					break;
				case 'stringEndsWith':
					var sourceString = self.getValue(text.sourceString, vars);
					var patternString = self.getValue(text.patternString, vars);

					if (sourceString && patternString && typeof sourceString == 'string' && typeof patternString == 'string') {
						returnValue = sourceString.endsWith(patternString);
					}
					break;
				case 'replaceValuesInString':
					var sourceString = self.getValue(text.sourceString, vars);
					var matchString = self.getValue(text.matchString, vars);
					var newString = self.getValue(text.newString, vars);

					if (sourceString && matchString && newString && typeof sourceString == 'string' && typeof matchString == 'string' && typeof newString == 'string') {
						returnValue = sourceString.split(matchString).join(newString);
					}
					break;
				case 'concat':
					var stringA = self.getValue(text.textA, vars);
					var stringB = self.getValue(text.textB, vars);

					// isNaN('') is true
					if (typeof stringA === 'string' && stringA.length && !isNaN(stringA)) {
						stringA = parseFloat(stringA).toFixed(0);
					}

					if (typeof stringB === 'string' && stringB.length && !isNaN(stringB)) {
						stringB = parseFloat(stringB).toFixed(0);
					}

					returnValue = `${stringA}${stringB}`;
					break;

				case 'getMin':
					var num1 = self.getValue(text.num1, vars);
					var num2 = self.getValue(text.num2, vars);

					if (num1 != undefined && num2 != undefined) {
						returnValue = Math.min(num1, num2);
					}
					break;

				case 'getMax':
					var num1 = self.getValue(text.num1, vars);
					var num2 = self.getValue(text.num2, vars);

					if (num1 != undefined && num2 != undefined) {
						returnValue = Math.max(num1, num2);
					}
					break;

				case 'getExponent':
					var base = self.getValue(text.base, vars);
					var power = self.getValue(text.power, vars);

					if (base != undefined && power != undefined) {
						returnValue = Math.pow(base, power);
					}
					break;
					/* Groups */

				case 'allUnits':
					returnValue = ige.$$('unit');
					break;

				case 'allRegions':
					returnValue = ige.$$('region');
					break;

				case 'allUnitsOwnedByPlayer':
					var player = self.getValue(text.player, vars);

					if (player) {
						var units = [];
						for (var i = 0; i < player._stats.unitIds.length; i++) {
							var unitId = player._stats.unitIds[i];
							units.push(ige.$(unitId));
						}
						returnValue = units;
					}

					break;

				case 'allUnitsInRegion':
					// if we have the properties needed to get the units in a region
					var region = self.getValue(text.region, vars);

					if (region) {
						var regionBounds = region._stats ? region._stats.default : region;
						returnValue = ige.physics.getBodiesInRegion(regionBounds)
							.filter(({ _category }) => {
								return _category === 'unit';
							});
					} else { // the entire map
						returnValue = [];
					}

					break;

				case 'allPlayers':
					returnValue = ige.$$('player');
					break;

				case 'humanPlayers':
					returnValue = ige.$$('player').filter(function (player) { return player._stats.controlledBy == 'human'; });
					break;

				case 'computerPlayers':
					returnValue = ige.$$('player').filter(function (player) { return player._stats.controlledBy != 'human'; });
					break;

				case 'allItems':
					returnValue = ige.$$('item');
					break;

				case 'allDebris':
					returnValue = ige.$$('debris');
					break;

				case 'allProjectiles':
					returnValue = ige.$$('projectile');
					break;

				/* entity */
				case 'getEntityVariable':
					// console.log('text.variable', text.variable);
					returnValue = text.variable;
					break;

				case 'allEntities':
					var igeRegister = ige.register();
					returnValue = _.values(igeRegister)
						.filter(({ _category }) => {
							return ige.action.entityCategories.includes(_category) || !_category;
						});
					break;

				case 'entitiesInRegionInFrontOfEntityAtDistance':
					var entity = self.getValue(text.entity, vars);
					var distance = self.getValue(text.distance, vars);
					var width = self.getValue(text.width, vars);
					var height = self.getValue(text.height, vars);

					if (
						entity != undefined &&
						ige.action.entityCategories.indexOf(entity._category) > -1 &&
						height != undefined &&
						width != undefined &&
						distance != undefined
					) {
						// console.log(entity._translate.x, distance * Math.cos(entity._rotate.z + Math.radians(-90)));
						// console.log(entity._translate.y, distance * Math.sin(entity._rotate.z + Math.radians(-90)));
						var region = {
							x: entity._translate.x + (distance * Math.cos(entity._rotate.z + Math.radians(-90))),
							y: entity._translate.y + (distance * Math.sin(entity._rotate.z + Math.radians(-90))),
							width: width,
							height: height
						};

						region.x -= region.width / 2;
						region.y -= region.height / 2;

						if (region.x && !isNaN(region.x) && region.y && !isNaN(region.y) && region.width && !isNaN(region.width) && region.height && !isNaN(region.height)) {
							returnValue = ige.physics.getBodiesInRegion(region).filter(({ _category }) => {
								return ige.action.entityCategories.includes(_category) || !_category;
							});
						} else {
							ige.script.errorLog(`region ${JSON.stringify(region)} is not a valid region`);
							returnValue = [];
						}
					}

					break;
				case 'entitiesInRegion':
					var region = self.getValue(text.region, vars);

					var id = ige.game.lastCastingUnitId;
					var unit = ige.$(id);

					if (region) {
						// region represent some instance of IgeRegion
						if (region._stats) {
							returnValue = ige.physics.getBodiesInRegion(region._stats.default)
								.filter(({ _category }) => {
									return ige.action.entityCategories.includes(_category) || !_category;
								});
						} else {
							returnValue = ige.physics.getBodiesInRegion(region)
								.filter(({ _category }) => {
									return ige.action.entityCategories.includes(_category) || !_category;
								});
						}
					} else {
						ige.script.errorLog('region is not a valid region');
						returnValue = [];
					}

					break;

				case 'getEntityType':
					var entity = self.getValue(text.entity, vars);
					if (entity) {
						returnValue = entity._category || 'wall';
					}

					break;

				case 'getTimeString':
					var seconds = self.getValue(text.seconds, vars);

					returnValue = new Date(parseFloat(seconds) * 1000).toISOString().substr(11, 8);
					break;

				case 'getValueOfEntityVariable':
					var variableData = self.getValue(text.variable, vars);
					var entity = self.getValue(text.entity, vars);

					if (entity && variableData) {
						var entityVariable = entity.variables &&
							entity.variables[variableData.key] &&
							entity.variables[variableData.key];

						if (entityVariable) {
							returnValue = entityVariable.value;

							if (returnValue === null || returnValue == undefined) {
								returnValue = entityVariable.default;
							}

							if (variableData.dataType === 'region') {
								returnValue.key = variableData.key;
							}
						}
					}

					break;

				case 'undefinedValue':
					returnValue = undefined;
					break;

				default:
					if (text.function) {
						ige.script.errorLog(`warning: function '${text.function}' not found`);
					} else {
						returnValue = text;
					}
					break;
			}
		}

		// For debugging purpose. if type of returnValue is object, it can sometimes cause TypeError: Converting circular structure to JSON
		if (ige.isServer) {
			var output = returnValue;
			if (typeof returnValue == 'object' && returnValue && returnValue._category) {
				output = returnValue._category;
			}
		}

		return returnValue;
	},

	calculate: function (items, vars) {
		var self = this;

		if (items == undefined)
			return;

		if ((items && items.constructor != Array) || typeof items == 'number') {
			var solution = this.getValue(items, vars);
			return parseFloat(solution);
		}

		var op = items[0];
		var left = this.getValue(items[1], vars);
		var right = this.getValue(items[2], vars);

		// const [op, left, right] = items

		var result = undefined;

		if (op == '+' || op.operator == '+') {
			result = this.calculate(left, vars) + this.calculate(right, vars);
		} else if (op == '-' || op.operator == '-') {
			result = this.calculate(left, vars) - this.calculate(right, vars);
		} else if (op == '*' || op.operator == '*') {
			result = this.calculate(left, vars) * this.calculate(right, vars);
		} else if (op == '/' || op.operator == '/') {
			result = this.calculate(left, vars) / this.calculate(right, vars);
		} else if (op == '%' || op.operator == '%') {
			result = this.calculate(left, vars) % this.calculate(right, vars);
		}

		if (isNaN(result)) {
			ige.script.errorLog('\'Calculate\' detected NaN value. Returning undefined');
			return undefined;
		}

		return result;
	},

	getAllVariables: function (selectedTypes) {
		var returnObj = {};

		for (var variableName in ige.game.data.variables) {
			var variable = ige.game.data.variables[variableName];

			if (!selectedTypes || selectedTypes.includes(variable.dataType)) {
				// if variable's current value isn't set, set value as default
				if (variable.value == undefined && variable.default != undefined) {
					if (variable.dataType == 'player' || variable.dataType == 'unit') {
						variable.value = ige.game[variable.default];
					} else if (variable.dataType == 'region') {
						var region = ige.regionManager.getRegionById(variableName);
						variable.value = region || variable.default;
						variable.value.key = variableName;
						return variable.value;
					} else {
						variable.value = variable.default;
					}

					// after retrieving variable data, nullify the default value,
					// otherwise, if .value is set to null intentionally, default value will be returned instead.
					variable.default = null;
				}

				returnObj[variableName] = variable.value;
			}
		}

		return returnObj;
	},

	getVariable: function (variableName) {
		var variable = ige.game.data.variables[variableName];
		if (variable) {
			// if variable's current value isn't set, set value as default
			if (variable.value == undefined && variable.default != undefined) {
				if (variable.dataType == 'player' || variable.dataType == 'unit') {
					variable.value = ige.game[variable.default];
				} else if (variable.dataType == 'region') {
					var region = ige.regionManager.getRegionById(variableName);
					variable.value = region || variable.default;
					variable.value.key = variableName;
					return variable.value;
				} else {
					variable.value = variable.default;
				}

				// after retrieving variable data, nullify the default value,
				// otherwise, if .value is set to null intentionally, default value will be returned instead.
				variable.default = null;
			}

			return variable.value;
		}
		return null;
	},

	setGlobalVariable: function (name, newValue) {
		if (ige.isServer) {
			if (ige.game.data.variables.hasOwnProperty(name)) {
				ige.game.data.variables[name].value = newValue;
				// if variable has default field then it will be returned when variable's value is undefined
				if (
					newValue === undefined &&
					action.value &&
					action.value.function === 'undefinedValue' &&
					ige.game.data.variables[name].hasOwnProperty('default')
				) {
					ige.game.data.variables[name].default = undefined;
				}
			}

			params.newValue = newValue;
			this.updateDevConsole({ type: 'setVariable', params: params });
		} else if (ige.isClient) {

		}
	},

	// update dev console table w/ latest setValue data
	updateDevConsole: function (data) {
		var self = this;
		// if a developer is connected, send
		if (ige.isServer && (ige.server.developerClientIds.length || process.env.ENV === 'standalone' || process.env.ENV == 'standalone-remote')) {
			// only show 'object' string if env variable is object
			if (typeof data.params.newValue == 'object') {
				if (data.params.newValue._stats) {
					self.devLogs[data.params.variableName] = `object (${data.params.newValue._category}): ${data.params.newValue._stats.name}`;
				} else {
					self.devLogs[data.params.variableName] = 'object';
				}
			} else // otherwise, show the actual value
			{
				self.devLogs[data.params.variableName] = data.params.newValue;
			}
		} else if (ige.isClient) {
			// update GS CPU graphs if data present
			if (data.status && data.status.cpu) {
				// cpu time spent in user code (ms) since last dev console update - may end up being greater than actual elapsed time if multiple CPU cores are performing work for this process
				if (data.status.cpu.user) {
					statsPanels.serverCpuUser._serverCpuUserPanel.update(data.status.cpu.user * 0.001, 1000);
				}
				// cpu time spent in system code (ms) since last dev console update
				if (data.status.cpu.system) {
					statsPanels.serverCpuSystem._serverCpuSystemPanel.update(data.status.cpu.system * 0.001, 1000);
				}
			}

			var totalAttrsCount = 0;
			for (variableName in data) {
				if (variableName !== 'status') {
					var div = $(`#variables-div div.col-sm-12[name='${variableName}']`);
					var newValue = data[variableName];
					if (div.length) {
						div.find('.setVariable-value').html(newValue);
					} else {
						$('#variables-div').append(
							$('<div/>', {
								name: variableName,
								class: 'col-sm-12',
								style: 'font-size: 12px'
							}).append(
								$('<td/>', {
									html: variableName,
									style: 'color:yellow; padding-left: 10px'
								})
							).append(
								$('<td/>', {
									class: 'setVariable-value text-left',
									html: newValue,
									style: 'padding: 0px 10px 0px 10px'
								})
							)
						);
					}

					totalAttrsCount++;
				}
			}

			if (data.status != {} && ige.physics && ige.physics.engine != 'CRASH') {
				// if streaming entity cound > 150 warn user
				if (data.status && data.status.entityCount && data.status.entityCount.streaming > 150 && !self.streamingWarningShown) {
					$('#streaming-entity-warning').show();
					self.streamingWarningShown = true;
				}

				var innerHtml = '';

				innerHtml = `${'' +
					'<table class="table table-hover text-center" style="border:1px solid #eceeef">' +
					'<tr>' +
					'<th>Entity Count</th>' +
					'<th class="text-center">Server</th>' +
					'<th class="text-center">Client</th>' +
					'<th class="text-center">Server Bandwidth</th>' +
					'</tr>' +
					'<tr>' +
					'<td>Unit</td>' +
					'<td>'}${data.status.entityCount.unit}</td>` +
					`<td>${ige.$$('unit').length}</td>` +
					`<td>${data.status.bandwidth.unit}</td>` +
					'</tr>' +
					'<tr>' +
					'<td>Item</td>' +
					`<td>${data.status.entityCount.item}</td>` +
					`<td>${ige.$$('item').length}</td>` +
					`<td>${data.status.bandwidth.item}</td>` +
					'</tr>' +
					'<tr>' +
					'<td>Player</td>' +
					`<td>${data.status.entityCount.player}</td>` +
					`<td>${ige.$$('player').length}</td>` +
					`<td>${data.status.bandwidth.player}</td>` +
					'</tr>' +
					'<tr>' +
					'<td>Debris</td>' +
					`<td>${data.status.entityCount.debris}</td>` +
					`<td>${ige.$$('debris').length}</td>` +
					`<td>${data.status.bandwidth.debris}</td>` +
					'</tr>' +
					'<tr>' +
					'<td>Projectile</td>' +
					`<td>${data.status.entityCount.projectile}</td>` +
					`<td>${ige.$$('projectile').length}</td>` +
					`<td>${data.status.bandwidth.projectile}</td>` +
					'</tr>' +
					'<tr>' +
					'<td>Region</td>' +
					`<td>${data.status.entityCount.region}</td>` +
					`<td>${ige.$$('region').length}</td>` +
					`<td>${data.status.bandwidth.region}</td>` +
					'</tr>' +
					'<tr>' +
					'<td>Sensor</td>' +
					`<td>${data.status.entityCount.sensor}</td>` +
					`<td>${ige.$$('sensor').length}</td>` +
					`<td>${data.status.bandwidth.sensor}</td>` +
					'</tr>' +
					'<tr>' +
					'<th colspan= >Physics</th>' +
					`<th>${data.status.physics.engine}</th>` +
					`<th>${ige.physics.engine}</th>` +
					'<td></td>' +
					'</tr>' +
					'<tr>' +
					'<td>Bodies</td>' +
					`<td>${data.status.physics.bodyCount}</td>` +
					`<td>${(ige.physics._world) ? ige.physics._world.m_bodyCount : ''}</td>` +
					'<td></td>' +
					'</tr>' +
					'<tr>' +
					'<td>Joints</td>' +
					`<td>${data.status.physics.jointCount}</td>` +
					`<td>${(ige.physics._world) ? ige.physics._world.m_jointCount : ''}</td>` +
					'<td></td>' +
					'</tr>' +
					'<tr>' +
					'<td>Contacts</td>' +
					`<td>${data.status.physics.contactCount}</td>` +
					`<td>${(ige.physics._world) ? ige.physics._world.m_contactCount : ''}</td>` +
					'<td></td>' +
					'</tr>' +
					'<tr>' +
					'<td>Heap used</td>' +
					`<td>${data.status.heapUsed.toFixed(2)}</td>` +
					`<td>${(window.performance.memory.usedJSHeapSize / 1000000).toFixed(2)}</td>` +
					'<td></td>' +
					'</tr>' +
					'<tr>' +
					'<td>Avg Step Duration(ms)</td>' +
					`<td>${data.status.physics.stepDuration}</td>` +
					`<td>${(ige.physics._world) ? ige.physics.avgPhysicsTickDuration.toFixed(2) : ''}</td>` +
					'<td></td>' +
					'</tr>' +
					'<tr>' +
					'<td>Physics FPS</td>' +
					`<td>${data.status.physics.stepsPerSecond}</td>` +
					`<td>${ige._physicsFPS}</td>` +
					'<td></td>' +
					'</tr>' +
					'<tr>' +
					'<th colspan=3>Etc</th><th>Time Scale</th>' +
					'</tr>' +
					'<tr>' +
					'<td>Current Time</td>' +
					// + '<td>' + data.status.currentTime + '(' + (data.status.currentTime - this.prevServerTime) + ')' + '</td>'
					// + '<td>' + Math.floor(ige._currentTime) + '(' + (Math.floor(ige._currentTime) - this.prevClientTime) + ')' + '</td>'
					`<td>${data.status.currentTime}</td>` +
					`<td>${Math.floor(ige._currentTime)}(${Math.floor(ige._currentTime) - data.status.currentTime})</td>` +
					`<td>${ige.timeScale()}</td>` +
					'</tr>' +

					'<tr>' +
					'<td>Client Count</td>' +
					`<td>${data.status.clientCount}</td>` +
					'<td></td>' +
					'<td></td>' +
					'</tr>' +

					'<tr>' +
					'<td>entityUpdateQueue size</td>' +
					'<td></td>' +
					`<td>${Object.keys(ige.client.entityUpdateQueue).length}</td>` +
					'<td></td>' +
					'</tr>' +
					'<tr>' +
					'<td>Total players created</td>' +
					`<td>${data.status.etc.totalPlayersCreated}</td>` +
					'<td></td>' +
					'<td></td>' +
					'</tr>' +

					'<tr>' +
					'<td>Total units created</td>' +
					`<td>${data.status.etc.totalUnitsCreated}</td>` +
					'<td></td>' +
					'<td></td>' +
					'</tr>' +

					'<tr>' +
					'<td>Total items created</td>' +
					`<td>${data.status.etc.totalItemsCreated}</td>` +
					'<td></td>' +
					'<td></td>' +
					'</tr>' +

					'<tr>' +
					'<td>Total Bodies Created</td>' +
					`<td>${data.status.physics.totalBodiesCreated}</td>` +
					`<td>${(ige.physics._world) ? ige.physics.totalBodiesCreated : ''}</td>` +
					'<td></td>' +
					'</tr>' +

					'<tr>' +
					'<td>CPU Usage</td>' +
					`<td>${data.status.cpuDelta}</td>` +
					'<td></td>' +
					'<td></td>' +
					'</tr>' +

					'<tr>' +
					'<td>Last Snapshot Length</td>' +
					`<td>${data.status.lastSnapshotLength}</td>` +
					'<td></td>' +
					'<td></td>' +
					'</tr>' +

					'</table>';

				this.prevServerTime = data.status.currentTime;
				this.prevClientTime = Math.floor(ige._currentTime);

				$('#dev-status-content').html(innerHtml);
				self.secondCount++;
			}
		}
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = VariableComponent; }
