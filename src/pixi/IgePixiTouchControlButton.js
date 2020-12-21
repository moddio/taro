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
        this.defaultTexture = new PIXI.Sprite.from('https://cache.modd.io/asset/spriteImage/1549614640644_button1.png?version=123', { crossOrigin: true });
        this._pixiTexture = new PIXI.Sprite(this.defaultTexture.texture.clone());
        this.onClickTexture = new PIXI.Sprite.from('https://cache.modd.io/asset/spriteImage/1549614658007_button2.png?version=123', { crossOrigin: true });
        this._pixiContainer.addChild(this.defaultTexture);
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
    },
	
	setPosition: function(x,y){
		
		this._pixiContainer.x = x;
		this._pixiContainer.y = y;
		
	},
	
	setSize: function(w,h){
		
		this._pixiContainer.width = w;
		this._pixiContainer.height = h;
		
		
	}

});