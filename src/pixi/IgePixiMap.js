var IgePixiMap = IgeClass.extend({
    classId: 'PixiMap',
    componentId: 'pixiMap',

    init: function () {
        this.layersTexture = {};
        this.layersGroup = {};
    },
    loadJson: function (map, callback) {
        var mapWidth = map.width,
            mapHeight = map.height,
            layerArray = map.layers,
            layerCount = layerArray ? layerArray.length : 0,
            tileSetArray = map.tilesets,
            tileSetCount = tileSetArray ? tileSetArray.length : 0,
            layersById = {},
            layersByKey = {},
            self = this;

        var applyStats = function (resource, next) {
            resource._stats = {};
            var tileset = tileSetArray.find(function (tileset) {
                if (tileset.image === resource.name) return true;
            });
            resource._stats = tileset;
            next();
        }

        tileSetArray.forEach((tileset) => {
            // Loader.shared
            var url = tileset.image + "?version=" + 1;
            ige.pixi.loader.add(tileset.image, url, { crossOrigin: true });
        })

        ige.pixi.loader.use(applyStats);
        ige.pixi.loader.load(function (loader, resources) {
            map.tilewidth = parseFloat(map.tilewidth)
            map.tileheight = parseFloat(map.tileheight)
            map.width = parseFloat(map.width)
            map.height = parseFloat(map.height)

            ige.pixi.world.tileWidth = map.tilewidth;
            ige.pixi.world.tileHeight = map.tileheight;

            ige.pixi.world.worldWidth = map.width * map.tilewidth;
            ige.pixi.world.worldHeight = map.height * map.tileheight;

            // create viewport
            ige.pixi.viewport();

            if (ige.pixi.world.worldWidth % 2) {
                ige.pixi.world.worldWidth--;
            }
            if (ige.pixi.world.worldHeight % 2) {
                ige.pixi.world.worldheight--;
            }

            ige.pixi.world.worldScreenHeight = 600;
            ige.pixi.world.worldScreenWidth = 400;

            ige.pixi.world.widthInTiles = map.width;
            ige.pixi.world.heightInTiles = map.height;

            ige.pixi.world.objects = [];

            let layerZIndex = ["", "floor", "floor2", "walls", "trees"];
            var isHavingError = false;
            map.layers.forEach(function (tiledLayer, i) {

                layersById[tiledLayer.name] = tiledLayer;
                layersByKey[i] = tiledLayer;

                var layerGroup = new PIXI.Container();
                if (tiledLayer.type === "tilelayer") {
                    for (var index = 0; index < map.width * map.height; index++) {
                        var gid = tiledLayer.data[index];
                        var tileSprite = undefined,
                            texture = undefined,
                            mapX = undefined,
                            mapY = undefined,
                            tilesetX = undefined,
                            tilesetY = undefined,
                            mapColumn = undefined,
                            mapRow = undefined,
                            tilesetColumn = undefined,
                            tilesetRow = undefined;

                        var tilesetObj = _.find(map.tilesets, (tileset) => {
                            if (gid >= tileset.firstgid && gid <= tileset.firstgid + tileset.tilecount - 1) return true;
                        })
                        if (tilesetObj) {
                            gid = gid - tilesetObj.firstgid + 1;
                            var spacing = parseFloat(tilesetObj.spacing) || 0;
                            var tileset = tilesetObj.image;
                            var numberOfTilesetColumns = Math.floor(tilesetObj.imagewidth / (tilesetObj.tilewidth + spacing));
                            // map x,y position of tile
                            mapColumn = index % ige.pixi.world.widthInTiles;
                            mapRow = Math.floor(index / ige.pixi.world.widthInTiles);
                            mapX = mapColumn * ige.pixi.world.tileWidth;
                            mapY = mapRow * ige.pixi.world.tileHeight;

                            // tileset x,y position of tile
                            tilesetColumn = (gid - 1) % numberOfTilesetColumns;
                            tilesetRow = Math.floor((gid - 1) / numberOfTilesetColumns);
                            tilesetX = tilesetColumn * ige.pixi.world.tileWidth;
                            tilesetY = tilesetRow * ige.pixi.world.tileHeight;

                            if (spacing > 0) {
                                tilesetX += spacing + spacing * ((gid - 1) % numberOfTilesetColumns);
                                tilesetY += spacing + spacing * Math.floor((gid - 1) / numberOfTilesetColumns);
                            }

                            texture = resources[tileset].texture.clone();
                            try {
                                texture.frame = new PIXI.Rectangle(Math.round(tilesetX), Math.round(tilesetY), ige.pixi.world.tileWidth, ige.pixi.world.tileHeight);
                            }
                            catch (e) {
                                isHavingError = { tileset: tileset, error: e.message, display: true };
                            }
                            tileSprite = new PIXI.Sprite(texture);
                            tileSprite.x = mapX;
                            tileSprite.y = mapY;
                            tileSprite.index = index;
                            tileSprite.gid = gid;
                            layerGroup.addChild(tileSprite);
                        }
                        else {
                            layerGroup.addChild(new PIXI.Sprite());
                        }
                    };
                    var renderTexture = ige.pixi.app.renderer.generateTexture(layerGroup);
                    var error = ige.pixi.app.renderer.gl && ige.pixi.app.renderer.gl.getError();
                    if (error > 0 && ige.lastError != error && typeof Rollbar !== 'undefined') {
                        var forceCanvas = JSON.parse(localStorage.getItem('forceCanvas')) || {};
                        forceCanvas[gameId] = true;
                        localStorage.setItem('forceCanvas', JSON.stringify(forceCanvas));
                        location.reload();
                        ige.lastError = error;
                    }
                    renderTexture.tileMap = true;
                    layerGroup = new PIXI.Sprite(renderTexture);
                    layerGroup.scale.x = ige.scaleMapDetails.scaleFactor.x;
                    layerGroup.scale.y = ige.scaleMapDetails.scaleFactor.y;

                    Object.keys(tiledLayer).forEach(function (key) {
                        if (key !== "width" && key !== "height") {
                            layerGroup[key] = tiledLayer[key];
                        }
                    });
                    // layerGroup.alpha = tiledLayer.opacity;
                    layerGroup.zIndex = layerZIndex.indexOf(tiledLayer.name);
                    layerGroup.tileMap = true;

                    self.layersTexture[tiledLayer.name] = renderTexture;
                    self.layersGroup[tiledLayer.name] = layerGroup;
                    ige.pixi.world.addChild(layerGroup);
                }
            })
            if (isHavingError && isHavingError.display) {
                alert("Tilesheet '" + isHavingError.tileset + "' is having error in parsing. Log: " + isHavingError.error);
            }
            ige.pixi.viewport.moveCenter(ige.pixi.world.width / 2, ige.pixi.world.height / 2)
            callback(layersByKey, layersById);
        });
    }
})

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgePixiMap; }