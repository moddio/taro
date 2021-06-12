// var appInsights = require("applicationinsights");
// appInsights.setup("db8b2d10-212b-4e60-8af0-2482871ccf1d").start();
var net = require('net');
const publicIp = require('public-ip');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
var request = require('request');
const fs = require('fs');
const cluster = require('cluster');
const { RateLimiterMemory } = require('rate-limiter-flexible');
_ = require('lodash');

const config = require('../config');
const { FILE } = require('dns');
const Console = console.constructor;
// redirect global console object to log file

function logfile (file) {
	var con = new Console(fs.createWriteStream(file));
	Object.keys(Console.prototype).forEach(function (name) {
		console[name] = function () {
			con[name].apply(con, arguments);
		};
	});
}

module.exports = logfile;

Error.stackTraceLimit = Infinity; // debug console.trace() to infinite lines

global.rollbar = {
	log: function () {
		// do nothing in non prod env
	},
	error: function () {

	}
};

if (process.env.ENV == 'production') {
	var Rollbar = require('rollbar');
	global.rollbar = new Rollbar({
		accessToken: '326308ea71e041dc87e30fce4eb48d99',
		captureUncaught: true,
		captureUnhandledRejections: true
	});

	process.on('uncaughtException', function (err) {
		global.rollbar.log(err);
		console.log(`server.js uncaughtException: ${err.stack}`);
		process.exit(0);
	});
}

process.on('exit', function () {
	console.log('process exit called.');
	console.trace();
});

var Server = IgeClass.extend({
	classId: 'Server',
	Server: true,

	init: function (options) {
		var self = this;

		self.buildNumber = 466;

		self.status = 'stopped';
		self.totalUnitsCreated = 0;
		self.totalWallsCreated = 0;
		self.totalItemsCreated = 0;
		self.totalPlayersCreated = 0;
		self.totalProjectilesCreated = 0;
		self.retryCount = 0;
		self.maxRetryCount = 3;
		self.started_at = new Date();
		self.lastSnapshot = [];

		self.logTriggers = {

		};

		ige.env = process.env.ENV || 'production';
		self.config = config[ige.env];

		if (!self.config) {
			self.config = config.default;
		}

		self.tier = process.env.TIER || 2;
		self.region = process.env.REGION || 'apocalypse';
		self.isScriptLogOn = process.env.SCRIPTLOG == 'on';
		self.gameLoaded = false;
		self.coinUpdate = {};

		self.socketConnectionCount = {
			connected: 0,
			disconnected: 0,
			immediatelyDisconnected: 0
		};

		self.serverStartTime = new Date();// record start time

		self.bandwidthUsage = {
			unit: 0,
			debris: 0,
			item: 0,
			player: 0,
			projectile: 0,
			region: 0,
			sensor: 0
		};

		self.serverStartTime = new Date();// record start time
		global.isDev = ige.env == 'dev' || ige.env == 'local' || ige.env === 'standalone' || ige.env === 'standalone-remote';
		global.myIp = process.env.IP;
		global.beUrl = self.config.BE_URL;

		console.log('environment', ige.env, self.config);
		console.log('isDev =', global.isDev);

		self.internalPingCount = 0;

		ige.debugEnabled(global.isDev);

		var rateLimiterOptions = {
			points: 20, // 6 points
			duration: 60 // Per second
		};
		ige.rateLimiter = new RateLimiterMemory(rateLimiterOptions);

		self.keysToRemoveBeforeSend = [
			'abilities', 'animations', 'bodies', 'body', 'cellSheet',
			'defaultData.rotation', 'defaultData.translate',
			'buffTypes', 'bonus', 'bulletStartPosition', 'canBePurchasedBy', 'carriedBy', 'damage',
			'description', 'handle', 'hits', 'inventoryImage', 'isGun', 'isStackable', 'maxQuantity',
			'texture', 'sound', 'states', 'frames', 'inventorySize', 'particles', 'price', 'skin',
			'variables', 'canBuyItem', 'canBePurchasedBy', 'inventoryImage', 'isPurchasable', 'oldState',
			'raycastCollidesWith', 'effects', 'defaultProjectile', 'currentBody',
			'penetration', 'bulletDistance', 'bulletType', 'ammoSize', 'ammo', 'ammoTotal', 'reloadRate',
			'recoilForce', 'fireRate', 'knockbackForce', 'canBeUsedBy', 'spawnChance', 'consumeBonus',
			'isConsumedImmediately', 'lifeSpan', 'removeWhenEmpty', 'spawnPosition', 'baseSpeed', 'bonusSpeed',
			'flip', 'fadingTextQueue', 'points', 'highscore', 'jointsOn', 'totalTime', 'email', 'isEmailVerified',
			'isUserAdmin', 'isUserMod', 'newHighscore', 'streamedOn', 'controls'
		];

		// for debugging reasons
		global.isServer = ige.isServer;

		if (typeof HttpComponent != 'undefined') {
			ige.addComponent(HttpComponent);
		}
		console.log('cluster.isMaster', cluster.isMaster);
		if (cluster.isMaster) {
			if (process.env.ENV === 'standalone') {
				self.gameId = process.env.npm_config_game;
				self.ip = '127.0.0.1';
				self.startServer();
				self.start();
				self.startGame();
			} else if (typeof ClusterServerComponent != 'undefined') {
				ige.addComponent(ClusterServerComponent);
			}
		} else {
			if (typeof ClusterClientComponent != 'undefined') {
				ige.addComponent(ClusterClientComponent); // backend component will retrieve "start" command from BE
			}

			// if production, then get ip first, and then start
			if (['production', 'staging', 'standalone-remote'].includes(ige.env)) {
				console.log('getting IP address');
				publicIp.v4().then(ip => { // get public ip of server
					self.ip = ip;
					self.start();
				});
			} else // use 127.0.0.1 if dev env
			{
				self.ip = '127.0.0.1';
				self.start();
			}
		}

		// periodicaly update user coins to db for inapp purchase
		setInterval(function () {
			if (Object.keys(self.coinUpdate || {}).length > 0) {
				self.postConsumeCoinsForUsers();
			}
		}, 10000);
	},

	// start server
	start: function () {
		var self = this;
		console.log('ip', self.ip);

		if (self.gameLoaded) {
			console.log('Warning: Game already loaded in this server!!');
			return;
		}

		// Add the server-side game methods / event handlers
		this.implement(ServerNetworkEvents);
		ige.addComponent(IgeNetIoComponent);
	},

	loadGameJSON: function (gameUrl) {
		var self = this;

		return new Promise((resolve, reject) => {
			setTimeout(() => {
				self.retryCount++;

				if (self.retryCount > self.maxRetryCount) {
					return reject(new Error('Could not load game'));
				}

				request(`${gameUrl}&num=${self.retryCount}`, (error, response, body) => {
					if (error) {
						console.log('LOADING GAME-JSON ERROR', self.retryCount, error);
						return self.loadGameJSON(gameUrl)
							.then((data) => resolve(data))
							.catch((err) => reject(err));
					}

					if (response.statusCode == 200) {
						return resolve(JSON.parse(body));
					} else {
						console.log('LOADING GAME-JSON ERROR', self.retryCount, response.statusCode, body);
						return self.loadGameJSON(gameUrl)
							.then((data) => resolve(data))
							.catch((err) => reject(err));
					}
				});
			}, self.retryCount * 5000);
		});
	},
	startServer: function () {
		const app = express();
		const port = process.env.PORT || 2000;
		this.port = 2001; // game started on

		app.use(bodyParser.urlencoded({ extended: false }));
		// parse application/json
		app.use(bodyParser.json());

		app.set('view engine', 'ejs');
		app.set('views', path.resolve('src'));

		app.use('/engine', express.static(path.resolve('./engine/')));

		const FILES_TO_CACHE = [
			'pixi-legacy.js',
			'stats.js',
			'dat.gui.min.js',
			'msgpack.min.js'
		];
		const SECONDS_IN_A_WEEK = 7 * 24 * 60 * 60;
		app.use('/src', express.static(path.resolve('./src/'), {
			setHeaders: (res, path, stat) => {
				let shouldCache = FILES_TO_CACHE.some((filename) => path.endsWith(filename));

				// cache minified file
				shouldCache = shouldCache || path.endsWith('.min.js');

				if (shouldCache) {
					res.set('Cache-Control', `public, max-age=${SECONDS_IN_A_WEEK}`);
				}
			}
		}));

		app.use('/assets', express.static(path.resolve('./assets/'), { cacheControl: 7 * 24 * 60 * 60 * 1000 }));

		app.get('/', (req, res) => {
			const videoChatEnabled = ige.game.videoChatEnabled && req.protocol == 'https' ? ige.game.videoChatEnabled : false;
			const game = {
				_id: global.standaloneGame.defaultData._id,
				title: global.standaloneGame.defaultData.title,
				tier: global.standaloneGame.defaultData.tier,
				gameSlug: global.standaloneGame.defaultData.gameSlug,
				videoChatEnabled: videoChatEnabled
			};
			const options = {
				isAuthenticated: false,
				env: process.env.ENV,
				gameId: process.env.npm_config_game,
				user: {},
				isOpenedFromIframe: false,
				gameSlug: game.gameSlug,
				referAccessDenied: true,
				ads: false,
				showSideBar: false,
				gameDetails: {
					name: game.title,
					tier: game.tier,
					gameSlug: game.gameSlug,
					videoChatEnabled: game.videoChatEnabled
				},
				highScores: null,
				hostedGames: null,
				currentUserScore: null,
				err: undefined,
				selectedServer: null,
				servers: [{
					ip: '127.0.0.1',
					port: 2001,
					playerCount: 0,
					maxPlayers: 32,
					acceptingPlayers: true
				}],
				createdBy: '',
				menudiv: false,
				gameTitle: game.title,
				currentUserPresentInHighscore: false,
				discordLink: null,
				facebookLink: null,
				twitterLink: null,
				youtubeLink: null,
				androidLink: null,
				iosLink: null,
				share: {
					url: ''
				},
				domain: req.get('host'),
				version: Math.floor((Math.random() * 10000000) + 1),
				constants: {
					appName: 'Modd.io   ',
					appUrl: 'http://www.modd.io/',
					noAds: true,
					assetsProvider: ''
				},
				purchasables: null,
				timers: {
					smallChest: 0,
					bigChest: 0
				},
				analyticsUrl: '/'
			};

			return res.render('index.ejs', options);
		});
		app.listen(port, () => console.log(`MC listening on port ${port}!`));
	},

	// run a specific game in this server
	startGame: function (gameJson) {
		console.log('ige.server.startGame()');
		var self = this;

		if (self.gameLoaded) {
			console.log('Warning: Game already loaded in this server!!');
			return;
		}

		this.socket = {};

		self.url = `http://${self.ip}:${self.port}`;

		this.duplicateIpCount = {};
		this.bannedIps = [];

		// switch (process.env.TIER) {
		// 	case '1': maxPlayerForTier = 16; break;
		// 	case '2': maxPlayerForTier = 32; break;
		// 	case '3': maxPlayerForTier = 64; break;
		// }
		self.maxPlayers = self.maxPlayers || 32;
		this.maxPlayersAllowed = self.maxPlayers || 32;

		console.log('maxPlayersAllowed', this.maxPlayersAllowed);
		console.log('starting netIoServer at', self.url);

		// Define an object to hold references to our player entities
		this.clients = {};

		// Add the networking component
		ige.network.debug(self.isDebugging);
		// Start the network server
		ige.network.start(self.port, function (data) {
			console.log('IgeNetIoComponent: listening to', self.url);
			console.log('connecting to BE:', global.beUrl);

			var domain = null;

			// dev gets map from local file
			if (ige.env == 'standalone' || ige.env == 'standalone-remote' || ige.env === 'production') { // production or staging gets map data from API
				// using BE's URL instead of GS Manager because GS Manager is overloaded right now so..
				domain = 'https://www.modd.io';
			} else {
				domain = global.beUrl;
			}

			console.log('connecting to BE:', global.beUrl);

			var promise;

			if (gameJson) {
				promise = Promise.resolve(gameJson);
			} else if (ige.server.gameId) {
				var gameUrl = `${domain}/api/game-client/${ige.server.gameId}/?source=gs`;
				console.log('gameUrl', gameUrl);
				promise = self.loadGameJSON(gameUrl);
			} else {
				promise = new Promise(function (resolve, reject) {
					var game = fs.readFileSync(`${__dirname}/../src/game.json`);
					game = JSON.parse(game);
					game.defaultData = game;
					var data = { data: {} };
					for (let [key, value] of Object.entries(game)) {
						data.data[key] = value;
					}
					for (let [key, value] of Object.entries(game.data)) {
						data.data[key] = value;
					}
					resolve(data);
				});
			}

			promise.then((game) => {
				ige.addComponent(GameComponent);
				self.gameStartedAt = new Date();

				ige.game.data = game.data;
				ige.game.cspEnabled = !!ige.game.data.defaultData.clientSidePredictionEnabled;

				global.standaloneGame = game.data;
				var baseTilesize = 64;

				// I'm assuming that both tilewidth and tileheight have same value
				// tilesize ratio is ratio of base tile size over tilesize of current map
				var tilesizeRatio = baseTilesize / game.data.map.tilewidth;

				var engineTickFrameRate = 15;
				console.log(game.data.defaultData);
				if (game.data.defaultData && !isNaN(game.data.defaultData.frameRate)) {
					engineTickFrameRate = Math.max(15, Math.min(parseInt(game.data.defaultData.frameRate), 60)); // keep fps range between 15 and 60
				}

				// ige.setFps(engineTickFrameRate)
				ige._physicsTickRate = engineTickFrameRate;

				// Add physics and setup physics world
				ige.addComponent(PhysicsComponent)
					.physics.sleep(true)
					.physics.tilesizeRatio(tilesizeRatio);

				if (game.data.settings) {
					var gravity = game.data.settings.gravity;
					if (gravity) {
						console.log('setting gravity', gravity);
						ige.physics.gravity(gravity.x, gravity.y);
					}
				}

				ige.physics.createWorld();
				ige.physics.start();
				console.log('box2d world started');

				// console.log("game data", game)
				// mapComponent needs to be inside IgeStreamComponent, because debris' are created and streaming is enabled which requires IgeStreamComponent
				console.log('initializing components');

				ige.network.on('connect', self._onClientConnect);
				ige.network.on('disconnect', self._onClientDisconnect);

				// Networking has started so start the game engine
				ige.start(function (success) {
					// Check if the engine started successfully
					if (success) {
						console.log('IgeNetIoComponent started successfully');

						self.defineNetworkEvents();
						// console.log("game data", ige.game.data.settings)

						// Add the network stream component
						ige.network.addComponent(IgeStreamComponent)
							.stream.sendInterval(1000 / engineTickFrameRate)
							.stream.start(); // Start the stream

						// Accept incoming network connections
						ige.network.acceptConnections(true);

						ige.addGraph('IgeBaseScene');

						ige.addComponent(MapComponent);
						ige.addComponent(ShopComponent);
						ige.addComponent(IgeChatComponent);
						ige.addComponent(ItemComponent);
						ige.addComponent(TimerComponent);
						ige.addComponent(TriggerComponent);
						ige.addComponent(VariableComponent);
						ige.addComponent(GameTextComponent);
						ige.addComponent(ScriptComponent);
						ige.addComponent(ConditionComponent);
						ige.addComponent(ActionComponent);
						ige.addComponent(AdComponent);
						ige.addComponent(SoundComponent);
						ige.addComponent(RegionManager);

						if (ige.game.data.defaultData.enableVideoChat) {
							ige.addComponent(VideoChatComponent);
						}

						let map = ige.scaleMap(_.cloneDeep(ige.game.data.map));
						ige.map.load(map);

						ige.game.start();

						self.gameLoaded = true;

						// send dev logs to developer every second
						var logInterval = setInterval(function () {
							// send only if developer client is connect
							if (ige.isServer && ((self.developerClientId && ige.server.clients[self.developerClientId]) || process.env.ENV == 'standalone')) {
								ige.variable.devLogs.status = ige.server.getStatus();
								ige.network.send('devLogs', ige.variable.devLogs, self.developerClientId);

								if (ige.script.errorLogs != {}) {
									ige.network.send('errorLogs', ige.script.errorLogs, self.developerClientId);
									ige.script.errorLogs = {};
								}
							}
							// console.log(ige.physicsTickCount, ige.unitBehaviourCount)
							ige.physicsTickCount = 0;
							ige.unitBehaviourCount = 0;
						}, 1000);

						setInterval(function () {
							var copyCount = Object.assign({}, self.socketConnectionCount);
							self.socketConnectionCount = {
								connected: 0,
								disconnected: 0,
								immediatelyDisconnected: 0
							};

							ige.clusterClient && ige.clusterClient.recordSocketConnections(copyCount);
						}, 900000);
					}
				});
			})
				.catch((err) => {
					console.log('got error while loading game json', err);
					ige.clusterClient && ige.clusterClient.kill('got error while loading game json');
				});
		});
	},

	defineNetworkEvents: function () {
		var self = this;

		console.log('server.js: defineNetworkEvents');
		ige.network.define('joinGame', self._onJoinGameWrapper);
		ige.network.define('gameOver', self._onGameOver);

		ige.network.define('setStreamSendInterval', self._onSetStreamSendInterval);

		ige.network.define('makePlayerSelectUnit', self._onPlayerSelectUnit);
		ige.network.define('playerUnitMoved', self._onPlayerUnitMoved);
		ige.network.define('playerKeyDown', self._onPlayerKeyDown);
		ige.network.define('playerKeyUp', self._onPlayerKeyUp);
		ige.network.define('playerMouseMoved', self._onPlayerMouseMoved);
		ige.network.define('playerCustomInput', self._onPlayerCustomInput);
		ige.network.define('playerAbsoluteAngle', self._onPlayerAbsoluteAngle);
		ige.network.define('playerDialogueSubmit', self._onPlayerDialogueSubmit);

		ige.network.define('buyItem', self._onBuyItem);
		ige.network.define('buyUnit', self._onBuyUnit);
		ige.network.define('buySkin', self._onBuySkin);

		ige.network.define('equipSkin', self._onEquipSkin);
		ige.network.define('unEquipSkin', self._onUnEquipSkin);

		ige.network.define('swapInventory', self._onSwapInventory);

		// bullshit that's necessary for sending data to client
		ige.network.define('makePlayerCameraTrackUnit', self._onSomeBullshit);
		ige.network.define('changePlayerCameraPanSpeed', self._onSomeBullshit);

		ige.network.define('hideUnitFromPlayer', self._onSomeBullshit);
		ige.network.define('showUnitFromPlayer', self._onSomeBullshit);
		ige.network.define('hideUnitNameLabelFromPlayer', self._onSomeBullshit);
		ige.network.define('showUnitNameLabelFromPlayer', self._onSomeBullshit);

		ige.network.define('createPlayer', self._onSomeBullshit);
		ige.network.define('updateUiText', self._onSomeBullshit);
		ige.network.define('updateUiTextForTime', self._onSomeBullshit);
		ige.network.define('alertHighscore', self._onSomeBullshit);
		ige.network.define('addShopItem', self._onSomeBullshit);
		ige.network.define('removeShopItem', self._onSomeBullshit);
		ige.network.define('gameState', self._onSomeBullshit);

		// ige.network.define('updateEntity', self._onSomeBullshit);
		ige.network.define('updateEntityAttribute', self._onSomeBullshit);
		ige.network.define('updateAllEntities', self._onSomeBullshit);
		ige.network.define('teleport', self._onSomeBullshit);
		ige.network.define('itemHold', self._onSomeBullshit);
		ige.network.define('item', self._onSomeBullshit);
		ige.network.define('clientConnect', self._onSomeBullshit);
		ige.network.define('clientDisconnect', self._onSomeBullshit);
		ige.network.define('killStreakMessage', self._onSomeBullshit);
		ige.network.define('insertItem', self._onSomeBullshit);
		ige.network.define('playAd', self._onSomeBullshit);
		ige.network.define('ui', self._onSomeBullshit);
		ige.network.define('updateShopInventory', self._onSomeBullshit);
		ige.network.define('errorLogs', self._onSomeBullshit);
		ige.network.define('devLogs', self._onSomeBullshit);
		ige.network.define('sound', self._onSomeBullshit);
		ige.network.define('particle', self._onSomeBullshit);
		ige.network.define('camera', self._onSomeBullshit);
		ige.network.define('videoChat', self._onSomeBullshit);

		ige.network.define('gameSuggestion', self._onSomeBullshit);
		ige.network.define('minimap', self._onSomeBullshit);

		ige.network.define('createFloatingText', self._onSomeBullshit);

		ige.network.define('openShop', self._onSomeBullshit);
		ige.network.define('openDialogue', self._onSomeBullshit);
		ige.network.define('closeDialogue', self._onSomeBullshit);
		ige.network.define('userJoinedGame', self._onSomeBullshit);

		ige.network.define('kick', self._onKick);
		ige.network.define('ban-user', self._onBanUser);
		ige.network.define('ban-ip', self._onBanIp);
		ige.network.define('ban-chat', self._onBanChat);

		ige.network.define('setOwner', self._setOwner);

		ige.network.define('trade', self._onTrade);
	},

	unpublish: function (from) {
		console.log('unpublishing...');
		ige.clusterClient.unpublish(from);
		process.exit(0);
	},

	saveLastPlayedTime: function (data) {
		console.log('temp', data);
	},

	kill: function (log) {
		if (ige.clusterClient && ige.clusterClient.markedAsKilled) {
			return;
		}

		// send a message to master cluster
		if (ige.env != 'dev' && process && process.send) {
			process.send({ chat: 'kill server called' });
		}
		// ige.clusterClient.disconnect();

		ige.clusterClient && ige.clusterClient.kill(log);
	},

	// get client with _id from BE
	getClientByUserId: function (_id) {
		var self = this;

		for (i in ige.server.clients) {
			if (ige.server.clients[i]._id == _id) {
				return ige.server.clients[i];
			}
		}
	},

	giveCoinToUser: function (player, coin, itemName) {
		if (coin && player._stats && player._stats.userId && (ige.game.data.defaultData.tier == 3 || ige.game.data.defaultData.tier == 4)) {
			request({
				method: 'POST',
				url: `${global.beUrl}/api/user/updateCoins`,
				body: {
					creatorId: ige.game.data.defaultData.owner,
					userId: player._stats.userId,
					coins: coin,
					game: ige.game.data.defaultData._id
				},
				json: true
			}, (err, httpResponse, body) => {
				const statusCode = httpResponse && httpResponse.statusCode;

				if (err) {
					console.log(err);
				}

				if (statusCode !== 200) {
					console.log(new Error(`BE responded with statusCode ${statusCode}`));
				}

				if (body) {
					if (body.status === 'success') {
						player.streamUpdateData([{ coins: body.message }]);
					}
					if (body.status === 'error') {
						ige.chat.sendToRoom('1', `cannot create ${itemName}. ${body.message.username} is out of coins`, player._stats.clientId, undefined);
					}
				} else {
					console.log(new Error('BE responded without body (giveCoinToUser)'));
				}
			});
			// console.log('player stream update', coin)
		}
	},
	postConsumeCoinsForUsers: function () {
		var self = this;
		request({
			method: 'POST',
			url: `${global.beUrl}/api/user/consumecoins`,
			body: self.coinUpdate,
			json: true
		}, (err, httpResponse, body) => {
			const statusCode = httpResponse && httpResponse.statusCode;

			if (err) {
				console.log(err);
			}

			if (statusCode !== 200) {
				console.log(new Error(`BE responded with statusCode ${statusCode}`));
			}

			if (body) {
				if (body.status === 'success') {
					if (body.message && body.message.length > 0) {
						body.message.forEach(function (updatedCoinsValue) {
							var foundPlayer = ige.$$('player').find(function (player) {
								return player && player._stats && player._stats.clientId == updatedCoinsValue.clientId;
							});
							if (foundPlayer) {
								foundPlayer.streamUpdateData([{ coins: updatedCoinsValue.coinsLeft }]);
							}
						});
					}
					self.coinUpdate = {};
				}
				if (body.status === 'error') {
					// console.log('error in buying item')
				}
			}
		});
	},
	consumeCoinFromUser: function (player, coins, boughtItemId) {
		var self = this;
		if (player && coins && (ige.game.data.defaultData.tier == 3 || ige.game.data.defaultData.tier == 4)) {
			if (ige.game.data.defaultData.owner != player._stats.userId) {
				if (!self.coinUpdate[player._stats.clientId]) {
					self.coinUpdate[player._stats.clientId] = {
						creatorId: ige.game.data.defaultData.owner,
						userId: player._stats.userId,
						coins: coins,
						game: ige.game.data.defaultData._id,
						boughtItems: []
					};
				} else {
					self.coinUpdate[player._stats.clientId].coins += coins;
				}
				if (self.coinUpdate[player._stats.clientId].boughtItems) {
					self.coinUpdate[player._stats.clientId].boughtItems.push({
						itemId: boughtItemId,
						date: new Date(),
						userId: player._stats.userId
					});
				}
			}
		}
	},
	getStatus: function () {
		var self = this;

		var cpuDelta = null;
		if (ige._lastCpuUsage) {
			// console.log('before',ige._lastCpuUsage);
			cpuDelta = process.cpuUsage(ige._lastCpuUsage);
			ige._lastCpuUsage = process.cpuUsage();
		} else {
			ige._lastCpuUsage = cpuDelta = process.cpuUsage();
		}

		if (ige.physics && ige.physics.engine != 'CRASH') {
			// console.log('ige stream',ige.stream);

			var jointCount = 0;
			var jointList = ige.physics._world && ige.physics._world.getJointList();
			while (jointList) {
				jointCount++;
				jointList = jointList.getNext();
			}
			var returnData = {
				clientCount: Object.keys(ige.network._socketById).length,
				entityCount: {
					player: ige.$$('player').filter(function (player) { return player._stats.controlledBy == 'human'; }).length,
					unit: ige.$$('unit').length,
					item: ige.$$('item').length,
					debris: ige.$$('debris').length,
					projectile: ige.$$('projectile').length,
					sensor: ige.$$('sensor').length,
					region: ige.$$('region').length
				},
				bandwidth: self.bandwidthUsage,
				heapUsed: process.memoryUsage().heapUsed / 1024 / 1024,
				currentTime: ige._currentTime,
				physics: {
					engine: ige.physics.engine,
					bodyCount: ige.physics._world.m_bodyCount,
					contactCount: ige.physics._world.m_contactCount,
					jointCount: ige.physics._world.m_jointCount,
					stepDuration: ige.physics.avgPhysicsTickDuration.toFixed(2),
					stepsPerSecond: ige._physicsFPS,
					totalBodiesCreated: ige.physics.totalBodiesCreated
				},
				etc: {
					totalPlayersCreated: ige.server.totalPlayersCreated,
					totalUnitsCreated: ige.server.totalUnitsCreated,
					totalItemsCreated: ige.server.totalItemsCreated,
					totalProjectilesCreated: ige.server.totalProjectilesCreated,
					totalWallsCreated: ige.server.totalWallsCreated
				},
				cpu: cpuDelta,
				lastSnapshotLength: JSON.stringify(ige.server.lastSnapshot).length
			};

			self.bandwidthUsage = {
				unit: 0,
				debris: 0,
				item: 0,
				player: 0,
				projectile: 0,
				region: 0,
				sensor: 0
			};

			return returnData;
		}
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = Server; }
