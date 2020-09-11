var IgePixiTexture = IgeClass.extend({
    classId: 'IgePixiTexture',
    componentId: 'pixitexture',
    init: function (entity) {
        if (typeof arguments[0] == 'string') {
            this._stats = {
                url: arguments[0],
                columns: arguments[1],
                rows: arguments[2],
            }
            this._entity = arguments[3];
        }
        else {
            this._entity = entity;
        }
    },
    get: function (source, data) {
        var texture = null;
        if (ige.pixi.loader.resources[source] && ige.pixi.loader.resources[source].texture) {
            texture = ige.pixi.loader.resources[source].texture.clone();
        }
        else if (PIXI.utils.BaseTextureCache[source]) {
            texture = new PIXI.Texture(PIXI.utils.BaseTextureCache[source]);
        }
        else {
            var version = 1;
            if (data && data.entity.lastLoadedImage != source) {
                var resource = new PIXI.Loader();
                var options = {};

                // if image is not from discord
                options = { crossOrigin: true };

                resource.add(source, source + "?version=" + version, options)
                    .load(function () {
                        data.entity.pixianimation._anims = {};
                        data.entity[data.cb](data.animationId);
                    });

                data.entity.lastLoadedImage = source;
            }

            texture = new PIXI.Texture(PIXI.utils.BaseTextureCache["emptyTexture"]);
        }
        return texture;
    },
    loadTextures: function (url, column, row) {
        this._stats = {};
        if (typeof url === 'string') {
            var texture,
                resource = ige.pixi.loader.resources[url];
            if (resource) {
                texture = new PIXI.Sprite(resource.texture);
                this._stats.resourceTexture = resource.texture;
            }
            else {
                texture = new PIXI.Sprite.from(url)
            }
            this._stats.columns = parseInt(column);
            this._stats.rows = parseInt(row);

            texture.width = this._entity._stats.currentBody && this._entity._stats.currentBody.width || this._entity._stats.width;
            texture.height = this._entity._stats.currentBody && this._entity._stats.currentBody.height || this._entity._stats.height;
            // texture.pivot.set(texture.width / 2, texture.height / 2);
            texture.anchor.set(0.5);
            texture.zIndex = this._entity._stats.currentBody && this._entity._stats.currentBody['z-index'].layer || 3;
            // texture.anchor.set(0.5);
            texture._category = this._category;
            this._entity._pixiTexture = texture;

            this.texture = texture;
            return texture;
        }
    },
    spriteFromCellSheet: function (gid, log) {
        // var spacing = map.tilesets[0].spacing || 0;
        // gid = gid - 1;
        var spacing = 0;
        var resource = this.get(this._stats.url, {
            entity: this._entity,
            cb: 'createPixiTexture',
            animationId: gid
        });

        var tilesetColumn = (gid) % this._stats.columns;
        var tilesetRow = Math.floor((gid) / this._stats.columns);
        var spriteWidth = resource.width / this._stats.columns;
        var spriteHeight = resource.height / this._stats.rows;
        var tilesetX = tilesetColumn * spriteWidth;
        var tilesetY = tilesetRow * spriteHeight;
        resource = this.get(this._stats.url);
        try {
            resource.frame = new PIXI.Rectangle(tilesetX, tilesetY, spriteWidth, spriteHeight);
        }
        catch (e) {
            console.log('Error in loading texture from "' + this._stats.url + "'. Please check", e);
        }
        var sprite = new PIXI.Sprite(resource);

        sprite.width = this._entity.width();
        sprite.height = this._entity.height();
        sprite.zIndex = 3;
        // centering sprite
        sprite.anchor.set(0.5);
        return sprite;
    },
    zOrder: function (order) {
        this.zIndex = order;
    },
    generateFramesCells: function (cols, rows, texture) {

        return cells;
    }
})

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgePixiTexture; }