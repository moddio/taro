var LeaderboardComponent = IgeEntity.extend({
	classId: 'LeaderboardComponent',
	componentId: 'leaderboard',

	init: function () {
		var self = this
		// self.scoreAttributeId = ige.game.data.settings.scoreBoard
		// console.log("ige.game.data.settings", ige.game.data.settings)
		self.scoreAttributeId = ige.game.data.settings.scoreAttributeId
		self._hidden = false;

		self.setUI();
	},

	setUI: function () {
		if (ige.mobileControls.isMobile) {
			$('#leaderboard-header').addClass('small');
			$('#leaderboard').addClass('small');
		}
		else {
			$('#leaderboard-header').addClass('h5');
			$('#leaderboard').addClass('h6');
			$('#leaderboard')
				.addClass('h3')
				.removeClass('d-none');
		}


		$(function () {
			$.contextMenu({
				selector: '.leaderboard-user-entry',
				build: function ($trigger) {
					var userData = $trigger.data();
					var myPlayer = ige.client.myPlayer;

					if (!myPlayer || !myPlayer._stats) {
						return;
					}

					var userId = myPlayer._stats.userId;
					var mutedUsers = myPlayer._stats.mutedUsers;
					if (userId === userData.userId) {
						// user cannot perform action on his/her own player
						return;
					}

					ige.leaderboard.selectedUser = userData;

					var index = mutedUsers.indexOf(ige.leaderboard.selectedUser.userId);

					return {
						callback: function (key) {
							switch (key) {
								case 'unmute': {
									mutedUsers.splice(index, 1);
									$.ajax({
										url: "/api/user/toggle-mute/" + ige.leaderboard.selectedUser.userId,
										type: 'POST',
										success: function (data) {
											console.log(data);											// alert('request sent');
										}
									})
									break;
								}
								case 'mute': {
									mutedUsers.push(ige.leaderboard.selectedUser.userId);
									$.ajax({
										url: "/api/user/toggle-mute/" + ige.leaderboard.selectedUser.userId,
										type: 'POST',
										success: function (data) {
											console.log(data);											// alert('request sent');											
										}
									})
									break;
								}
								case 'addFriend': {
									$.ajax({
										url: "/api/user/request/" + ige.leaderboard.selectedUser.userId,
										type: 'POST',
										success: function (data) {
											alert('request sent');
										}
									})
									break;
								}
							}
						},
						items: {
							addFriend: {
								name: "Add Friend"
							},
							separator: { "type": "cm_separator" },
							unmute: {
								name: "Unmute " + ige.leaderboard.selectedUser.userName,
								visible: index > -1
							},
							mute: {
								name: "Mute " + ige.leaderboard.selectedUser.userName,
								visible: index === -1,
								className: 'context-menu-item context-menu-hover context-menu-danger'
							},
						}
					};
				}
			});
		});
	},

	convertNumbersToKMB: function (labelValue) {

		// Nine Zeroes for Billions
		return Math.abs(Number(labelValue)) >= 1.0e+9

			? (Math.abs(Number(labelValue)) / 1.0e+9).toFixed(2) + "B"
			// Six Zeroes for Millions 
			: Math.abs(Number(labelValue)) >= 1.0e+6

				? (Math.abs(Number(labelValue)) / 1.0e+6).toFixed(2) + "M"
				// Three Zeroes for Thousands
				: Math.abs(Number(labelValue)) >= 1.0e+3

					? (Math.abs(Number(labelValue)) / 1.0e+3).toFixed(2) + "K"

					: Math.abs(Number(labelValue));

	},

	update: function () {
		var self = this
		var DEFAULT_COLOR = "white";

		if (ige.isClient) {
			var sortedScores = [];
			var players = ige.$$('player')
			var topPlayersToShow = ige.mobileControls.isMobile ? 3 : 10;

			players.forEach(function (player) {
				if (player._stats && player._stats.clientId) // only display human players on scoreboard
				{
					var clientId = player._stats.clientId
					var score = 0
					if (self.scoreAttributeId && player._stats.attributes && player._stats.attributes[self.scoreAttributeId]) {
						var playerAttribute = player._stats.attributes[self.scoreAttributeId]
						score = playerAttribute.value
					}

					sortedScores.push({
						'key': clientId,
						'value': parseInt(score)
					});
				}
			})

			sortedScores.sort(function (a, b) {
				return a.value - b.value
			});

			var scoreboard = "";
			for (var i = sortedScores.length - 1; i >= 0; i--) {
				var clientId = sortedScores[i].key
				var player = ige.game.getPlayerByClientId(clientId);
				var defaultFontWeight = 500;
				if (player) {
					var color = null; // color to indicate human, animal, or my player on scoreboard

					var playerType = ige.game.getAsset('playerTypes', player._stats.playerTypeId)

					if (playerType && playerType.color) {
						color = playerType.color
					}
					if (player._stats.clientId == ige.network.id()) {
						defaultFontWeight = 800;
						color = '#99FF00';
					}

					var readableName = player._stats.name;

					readableName = readableName.replace(/>/g, '&gt;');

					color = color || DEFAULT_COLOR;
					scoreboard += "<div data-user-name='" + player._stats.name + "' data-user-id='" + player._stats.userId + "' class='cursor-pointer mb-2 scoreboard-user-entry' style='color: " + color + ";font-weight:" + defaultFontWeight + "'>" + readableName + " <small><span>" + self.convertNumbersToKMB(sortedScores[i].value) + "</span></small></div>";
				}
			}

			ige.client.clientCount = sortedScores.length;

			$("#player-count").html(players.length);

			if (self._hidden) {
				$("#scoreboard").html('');
				$("#scoreboard-toggle").html('&nbsp;<i class="far fa-caret-square-down" aria-hidden="true" onclick="ige.scoreboard.toggleScores()" style="cursor:pointer;"></i>');
			} else {
				$("#scoreboard").html(scoreboard);
				$("#scoreboard-toggle").html('&nbsp;<i class="far fa-caret-square-up" aria-hidden="true" onclick="ige.scoreboard.toggleScores()" style="cursor:pointer;"></i>');
			}
		}

	},

	hideScores: function () {
		this._hidden = true;
	},

	showScores: function () {
		this._hidden = false;
	},

	toggleScores: function () {
		this._hidden = !this._hidden;
	}

})

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = LeaderboardComponent; }