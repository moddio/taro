var VideoChatComponent = IgeEntity.extend({
	classId: 'VideoChatComponent',
	componentId: 'videoChat',

	init: function (entity, options) {
		var self = this;
		self._entity = entity;
		self.groups = {};
		self.playerDistances = {};

		if (ige.isServer) {

			self.chatEnterDistance = 50000
			self.chatLeaveDistance = 50000

			// update player groups every 1s
			setInterval(self.updatePlayerGroups, 1000, self);
		} else if (ige.isClient) {
			self.minRange = 300 // myPlayer's video & audio chat radius. when range is at 700, fade value & audio should be at 0.
			self.maxRange = 700
			if (typeof videoChatUpdateSpatialVideo == 'function') {
				setInterval(self.updatePlayerDistanceMatrix, 200, self);
			}
		}

	},

	updatePlayerGroups: function (self) {
		var players = ige.$$('player').filter(function (player) { return player._stats.controlledBy == 'human' })
		// var players = ige.$$('player')

		// update centoid of the groups
		for (groupId in self.groups) {
			var group = self.groups[groupId];
			var polygons = self.getPolygons(group.playerIds)
			var centoid = self.getCentoid(polygons);
			// delete empty group
			if (centoid == undefined) {
				delete self.groups[groupId]
				continue;
			}
			self.groups[groupId].centoid = centoid;
			// console.log("group", groupId, " size: ", group.playerIds.length, "centoid", group.centoid)
			// if (isNaN(group.centoid.x)) {
			// 	console.log(self.groups[groupId])
			// 	var playerIds = self.groups[groupId].playerIds;
			// 	for (var i = 0; i < playerIds.length; i++) {
			// 		var playerId = playerIds[i]
			// 		console.log("inspecting player", playerId)
			// 		var player = ige.$(playerId);
			// 		var unit = player.getSelectedUnit();
			// 		if (unit != undefined)
			// 			console.log(unit._translate)
			// 		else
			// 			console.log("unit doesn't exist")
			// 	}
			// }
		}

		for (var i = 0; i < players.length; i++) {
			var player = players[i]
			if (player) {
				var playerId = player.id()
				var unit = player.getSelectedUnit();
				if (unit) {
					if (player.vcGroupId) {
						var group = self.groups[player.vcGroupId];
						// if the Player belongs to a group and is out of range from the group's centoid, then kick that player out of the group
						if (group) {
							var centoid = group.centoid;
							var distance = self.getDistance(centoid, unit._translate)
							if (distance > self.chatLeaveDistance) {
								self.removePlayerFromGroup(playerId)
							}
						}
					} else { // if the Player doesn't belong in any group					
						// check if the Player is within enter range of any group. If so, make Player enter the group.
						for (groupId in self.groups) {
							var group = self.groups[groupId];
							if (group) {
								var centoid = group.centoid;
								var distance = self.getDistance(centoid, unit._translate)
								if (distance < self.chatEnterDistance) {
									self.addPlayerToGroup(playerId, groupId)
									break;
								}
							}
						}
						// check if a player is within chat range. If that player also doesn't belong is a group, then create a new group
						for (var j = 0; j < players.length; j++) {
							var playerB = players[j]
							if (playerB) {
								var playerBId = playerB.id();
								if (playerId != playerBId) {
									var unitB = playerB.getSelectedUnit();
									if (unitB && playerB.vcGroupId == undefined) {
										var distance = self.getDistance(unit._translate, unitB._translate);
										if (distance < self.chatEnterDistance) {
											self.createGroup([playerId, playerBId])
											break;
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},

	getDistance: function (A, B) {
		var xDiff = A.x - B.x;
		var yDiff = A.y - B.y;

		return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
	},

	createGroup: function (playerIds) {
		var self = this;
		// group needs ID, and its members' PlayerID and their positions
		// console.log("creating a group.. initial members:", playerIds)
		var groupId = ige.newIdHex();
		self.groups[groupId] = {
			playerIds: []
		}
		for (i = 0; i < playerIds.length; i++) {
			var playerId = playerIds[i];
			self.addPlayerToGroup(playerId, groupId)
		}

		var polygons = self.getPolygons(self.groups[groupId].playerIds)
		self.groups[groupId].centoid = self.getCentoid(polygons)
	},

	// param: destroy group that contains PlayerId
	destroyGroup: function (id) {
		for (groupId in this.groups) {
			if (groupId == id) {
				// unset the existing members' vcGroupIDs
				var playerIds = this.groups[id].playerIds
				if (playerIds) {
					for (i = 0; i < playerIds.length; i++) {
						var playerId = playerIds[i]
						var player = ige.$(playerId);
						if (player) {
							this.removePlayerFromGroup(playerId)
						}
					}
				}

				delete this.groups[id];
			}
		}
	},

	addPlayerToGroup: function (playerId, groupId) {
		var player = ige.$(playerId);
		if (player) {
			this.groups[groupId].playerIds.push(playerId)
			player.vcGroupId = groupId;
			console.log("Adding player ", player._stats.name, "(", playerId, ") from the group", groupId)
			ige.network.send("videoChat", { command: "joinGroup", groupId: groupId }, player._stats.clientId)
		} else {
			console.log("Cannot add player to videoChat group. Player doesn't exist!")
		}
	},

	removePlayerFromGroup: function (playerId) {
		var player = ige.$(playerId);
		if (player) {
			if (player.vcGroupId) {
				var playerIds = this.groups[player.vcGroupId].playerIds
				if (playerIds) {
					for (i = 0; i < playerIds.length; i++) {
						if (playerIds[i] == playerId) {
							console.log("Removing player ", player._stats.name, "(", playerId, ") from the group", player.vcGroupId)
							this.groups[player.vcGroupId].playerIds.splice(i, 1);
							ige.network.send("videoChat", { command: "leaveGroup" }, player._stats.clientId)

							// if there's only 1 person in a group, destroy the group
							if (this.groups[player.vcGroupId].playerIds.length <= 1) {
								this.destroyGroup(player.vcGroupId)
							}
							break;
						}
					}
				}
			}
			player.vcGroupId = undefined
		} else {
			console.log("Cannot add player to videoChat group. Player doesn't exist!")
		}
	},

	getPolygons: function (playerIds) {
		var polygons = []
		if (playerIds) {
			for (var i = 0; i < playerIds.length; i++) {
				var playerId = playerIds[i];
				var player = ige.$(playerId);
				if (player) {
					var unit = player.getSelectedUnit();
					if (unit) {
						polygons.push([unit._translate.x, unit._translate.y])
					}
				}
			}
		}
		return polygons;
	},

	getCentoid: function (polygons) {
		// console.log("polygons", polygons)
		if (polygons == undefined || polygons.length == 0) {
			return undefined;
		}

		var centroid = { x: 0, y: 0 };
		for (var i = 0; i < polygons.length; i++) {
			var point = polygons[i];
			centroid.x += point[0];
			centroid.y += point[1];
		}
		centroid.x /= polygons.length;
		centroid.y /= polygons.length;
		return centroid;
	},

	updatePlayerDistanceMatrix: function (self) {

		self.playerDistances = {};
		var players = ige.$$('player').filter(function (player) { return player._stats.controlledBy == 'human' });

		for (var i = 0; i < players.length; i++) {
			var playerA = players[i]
			var playerAId = playerA.id()
			if (playerA) {

				if (self.playerDistances[playerAId] == undefined) {
					self.playerDistances[playerAId] = {}
				}

				var unitA = playerA.getSelectedUnit();
				if (unitA) {
					for (var j = 0; j < players.length; j++) {
						if (i != j) { // dont compare distance between same unit
							var playerB = players[j]

							if (playerB) {
								var playerBId = playerB.id()
								var unitB = playerB.getSelectedUnit();
								if (unitB) {
									self.playerDistances[playerAId][playerBId] = self.getDistance(unitA._translate, unitB._translate);
								}
							}
						}
					}
				}
			}
		}

		// console.log(self.playerDistances)
		if (ige.client.myPlayer != undefined) {
			videoChatUpdateSpatialVideo(self.playerDistances[ige.client.myPlayer.id()])
		}
		//console.log("distance to other players", self.playerDistances[ige.client.myPlayer.id()])
	}


});


if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = VideoChatComponent; }
