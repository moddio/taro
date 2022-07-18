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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var GameScene = /** @class */ (function (_super) {
    __extends(GameScene, _super);
    function GameScene() {
        var _this = _super.call(this, { key: 'Game' }) || this;
        _this.layers = {};
        return _this;
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
            camera.zoom *= gameSize.height / previousHeight;
            /*camera.centerOn(
                camera.scrollX + (gameSize.width - previousWidth) / 2,
                camera.scrollY + (gameSize.height - previousHeight) / 2
            );*/
        });
        ige.client.on('zoom', function (height) {
            console.log('GameScene zoom event', height); // TODO remove
            camera.zoomTo(_this.scale.height / height, 1000, Phaser.Math.Easing.Quadratic.Out, true);
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
        // Press L to log a table of the scene's DisplayList
        this.input.keyboard.on('keydown-L', function () {
            console.info('Display List:');
            // list doesn't want to tell us about the last element.
            console.table(__spreadArray(__spreadArray([], _this.children.list, true), [_this.children.last], false), ['name', 'type', '_depth', 'x', 'y']);
            var scenegraph = '';
            var TOP = "\n\u250C".concat('\u2500'.repeat(57), "\u2510");
            var BOTTOM = "\n\u2514".concat('\u2500'.repeat(57), "\u2518\n");
            function SPACE4(depth) {
                return '\u2502    '.repeat(depth);
            }
            function RETURN(depth) {
                return '\n' + SPACE4(depth) + ' '.repeat(58 - SPACE4(depth).length) + '\u2502';
            }
            var depth = 0;
            function checkForChildren(child, depth) {
                var line = "\n".concat(depth === 0 ?
                    ("\u251C\u2500\u2500".concat(SPACE4(depth))) :
                    ("".concat(SPACE4(depth), "\u251C\u2500\u2500")), " ").concat(child.type, "  ").concat(child.name || '');
                // add two padding line (return) then content line
                scenegraph += "".concat(RETURN(depth + 1)).concat(line).concat(' '.repeat(TOP.length - line.length - 1), "\u2502");
                if (!child.list || child.list.length < 1) {
                    depth = 0;
                    return;
                }
                else {
                    depth++;
                    child.list.forEach(function (current) {
                        return checkForChildren(current, depth);
                    });
                }
            }
            //build string
            scenegraph += TOP;
            __spreadArray([], _this.children.list, true).forEach(function (current) {
                (checkForChildren(current, depth));
            });
            scenegraph += BOTTOM;
            console.log(scenegraph);
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
            var key = "tiles/".concat(tileset.name);
            _this.load.once("filecomplete-image-".concat(key), function () {
                var texture = _this.textures.get(key);
                var canvas = _this.extrude(tileset, texture.getSourceImage());
                if (canvas) {
                    _this.textures.remove(texture);
                    _this.textures.addCanvas("extruded-".concat(key), canvas);
                }
            });
            _this.load.image(key, _this.patchAssetUrl(tileset.image));
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
        var _this = this;
        ige.client.phaserLoaded.resolve();
        var map = this.make.tilemap({ key: 'map' });
        var data = ige.game.data;
        var scaleFactor = ige.scaleMapDetails.scaleFactor;
        data.map.tilesets.forEach(function (tileset) {
            var key = "tiles/".concat(tileset.name);
            var extrudedKey = "extruded-".concat(key);
            if (_this.textures.exists(extrudedKey)) {
                map.addTilesetImage(tileset.name, extrudedKey, tileset.tilewidth, tileset.tileheight, (tileset.margin || 0) + 1, (tileset.spacing || 0) + 2);
            }
            else {
                map.addTilesetImage(tileset.name, key);
            }
        });
        data.map.layers.forEach(function (layer, i) {
            // floor, 0
            // floor2, 1
            // walls, 2
            // debris, 3 (returns early)
            // trees, 4
            if (layer.type !== 'tilelayer') {
                return;
            }
            map.createLayer(layer.name, map.tilesets, 0, 0)
                .setScale(scaleFactor.x, scaleFactor.y)
                .setName("map: ".concat(layer.name));
            // hard-coded solution for backwards compatibility
            // letter choice 'c' is insignificant
            var c = i !== 3 ? i + 1 : i;
            _this.layers[c] = _this.add.layer()
                .setName(layer.name);
            // plug in debris because its map layer index is swapped with walls (3,4)
            if (c === i) {
                _this.layers[c + 1] = _this.add.layer()
                    .setName('debris');
            }
        });
        var camera = this.cameras.main;
        camera.centerOn(map.width * map.tileWidth / 2 * scaleFactor.x, map.height * map.tileHeight / 2 * scaleFactor.y);
        camera.zoom = this.scale.width / 800;
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
    GameScene.prototype.extrude = function (tileset, sourceImage, extrusion, color) {
        if (extrusion === void 0) { extrusion = 1; }
        if (color === void 0) { color = '#ffffff00'; }
        var tilewidth = tileset.tilewidth, tileheight = tileset.tileheight, _a = tileset.margin, margin = _a === void 0 ? 0 : _a, _b = tileset.spacing, spacing = _b === void 0 ? 0 : _b;
        var width = sourceImage.width, height = sourceImage.height;
        var cols = (width - 2 * margin + spacing) / (tilewidth + spacing);
        var rows = (height - 2 * margin + spacing) / (tileheight + spacing);
        if (!Number.isInteger(cols) || !Number.isInteger(rows)) {
            console.warn('Non-integer number of rows or cols found while extruding. ' +
                "Tileset \"".concat(tileset.name, "\" image doesn't match the specified parameters. ") +
                'Double check your margin, spacing, tilewidth and tileheight.');
            return null;
        }
        var newWidth = 2 * margin + (cols - 1) * spacing + cols * (tilewidth + 2 * extrusion);
        var newHeight = 2 * margin + (rows - 1) * spacing + rows * (tileheight + 2 * extrusion);
        var canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, newWidth, newHeight);
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var srcX = margin + col * (tilewidth + spacing);
                var srcY = margin + row * (tileheight + spacing);
                var destX = margin + col * (tilewidth + spacing + 2 * extrusion);
                var destY = margin + row * (tileheight + spacing + 2 * extrusion);
                var tw = tilewidth;
                var th = tileheight;
                // Copy the tile.
                ctx.drawImage(sourceImage, srcX, srcY, tw, th, destX + extrusion, destY + extrusion, tw, th);
                // Extrude the top row.
                ctx.drawImage(sourceImage, srcX, srcY, tw, 1, destX + extrusion, destY, tw, extrusion);
                // Extrude the bottom row.
                ctx.drawImage(sourceImage, srcX, srcY + th - 1, tw, 1, destX + extrusion, destY + extrusion + th, tw, extrusion);
                // Extrude left column.
                ctx.drawImage(sourceImage, srcX, srcY, 1, th, destX, destY + extrusion, extrusion, th);
                // Extrude the right column.
                ctx.drawImage(sourceImage, srcX + tw - 1, srcY, 1, th, destX + extrusion + tw, destY + extrusion, extrusion, th);
                // Extrude the top left corner.
                ctx.drawImage(sourceImage, srcX, srcY, 1, 1, destX, destY, extrusion, extrusion);
                // Extrude the top right corner.
                ctx.drawImage(sourceImage, srcX + tw - 1, srcY, 1, 1, destX + extrusion + tw, destY, extrusion, extrusion);
                // Extrude the bottom left corner.
                ctx.drawImage(sourceImage, srcX, srcY + th - 1, 1, 1, destX, destY + extrusion + th, extrusion, extrusion);
                // Extrude the bottom right corner.
                ctx.drawImage(sourceImage, srcX + tw - 1, srcY + th - 1, 1, 1, destX + extrusion + tw, destY + extrusion + th, extrusion, extrusion);
            }
        }
        return canvas;
    };
    return GameScene;
}(PhaserScene));
//# sourceMappingURL=GameScene.js.map