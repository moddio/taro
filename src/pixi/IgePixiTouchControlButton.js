/**
 * Input entity that supports multitouch
 * 
 */
var IgePixiTouchControlButton = IgeEntity.extend({
    classId: 'pixiTouchControlButton',

    init: function (parent) {
        IgeEntity.prototype.init.call(this);

        var self = this;
        this.textures = {};

        // flag to facilitate blocking of repetition
        this.pressed = false;

        // support a text label
        this._text = "";

        // key id
        this._key = null;
        this._pixiContainer = new PIXI.Container()
        this.defaultTexture = new PIXI.Sprite.from('https://cache.modd.io/asset/spriteImage/1549614640644_button1.png?version=123');
        this._pixiTexture = new PIXI.Sprite(this.defaultTexture.texture.clone());
        this.onClickTexture = new PIXI.Sprite.from('https://cache.modd.io/asset/spriteImage/1549614658007_button2.png?version=123');
        this._pixiContainer.addChild(this._pixiTexture);
        this._pixiContainer.isButton = true;
        this._pixiContainer.interactive = true;
        this._pixiContainer.alpha = 0.6;
        this._pixiContainer.on('touchstart', function (event) {
            self.isClicked = true;
            event.stopPropagation();
            self.setDown();
        });
        this._pixiContainer.on('touchend', function (event) {
            self.isClicked = false;
            event.stopPropagation();
            self.setUp();
        });
        ige.pixi.mobileControls.addChild(this._pixiContainer);
        // this._pixiContainer.alpha = 0.5;

        // default to 128x128px (in the 960x540 layout)
        this.width(128)
            .height(128)
            .translateTo(0, 0, 0);

    },

    // set pressed state of this touch control to pressed down
    setDown: function () {
        // prevent repetition
        if (!this.pressed) {
            this.pressed = true;
            this._pixiTexture.texture = this.onClickTexture.texture.clone();
            if (this._text) {
                ige.network.send('playerKeyDown', { device: 'key', key: this._key });
            }
        }
    },

    // set pressed state of this touch control to up (not pressed)
    setUp: function () {
        // prevent repetition
        if (this.pressed) {
            this.pressed = false;
            this._pixiTexture.texture = this.defaultTexture.texture.clone();
            if (this._text) {
                ige.network.send('playerKeyUp', { device: 'key', key: this._key });
            }
        }
    },

    // check if this control contains a viewport point
    containsPoint: function (p) {
        // if (this._aabb && p.x >= this._aabb.x) {
        //     if (p.x <= this._aabb.x + this._aabb.width) {
        //         if (p.y >= this._aabb.y) {
        //             if (p.y <= this._aabb.y + this._aabb.height) {
        //                 return true;
        //             }
        //         }
        //     }
        // }
        return false;
    },

    // harmonized mouse / touch input handler
    // touch object will be null if mouse
    handleInputDown: function (pos, touch) {

        //console.log('tc inputdown '+pos.x+' '+pos.y);
        // if (this.containsPoint(pos)) {
        //     this.setDown();
        //     if (touch && this._touchId == null) {
        //         this._touchId = touch.identifier;
        //     }
        // }
    },

    // harmonized mouse / touch input handler
    // touch object will be null if mouse
    handleInputMove: function (pos, touch) {

        //console.log('tc inputmove '+pos.x+' '+pos.y);
        // if (this.containsPoint(pos)) {
        //     if (touch && this._touchId == null) {
        //         // in
        //         this.setDown();
        //         this._touchId = touch.identifier;
        //     }
        //     if (!touch) {
        //         //this.setDown();
        //         // disable as need to know button is down
        //     }
        // } else {
        //     if (touch && this._touchId == touch.identifier) {
        //         // out
        //         this.setUp();
        //         this._touchId = null;
        //     }
        //     if (!touch) {
        //         this.setUp();
        //     }
        // }
    },

    // harmonized mouse / touch input handler
    // touch object will be null if mouse
    handleInputUp: function (pos, touch) {

        //console.log('tc inputup '+pos.x+' '+pos.y);
        // if (this.containsPoint(pos)) {
        //     this.setUp();
        //     if (touch && this._touchId == touch.identifier) {
        //         this._touchId = null;
        //     }
        // }
    },

    // draw text label if set
    // tick: function (ctx) {
    //     IgeEntity.prototype.tick.call(this, ctx);
    //     if (this._text) {
    //         // Draw text
    //         ctx.font = "normal 16px Verdana";
    //         ctx.textAlign = 'center';
    //         ctx.textBaseline = 'middle';
    //         ctx.fillStyle = '#FFFFFF';
    //         ctx.fillText(this._text, 0, 0);
    //     }
    // },

    // set text label
    setText: function (text) {
        this._text = new PIXI.Text(text, { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'center' });
        this._text.position.set(this.width() / 2, this.height() / 2);
        this._pixiContainer.addChild(this._text);
        return this;
    },

    // set key id
    setKey: function (key) {
        this._key = key;
        return this;
    }

});