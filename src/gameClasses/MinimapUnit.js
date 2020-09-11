var MiniMapUnit = IgeEntity.extend({
    classId: 'MiniMapUnit',
    componentId: 'miniMapUnit',

    init: function (color = "0x00FF00") {

        // IgeUiEntity.prototype.init.call(this);

        this.category('minimapUnit');
        if (!ige.miniMap.miniMap) return this;
        var graphics = new PIXI.Graphics();
        graphics.beginFill(color);

        // set the line style to have a width of 5 and set the color to red
        graphics.lineStyle(5, color)

        if (ige.miniMap.mapScale) {
            graphics.drawRect(0, 0, 5 / ige.miniMap.mapScale.y, 5 / ige.miniMap.mapScale.x);
        } else {
            graphics.drawRect(0, 0, 70, 70);
            // this.height(70);
            // this.width(70);
        }
        graphics.zIndex = 10;
        graphics.depth = 1;
        this._pixiTexture = graphics;
        if (ige.miniMap.miniMap)
            ige.miniMap.miniMap.addChild(this._pixiTexture);
        return this;
    },
    destroy: function () {
        if (ige.miniMap.miniMap) {
            ige.miniMap.miniMap.removeChild(this._pixiTexture);
            this._pixiTexture.destroy(true);
        }
        IgeEntity.prototype.destroy.call(this);
    }
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = MiniMapUnit; }