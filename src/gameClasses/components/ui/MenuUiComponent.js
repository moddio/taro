var MenuUiComponent = IgeEntity.extend({
	classId: 'MenuUiComponent',
	componentId: 'menuUi',

	init: function () {
		var self = this;
		// adding event for taro engine button
		var playButtonClick = document.querySelector("#play-game-button")

		if (ige.isClient) {
			console.log('initializing UI elements...');
			self.shopType = '';
			self.shopKey = '';
			self.shopPage = 1;

			$('#reconnect-button').on('click', function () {
				location.reload();
			});

			$('#kick-player').on('click', function () {
				$('#kick-players-outofgame-modal').modal('show');
			});

			// $(".inventory-item-button").on("click", function () {
			// 	if (ige.client.selectedUnit) {
			// 		var index = $(this).attr('name');
			// 		ige.client.selectedUnit._stats.currentItemIndex = index;
			// 		ige.client.selectedUnit.changeItem(index);
			// 	}
			// });

			$('#resolution-high').on('click', function () {
				localStorage.setItem('resolution', 'high');
				self.setResolution();
			});

			$('#resolution-low').on('click', function () {
				// setting 640x480 resolution as low resolution
				if ($('#igeFrontBuffer').attr('width') != 640 && $('#igeFrontBuffer').attr('height') != 480) {
					localStorage.setItem('resolution', 'low');
					self.setResolution();
					if (typeof incrLowResolution === 'function') {
						incrLowResolution();
					}
				}
			});

			// register error log modal btn;
			$('#dev-error-button').on('click', function () {
				$('#error-log-modal').modal('show');
			});

			$('#bandwidth-usage').on('click', function () {
				$('#dev-status-modal').modal('show');
			});

			$('#leaderboard-link').on('click', function (e) {
				e.preventDefault();
				$('#leaderboard-modal').modal('show');
			});

			$('#refresh-server-list-button').on('click', function () {
				ige.client.refreshServerList();
			});

			$('#max-players').on('change', function () {
				ige.client.refreshServerList();
			});

			$('#map-list').on('change', function () {
				ige.client.refreshServerList();
			});

			$('#kick-player-body').on('click', '.kick-player-btn', function () {
				var clientId = $(this).attr('data-clientid');
				if ((ige.game.data.isDeveloper || (ige.client.myPlayer && ige.client.myPlayer._stats.isUserMod)) && clientId) {
					ige.network.send('kick', clientId);
				}
			});

			$('#kick-player-body').on('click', '.ban-player-btn', function () {
				var userId = $(this).attr('data-userId');
				var gameId = $(this).attr('data-gameId');
				var clientId = $(this).attr('data-clientid');
				if ((ige.game.data.isDeveloper || (ige.client.myPlayer && ige.client.myPlayer._stats.isUserMod)) && userId) {
					ige.network.send('ban-user', { kickuserId: clientId, userId: userId });
				}
			});

			$('#kick-player-body').on('click', '.ban-ip-btn', function () {
				var gameId = $(this).attr('data-gameId');
				var clientId = $(this).attr('data-clientid');
				if ((ige.game.data.isDeveloper || (ige.client.myPlayer && ige.client.myPlayer._stats.isUserMod)) && gameId) {
					ige.network.send('ban-ip', {
						gameId: gameId,
						kickuserId: clientId
					});
				}
			});

			$('#kick-player-body').on('click', '.ban-chat-btn', function () {
				var gameId = $(this).attr('data-gameId');
				var clientId = $(this).attr('data-clientid');
				if ((ige.game.data.isDeveloper || (ige.client.myPlayer && ige.client.myPlayer._stats.isUserMod)) && gameId) {
					ige.network.send('ban-chat', {
						gameId: gameId,
						kickuserId: clientId
					});
				}
			});

			$('#open-inventory-button').on('click', function () {
				if ($('#backpack').is(':visible')) {
					$('#backpack').hide();
				} else {
					$('#backpack').show();
				}
			});

			$('.open-menu-button').on('click', function () {
				self.toggleMenu();
				$('.open-menu-button').hide();
			});

			$('#change-server').on('click', function () {
				window.location.replace(`/play/${gameSlug}?serverId=${ige.client.changedServer}&joinGame=true`);
			});

			$('#add-player-instance').on('click', function () {
				var url = `${window.location.host}/play/${gameSlug}?add-instance=true`;
				Swal({
					html: `<div class='swal2-title'>Want to add player instance?</div><div class='swal2-text' style='user-select: text;'>Copy the link given below and open it in incognito mode.<br/><input type='text' class='form-control mt-2' value='${url}' /></div>`,
					button: 'close'
				});
			});

			// once modal is hidden, then it's no longer shown when the game starts
			$('#help-modal').on('hidden.bs.modal', function (e) {
				localStorage.setItem('tutorial', 'off');
			});

			$('#server-list').on('change', function () {
				var gameSlug = $(this).attr('game-slug');
				ige.client.gameSlug = gameSlug;

				if (ige.client.servers) {
					for (var i = 0; i < ige.client.servers.length; i++) {
						var serverObj = ige.client.servers[i];

						if (serverObj.id === this.value) {
							ige.client.server = serverObj;
						}
					}
				}
			});

			if (typeof isLoggedIn !== 'undefined' && isLoggedIn) {
				$('#logged-in-as-a-guest').hide();
				// $("#menu-buttons").hide();
			} else {
				$('#logged-in-as-a-guest').show();
			}

			$('#menu-form').keyup(function (e) {
				if (e.keyCode == 13) {
					ige.client.login();
				}
			});

			$('#login-button').on('click', function () {
				ige.client.login();
			});

			$('#close-game-suggestion').on('click', function () {
				$('#more-games').removeClass('slideup-menu-animation').addClass('slidedown-menu-animation');
			});

			$('#play-as-guest-button').on('click', function () {
				// console.log("Play !");
				// ige.client.joinGame()
				self.playGame();
			});
			$('#server-list').on('blur', function () {
				$('#server-list').attr('size', 1);
			});
			$('#server-list').on('click', function () {
				$('#server-list').attr('size', 1);
			});

			// this should only be a temporary solution
			// we need to find a better way to implement the callbacks
			// all related to clicking the Play Game button
			playButtonClick.addEventListener('connectPlayer', function () {
				if (this.innerText.includes('Connection Failed')) {
					var serverLength = $('#server-list') && $('#server-list')[0] && $('#server-list')[0].children.length;
					$('#server-list').attr('size', serverLength);
					$('#server-list').focus();
				} else {
					// did user tried to change server
					var isServerChanged = window.connectedServer && ige.client.server.id !== window.connectedServer.id;

					if (isServerChanged) {
						window.location = `${window.location.pathname}?serverId=${ige.client.server.id}&joinGame=true`;
						return;
					}

					if (ige.game && ige.game.isGameStarted) {
						var wasGamePaused = this.innerText.includes('Continue');
						self.playGame(wasGamePaused);
						self.setResolution();
					} else {
						$('#play-game-button').attr('disabled', true);
						self.startLoading();
						ige.client.connectToServer();
					}
				}
				$('#play-game-button-wrapper').addClass('d-none-important');
			});

			if (window.location.hostname == 'localhost') {
				$('#play-game-button').on('click', function () {
					if (this.innerText.includes('Connection Failed')) {
						var serverLength = $('#server-list') && $('#server-list')[0] && $('#server-list')[0].children.length;
						$('#server-list').attr('size', serverLength);
						$('#server-list').focus();
					} else {
						// did user tried to change server
						var isServerChanged = window.connectedServer && ige.client.server.id !== window.connectedServer.id;

						if (isServerChanged) {
							window.location = `${window.location.pathname}?serverId=${ige.client.server.id}&joinGame=true`;
							return;
						}

						if (ige.game && ige.game.isGameStarted) {
							var wasGamePaused = this.innerText.includes('Continue');
							self.playGame(wasGamePaused);
							self.setResolution();
						} else {
							$('#play-game-button').attr('disabled', true);
							self.startLoading();
							ige.client.connectToServer();
						}
					}
					$('#play-game-button-wrapper').addClass('d-none-important');
				});
			}

			$('#help-button').on('click', function () {
				$('#help-modal').modal('show');
			});
		}
	},
	toggleScoreBoard: function (show) {
		if (ige.game.data && ige.game.data.settings && !ige.game.data.settings.displayScoreboard) {
			$('#scoreboard-header').hide();
			$('#scoreboard').hide();
		} else {
			if (show) {
				$('#scoreboard-header').show();
				$('#scoreboard').show();
				$('#leaderboard').show();
			} else {
				$('#scoreboard-header').hide();
				$('#scoreboard').hide();
				$('#leaderboard').hide();
			}
		}
	},
	toggleLeaderBoard: function (show) {
		if (show) {
			$('#leaderboard').show();
		} else {
			$('#leaderboard').hide();
		}
	},
	toggleGameSuggestionCard: function (show) {
		if (show) {
			// $('#game-suggestions-card').removeClass('d-xl-none');
			// $('#game-suggestions-card').addClass('d-xl-block');
		} else {
			// $('#game-suggestions-card').removeClass('d-xl-block');
			// $('#game-suggestions-card').addClass('d-xl-none');
		}
	},
	startLoading: function () {
		var html = $('#play-game-button .content').html();

		if (/connecting/i.test(html)) {
			// loader is already shown
			return;
		}

		var html = '<i class="fa fa-sync mr-2 py-3 fa-spin" aria-hidden="true"></i>Connecting.....';
		$('#play-game-button .content').html(html);
	},
	playGame: function (wasGamePaused) {
		var self = this;

		self.startLoading();

		$('#featured-youtuber').hide();

		setTimeout(function () {
			var html = $('#play-game-button .content').html();

			if (/connecting/i.test(html)) {
				$.post(`${analyticsUrl}api/game-report/game-access/${gameId}/infinite-connecting`);
			}
		}, 10000);

		var gameId = ige.game.data.defaultData._id;

		if (gameId && !wasGamePaused && !window.isStandalone) {
			if (window.innerWidth < 1000) {
				setTimeout(() => {
					// $('#invite-players-card').addClass('d-none');
					$('#show-chat').removeClass('d-none');
					$('#chat-box').addClass('d-none');
				}, 1500);
			}

			$.post(`${analyticsUrl}api/game-report/game-access/${gameId}/play-button`)
				.then(function () { }, function (xhr, status, error) {
					$.post('/api/log', {
						event: 'play-button',
						game: gameId,
						status: xhr.status,
						text: xhr.statusText
					});
				});
		}

		ige.client.joinGame();

		if (!window.isStandalone) {
			ige.ad.showAnchorTag();
		}
	},

	kickPlayerFromGame: function (excludeEntity) {
		var self = this;
		var players = ige.$$('player').filter(function (player) { if (player && player._stats && player._stats.controlledBy === 'human' && player._alive && player.id() !== excludeEntity) return true; });
		var html = '<table class="table table-hover">';
		html += '<tr class="border-bottom">';
		html += '<th class="border-top-0">Name</th>';
		html += '<th class="border-top-0 text-center">Action</th>';
		html += '</tr>';
		players.forEach(function (player) {
			html += '<tr class="border-bottom">';
			html += `<td class="border-top-0">${player._stats.name}`;
			if (ige.client.myPlayer && player.id() === ige.client.myPlayer.id()) {
				html += ' (you)';
			}
			html += '</td>';
			html += '<td class="border-top-0 text-center">';
			html += '<div class="btn-group" role="group" aria-label="Basic example">';
			html += `<button class="btn btn-danger kick-player-btn" data-clientid="${player._stats.clientId}" > Kick</button>`;
			// html += '<button class="btn btn-warning ban-player-btn" data-clientid="' + player._stats.clientId + '" data-gameId="' + ige.game.data.defaultData._id + '" data-userId="' + player._stats.userId + '">Ban user</button>'
			html += `<button class="btn btn-success ban-ip-btn" data-clientid="${player._stats.clientId}" data-gameId="${ige.game.data.defaultData._id}">Ban Ip</button>`;
			html += `<button class="btn btn-primary ban-chat-btn" data-clientid="${player._stats.clientId}" data-gameId="${ige.game.data.defaultData._id}">${player._stats.banChat ? 'unmute' : 'mute'}</button>`;
			html += '</div>';
			html += '</td>';
			html += '</tr>';
		});
		html += '</table>';

		$('#kick-player-body').html(html);
	},
	showMenu: function (selectBestServer) {
		var self = this;

		if (ige.isClient) {
			var selectedServer = undefined;
			var gameSlug = window.location.pathname.split('/').pop();

			if (window.isStandalone) {
				return $('#menu-wrapper').removeClass('d-none').addClass('d-flex');
			}

			if (!ige.mobileControls || !ige.mobileControls.isMobile) {
				$('#friends-panel').removeClass('d-none');
			}

			this.changesForMobile(true);
			this.toggleScoreBoard(false);
			this.toggleLeaderBoard(false);
			this.toggleGameSuggestionCard(false);

			$.ajax({
				type: 'GET',
				url: `/api/game-server/${gameId}`,
				success: function (res) {
					if (res.status == 'success') {
						var servers = res.message;
						var serversList = '';
						var index = 0;

						function separate (str) {
							var alphabets = '';
							var numbers = '';
							var chars = str.split('');
							var numberRegex = /[0-9]/;

							// get number segment from end
							while (chars.length) {
								var char = chars[chars.length - 1];

								if (numberRegex.test(char)) {
									numbers = char + numbers;
									chars.pop();
								} else {
									break;
								}
							}

							return {
								alphabets: chars.join(''),
								numbers: numbers
							};
						}

						// generate server list
						servers.forEach(function (server) {
							var protocol = location.protocol.indexOf('https') > -1 ? 'wss' : 'ws';
							var dataUrl = `${protocol}://${server.ip}${(server.port) ? `:${server.port}` : ''}`;
							if (server) {
								var serverIP = server.ip.slice(0, server.ip.indexOf('.'));
								var separated = separate(serverIP);
								var optionText = `${separated.alphabets} ${separated.numbers}`;
								var acceptingPlayers = server.acceptingPlayers ? '' : ' not accepting players';
								serversList += `${'<option ' +
									' class="game-server"' +
									' id="server-option-'}${index++}"` +
									` owner="${server.owner}"` +
									` player-count="${server.playerCount}"` +
									` max-players="${server.maxPlayers}"` +
									` data-server-id="${server.id}"` +
									` data-url="${dataUrl}"` +
									` value="${server.id}"` +
									`>${optionText} (${server.playerCount} / ${server.maxPlayers})${
									 acceptingPlayers}</option>`;
							}

							// select best server in avail servers
							if (selectBestServer && !selectedServer && server.acceptingPlayers) {
								selectedServer = server;
							}
						});

						if (serversList) {
							$('#server-list').html(serversList);

							// update servers array in case some new servers were added/removed to list
							ige.client.servers = ige.client.getServersArray();

							if (selectBestServer && selectedServer) {
								ige.client.server = selectedServer.id;
								$('#server-list').val(selectedServer.id);
								$('#play-game-button').hide();
								$('#change-server').show();
							} else {
								$('#server-list').val(ige.client.server.id);
							}
							self.getServerPing();
						} else {
							$('#server-list').hide();
						}
					}
					$('#menu-wrapper').removeClass('d-none').addClass('d-flex');
				}
			});
		}
	},

	getServerPing: function (shouldPickOneWithLeast) {
		var serverOptions = $('option.game-server:enabled');
		var promises = [];
		var self = this;

		// if (typeof user === 'undefined' || !user || !user.local || (user.local.username !== "nishant" && user.local.username !== "m0dE")) {
		// 	return;
		// }

		// if (!serverOptions || serverOptions.length <= 1) {
		// 	return;
		// }

		// var index = 0;
		// for (var serverOption of serverOptions) {
		// 	(function socketPing(serverOption, index) {
		// 		var promise = self.getPing(serverOption);
		// 		promises.push(promise);
		// 	})(serverOption, index++);
		// }

		// if (shouldPickOneWithLeast) {
		// 	Promise.all(promises)
		// 		.then(function serversPingResolve(data) {
		// 			var sortedData = data.sort(function (a, b) {
		// 				return a.ping - b.ping;
		// 			})
		// 			var serverWithLeastPing = sortedData[0];

		// 			$("#server-list").val(serverWithLeastPing.server.value);
		// 		})
		// 		.catch(function serversPingReject(err) {
		// 			console.log(err);
		// 		});
		// }
	},

	getPing: function (serverOption, duration) {
		return new Promise(function promiseFunction (resolve, reject) {
			var data = $(serverOption).data();
			var socket = new WebSocket(`${data.url}/?token=`);
			var ping = Number.MAX_VALUE;

			socket.onopen = function (event) {
				socket.send(JSON.stringify({
					type: 'ping',
					sentAt: Date.now()
				}));

				setTimeout(function () {
					if (socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
						socket.close();
						var existingText = $(serverOption).text();
						$(serverOption).text(`${existingText} (${Number.POSITIVE_INFINITY} ms)`);
						resolve({
							server: serverOption,
							ping: ping
						});
					}
				}, 5000);
			};

			socket.onmessage = function (event) {
				var jsonString = LZString.decompressFromUTF16(event.data);
				var json = JSON.parse(jsonString);

				if (json.type === 'pong') {
					ping = Date.now() - json.clientSentAt;
					var existingText = $(serverOption).text();
					socket.close();

					console.log(json);
					$(serverOption).text(`${existingText} (${ping} ms)`);
					resolve({
						server: serverOption,
						ping: ping
					});
				}
			};

			socket.onerror = function (err) {
				console.log('Error while testing ping', err);
				reject(err);
			};
		});
	},

	changesForMobile: function (isMenuVisible) {
		if (ige.mobileControls && ige.mobileControls.isMobile) {
			var loginDiv = $('#login-div');
			var myScoreDiv = $('#my-score-div');
			var leaderBoard = $('#leaderboard');
			var topText = $('.ui-text-top');
			var topMenuButtons = $('#top-menu-buttons');
			var friendsPanel = $('#friends-panel');
			var mobileChatBox = $('#mobile-chat-box');
			var shopButton = $('#mobile-shop-button');
			var shopButton = $('#mobile-shop-button');
			var homeButton = $('#home-button');

			if (isMenuVisible) {
				topMenuButtons.addClass('d-none');
				leaderBoard.addClass('d-none');
				topText.addClass('d-none');
				homeButton.removeClass('d-none');
				myScoreDiv.removeClass('d-block');
				loginDiv.removeClass('hide-on-mobile');
				friendsPanel.addClass('d-none');
				mobileChatBox.addClass('d-none');
				shopButton.removeClass('d-inline');
				homeButton.removeClass('d-none');
			} else {
				topMenuButtons.removeClass('d-none');
				leaderBoard.removeClass('d-none');
				topText.removeClass('d-none');
				homeButton.addClass('d-none');
				myScoreDiv.addClass('d-block');
				loginDiv.addClass('hide-on-mobile');
				mobileChatBox.removeClass('d-none invisible');
				shopButton.addClass('d-inline');
			}
			$('#modd-shop-modal').css({ fontSize: 11 });
			// hide mobile controls
			var allControls = ige.mobileControls.controls;
			if (allControls) {
				for (var k in allControls) {
					var control = allControls[k];
					control && control.opacity && control.opacity(isMenuVisible ? 0 : 0.5);
				}
			}

			// hide minimap here by setting width to 0
			if (ige.miniMap && ige.miniMap.miniMap) {
				var newWidth = isMenuVisible ? 0 : ige.miniMap.maxMapDimension.width;
				ige.miniMap.miniMap.width(newWidth);
			}
		}
	},

	hideMenu: function () {
		$('#menu-wrapper').removeClass('d-flex').addClass('d-none');

		if (!ige.mobileControls || !ige.mobileControls.isMobile) {
			$('#friends-panel').addClass('d-none');
		}

		this.changesForMobile(false);
		this.toggleScoreBoard(true);
		this.toggleLeaderBoard(true);
		this.toggleGameSuggestionCard(true);
	},

	toggleMenu: function () {
		if ($('#menu-wrapper').is(':visible')) {
			this.hideMenu();
		} else {
			this.showMenu();
		}
	},
	clipImageForShop: function () {
		var skins = $('#menu-purchasables')[0] ? $('#menu-purchasables')[0].children : [];
		for (var i = 0; i < skins.length; i++) {
			let data = skins[i];
			let image = new Image();
			let dataSets = data.dataset;
			dataSets.id = data.id;
			image.src = data.dataset.src;
			image.onload = function () {
				let replacingImage = data.children[0];
				if (replacingImage) {
					let url = data.dataset.src;
					let itemDetails = ige.game.data.unitTypes[dataSets.key];
					let originalHeight = itemDetails && `${image.height / itemDetails.cellSheet.rowCount}px`;
					let originalWidth = itemDetails && `${image.width / itemDetails.cellSheet.columnCount}px`;
					// clipping = "height:" + originalHeight + "px;width:" + originalWidth + "px;background:url('" + item.image + "') 0px 0px no-repeat;";
					replacingImage.style.height = originalHeight;
					replacingImage.style.width = originalWidth;
					replacingImage.style.backgroundImage = `url('${url}')`;
					replacingImage.style.maxHeight = '64px';
					replacingImage.style.maxWidth = '64px';
					if (itemDetails && itemDetails.cellSheet.rowCount <= 1 && itemDetails.cellSheet.columnCount <= 1) {
						replacingImage.style.backgroundRepeat = 'no-repeat';
						replacingImage.style.backgroundPosition = 'center center';
						replacingImage.style.backgroundSize = 'contain';
					}
				}
			};
		}
	},
	getUrlVars: function () {
		// edited for play/:gameId
		var gameId = window.location.pathname.split('/')[2];
		var vars = {
			gameId: gameId
		};

		// if serverId is present then add it to vars
		window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
			vars[key] = value;
		});

		return vars;
	},
	onDisconnectFromServer: function (src, message) {
		console.log('modal shown from', src, message);

		if (ige.mobileControls.isMobile) return;

		var defaultContent = 'Lost connection to the game server. Please refresh this page or visit our homepage.';
		ige.client.disconnected = true;

		$('#server-disconnect-modal .modal-body').html(message || defaultContent);
		$('#server-disconnect-modal').modal('show');

		// refreshIn("connection-lost-refresh", 5);

		$('#more-games')
			.removeClass('slidedown-menu-animation')
			.addClass('slideup-menu-animation');
	},
	setResolution: function () {
		if (ige.mobileControls.isMobile) return;
		var resolution = localStorage.getItem('resolution') || 'high';
		if (resolution == 'high') {
			ige.client.resolutionQuality = 'high';
			ige._resizeEvent();
			ige.miniMap.updateMiniMap();
			$('#resolution-high').addClass('btn-success').removeClass('btn-light');
			$('#resolution-low').removeClass('btn-success').addClass('btn-light');
		} else {
			ige.client.resolutionQuality = 'low';
			ige._resizeEvent();
			ige.miniMap.updateMiniMap();
			$('#resolution-low').addClass('btn-success').removeClass('btn-light');
			$('#resolution-high').removeClass('btn-success').addClass('btn-light');
		}
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = MenuUiComponent; }
