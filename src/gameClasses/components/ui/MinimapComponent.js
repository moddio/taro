var MiniMapComponent = IgeEntity.extend({
    classId: 'MiniMapComponent',
    componentId: 'miniMap',

    init: function () {
        var self = this;
        self.mapScale = {
            x: 0.05,
            y: 0.05
        };
        self.miniMap = null;
        self.maxMapDimension = {
            height: 200,
            width: 200
        }
        self.units = {};
    },

    createMiniMap: function () {
        var self = this;

        // var texture = ige.pixi.app.renderer.generateTexture(ige.pixi.world);
        // self.miniMap = new PIXI.Sprite(texture);
        let layerZIndex = ["floor", "floor2", "walls", "trees"];
        self.miniMap = new PIXI.Container();
        self.miniMap.zIndex = 5;
        layerZIndex.forEach(function (layerKey) {
            self.miniMap.addChild(new PIXI.Sprite(ige.pixiMap.layersTexture[layerKey]));
        })
        ige.pixi.app.stage.addChild(self.miniMap)
    },

    updateMiniMap: function () {
        var self = this;
        if (ige.game) {
            var worldWidth = ige.game.data.map.width * ige.map.data.tilewidth;
            var worldHeight = ige.game.data.map.height * ige.map.data.tileheight;

            if (ige.mobileControls.isMobile) {
                self.maxMapDimension.width = 50;
                self.maxMapDimension.height = 50;
            }
            else {
                if (ige.client.resolutionQuality === 'low') {
                    self.maxMapDimension.width = 100;
                    self.maxMapDimension.height = 100;
                }
                else {
                    self.maxMapDimension.width = 200;
                    self.maxMapDimension.height = 200;
                }
            }
            self.mapScale.x = parseFloat(self.maxMapDimension.width / worldWidth);
            self.mapScale.y = parseFloat(self.maxMapDimension.height / worldHeight);

            if (self.miniMap) {
                self.miniMap.scale.set(self.mapScale.x, self.mapScale.y);

                self.miniMap.width = worldWidth * self.mapScale.x;
                self.miniMap.height = worldHeight * self.mapScale.y;
                self.miniMap.pivot.x = self.miniMap.width / 2;
                self.miniMap.pivot.y = self.miniMap.height / 2;
                self.miniMap.x = 5;
                self.miniMap.y = window.innerHeight - self.miniMap.height;
            }
        }
    },

    createUnit: function (id) {
        var self = this;
        self.units[id] = new MiniMapUnit();
    },
    translateTo: function (id, x, y, z) {
        var self = this;
        if (self.units[id]) {
            self.units[id].translateTo(x, y, z)
        }
    }
});


if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = MiniMapComponent; }