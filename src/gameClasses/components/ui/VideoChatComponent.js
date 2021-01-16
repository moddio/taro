var VideoChatComponent = IgeEntity.extend({
	classId: 'VideoChatComponent',
	componentId: 'videoChat',

	init: function (entity, options) {
		var self = this;
		self._entity = entity;
		self.groups = {};
		self.chatEnterDistance = 300
		self.chatLeaveDistance = 170
		
		// update player groups every 1s
		setInterval(self.updatePlayerGroups, 1000, self);
	},

	updatePlayerGroups: function(self) {
		var players = ige.$$('player').filter(function (player) { return player._stats.controlledBy == 'human' })
		
		// update centoid of the groups
		for (groupId in self.groups) {
			var group = self.groups[groupId];
			var polygons = self.getPolygons(group.playerIds)
			self.groups[groupId].centoid = self.getCentoid(polygons);
			console.log("group", groupId, " size: ", group.playerIds.length, "centoid", group.centoid)
		}

		for (var i = 0; i < players.length; i++) {
			var player = players[i]
			if (player) {
				var playerId = player.id()
				var unit = player.getSelectedUnit();
				if (unit && player.vcGroupId) {
					var group =  self.groups[player.vcGroupId];
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
						var group =  self.groups[groupId];
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
	},

	getDistance: function(A, B) {
		var xDiff = A.x - B.x;
		var yDiff = A.y - B.y;

		return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
	},

	createGroup: function(playerIds) {
		var self = this;
		// group needs ID, and its members' PlayerID and their positions
		console.log("creating a group.. initial members:", playerIds)
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
	destroyGroup: function(id) {
		for (groupId in this.groups) {
			if (groupId == id) {
				// unset the existing members' vcGroupIDs
				var playerIds = this.groups[id].playerIds
				if (playerIds) {
					for (i=0; i < playerIds.length; i++) {
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

	addPlayerToGroup: function(playerId, groupId) {
		var player = ige.$(playerId);
		if (player) {
			this.groups[groupId].playerIds.push(playerId)
			player.vcGroupId = groupId;
			console.log("Adding player ", player._stats.name, "(", playerId,") from the group", groupId)
			ige.network.send("videoChat", {command: "joinGroup", groupId: groupId}, player._stats.clientId)
		} else {
			console.log("Cannot add player to videoChat group. Player doesn't exist!")
		}		
	},

	removePlayerFromGroup: function(playerId) {
		var player = ige.$(playerId);
		if (player) {
			if (player.vcGroupId) {
				var playerIds = this.groups[player.vcGroupId].playerIds
				if (playerIds) {
					for (i=0; i < playerIds.length; i++) {
						if (playerIds[i] == playerId) {
							console.log("Removing player ", player._stats.name, "(", playerId,") from the group", player.vcGroupId)
							this.groups[player.vcGroupId].playerIds.splice(i, 1);
							ige.network.send("videoChat", {command: "leaveGroup"}, player._stats.clientId)
							
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

	getPolygons: function(playerIds) {
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

	getCentoid: function(points) {
		var centroid = {x: 0, y: 0};
		for(var i = 0; i < points.length; i++) {
			var point = points[i];
			centroid.x += point[0];
			centroid.y += point[1];
		}
		centroid.x /= points.length;
		centroid.y /= points.length;
		return centroid;
	}
});


if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = VideoChatComponent; }