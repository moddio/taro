/**
 * MobileControlsComponent
 * Virtual game controls for use on mobile devices
 */
var MobileControlsComponent = IgeEntity.extend({
    classId: 'MobileControlsComponent',
    componentId: 'mobileControls',

    init: function (entity) {
        IgeEntity.prototype.init.call(this);
        var self = this;

        this.isMobile = ige.isMobileDevice(); // cache
        this.isSingleGame = this.isSingleGameMode();

        // Store the entity that this component has been added to
        this._entity = entity;

        this.debug = false;

        this.controls = [];

        var canvas = document.getElementById('igeFrontBuffer');
        this.canvas = {
            height: (canvas.style.height && parseInt(canvas.style.height.replace('px', ''))) || canvas.height,
            width: (canvas.style.width && parseInt(canvas.style.width.replace('px', ''))) || canvas.width
        };
        $(window).on("orientationchange load resize", function () {
            var canvas = document.getElementById('igeFrontBuffer');
            this.canvas = {
                height: (canvas.style.height && parseInt(canvas.style.height.replace('px', ''))) || canvas.height,
                width: (canvas.style.width && parseInt(canvas.style.width.replace('px', ''))) || canvas.width
            };

            if (ige.mobileControls) {
                // and this unit is our player
                if (ige.client && ige.client.myPlayer && ige.network.id() == ige.client.myPlayer._stats.clientId) {
                    var unit = ige.$(ige.client.myPlayer._stats.selectedUnitId);
                    if (unit && unit._stats.controls) {
                        var unitAbilities = unit._stats.controls.abilities;
                        if (unitAbilities) {
                            // update mobile controls
                            ige.mobileControls.configure(unitAbilities);
                        }
                    }
                }
            }
        });

        this.id();
        ige.pixi.trackEntityById[this.id()] = this;
        self.addBehaviour('mobileControl', self._behaviour);
    },

    getParameterByName: function (name, url) {
        // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },

    isSingleGameMode: function () {

        var s = this.getParameterByName('s');
        if (parseInt(s) == 1) return true;
        return false;

    },

    // called from client after textures loaded
    attach: function (mountScene) {

        // don't add if not on mobile
        if (!this.isMobile) return;

        // DOM UI Modifications for mobile
        noAds = true;

        // moved plain jquery based UI changes to template.js adjustUIForMobile function as 
        // this component gets added very late causing a flash of ugly ui on smaller screens

        if (this.isSingleGame) {
            $("#back-to-game-selection-button").hide();
        } else {
            $("#back-to-game-selection-button").show();
        }

        if (this.isPortrait()) {
            $('#chat-input-field-div').css({
                width: '80%'
            });
        } else {
            $('#chat-input-field-div').css({
                width: '60%'
            });
        }

        var self = this;

        // guide is a "960x540" panel scaled to fit
        // buttons are mounted / laid out within this space
        this.guide = new IgeEntity()
            .depth(100)
            .width(960)
            .height(540)
            .mount(this.mobileControls);

        // for testing layout / scaling is working OK
        if (this.debug) this.guide.texture(self.textures.guide);

        if (this.debug) {
            this.addButton('1', 0, 0, 64, 64);
            this.addButton('2', 960 - 64, 540 - 64, 64, 64);
        }

        return this;

    },

    clearControls: function (newAbilities) {

        var self = this;
        for (ix in this.controls) {
            var uppercaseKey = ix;
            if (newAbilities && !newAbilities[uppercaseKey]) {
                var button = self.controls[uppercaseKey];
                if (typeof button === 'object' && button) {
                    button.destroy();
                }
                delete this.controls[uppercaseKey];
            }
        }
        // this.controls = [];

    },

    configure: function (abilities) {

        if (!this.isMobile || !abilities) return;
		
        // $("#show-chat").show();
        $("#show-chat").hide(); // completely disable chat on mobile (app review)
        //$("#chat-box").show();
		
		$("#chat-box").hide();
		
        $("#chat-box").css({ top: "10vh", fontSize: 'x-small' });
        $('#chat-box').css('min-width', '200px');
        $('#chat-history').css('width', '200px')
        $("#dev-console").hide() // this gets in the way of testing too
        $("#modd-item-shop-modal").css({
            'zIndex': 9050
        });
        ige.scoreboard.hideScores(); // default to collapsed state on mobile

        var self = this;

        this.clearControls(abilities);

        Object.keys(abilities).forEach(function (key, index) {
            var ability = abilities[key];

            if (ability.mobilePosition && !self.controls[key]) {
                // mobile control layout editor is 480x270
                // rescale to 960x540
                var x = ability.mobilePosition.x * 2;
                var y = ability.mobilePosition.y * 2;

                self.addControl(key, x, y, 75, 64, ability);
            }

        });

    },

    // add a button or stick to the virtual controller
    addControl: function (key, x, y, w, h, ability) {
        w = w || 128;
        h = h || 128;

        var isStick = (key == 'movementWheel' || key == 'lookWheel' || key == 'lookAndFireWheel');
        if (isStick) {
            w = 100;
            h = 100;
            if (this.isPortrait()) {
                w *= 1.777;
                h *= 1.777;
                y = y * 2;
            }

            x -= w * 0.5;
            y -= h * 0.5;

            if (this.isPortrait()) {
                x = x / 1.5;
            }

            if (this.controls[key]) return;
            this.controls[key] = new IgePixiTouchControlStick(w, h)
            .setMode(key);
        } else {

            var text = key.toUpperCase();
			
			var newButton = new PIXI.Sprite.from('https://cache.modd.io/asset/spriteImage/1549614640644_button1.png?version=123', { crossOrigin: true });
			ige.pixi.mobileControls.addChild(newButton);
			newButton.width=w;
			newButton.height=h;
			newButton.x = x;
			newButton.y = y;
			newButton._key = key.toLowerCase();
			
			var label = new PIXI.Text(text, { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'center' });
			ige.pixi.mobileControls.addChild(label);
			label.anchor.set(0.5);
			label.position.set(x+(w / 2), y+(h / 2));
			
			newButton.isButton = true;
			newButton.interactive = true;
			newButton.alpha = 0.6;
			newButton.on('touchstart', function (event) {
				if (newButton._isClicked) return;  // block repetition
				newButton._isClicked = true;
				event.stopPropagation();
				let texture = PIXI.Texture.from('https://cache.modd.io/asset/spriteImage/1549614658007_button2.png?version=123', { crossOrigin: true });
				newButton.texture = texture;
				
				if (newButton._key) {
					//console.log("Key down:"+newButton._key);
					ige.network.send('playerKeyDown', { device: 'key', key: newButton._key });
				}
			});
			newButton.on('touchend', function (event) {
				if (!newButton._isClicked) return; // block repetition
				newButton._isClicked = false;
				event.stopPropagation();
				let texture = PIXI.Texture.from('https://cache.modd.io/asset/spriteImage/1549614640644_button1.png?version=123', { crossOrigin: true });
				newButton.texture = texture;
				
				if (newButton._key) {
					//console.log("Key up:"+newButton._key);
					ige.network.send('playerKeyUp', { device: 'key', key: newButton._key });
				}
			});
						
        }

    },
    isIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    },
    isPortrait: function () {
        // return ige._bounds2d.x < ige._bounds2d.y;
        // return window.orientation === 0 || window.orientation == undefined;
        return this.canvas.width < this.canvas.height
    }

});

// client side only
// if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = MobileControlsComponent; }
