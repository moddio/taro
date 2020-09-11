// var app, viewport, world;
var IgePixiChatBubble = IgeEntity.extend({
    classId: 'IgePixiChatBubble',

    init: function (chatText, data) {
        var maxWidth = 230;
        var maxHeight = 25;
        var cameraScale = ige.pixi.viewport.scale && ige.pixi.viewport.scale.x;
        var camera = ige.pixi.viewport;
        this._id = this.id();
        var container = new PIXI.Container();

        this._stats = {
            owner: data.parentUnit,
            bottomMargin: 15 / cameraScale,
        };
        this.category('chatbubble');

        var words = chatText;
        if (words.length > 40) {
            words = words.substring(0, 40);
            words += '...';
        }
        var style = {
            fill: "#FFFFFF",
            // fontFamily: "Verdana",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: 0.5,
            // stroke: 'black',
            // strokeThickness: 4,
            // fontWeight: "bold"
        }
        var text = new PIXI.Text(words, style);

        maxWidth = text.width;
        maxWidth += 10; // width for rectangle

        text.anchor.set(0.5);
        text.x = maxWidth / 2;
        text.y = maxHeight / 2;
        text.resolution = 2;
        text.dirty = true;

        // draw rectangle
        var graphic = new PIXI.Graphics();
        // graphic.lineStyle(2, 0x000000, 1);
        graphic.beginFill(0x000000, 0.5);
        graphic.drawRoundedRect(0, 0, maxWidth, maxHeight, 5);
        graphic.endFill();
        container.addChild(graphic);

        // draw triangle
        var triangle = this.createTriangle(0, 10, 10);
        // triangle.anchor.set(0.5);
        triangle.x = maxWidth / 2 - 5;
        triangle.y = maxHeight;
        container.addChild(triangle);

        container.addChild(text);

        // var texture = ige.pixi.app.renderer.generateTexture(container);
        // var sprite = new PIXI.Sprite(texture);
        this.parentUnit = data.parentUnit;
        var owner = this.getOwner();
        // if (owner) {
        container.zIndex = 3;
        container.depth = 10;
        // }
        container.pivot.x = maxWidth / 2;
        container.pivot.y = maxHeight / 2;
        var offset = this.getOffset();
        container.y = offset;
        this._pixiContainer = container;
        this.scaleTo(1 / camera.scale.x, 1 / camera.scale.y, 1);
        // ige.pixi.trackEntityById[this._id] = container;
        this.mount(owner._pixiContainer);

        return this;
    },
    updateScale: function () {
        this.scaleTo(
            1 / ige.pixi.viewport.scale.x,
            1 / ige.pixi.viewport.scale.y,
            1 / ige.pixi.viewport.scale.z
        )
    },
    getOwner: function() {
        return ige.$(this.parentUnit);
    },
    updatePosition: function () {
        if (this._pixiContainer && !this._pixiContainer._destroyed) {
            this._pixiContainer.y = this.getOffset();
        }
    },
    getOffset: function () {
        var owner = this.getOwner();
        var bottomMargin = 20;
        var nameLabel = null;

        for (var child of owner._pixiContainer.children) {
            if (child._category === 'floating_text') {
                nameLabel = child;
                break;
            }
        }

        if (nameLabel) {
            return nameLabel.y - nameLabel.height - bottomMargin;
        }
        else {
            return -bottomMargin;
        }
    },
    createTriangle(xPos, yPos, i) {
        var triangle = new PIXI.Graphics();

        triangle.x = xPos;
        triangle.y = yPos;

        var triangleWidth = 10,
            triangleHeight = 5,
            triangleHalfway = triangleWidth / 2;

        // draw triangle 
        triangle.beginFill(0x000000, 0.5);
        // triangle.lineStyle(2, 0x000000, 1);
        triangle.moveTo(triangleWidth, 0);
        triangle.lineTo(triangleHalfway, triangleHeight);
        triangle.lineTo(0, 0);
        // triangle.lineStyle(0, 0x000000, 1);
        triangle.lineTo(triangleHalfway, 0);
        triangle.endFill();

        triangle.interactive = true;
        triangle.buttonMode = true;
        return triangle;
    },
    fade: function (fadeAfter) {
        var self = this;
        setTimeout(() => {
            var interval = setInterval(function () {
                if (self._pixiContainer) {
                    self._pixiContainer.alpha += -0.1;

                    if (self._pixiContainer.alpha <= 0) {
                        clearInterval(interval);
                        delete openChatBubble[this.parentUnit];
                        self.destroy();
                    }
                } else {
                    clearInterval(interval);
                }
            }, 1000 / 60);
        }, fadeAfter);
        return this;
    },
    destroy: function () {
        if (this._pixiContainer && !this._pixiContainer._destroyed) {
            this._pixiContainer.destroy(true);
            this._destroyed = true;
            delete ige.pixi.trackEntityById[this._id];
        }
        IgeEntity.prototype.destroy.call(this);
    }
})

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgePixiChatBubble; }