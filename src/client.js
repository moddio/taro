showMiniMap = false;
showAllLayers = false;
curLayerPainting = "floor";
var mouseIsDown = false;
var curSelectedTileIndex;
$(document).mousedown(function () {
    mouseIsDown = true;
}).mouseup(function () {
    mouseIsDown = false;
});

var statsPanels = {};

// minimap is disabled for BETA
// if ((typeof gameId !== 'undefined') && (gameId != "") && (mode == 'sandbox')) {
//     showMiniMap = true;
// }

var Client = IgeClass.extend({
    classId: 'Client',

    init: function () {

        var self = this;
        self.data = [];
        self.previousScore = 0;
        self.host = window.isStandalone ? 'https://www.modd.io' : '';
        self.loadedTextures = {};

        console.log("var getUrl ", window.location.hostname)
        if (window.location.hostname == 'localhost')
            ige.env = 'local'

        self.entityUpdateQueue = {};
        self.errorLogs = [];
        self.tickAndUpdateData = {};

        pathArray = window.location.href.split('/');

        $("#coin-icon").append(
            $("<img/>", {
                src: self.host + "/assets/images/coin.png",
                width: 32,
                height: 32
            }))

        self.igeEngineStarted = $.Deferred();
        self.mapLoaded = $.Deferred();
        self.mapRenderEnabled = true;
        self.unitRenderEnabled = true;
        self.itemRenderEnabled = true;
        self.uiEntityRenderEnabled = true;
        self.miniMapLoaded = $.Deferred();
        self.miniMapEnabled = false;
        self.clearEveryFrame = true;
        self.cameraEnabled = true;
        self.ctxAlphaEnabled = true;
        self.viewportClippingEnabled = true;
        self.extrapolation = false; //disabeling due to item bug
        self.resolution = 0; // autosize
        self.scaleMode = 0; // none
        self.isActiveTab = true;
        self._trackTranslateSmoothing = 15;
        self.inactiveTabEntityStream = [];
        self.eventLog = [];

        self.fontTexture = new IgeFontSheet('/assets/fonts/verdana_12pt.png');
        self.servers = [
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

        self.cellSheets = {};
        self.allowTickAndUpdate = [
            'baseScene',
            'vpMiniMap',
            'minimapScene',
            'objectScene',
            'rootScene',
            'uiScene',
            'vp1',
            'tilelayer'
        ]
        self.keysToAddBeforeRender = [
            "abilities", "animations", "bodies", "bonus",
            "cellSheet", "sound", "states",
            "inventorySize", "particles", "price",
            "skin", "variables", "canBuyItem",
            "canBePurchasedBy", "inventoryImage", "isPurchasable",
            "bulletStartPosition", "canBePurchasedBy", "carriedBy",
            "damage", "description", "handle", "hits",
            "inventoryImage", "isGun", "isStackable", "deployMethod",
            "maxQuantity", "texture", "raycastCollidesWith", "effects",
            'penetration', "bulletDistance", "bulletType", "ammoSize", "ammo", "ammoTotal",
            "reloadRate", "recoilForce", "fireRate", "knockbackForce", "canBeUsedBy", "spawnChance",
            "consumeBonus", "isConsumedImmediately", "type", "lifeSpan", "removeWhenEmpty", "spawnPosition",
            "baseSpeed", "bonusSpeed", "controls"
        ];


        self.tradeOffers = [undefined, undefined, undefined, undefined, undefined]

        self.implement(ClientNetworkEvents);

        //	ige.addComponent(IgeEditorComponent);
        ige.addComponent(IgeInitPixi);
        self.startIgeEngine()

        //register error log modal btn;
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

        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) {
                //apply entities merged stats saved during inactive tab
                self.applyInactiveTabEntityStream();
            }
            self.isActiveTab = !document.hidden;
        });

        if (typeof mode == 'string' && mode == 'play') {
            $('#igeFrontBuffer').click(function (e) {
                $('#more-games').removeClass('slideup-menu-animation').addClass('slidedown-menu-animation')
            })
        }

        console.log("client box2d world started")
        // components required for client side game logic
        // Add physics and setup physics world
        ige.addComponent(GameComponent);
        ige.addComponent(IgeNetIoComponent);
        ige.addComponent(SoundComponent);
        ige.addComponent(MapComponent);


        ige.addComponent(MenuUiComponent);
        ige.addComponent(TradeUiComponent);
        ige.addComponent(MobileControlsComponent);
        if (mode === 'play') {
            setTimeout(function () {
                console.log('loading removed')
                $('#loading-container').addClass('slider-out');
            }, 2000);
        }
        $.when(self.igeEngineStarted).done(function () {

            // SANDBOX mode
            if (typeof mode == 'string' && mode == 'sandbox') {

                $.ajax({
                    url: '/api/game-client/' + gameId,
                    dataType: "json",
                    type: 'GET',
                    success: function (game) {
                        ige.game.data = game.data;
                        // load map
                        var gameMap = ige.scaleMap(game.data.map);

                        ige.map.load(gameMap);

                        var baseTilesize = 64;
                        var tilesizeRatio = baseTilesize / ige.game.data.map.tilewidth;
                        ige.physics.tilesizeRatio(tilesizeRatio)

                        //close loading screen in 4 second;
                        setTimeout(function () {
                            $('#loading-container').addClass('slider-out');
                        }, 4000);

                        $.when(self.mapLoaded)
                            .done(function () {

                                ige.mapEditor.scanMapLayers()
                                ige.mapEditor.drawTile();
                                ige.mapEditor.addUI()
                                ige.mapEditor.customEditor()
                                if (!ige.game.data.isDeveloper) {
                                    ige.mapEditor.selectEntities = false;
                                }
                                ige.setFps(15);
                                $('#loading-container').addClass('slider-out');
                            })
                            .fail(function (err) {
                                $('#loading-container').addClass('slider-out');
                            })

                    }
                })
            } else {
                var params = self.getUrlVars()
                self.serverFound = false;
                if (!window.isStandalone) {
                    self.servers = self.getServersArray();
                }
                self.preSelectedServerId = params.serverId;

                if (self.preSelectedServerId) {
                    for (var serverObj of self.servers) {
                        // pre-selected server found! (via direct url)
                        if (serverObj.id == self.preSelectedServerId) {
                            console.log("pre-selected server found. connecting..")
                            self.serverFound = true
                            self.server = serverObj;
                            break;
                        }
                    }
                }

                if (!self.server) {
                    var bestServer = self.getBestServer();

                    if (bestServer) {
                        self.server = bestServer;
                        self.serverFound = true;
                    }
                }
                $('#server-list').val(self.server.id)
                console.log('best server selected', self.server)

                self.initEngine();
            }
        })
    },

    getServersArray: function () {
        var serversList = [];
        var serverOptions = $("#server-list > option").toArray();

        serverOptions.forEach(function (serverOption) {

            var server = {
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

    getBestServer: function (ignoreServerIds) {
        var self = this;
        var firstChoice = null; // server which has max players and is under 80% capacity
        var secondChoice = null;
        var validServers = self.servers.filter(function (server) {
            return !ignoreServerIds || ignoreServerIds.indexOf(server.id) === -1;
        });

        // max number of players for a server which is under 80% of its capacity
        var overloadCriteria = 0.8;
        var maxPlayersInUnderLoadedServer = 0;
        var minPlayerCount = Number.MAX_SAFE_INTEGER;

        for (var server of validServers) {
            var capacity = server.playerCount / server.maxPlayers;

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

    startIgeEngine: function () {
        var self = this;

        // ige.createFrontBuffer(true);

        // when all textures have loaded
        ige.on('texturesLoaded', function () {
            // Ask the engine to start
            ige.start(function (success) {
                // Check if the engine started successfully
                if (success) {
                    console.log("textures loaded")

                    self.rootScene = new IgeScene2d().id('rootScene').drawBounds(false);

                    self.minimapScene = new IgeScene2d().id('minimapScene').drawBounds(false);

                    self.tilesheetScene = new IgeScene2d().id('tilesheetScene').drawBounds(true).drawMouse(true);

                    self.mainScene = new IgeScene2d().id('baseScene').mount(self.rootScene).drawMouse(true);

                    self.objectScene = new IgeScene2d().id('objectScene').mount(self.mainScene)

                    if (typeof mode == 'string' && mode == 'sandbox') {
                        ige.addComponent(MapEditorComponent)
                        ige.mapEditor.createMiniMap();
                    } else if (typeof mode === 'string' && mode == 'play') {
                        ige.addComponent(MiniMapComponent)
                        ige.addComponent(MiniMapUnit);
                    }
                    ige.addComponent(RegionManager);

                    // Create the UI scene
                    self.uiScene = new IgeScene2d()
                        .id('uiScene')
                        .depth(1000)
                        .ignoreCamera(true)
                        .mount(self.rootScene);

                    ige.mobileControls.attach(self.uiScene);

                    if (typeof mode == 'string' && mode == 'sandbox') {
                        self.vp2 = new IgeViewport()
                            .id('vp2')
                            .layer(100)
                            .drawBounds(true)
                            .height(0)
                            .width(0)
                            .borderColor('#0bcc38')
                            .borderWidth(20)
                            .bottom(0)
                            .right(0)
                            .scene(self.tilesheetScene)
                            .mount(ige);
                    }
                    self.vp1 = new IgeViewport()
                        .id('vp1')
                        .autoSize(true)
                        .scene(self.rootScene)
                        .drawBounds(false)
                        .mount(ige);

                    ige._selectedViewport = self.vp1;

                    if (typeof mode == 'string' && mode == 'sandbox') {
                        self.vp1.addComponent(MapPanComponent)
                            .mapPan.enabled(true);

                        self.vp2.addComponent(MapPanComponent)
                            .mapPan.enabled(true);

                        ige.client.vp2.drawBounds(true);
                        ige.client.vp1.drawBounds(true)
                    }

                    console.log("igeEngine Started")

                    self.igeEngineStarted.resolve();
                }
            });
        });
    },

    loadGameTextures: function () {
        return new Promise(function (resolve, reject) {
            var version = 1;
            var resource = ige.pixi.loader;

            // used when texture is not loaded in cache.
            resource.add("emptyTexture", "https://cache.modd.io/asset/spriteImage/1560747844626_dot.png?version=" + version, { crossOrigin: true });

            for (var key in ige.game.data.unitTypes) {
                var unit = ige.game.data.unitTypes[key];
                var cellSheet = unit.cellSheet;
                if (cellSheet && !ige.client.loadedTextures[cellSheet.url]) {
                    ige.client.loadedTextures[cellSheet.url] = cellSheet;
                    resource.add(cellSheet.url, cellSheet.url + "?version=" + version, { crossOrigin: true });
                }
            }
            for (var key in ige.game.data.projectileTypes) {
                var projectile = ige.game.data.projectileTypes[key];
                var cellSheet = projectile.cellSheet;
                if (cellSheet.url && !ige.client.loadedTextures[cellSheet.url]) {
                    ige.client.loadedTextures[cellSheet.url] = cellSheet;
                    resource.add(cellSheet.url, cellSheet.url + "?version=" + version, { crossOrigin: true });
                }
            }
            for (var key in ige.game.data.itemTypes) {
                var item = ige.game.data.itemTypes[key];
                var cellSheet = item.cellSheet;

                if (cellSheet && !ige.client.loadedTextures[cellSheet.url]) {
                    ige.client.loadedTextures[cellSheet.url] = cellSheet;
                    resource.add(cellSheet.url, cellSheet.url + "?version=" + version, { crossOrigin: true });
                }
            }

            resource.load(function (loadedResource) {
                for (var imageName in loadedResource.resources) {
                    var resource = loadedResource.resources[imageName];
                    resource.animation = new IgePixiAnimation();
                    if (resource && resource.url) {
                        var cellSheet = ige.client.loadedTextures[resource.name];
                        if (cellSheet) {
                            resource.animation.getAnimationSprites(resource.url, cellSheet.columnCount, cellSheet.rowCount);
                        }
                    }
                }
                return resolve();
            });
        });
        // console.log('item textures loaded');
    },

    setZoom: function (zoom) {

        // on mobile increase default zoom by 25%
        if (ige.mobileControls.isMobile) {
            zoom *= 0.75; // visible area less 25%
        }

        // var viewPort = ige.client.vp1;

        // viewPort.minimumVisibleArea(zoom, zoom); // alters viewport camera scale
        ige.pixi.zoom(zoom);
        // prevent camera moving outside of map bounds
        // var mapHeight = ige.game.data.map.height * ige.game.data.map.tileheight;
        // var mapWidth = ige.game.data.map.width * ige.game.data.map.tilewidth;
        //console.log('map height ',mapHeight,' width ',mapWidth);
        // var viewArea = viewPort.viewArea();
        //console.log('viewArea:',viewArea);
        // var buffer = 0;
        if (ige.client.resolutionQuality === 'low') {
            viewArea.width = viewArea.width * 0.5;
            viewArea.height = viewArea.height * 0.5;;
        }

    },

    initEngine: function () {
        var self = this;

        var promise;
        if (self.server.gameId) {
            promise = new Promise(function (resolve, reject) {

                $.when(self.igeEngineStarted).done(function () {
                    $.ajax({
                        url: self.host + '/api/game-client/' + self.server.gameId,
                        dataType: "json",
                        type: 'GET',
                        success: function (game) {
                            ige.menuUi.getServerPing(true);
                            resolve(game);
                        }
                    })
                })
            })
        } else {
            promise = new Promise(function (resolve, reject) {
                $.ajax({
                    url: '/src/game.json',
                    dataType: "json",
                    type: 'GET',
                    success: function (game) {
                        var data = { data: {} };
                        game.defaultData = game;
                        for (let [key, value] of Object.entries(game)) {
                            data['data'][key] = value;
                        }
                        for (let [key, value] of Object.entries(game.data)) {
                            data['data'][key] = value;
                        }
                        resolve(data);
                    }
                })
            })
        }
        promise.then(function (game) {
            var params = ige.client.getUrlVars();

            if (!game.data.isDeveloper) {
                game.data.isDeveloper = window.isStandalone;
            }
            ige.game.data = game.data;

            if (ige.game.data.isDeveloper) {
                $('#mod-this-game-menu-item').removeClass('d-none');
            }

            for (let i in ige.game.data.unitTypes) {
                let unit = ige.game.data.unitTypes[i];
                let image = new Image();
                image.src = unit.cellSheet.url;
                image.onload = function () {
                    ige.game.data.unitTypes[i].cellSheet.originalHeight = image.height / unit.cellSheet.rowCount;
                    ige.game.data.unitTypes[i].cellSheet.originalWidth = image.width / unit.cellSheet.columnCount;
                }
            }

            if (ige.game.data.defaultData.clientPhysicsEngine) {
                ige.addComponent(PhysicsComponent)
                    .physics.sleep(true);
            }

            ige.menuUi.clipImageForShop();
            ige.scaleMap(game.data.map);
            ige.client.loadGameTextures()
                .then(() => {
                    ige.map.load(ige.game.data.map);
                });

            if (mode === 'play' && ige.game.data.defaultData.enableMiniMap) {
                $('#leaderboard').css({
                    top: '190px'
                })
                self.miniMapEnabled = true;
                ige.miniMap.updateMiniMap();
            }

            var engineTickFrameRate = 15
            if (game.data.defaultData && !isNaN(game.data.defaultData.frameRate)) {
                engineTickFrameRate = Math.max(15, Math.min(parseInt(game.data.defaultData.frameRate), 60)) // keep fps range between 15 and 60
            }
            ige._physicsTickRate = engineTickFrameRate;

            ige.menuUi.toggleScoreBoard();
            ige.menuUi.toggleLeaderBoard();

            if (ige.game.data.isDeveloper) {
                ige.addComponent(DevConsoleComponent);
            }

            // center camera while loading
            var tileWidth = ige.scaleMapDetails.tileWidth,
                tileHeight = ige.scaleMapDetails.tileHeight;

            ige.client.vp1.camera.translateTo((ige.map.data.width * tileWidth) / 2, (ige.map.data.height * tileHeight) / 2, 0);

            ige.addComponent(AdComponent); // ads should only be shown in games

            if (ige.physics) {
                self.loadCSP(); // always enable CSP.
            }
            ige.addComponent(VariableComponent);

            $.when(self.mapLoaded).done(function () {

                var zoom = 1000
                if (ige.game.data.settings.camera && ige.game.data.settings.camera.zoom && ige.game.data.settings.camera.zoom.default) {
                    zoom = ige.game.data.settings.camera.zoom.default
                    self._trackTranslateSmoothing = ige.game.data.settings.camera.trackingDelay || 15;
                }

                self.setZoom(zoom);

                ige.addComponent(TimerComponent);

                ige.addComponent(ThemeComponent);
                ige.addComponent(PlayerUiComponent);
                ige.addComponent(UnitUiComponent);
                ige.addComponent(ItemUiComponent);
                ige.addComponent(ScoreboardComponent);

                ige.addComponent(ShopComponent); // game data is needed to populate shop
                if (ige.game.data.defaultData.enableMiniMap) {
                    ige.miniMap.createMiniMap();
                }
                // if (ige.game.data.settings.shop && ige.game.data.settings.shop.isEnabled) {
                ige.shop.enableShop();

                // ige.client.preLoadAnimationTextures();
                //load sound and music
                //when game starts
                ige.sound.preLoadSound();
                ige.sound.preLoadMusic();

                window.activatePlayGame = true;
                window.activatePlayGame = true;
                $('#play-game-button-wrapper').removeClass('d-none-important');
                $('.modal-videochat-backdrop, .modal-videochat').removeClass('d-none');
                $('.modal-videochat').show();
                $(".modal-step-link[data-step=2]").click();

                if (self.preSelectedServerId && self.serverFound && params.joinGame === 'true' && userId) {
                    self.connectToServer();
                }
            }); // map loaded
        })
    },

    connectToServer: function () {
        ige.network.start(ige.client.server, function (data) {
            for (var serverObj of ige.client.servers) {
                if (serverObj.url === data.url) {
                    ige.client.server = serverObj;
                    break;
                }
            }

            if (ige.client.server) {
                var serverIP = ige.client.server.url.split('://')[1];
                if (serverIP) {
                    var serverName = serverIP.split('.')[0];

                    if (serverName) {
                        $('#server-text').text('to ' + serverName);
                    }
                }
            }

            $('#loading-container').addClass('slider-out');

            console.log("connected to", ige.client.server.url, "clientId", ige.network.id());
            ige.client.defineNetworkEvents();

            ige.network.send('igeChatJoinRoom', "1");

            ige.addComponent(IgeChatComponent);
            ige.addComponent(VideoChatComponent);
            ige.chat.on('messageFromServer', function (msgData) {
                ige.chat.postMessage(msgData);
            });

            var sendInterval = ige.game.data.settings.latency || (ige._fpsRate > 0) ? 1000 / ige._fpsRate : 70;

            //console.log('renderLatency:',renderLatency);
            // check for all of the existing entities in the game
            ige.network.addComponent(IgeStreamComponent)
            ige.network.stream.renderLatency(50) // Render the simulation renderLatency milliseconds in the past
            // ige.network.stream.sendInterval(sendInterval) // for some reason, this breaks game.js
            ige.network.stream._streamInterval = sendInterval;
            // Create a listener that will fire whenever an entity is created because of the incoming stream data
            ige.network.stream.on('entityCreated', function (entity) {
                if (entity._category == 'unit') // unit detected. add it to units array
                {
                    var unit = entity;
                    unit.equipSkin();
                    if (unit._stats.ownerId) {
                        var ownerPlayer = ige.$(unit._stats.ownerId);
                        if (ownerPlayer) {
                            unit.setOwnerPlayer(unit._stats.ownerId, { dontUpdateName: true });
                        }
                    }
                    unit.renderMobileControl();
                    // avoid race condition for item mounting
                }
                else if (entity._category == 'player') {
                    // apply skin to all units that's owned by this player
                    var player = entity;
                    if (player._stats.controlledBy === 'human') {
                        // if the player is me
                        if (player._stats.clientId == ige.network.id()) {
                            ige.client.eventLog.push([ige._currentTime - ige.client.eventLogStartTime, 'my player created'])
                            ige.client.myPlayer = player; // declare my player
                            if (typeof startVideoChat == "function") {
                                startVideoChat(player.id())
                            }
                            player.redrawUnits(['nameLabel']);
                        }

                        // if there are pre-existing units that belongs to this newly detected player, assign those units' owner as this player
                        var unitsObject = ige.game.getUnitsByClientId(player._stats.clientId);
                        for (var unitId in unitsObject) {
                            unitsObject[unitId].setOwnerPlayer(player.id(), { dontUpdateName: true })
                        }

                        if (player._stats && player._stats.selectedUnitId) {
                            var unit = ige.$(player._stats.selectedUnitId);
                            if (unit) {
                                unit.equipSkin();
                            }
                        }

                        if (ige.game.data.isDeveloper || (ige.client.myPlayer && ige.client.myPlayer._stats.isUserMod)) {
                            ige.menuUi.kickPlayerFromGame();
                        }
                    }
                }
            });

            ige.network.stream.on('entityDestroyed', function (unitBeingDestroyed) {

                if (unitBeingDestroyed._category == 'unit') {
                    unitBeingDestroyed.remove();
                }

                if ((ige.game.data.isDeveloper || (ige.client.myPlayer && ige.client.myPlayer._stats.isUserMod)) && unitBeingDestroyed._category === 'player') {
                    ige.menuUi.kickPlayerFromGame(unitBeingDestroyed.id())
                }
            });

            var params = ige.client.getUrlVars()

            ige.game.start();
            ige.menuUi.playGame();

            if (params.joinGame == 'true' || params.guestmode == 'on') {
                // hide menu and skin shop button
                if (params.guestmode == 'on') {
                    ige.client.guestmode = true;
                    $('.open-menu-button').hide();
                    $('.open-modd-shop-button').hide();
                }
            }
            if (window.isStandalone) {
                $('#toggle-dev-panels').show();
            }
        });
    },

    loadCSP: function () {
        ige.game.cspEnabled = !!ige.game.data.defaultData.clientSidePredictionEnabled;
        var gravity = ige.game.data.settings.gravity
        if (gravity) {
            console.log("setting gravity ", gravity)
            ige.physics.gravity(gravity.x, gravity.y)
        }
        ige.physics.createWorld();
        ige.physics.start();
        ige.addComponent(TriggerComponent);
        ige.addComponent(VariableComponent);
        ige.addComponent(ScriptComponent);
        ige.addComponent(ConditionComponent);
        ige.addComponent(ActionComponent);
        if (typeof mode === 'string' && mode === 'sandbox') {
            ige.script.runScript('initialize', {});
        }
        if (ige.env == 'local') {

        }

        // ige.physics.enableDebug(this.rootScene);
    },

    defineNetworkEvents: function () {
        var self = this;

        ige.network.define('makePlayerSelectUnit', self._onMakePlayerSelectUnit);
        ige.network.define('makePlayerCameraTrackUnit', self._onMakePlayerCameraTrackUnit);
        ige.network.define('changePlayerCameraPanSpeed', self._onChangePlayerCameraPanSpeed);

        ige.network.define('hideUnitFromPlayer', self._onHideUnitFromPlayer);
        ige.network.define('showUnitFromPlayer', self._onShowUnitFromPlayer);
        ige.network.define('hideUnitNameLabelFromPlayer', self._onHideUnitNameLabelFromPlayer);
        ige.network.define('showUnitNameLabelFromPlayer', self._onShowUnitNameLabelFromPlayer);

        ige.network.define('updateAllEntities', self._onUpdateAllEntities);
        ige.network.define('teleport', self._onTeleport);

        ige.network.define('updateEntityAttribute', self._onUpdateEntityAttribute);

        ige.network.define('updateUiText', self._onUpdateUiText);
        ige.network.define('updateUiTextForTime', self._onUpdateUiTextForTime);

        ige.network.define('alertHighscore', self._onAlertHighscore);

        ige.network.define('item', self._onItem);

        ige.network.define('clientDisconnect', self._onClientDisconnect);

        ige.network.define('ui', self._onUi);
        ige.network.define('playAd', self._onPlayAd);
        ige.network.define('buySkin', self._onBuySkin);
        ige.network.define('videoChat', self._onVideoChat);

        ige.network.define('devLogs', self._onDevLogs);
        ige.network.define('errorLogs', self._onErrorLogs);

        ige.network.define('sound', self._onSound);
        ige.network.define('particle', self._onParticle);
        ige.network.define('camera', self._onCamera);

        ige.network.define('gameSuggestion', self._onGameSuggestion);
        ige.network.define('minimap', self._onMinimapEvent);

        ige.network.define('createFloatingText', self._onCreateFloatingText)

        ige.network.define('openShop', self._onOpenShop);
        ige.network.define('openDialogue', self._onOpenDialogue);
        ige.network.define('closeDialogue', self._onCloseDialogue);

        ige.network.define('setOwner', self._setOwner);
        ige.network.define('userJoinedGame', self._onUserJoinedGame);

        ige.network.define('trade', self._onTrade);
    },

    login: function () {
        var self = this;
        console.log("attempting to login")
        $.ajax({
            url: '/login',
            data: {
                username: $("input[name='username']").val(),
                password: $("input[name='password']").val()
            },
            dataType: "json",
            jsonpCallback: 'callback',
            type: 'POST',
            success: function (data) {
                if (data.response == 'success') {
                    self.joinGame()
                } else {
                    $("#login-error-message").html(data.message).show().fadeOut(7000)
                }
            }
        })
    },

    joinGame: function () {
        var self = this;
        var isAdBlockEnabled = true;
        var data = {
            number: (Math.floor(Math.random() * 999) + 100)
        }
        ige.client.removeOutsideEntities = undefined;
        window.joinedGame = true;

        $("#dev-console").hide()

        if (typeof (userId) !== 'undefined' && typeof (sessionId) !== 'undefined') {
            data._id = userId;
        }

        if (ige.mobileControls && !ige.mobileControls.isMobile) {
            $(".game-ui").show();
        }

        // try loading an ad to find out whether adblocker is active or not
        if (window.isStandalone) {
            isAdBlockEnabled = false;
            if (typeof adBlockStatus === "function")
                adBlockStatus(false);
        }
        else {
            $.ajax('/showads.js', {
                async: false,
                success: function () {
                    isAdBlockEnabled = false;
                    adBlockStatus(false);
                },
                fail: function () {
                    adBlockStatus(true);
                }
            });

            // notify for ad block
            if (window.adBlockEnabled) {
                notifyAboutAdblocker();
            }
        }

        //show popover on setting icon for low frame rate
        if (!ige.mobileControls.isMobile) {
            setTimeout(function () {
                self.lowFPSInterval = setInterval(function () {
                    if (self.resolutionQuality !== 'low' && ige._renderFPS < 40) {
                        $('#setting').popover('show');
                        clearInterval(self.lowFPSInterval);
                    }
                }, 60000);
            }, 60000);
        }

        $(document).on("click", function () {
            $('#setting').popover('hide');
        })

        data.isAdBlockEnabled = !!isAdBlockEnabled

        ige.network.send('joinGame', data);

        window.joinGameSent.start = Date.now();

        console.log("joinGame sent");

        // if game was paused
        if (!window.playerJoined) {
            ige.client.eventLog.push([0, "joinGame sent. userId " + userId])
            ige.client.eventLogStartTime = ige._currentTime;

            window.errorLogTimer = setTimeout(function () {
                var list = ige.client.eventLog.reduce(function (p, e) {
                    return p + "<li>" + JSON.stringify(e) + "</li>";
                }, '');
                $('#event-logs-content').html("<ul>" + list + "</ul>");
                $('#event-logs-modal').modal('show');
            }, 12000);
        }
    },

    getUrlVars: function () {

        // edited for play/:gameId
        var tempGameId = window.location.pathname.split('/')[2];
        var vars = {
            gameId: tempGameId
        };

        //if serverId is present then add it to vars
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
            vars[key] = value;
        });

        return vars;
    },

    applyInactiveTabEntityStream: function () {
        var self = this;
        for (var entityId in self.inactiveTabEntityStream) {
            var entityData = _.cloneDeep(self.inactiveTabEntityStream[entityId]);
            self.inactiveTabEntityStream[entityId] = [];
            var entity = ige.$(entityId);
            if (entity && entityData) {
                // console.log("inactive Entity Update", entityData)
                entity.streamUpdateData(entityData);
            }
        }
    },

    positionCamera: function (x, y) {
        if (x !== undefined && y !== undefined) {
            ige.pixi.viewport.removePlugin('follow')
            console.log(ige.pixi.viewport)
            // using panTo for translating without animating
            // ige.client.vp1.camera.panTo({ x: x, y: y, z: 0 }, 0, 0);
            ige.pixi.viewport.moveCenter(x, y);
            // not working properly for some reason
            // var point = new IgePoint3d(x, y, 0);
            // this.vp1.camera.panTo(point, 1000);
        }
    }
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
    module.exports = Client;
}
