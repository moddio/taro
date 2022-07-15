var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var GameScene = /** @class */ (function (_super) {
    __extends(GameScene, _super);
    function GameScene() {
        return _super.call(this, { key: 'Game' }) || this;
    }
    GameScene.prototype.init = function () {
        var _this = this;
        // TODO move to css once pixi is gone
        // phaser canvas adjustments
        var canvas = this.game.canvas;
        canvas.style.position = 'fixed';
        canvas.style.opacity = '1';
        canvas.style.backgroundColor = 'transparent';
        //canvas.style.pointerEvents = 'none'; // TODO remove after pixi is gone
        if (ige.isMobile) {
            this.scene.launch('MobileControls');
        }
        var camera = this.cameras.main;
        this.scale.on(Phaser.Scale.Events.RESIZE, function (gameSize, baseSize, displaySize, previousWidth, previousHeight) {
            console.log(Phaser.Scale.Events.RESIZE, // TODO remove
            gameSize, baseSize, displaySize, previousWidth, previousHeight);
            if (gameSize.height > gameSize.width) {
                console.log('height>width');
                camera.zoom = gameSize.height / (ige.game.data.settings.camera.zoom.default * 2);
            }
            else {
                console.log('width>height');
                camera.zoom = gameSize.width / (ige.game.data.settings.camera.zoom.default * 2);
            }
            console.log('camera zoom', camera.zoom);
        });
        ige.client.on('zoom', function (height) {
            console.log('GameScene zoom event', height); // TODO remove
            /*camera.zoomTo(
                //this.defaultZoom * (ige.game.data.settings.camera.zoom.default / height),
                this.scale.height / height,
                1000,
                Phaser.Math.Easing.Quadratic.Out,
                true
            );*/
            /*this.scale.gameSize.setMin(0, height);
            this.scale.gameSize.setMax(Number.MAX_VALUE, height);*/
        });
        this.input.on('pointermove', function (pointer) {
            ige.input.emit('pointermove', [{
                    x: pointer.worldX,
                    y: pointer.worldY
                }]);
        });
        ige.client.on('create-unit', function (unit) {
            console.log('create-unit', unit); // TODO remove
            new PhaserUnit(_this, unit);
        });
        ige.client.on('create-item', function (item) {
            console.log('create-item', item); // TODO remove
            new PhaserItem(_this, item);
        });
        ige.client.on('create-projectile', function (projectile) {
            console.log('create-projectile', projectile); // TODO remove
            new PhaserProjectile(_this, projectile);
        });
        ige.client.on('create-region', function (region) {
            console.log('create-region', region); // TODO remove
            new PhaserRegion(_this, region);
        });
        ige.client.on('floating-text', function (data) {
            console.log('create-floating-text', data); // TODO remove
            new PhaserFloatingText(_this, data);
        });
    };
    GameScene.prototype.preload = function () {
        var _this = this;
        var data = ige.game.data;
        for (var type in data.unitTypes) {
            this.loadEntity("unit/".concat(type), data.unitTypes[type]);
        }
        for (var type in data.projectileTypes) {
            this.loadEntity("projectile/".concat(type), data.projectileTypes[type]);
        }
        for (var type in data.itemTypes) {
            this.loadEntity("item/".concat(type), data.itemTypes[type]);
        }
        data.map.tilesets.forEach(function (tileset) {
            _this.load.image("tiles/".concat(tileset.name), _this.patchAssetUrl(tileset.image));
        });
        this.load.tilemapTiledJSON('map', this.patchMapData(data.map));
    };
    GameScene.prototype.loadEntity = function (key, data) {
        var _this = this;
        var cellSheet = data.cellSheet;
        if (!cellSheet) { // skip if no cell sheet data
            return;
        }
        this.load.once("filecomplete-image-".concat(key), function () {
            // create spritesheet,
            // even if it has only one sprite
            var texture = _this.textures.get(key);
            var width = texture.source[0].width;
            var height = texture.source[0].height;
            Phaser.Textures.Parsers.SpriteSheet(texture, 0, 0, 0, width, height, {
                frameWidth: width / cellSheet.columnCount,
                frameHeight: height / cellSheet.rowCount,
            });
            // add animations
            for (var animationsKey in data.animations) {
                var animation = data.animations[animationsKey];
                var frames_1 = animation.frames;
                var animationFrames = [];
                for (var i = 0; i < frames_1.length; i++) {
                    // correction for 0-based indexing
                    animationFrames.push(frames_1[i] - 1);
                }
                _this.anims.create({
                    key: "".concat(key, "/").concat(animationsKey),
                    frames: _this.anims.generateFrameNumbers(key, {
                        frames: animationFrames
                    }),
                    frameRate: animation.framesPerSecond || 15,
                    repeat: (animation.loopCount - 1) // correction for loop/repeat values
                });
            }
        });
        this.load.image(key, this.patchAssetUrl(cellSheet.url));
    };
    GameScene.prototype.create = function () {
        ige.client.phaserLoaded.resolve();
        var map = this.make.tilemap({ key: 'map' });
        var data = ige.game.data;
        var scaleFactor = ige.scaleMapDetails.scaleFactor;
        data.map.tilesets.forEach(function (tileset) {
            map.addTilesetImage(tileset.name, "tiles/".concat(tileset.name));
        });
        data.map.layers.forEach(function (layer) {
            if (layer.type !== 'tilelayer') {
                return;
            }
            console.log(layer.name);
            var tilemapLayer = map.createLayer(layer.name, map.tilesets, 0, 0);
            tilemapLayer.setScale(scaleFactor.x, scaleFactor.y);
        });
        var camera = this.cameras.main;
        camera.centerOn(map.width * map.tileWidth / 2 * scaleFactor.x, map.height * map.tileHeight / 2 * scaleFactor.y);
        //console.log('this.scale.width', this.scale.width);
        //camera.zoom = this.scale.width / data.settings.camera.zoom.default;
        if (this.scale.height > this.scale.width) {
            console.log('height>width');
            camera.zoom = this.scale.height / (ige.game.data.settings.camera.zoom.default * 2);
        }
        else {
            console.log('width>height');
            camera.zoom = this.scale.width / (ige.game.data.settings.camera.zoom.default * 2);
        }
        console.log('camera zoom create', camera.zoom);
    };
    GameScene.prototype.patchMapData = function (map) {
        /**
         * map data gets patched in place
         * to not make a copy of a huge object
         **/
        var tilecount = map.tilesets[0].tilecount;
        map.layers.forEach(function (layer) {
            if (layer.type !== 'tilelayer') {
                return;
            }
            for (var i = 0; i < layer.data.length; i++) {
                var value = layer.data[i];
                if (value > tilecount) {
                    console.warn("map data error: layer[".concat(layer.name, "], index[").concat(i, "], value[").concat(value, "]."));
                    layer.data[i] = 0;
                }
            }
        });
        return map;
    };
    return GameScene;
}(PhaserScene));
//# sourceMappingURL=GameScene.js.map