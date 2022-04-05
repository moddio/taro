showMiniMap = false;
showAllLayers = false;
curLayerPainting = 'floor';
let mouseIsDown = false;
// be very careful with arrow functions.
// arrow functions on these callbacks break mouse input

$(document).mousedown(function() {
	mouseIsDown = true;
}).mouseup(function() {
	mouseIsDown = false;
});

const statsPanels = {}; // will we need this?

const Client = IgeClass.extend({
	classId: 'Client',

	init: function() {
		//

		this.data = [];
		this.previousScore = 0;
		this.host = window.isStandalone ? 'https://www.modd.io' : '';
		this.loadedTextures = {};

		console.log('window.location.hostname: ', window.location.hostname); // unnecessary

		if (window.location.hostname == 'localhost') ige.env = 'local';

		this.entityUpdateQueue = {};
		this.errorLogs = [];
		this.tickAndUpdateData = {};

		pathArray = window.location.href.split('/');

		$('coin-icon').append(
			$('<img/>', {
				src: `${this.host}/assets/images/coin.png`,
				width: 32,
				height: 32
			})
		);

		this.igeEngineStarted = $.Deferred();
		this.physicsConfigLoaded = $.Deferred();
		this.texturesLoaded = $.Deferred();
		this.mapLoaded = $.Deferred();

		// after rewrite then testing, this obviously stayed 'pending' so lets comment it out for now
		// this.miniMapLoaded = $.Deferred(); // well are we using it

		this.mapRenderEnabled = true; // check where we use this
		this.unitRenderEnabled = true; // check where we use this
		this.itemRenderEnabled = true; // check where we use this
		this.uiEntityRenderEnabled = true; // check where we use this

		this.miniMapEnabled = false;
		this.clearEveryFrame = true;
		this.cameraEnabled = true;
		this.ctxAlphaEnabled = true;
		this.viewportClippingEnabled = true;

		this.extrapolation = false; //old comment => 'disabling due to item bug'
		this.resolution = 0; //old comment => 'autosize'
		this.scaleMode = 0; //old comment => 'none'
		this.isActiveTab = true;

		this._trackTranslateSmoothing = 15;
		this.inactiveTabEntityStream = [];
		this.eventLog = [];

		this.fontTexture = new IgeFontSheet('/assets/fonts/verdana_12pt.png');
		this.servers = [
			{
				ip: '127.0.0.1',
				port: 2001,
				playerCount: 0,
				maxPlayers: 32,
				acceptingPlayers: true,
				gameId: gameId,
				url: 'ws://localhost:2001'
			}
		];

		this.cellSheets = {};

		this.allowTickAndUpdate = [
			'baseScene',
			'vpMiniMap',
			'minimapScene',
			'objectScene',
			'rootScene',
			'vp1',
			'tilelayer'
		];

		this.keysToAddBeforeRender = [
			'abilities', 'animations', 'bodies', 'bonus',
			'cellSheet', 'sound', 'states',
			'inventorySize', 'particles', 'price',
			'skin', 'variables', 'canBuyItem',
			'canBePurchasedBy', 'inventoryImage', 'isPurchasable',
			'bulletStartPosition', 'canBePurchasedBy', 'carriedBy',
			'damage', 'description', 'handle', 'hits',
			'inventoryImage', 'isGun', 'isStackable', 'deployMethod',
			'maxQuantity', 'texture', 'raycastCollidesWith', 'effects',
			'penetration', 'bulletDistance', 'bulletType', 'ammoSize', 'ammo', 'ammoTotal',
			'reloadRate', 'recoilForce', 'fireRate', 'knockbackForce', 'canBeUsedBy', 'spawnChance',
			'consumeBonus', 'isConsumedImmediately', 'type', 'lifeSpan', 'removeWhenEmpty', 'spawnPosition',
			'baseSpeed', 'bonusSpeed', 'controls'
		];

		// can we just comment this out
		this.tradeOffers = [undefined, undefined, undefined, undefined, undefined];

		// add utility
		this.implement(ClientNetworkEvents);
		ige.addComponent(IgeInitPixi);

		$('#dev-error-button').on('click', () => {
			$('#error-log-modal').modal('show');
		});

		$('#bandwidth-usage').on('click', () => { // maybe we could rename 'bandwidth-usage'
			$('#dev-status-modal').modal('show');
		});

		$('#leaderboard-link').on('click', (e) => {
			$('leaderboard-modal').modal('show');
		});

		document.addEventListener('visibilitychange', () => { //this should not be changed to jQ.on()
			//old comment => 'apply entities' merged stats saved during inactive tab
			if (!document.hidden) {
				this.applyInactiveTabEntityStream();
			}

			this.isActiveTab = !document.hidden;
		});

		//go fetch

		ige.addComponent(GameComponent);
		// we're going to try and insert the fetch here
		let promise = new Promise((resolve, reject) => {
			if (gameId) {
				$.ajax({
					url: `${this.host}/api/game-client/${gameId}`,
					dataType: 'json',
					type: 'GET',
					success: (game) => {
						//
						resolve(game);
					}
				});
			} else {
				$.ajax({
					url: '/src/game.json',
					dataType: 'json',
					type: 'GET',
					success: (game) => {
						//
						const data = { data: {} };

						game.defaultData = game;

						for (let [key, value] of Object.entries(game)) {
							//
							data['data'][key] = value;
						}

						for (let [key, value] of Object.entries(game.data)) {
							//
							data['data'][key] = value;
						}

						resolve(data);
					}
				});
			}
		});

		promise.then((game) => {
			ige.game.data = game.data;
			// add components to ige instance
			// old comment => 'components required for client-side game logic'
			ige.addComponent(IgeNetIoComponent);
			ige.addComponent(SoundComponent);

			ige.addComponent(MenuUiComponent);
			ige.addComponent(TradeUiComponent); // could we comment this one out?
			ige.addComponent(MobileControlsComponent);
		})
			.catch((err) => {
				console.error(err);
			})
			.finally(() => {
				this.configureEngine();
			});

		// these were under separate conditionals before. idk why.
		if (mode == 'play') {
			$('#igeFrontBuffer').click(() => {
				$('#more-games').removeClass('slideup-menu-animation').addClass('slidedown-menu-animation');
			});

			setTimeout(() => {
				// console.log('loading removed'); // not necessary in production
				$('#loading-container').addClass('slider-out');
			}, 2000);

			// let's try getting our server here
			//
			// if our url vars contained a serverId we are adding it to params
			// ADDING check for engine start resolved
			$.when(this.igeEngineStarted).done(() => {
				//
				const params = this.getUrlVars();
				this.serverFound = false;

				if (!window.isStandalone) {
					//
					this.servers = this.getServersArray();
				}
				// undefined if our params did not have a serverId
				this.preSelectedServerId = params.serverId;

				if (this.preSelectedServerId) {
					//
					for (let serverObj of this.servers) {
						//
						// old comment => 'preselected server found! (via direct url)'
						if (serverObj.id == this.preSelectedServerId) {
							//
							console.log('pre-selected server found. connecting...'); // prod console log

							this.serverFound = true;
							this.server = serverObj;
							break;
						}
					}
				}

				if (!this.server) {
					//
					// if we didn't provide server, we search for the best one
					const bestServer = this.getBestServer();

					if (bestServer) {
						//
						this.server = bestServer;
						this.serverFound = true;
					}
				}

				$('#server-list').val(this.server.id);
				// console.log(`best server selected: ${this.server, this.server.id}`);
			});
		}
	},

	loadPhysics: function() {
		// this will be empty string in data if no client-side physics
		const clientPhysicsEngine = ige.game.data.defaultData.clientPhysicsEngine;
		const serverPhysicsEngine = ige.game.data.defaultData.physicsEngine;


		window.igeLoader.loadPhysicsConfig(
			//
			clientPhysicsEngine,
			serverPhysicsEngine,
			// this callback fires when we have loaded all of the files
			() => {
				//
				// console.log('Physics engine files loaded');
				if (clientPhysicsEngine) {
					//
					ige.addComponent(PhysicsComponent)
						.physics.sleep(true);
				}
				// we want as little as possible in here so we can start our other loading
				this.physicsConfigLoaded.resolve();
			}
		);
	},

	loadMap: function() {
		//
		//we need the contents of physicsConfig to progress
		ige.addComponent(MapComponent);
		ige.addComponent(RegionManager);

		ige.menuUi.clipImageForShop();
		ige.scaleMap(ige.game.data.map);

		// IgePixiMap contains ige.client.mapLoaded.resolve();
		ige.map.load(ige.game.data.map);
	},

	//
	// new language for old 'initEngine' method
	//
	configureEngine: function() {
		//
		// let's make it easier by assigning the game data to a variable
		const gameData = ige.game.data;

		if (!gameData.isDeveloper) { // .isDeveloper property seems to be outdated
			//
			gameData.isDeveloper = window.isStandalone;
		}

		this.loadPhysics();

		$.when(this.physicsConfigLoaded).done(() => {

			//this is a really important async chain
			//
			// it *was* written as a dependency for IgeEngineStart,
			// but I don't think it was actually waiting until it was finished
			// to fire the event
			ige.client.loadGameTextures()
				.then(() => {
					//
					// ige.map.load could not run in tandem with texture loading
					// we could potentially speed this up by adding a second instance of pixi loader
					// and then delete it when finished.
					// this.loadMap(); // this runs fine here instead of in a `finally` block. Not sure it is functionally different.

					// eventually added a temporary PIXI.Loader instance to handle map so we can load in tandem.
					// as such, moved this.loadMap() outside of this promisified chain.

					this.texturesLoaded.resolve();
				})
				.catch((err) => {
					console.error(err);
				});
			this.loadMap();

			// still doing things only after physics load
			let engineTickFrameRate = 15;

			if (gameData.defaultData && !isNaN(gameData.defaultData.frameRate)) {
				//
				engineTickFrameRate = Math.max(
					// old comment => 'keep fps range between 15 and 60'
					15,
					Math.min(
						//
						parseInt(gameData.defaultData.frameRate),
						60
					)
				);
			}

			ige._physicsTickRate = engineTickFrameRate;

			if (ige.physics) {
				// old comment => 'always enable CSP'
				this.loadCSP();
			}

			// added important configuration details for sandbox
			if (mode == 'sandbox') {
				$.when(this.mapLoaded)
					.done(() => {
						ige.mapEditor.scanMapLayers();
						ige.mapEditor.drawTile();
						ige.mapEditor.addUI();
						ige.mapEditor.customEditor();

						if (!gameData.isDeveloper) {
							//
							ige.mapEditor.selectEntities = false;
						}

						ige.setFps(15);
						$('#loading-container').addClass('slider-out');
					})
					.fail((err) => {
						$('#loading-container').addClass('slider-out');
						console.error(err); // for now
					});

			}

			// don't really know if this needs to be inside this
			ige.addComponent(VariableComponent);

			if(gameData.isDeveloper) {
				//
				ige.addComponent(DevConsoleComponent);
			}

			// so let's try calling startIgeEngine here.
			// depends on physics loading
			this.startIgeEngine();
		});

		//this doesn't depend on physics config
		if (gameData.isDeveloper) {
			//
			$('#mod-this-game-menu-item').removeClass('d-none');
		}

		//don't think these depend on physcis
		ige.menuUi.toggleScoreBoard();
		ige.menuUi.toggleLeaderBoard();

		// this is viewport stuff
		// doing these with this.igeEngineStarted.done()
		// we can move the Deferred for mapLoaded to before engine start
		//
		$.when(this.igeEngineStarted, this.mapLoaded).done(() => {
			// old comment => 'center camera while loading'
			const tileWidth = ige.scaleMapDetails.tileWidth;
			const tileHeight = ige.scaleMapDetails.tileHeight;

			ige.client.vp1.camera.translateTo(
				(ige.map.data.width * tileWidth) / 2,
				(ige.map.data.height * tileHeight) /2,
				0
			);

			ige.addComponent(AdComponent);

			let zoom = 1000;

			if (
				gameData.settings.camera &&
				gameData.settings.camera.zoom &&
				gameData.settings.camera.zoom.default
			) {
				zoom = gameData.settings.camera.zoom.default;
				this._trackTranslateSmoothing = gameData.settings.camera.trackingDelay || 15;
			}

			this.setZoom(zoom);

			ige.addComponent(TimerComponent)
				.addComponent(ThemeComponent)
				.addComponent(PlayerUiComponent)
				.addComponent(UnitUiComponent)
				.addComponent(ItemUiComponent)
				.addComponent(ScoreboardComponent)
				// old comment => 'game data is needed to populate shop
				.addComponent(ShopComponent);

			if (gameData.defaultData.enableMiniMap) {
				//
				ige.miniMap.createMiniMap();
			}

			ige.shop.enableShop();

			//old comments => 'load sound and music when game starts'
			ige.sound.preLoadSound();
			ige.sound.preLoadMusic();

			window.activatePlayGame = true; // is there a reason this line was repeated?

			$('#play-game-button-wrapper').removeClass('d-none-important');
			// $('.modal-videochat-backdrop, .modal-videochat').removeClass('d-none'); // hmmm
			// $('.modal-videochat').show(); // no

			//
			$('.modal-step-link[data-step=2]').click(); // ok this is going to have to be explained

			if ( // big if
				//
				this.preSelectedServerId &&
				this.serverFound &&
				params.joinGame == 'true' &&
				userId
			) {
				//
				this.connectToServer();
			}

			// const params = ige.client.getUrlVars(); //PUT THIS SOMEWHERE
			// unit image loading???
			// we're not gonna do minimap for now but I will add it and comment out.
			// if (mode == 'play' && gameData.defaultData.enableMiniMap) {
			// 	//
			// 	$('#leaderboard').css({
			// 		//
			// 		top: 190
			// 	});

			// 	this.miniMapEnabled = true;
			// 	ige.miniMap.updateMiniMap();
			// }
		});

	},

	//
	// Not sure if we should be doing it this way,
	// but i'll replicate the old startIgeEngine method.
	//
	// I am changing the 'texturesLoaded emit callback to a $.when()
	// with a texturesLoaded Deferred object
	//
	startIgeEngine: function() {
		//
		$.when(this.texturesLoaded).done(() => {
			//
			ige.start((success) => {
				//
				if (success) {
					//
					this.rootScene = new IgeScene2d()
						.id('rootScene')
						.drawBounds(false);

					this.minimapScene = new IgeScene2d()
						.id('minimapScene')
						.drawBounds(false);

					this.tilesheetScene = new IgeScene2d()
						.id('tilesheetScene')
						.drawBounds(true)
						.drawMouse(true);

					this.mainScene = new IgeScene2d()
						.id('baseScene') // torturing me with the naming
						.mount(this.rootScene)
						.drawMouse(true);

					this.objectScene = new IgeScene2d()
						.id('objectScene')
						.mount(this.mainScene);

					// moving this up here so we can give sandbox the map pan component below
					this.vp1 = new IgeViewport()
						.id('vp1')
						.autoSize(true)
						.scene(this.rootScene)
						.drawBounds(false)
						.mount(ige);

					// old comment => 'Create the UI scene'
					this.uiScene = new IgeScene2d()
						.id('uiScene')
						.depth(1000)
						.ignoreCamera(true)
						.mount(this.rootScene);

					ige.mobileControls.attach(this.uiScene);

					// sandbox check for minimap
					if (mode == 'sandbox') {
						//
						ige.addComponent(MapEditorComponent)
							.mapEditor.createMiniMap();
						//
						// sandbox also gets a second viewport
						// moved the code under a duplicate conditional
						this.vp2 = new IgeViewport()
							.id('vp2')
							.layer(100)
							.drawBounds(true)
							.height(0)
							.width(0)
							.borderColor('#0bcc38')
							.borderWidth(20)
							.bottom(0)
							.right(0)
							.scene(this.tilesheetScene)
							.mount(ige);

						// sandbox also gets map pan components
						this.vp1.addComponent(MapPanComponent)
							.mapPan.enabled(true);

						this.vp2.addComponent(MapPanComponent)
							.mapPan.enabled(true);

						ige.client.vp1.drawBounds(true);
						//
					} else if (mode == 'play') {
						//
						ige.addComponent(MiniMapComponent)
							.addComponent(MiniMapUnit);
						//
					} else {
						//
						console.error('mode was not == to "sandbox" or "play"');
					}

					// moved this down here
					ige._selectedViewport = this.vp1;

					this.igeEngineStarted.resolve();
				}
			});
		});
	},

	//
	getServersArray: function() {
		const serversList = [];
		let serverOptions = $('#server-list > option').toArray(); // could this be const? idk jQ

		serverOptions.forEach((serverOption) => {
			let server = {
				playerCount: parseInt($(serverOption).attr('player-count')),
				maxPlayers: parseInt($(serverOption).attr('max-players')),
				owner: $(serverOption).attr('owner'),
				url: $(serverOption).attr('data-url'),
				gameId: gameId,
				id: $(serverOption).attr('value')
			};

			serversList.push(server);
		});

		return serversList;
	},
	// we never call this inside Client with a parameter. I assume its an array?
	//
	getBestServer: function(ignoreServerIds) {
		let firstChoice = null; // old comment => 'server which has max players and is under 80% capacity
		let secondChoice = null;

		const validServers = this.servers.filter((server) => {
			return !ignoreServerIds || ignoreServerIds.indexOf(server.id) == -1;
		});

		// old comment => 'max number of players for a server which is under 80% of its capacity
		const overloadCriteria = 0.8;
		let maxPlayersInUnderLoadedServer = 0;
		let minPlayerCount = Number.MAX_SAFE_INTEGER; // ok this seems really unnecessary

		for (let server of validServers) {
			const capacity = server.playerCount / server.maxPlayers;

			if (capacity < overloadCriteria && server.playerCount > maxPlayersInUnderLoadedServer) {
				firstChoice = server;
				maxPlayersInUnderLoadedServer = server.playerCount;
			}

			if (server.playerCount < minPlayerCount) {
				secondChoice = server;
				minPlayerCount = server.playerCount;
			}
		}

		return firstChoice || secondChoice;
	},

	// load game textures with ige.pixi.loader
	// this is was previously the only thing required before ige.start() // lets change that
	//
	loadGameTextures: function() {
		return new Promise((resolve) => {
			const version = 1;
			const pixiLoader = ige.pixi.loader; // renamed this from 'resource' to 'pixiLoader'

			// old comment => 'used when texture is not loaded in cache'
			pixiLoader.add(
				'emptyTexture',
				`https://cache.modd.io/asset/spriteImage/1560747844626_dot.png?version=${version}`,
				{ crossOrigin: true }
			);

			const iterateAndAddByEntityType = (type) => {
				//
				let entityType = type;

				for (let key in ige.game.data[`${entityType}Types`]) {
					//
					const entity = ige.game.data[`${entityType}Types`][key];
					const cellSheet = entity.cellSheet;

					if (cellSheet && !ige.client.loadedTextures[cellSheet.url]) {
						//
						ige.client.loadedTextures[cellSheet.url] = cellSheet;
						pixiLoader.add(
							cellSheet.url,
							`${cellSheet.url}?version=${version}`,
							{ crossOrigin: true }
						);
					}
				}
			};

			iterateAndAddByEntityType('unit');
			iterateAndAddByEntityType('projectile');
			iterateAndAddByEntityType('item');

			pixiLoader.load((loadedResource) => {
				//
				for (let imageName in loadedResource.resources) {
					//
					const resource = loadedResource.resources[imageName];
					resource.animation = new IgePixiAnimation();

					if (resource && resource.url) {
						//
						const cellSheet = ige.client.loadedTextures[resource.name];

						if (cellSheet) {
							//
							resource.animation.getAnimationSprites(
								resource.url,
								cellSheet.columnCount,
								cellSheet.rowCount
							);
						}
					}
				}

				return resolve();
			});
		});
	},

	//
	setZoom: function(zoom) {
		// old comment => 'on mobile increase default zoom by 25%'
		let zoomVar = zoom;
		if (ige.mobileControls.isMobile) {
			zoomVar *= 0.75;
		}

		ige.pixi.zoom(zoomVar);
		// there was a bunch of stuff involving viewports and view areas in the old method,
		// it appeared to be out of use.
	},

	//
	connectToServer: function() {
		// if typeof args[1] == 'function', callback(args[0])
		ige.network.start(ige.client.server, (clientServer) => { // changed param from 'data' to clientServer
			//
			for (let serverObj of ige.client.servers) {
				//
				if (serverObj.url == clientServer.url) {
					//
					ige.client.server = serverObj;
					break;
				}
			}

			if (ige.client.server) {
				// i feel like this is a goofy conditional
				const serverIP = ige.client.server.url.split('://')[1];

				if (serverIP) {
					//
					const serverName = serverIP.split('.')[0];

					if (serverName) {
						//
						$('#server-text').text(`to ${serverName}`);
					}
				}
			}

			$('#loading-container').addClass('slider-out');

			console.log('connected to ', ige.client.server.url, 'clientId ', ige.network.id()); // idk if this needs to be in production

			ige.client.defineNetworkEvents();

			ige.network.send('igeChatJoinRoom', '1');

			ige.addComponent(IgeChatComponent);
			ige.addComponent(VideoChatComponent); // shall we talk about the elephant in the room?
			ige.chat.on('messageFromServer', (msgData) => {
				ige.chat.postMessage(msgData);
			});

			const sendInterval = ige.game.data.settings.latency || (ige._fpsRate > 0) ? 1000 / ige._fpsRate : 70;

			// old comment => 'check for all of the existing entities in the game
			ige.network.addComponent(IgeStreamComponent);
			// old comment => 'render the simulation renderLatency ms in the past'
			ige.network.stream.renderLatency(50);
			ige.network.stream._streamInterval = sendInterval;
			// old comment => 'create a listener that will fire whenever an entity is created because of the incoming stream data'
			ige.network.stream.on('entityCreated', (entity) => {
				//
				if (entity._category == 'unit') {
					// old comment => 'unit detected. add it to units array'
					const unit = entity;
					unit.equipSkin();

					if (unit._stats.ownerId) {
						// this one can probably be refactored, but i'm not sure what it may break
						const ownerPlayer = ige.$(unit._stats.ownerId);

						if (ownerPlayer) {
							//
							unit.setOwnerPlayer(
								unit._stats.ownerId,
								{ dontUpdateName: true }
							);
						}
					}

					unit.renderMobileControl();
					// old comment => 'avoid race condition for item mounting'
				} else if (entity._category == 'player') {
					// old comment => 'apply skin to all units owned by this player'
					const player = entity;

					if (player._stats.controlledBy == 'human') {
						// old comment => 'if the player is me'
						if (player._stats.clientId == ige.network.id()) {
							//
							ige.client.eventLog.push([
								ige._currentTime - ige.client.eventLogStartTime,
								'My player created'
							]);
							// old comment => 'declare my player'
							ige.client.myPlayer = player;

							if (typeof startVideoChat == 'function') {
								// the elephant is back
								startVideoChat(player.id());
							}

							player.redrawUnits(['nameLabel']);
						}
						// old comment => 'if there are pre-existing units that belong to the newly detected player,
						// assign those units' owner as this player
						const unitsObject = ige.game.getUnitsByClientId(player._stats.clientId);

						for (let unitId in unitsObject) {
							//
							unitsObject[unitId].setOwnerPlayer(
								player.id(),
								{ dontUpdateName: true }
							);
						}

						if (player._stats && player._stats.selectedUnitId) {
							//
							const unit = ige.$(player._stats.selectedUnitId);

							if (unit) {
								//
								unit.equipSkin();
							}
						}

						if (ige.game.data.isDeveloper ||
							(ige.client.myPlayer &&
							ige.client.myPlayer._stats.isUserMod)
						) {
							//
							ige.menuUi.kickPlayerFromGame(); // we should rename this method
						}
					}
				}
			});

			ige.network.stream.on('entityDestroyed', (entityBeingDestroyed) => { // renamed param from 'unitBeingDestroyed' to 'entityBeingDestroyed'
				//
				if (entityBeingDestroyed._category == 'unit') {
					//
					entityBeingDestroyed.remove();
					//
				} else if ((ige.game.data.isDeveloper || // yeah idk why i did this
							(ige.client.myPlayer &&
							ige.client.myPlayer._stats.isUserMod)) &&
							entityBeingDestroyed._category == 'player'
				) {
					//
					ige.menuUi.kickPlayerFromGame(entityBeingDestroyed.id()); // this is inside the 'Moderate' menu
				}
			});

			const params = ige.client.getUrlVars();

			ige.game.start();
			ige.menuUi.playGame();

			if (params.guestmode == 'on') { // i removed 'this params.joinGame == 'true' || ' from the condition
				// old comment => 'hide menu and skin shop button'
				ige.client.guestmode = true;
				$('.open-menu-button').hide();
				$('.open-modd-shop-button').hide();
			}

			if (window.isStandalone) {
				//
				$('#toggle-dev-panels').show();
			}
		});
	},

	//This method should be looked at...
	//
	loadCSP: function() {
		//
		ige.game.cspEnabled = !!ige.game.data.defaultData.clientSidePredictionEnabled;
		const gravity = ige.game.data.settings.gravity;

		if (gravity) {
			//
			console.log('setting gravity: ', gravity); // not in prod please
			ige.physics.gravity(gravity.x, gravity.y);
		}

		ige.physics.createWorld();
		ige.physics.start();

		ige.addComponent(TriggerComponent);
		// ige.addComponent(VariableComponent); // this appears twice
		ige.addComponent(ScriptComponent);
		ige.addComponent(ConditionComponent);
		ige.addComponent(ActionComponent);

		if (typeof mode == 'string' && mode == 'sandbox') {
			//
			ige.script.runScript('initialize', {}); // why are we doing this?
		}
	},

	// not much here except definitions
	defineNetworkEvents: function () {
		//
		ige.network.define('makePlayerSelectUnit', this._onMakePlayerSelectUnit);
		ige.network.define('makePlayerCameraTrackUnit', this._onMakePlayerCameraTrackUnit);
		ige.network.define('changePlayerCameraPanSpeed', this._onChangePlayerCameraPanSpeed);

		ige.network.define('hideUnitFromPlayer', this._onHideUnitFromPlayer);
		ige.network.define('showUnitFromPlayer', this._onShowUnitFromPlayer);
		ige.network.define('hideUnitNameLabelFromPlayer', this._onHideUnitNameLabelFromPlayer);
		ige.network.define('showUnitNameLabelFromPlayer', this._onShowUnitNameLabelFromPlayer);

		ige.network.define('updateAllEntities', this._onUpdateAllEntities);
		ige.network.define('teleport', this._onTeleport);

		ige.network.define('updateEntityAttribute', this._onUpdateEntityAttribute);

		ige.network.define('updateUiText', this._onUpdateUiText);
		ige.network.define('updateUiTextForTime', this._onUpdateUiTextForTime);

		ige.network.define('alertHighscore', this._onAlertHighscore);

		ige.network.define('item', this._onItem);

		ige.network.define('clientDisconnect', this._onClientDisconnect);

		ige.network.define('ui', this._onUi);
		ige.network.define('playAd', this._onPlayAd);
		ige.network.define('buySkin', this._onBuySkin);
		ige.network.define('videoChat', this._onVideoChat);

		ige.network.define('devLogs', this._onDevLogs);
		ige.network.define('errorLogs', this._onErrorLogs);

		ige.network.define('sound', this._onSound);
		ige.network.define('particle', this._onParticle);
		ige.network.define('camera', this._onCamera);

		ige.network.define('gameSuggestion', this._onGameSuggestion);
		ige.network.define('minimap', this._onMinimapEvent);

		ige.network.define('createFloatingText', this._onCreateFloatingText)

		ige.network.define('openShop', this._onOpenShop);
		ige.network.define('openDialogue', this._onOpenDialogue);
		ige.network.define('closeDialogue', this._onCloseDialogue);

		ige.network.define('setOwner', this._setOwner);
		ige.network.define('userJoinedGame', this._onUserJoinedGame);

		ige.network.define('trade', this._onTrade);
	},

	//
	//i'm not going to change the login.
	//
	login: function() {
		//
		console.log('attempting to login'); // no console logs in production.

		$.ajax({
			url: '/login',
			data: {
				username: $('input[name="username"]').val(),
				password: $('input[name="password"]').val()
			},
			dataType: 'json',
			jsonpCallback: 'callback',
			type: 'POST',
			success: (data) => {
				//
				if (data.response == 'success') {
					//
					this.joinGame();
					//
				} else {
					//
					$('#login-error-message').html(data.message).show().fadeOut(7000)
				}
			}
		});
	},

	//
	//i'm not going to change the join game function
	//
	joinGame: function() {
		//
		let isAdBlockEnabled = true;
		const data = {
			number: (Math.floor(Math.random() * 999) + 100) // yeah ok cool, why?
		};

		ige.client.removeOutsideEntities = undefined;
		window.joinedGame = true;

		$('#dev-console').hide();

		if (typeof (userId) != 'undefined' && typeof (sessionId) != 'undefined') {
			//
			data._id = userId;
		}

		if (ige.mobileControls && !ige.mobileControls.isMobile) {
			//
			$('.game-ui').show();
		}

		// old comment => 'try loading an ad to find out whether adblocker is active or not
		if (window.isStandalone) {
			//
			isAdBlockEnabled = false;
			//
			if (typeof adBlockStatus == 'function') {
				//
				adBlockStatus(false);
			}
			//
		} else {
			//
			$.ajax(
				'/showads.js',
				{
					async: false,
					success: () => {
						isAdBlockEnabled = false;
						adBlockStatus(true);
					},
					fail: () => {
						adBlockStatus(true);
					}
				}
			);
			//notify for ad block
			if (window.isAdBlockEnabled) {
				//
				notifyAboutAdBlocker();
			}
		}

		// old comment => 'show popover on settings icon for low fram rate'
		if (!ige.mobileControls.isMobile) {
			//
			setTimeout(() => {
				//
				this.lowFPSInterval = setInterval(() => {
					//
					if (this.resolutionQuality != 'low' && ige._renderFPS < 40) { // do we still use this?
						//
						$('#setting').popover('show');
						clearInterval(this.lowFPSInterval);
					}
				}, 60000);
			}, 60000);
		}

		document.addEventListener('click', () => {
			// changed this to addEventListener so we capture the actual event
			$('#setting').popover('hide');
		});

		data.isAdBlockEnabled = !!isAdBlockEnabled;

		ige.network.send('joinGame', data);

		window.joinGameSent.start = Date.now();

		console.log('joinGame sent'); // you already know how I feel about these

		// old comment => 'if game was paused'
		if (!window.playerJoined) {
			//
			ige.client.eventLog.push([
				0,
				`joinGame sent. userId: ${userId}`
			]);
			ige.client.eventLogStartTime = ige._currentTime;
			//
		}
	},

	//
	// not going to touch that regex.
	//
	getUrlVars: function() {
		// old comment => 'edited for play/:gameId'
		const tempGameId = window.location.pathname.split('/')[2];
		const vars = {
			gameId: tempGameId,
		};

		// old comment => 'if serverId is present then add it to vars
		window.location.href.replace(
			/[?&]+([^=&]+)=([^&]*)/gi,
			(m, key, value) => { // not sure about this after looking up .replace()
				//
				vars[key] = value;
			}
		);

		return vars;

	},

	//
	// again not really touching this one
	//
	applyInactiveTabEntityStream: function() {
		//
		for (let entityId in this.inactiveTabEntityStream) {
			//
			const entityData = _.cloneDeep(this.inactiveTabEntityStream[entityId]);
			this.inactiveTabEntityStream[entityId] = [];

			const entity = ige.$(entityId);

			if (entity && entityData) {
				//
				entity.streamUpdateData(entityData);
			}
		}
	},

	//
	positionCamera: function(x, y) {
		//
		if (x != undefined && y != undefined) {
			//
			ige.pixi.viewport.removePlugin('follow');
			//
			console.log(ige.pixi.viewport); // ok i understand this one...

			ige.pixi.viewport.moveCenter(x, y);
		}
	}
});

if (typeof (module) != 'undefined' && typeof (module.exports) != 'undefined') {
	module.exports = Client;
}
