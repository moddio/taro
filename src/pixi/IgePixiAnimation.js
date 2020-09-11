var IgePixiAnimation = IgeClass.extend({
    classId: 'IgePixiAnimation',
    componentId: 'pixianimation',
    init: function (entity) {
        this._anims = {};
        this._entity = entity;
        // this.addComponent(IgePixiTexture);
    },
    exists: function (cellSheetAnimId) {
        return !!this._anims[cellSheetAnimId];
    },
    define: function (source, col, row, cellSheetAnimId, animationId) {
        var self = this;
        var sourceTexture = null;
        if (!this._anims[cellSheetAnimId]) {
            sourceTexture = ige.pixitexture.get(source, {
                entity: this._entity,
                cb: 'applyAnimationById',
                animationId: animationId
            });
            if (!sourceTexture) return;

            var spriteWidth = sourceTexture.width / col;
            var spriteHeight = sourceTexture.height / row;
            var texturesWithSprites = [];
            var animationTextures = ige.pixi.loader.resources[source] && ige.pixi.loader.resources[source].animation && ige.pixi.loader.resources[source].animation._anims;
            if (animationTextures) {
                animationTextures.forEach(function (texture) {
                    texturesWithSprites.push(self.setSpriteProperty(texture.clone()));
                });
            }
            else {
                for (var i = 0; i < row; i++) {
                    for (var j = 0; j < col; j++) {
                        var tileX = j * spriteWidth;
                        var tileY = i * spriteHeight;

                        // need to get every time clone texture;
                        var resource = ige.pixitexture.get(source);
                        try {
                            resource.frame = new PIXI.Rectangle(tileX, tileY, spriteWidth, spriteHeight);
                        }
                        catch (e) {
                            console.log(e);
                            alert('animation for ' + source + ' cannot be loaded');
                        }
                        texturesWithSprites.push(self.setSpriteProperty(resource));
                    }
                }
            };
            this._anims[cellSheetAnimId] = texturesWithSprites;
        }
        return this._anims[cellSheetAnimId];
    },
    setSpriteProperty: function (texture) {
        var self = this;
        var sprite = new PIXI.Sprite(texture);
        sprite.zIndex = self._entity._layer || 3;
        sprite.depth = self._entity._depth || 3.33;
        sprite.anchor.set(0.5);
        sprite.width = self._entity._stats.currentBody && self._entity._stats.currentBody.width || self._entity._stats.width;
        sprite.height = self._entity._stats.currentBody && self._entity._stats.currentBody.height || self._entity._stats.height;
        return sprite;
    },
    getAnimationSprites: function (source, col, row) {
        var sourceTexture = ige.pixitexture.get(source);
        if (!sourceTexture) return;

        var spriteWidth = sourceTexture.width / col;
        var spriteHeight = sourceTexture.height / row;
        var texturesWithSprites = [];
        for (var i = 0; i < row; i++) {
            for (var j = 0; j < col; j++) {
                var tileX = j * spriteWidth;
                var tileY = i * spriteHeight;

                // need to get every time clone texture;
                var resource = ige.pixitexture.get(source);
                try {
                    resource.frame = new PIXI.Rectangle(tileX, tileY, spriteWidth, spriteHeight);
                }
                catch (e) {
                    console.log(e);
                    alert('animation for ' + source + ' cannot be loaded');
                }
                texturesWithSprites.push(resource);
            }
        }
        this._anims = texturesWithSprites;
        return texturesWithSprites
    },
    select: function (frames, fps = 15, loopCount, cellSheetAnimId, animName) {
        var self = this;
        var entity = ige.pixi.trackEntityById[self._entity.entityId];
        if (!entity) return;

        var startFrame = frames[0] - 1;
        var lastFrame = frames[frames.length - 1] - 1;
        var totalNumberOfFrames = frames.length;

        self.i = 0;
        self.fpsSecond = 1000 / fps;
        self.frames = frames;
        self.loopCount = loopCount;
        self.lastFrame = lastFrame;
        self.startFrame = startFrame;
        self.totalNumberOfFrames = frames.length;
        self._entity.currentAnimId = cellSheetAnimId;

        this.resetAnimation();


        if (!this.animating) {
            this.animating = true;
        }
    },
    stopAtFrame: function (frameIndex) {
        if (
            this._entity &&
            this._entity._pixiContainer &&
            !this._entity._pixiContainer._destroyed &&
            this._anims[this._entity.currentAnimId] &&
            this._anims[this._entity.currentAnimId][frameIndex]
        ) {
            this._entity._pixiTexture.texture = this._anims[this._entity.currentAnimId][frameIndex].texture
        }
    },
    resetAnimation: function () {
        this.i = 0;
        this.animating = false;
    },
    advanceFrame: function (frameNumber) {
        var i = this.i;

        frameNumber = frameNumber - 1;
        if (i < this.totalNumberOfFrames - 1) {
            this.stopAtFrame(frameNumber);
            if (i + 1 < this.totalNumberOfFrames) {
                i++;
            }
        }
        else if (this.loopCount > 0) {
            this.stopAtFrame(this.startFrame);
            loopCount--;
            i = 0;
            // stopAtFrame(startFrame);
            // self._entity.pixianimation.select(frames, fps, loopCount = true, self._entity.currentAnimId);
        }
        else if (this.loopCount === undefined || this.loopCount === -1 || this.loopCount === "") {
            i = 0;
            this.stopAtFrame(this.lastFrame);
        }
        else {
            this.stopAtFrame(this.lastFrame);
            this.resetAnimation();
        }
        this.i = i;
    },
    animationTick: function () {
        if (this.animating) {
            var i = this.i;
            this.advanceFrame(this.frames[i], i);
        }
    }
})

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgePixiAnimation; }