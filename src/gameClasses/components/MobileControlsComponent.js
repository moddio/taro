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

        this.touchesDown = []; // track downness of touches to mitigate move after up issue

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

        // this.guide._resizeEvent = this.handleResize.bind(this);

        // for testing layout / scaling is working OK
        if (this.debug) this.guide.texture(self.textures.guide);

        if (this.debug) {
            this.addButton('1', 0, 0, 64, 64);
            this.addButton('2', 960 - 64, 540 - 64, 64, 64);
        }

        // attach event handlers
        ige.input.on('mouseDown', function (event) {
            return self._inputDown.call(self, event);
        });
        ige.input.on('mouseMove', function (event) {
            return self._inputMove.call(self, event);
        });
        ige.input.on('mouseUp', function (event) {
            return self._inputUp.call(self, event);
        });

        return this;

    },

    // canvas point from mouse event
    mousePoint: function (e) {
        return new IgePoint2d(
            e.igeX - ige._bounds2d.x2,
            e.igeY - ige._bounds2d.y2
        );
    },

    // canvas point from touch event
    touchPoint: function (touch) {
        return new IgePoint2d(
            touch.pageX - ige._canvasPosition().left - ige._bounds2d.x2,
            touch.pageY - ige._canvasPosition().top - ige._bounds2d.y2
        );
    },

    // convert canvas point to viewport point
    canvasToViewportPoint: function (canvasPoint) {
        var vp = ige.client.vp1;
        var viewportPoint = new IgePoint2d(
            Math.floor((canvasPoint.x - vp._translate.x) / vp.camera._scale.x + vp.camera._translate.x),
            Math.floor((canvasPoint.y - vp._translate.y) / vp.camera._scale.y + vp.camera._translate.y)
        );
        return viewportPoint;
    },

    // handle input down events
    _inputDown: function (e) {
        if (e.type == "mousedown") {
            var mp = this.canvasToViewportPoint(this.mousePoint(e));
            this.handleInputDown(mp, null);
            return;
        }

        if (!e.changedTouches) {
            return;
        }

        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            this.touchesDown[touch.identifier] = true;
            var vpBounds = ige.pixi.viewport.getVisibleBounds();
            var tp = { x: vpBounds.x + e.igeX, y: vpBounds.y + e.igeY };
            this.handleInputDown(tp, touch);

        }

    },

    // harmonized mouse / touch input handler
    // touch object will be null if mouse
    handleInputDown: function (pos, touch) {
        var self = this;
        //console.log('inputdown '+pos.x+' '+pos.y);
        var isButtonPressed = false;
        for (ix in this.controls) {
            var button = self.controls[ix];
            if (typeof button === 'object' && button && this.isButtonPressed()) {
                isButtonPressed = true;
                button && button.handleInputDown(pos, touch);
            }
        }
        if (!isButtonPressed) {
            for (ix in this.controls) {
                var button = self.controls[ix];
                if (button && typeof button === 'object') {
                    button.handleInputDown(pos, touch);
                }
            }
        }
    },

    // harmonized mouse / touch input handler
    // touch object will be null if mouse
    handleInputMove: function (pos, touch) {
        var self = this;
        //console.log('inputmove '+pos.x+' '+pos.y);
        for (ix in this.controls) {
            var button = self.controls[ix];
            if (typeof button === 'object' && button) {
                button.handleInputMove(pos, touch);
            }
        }
    },
    isWheel: function (ix) {
        return ix == 'movementWheel' || ix == 'lookWheel' || ix == 'lookAndFireWheel';
    },
    isMovementOrLookWheelEnable: function () {
        for (ix in this.controls) {
            if (this.isWheel(ix) && this.controls[ix]._touchId) {
                return true;
            }
        }
        return false;
    },

    // harmonized mouse / touch input handler
    // touch object will be null if mouse
    handleInputUp: function (pos, touch) {
        var self = this;
        //console.log('inputup '+pos.x+' '+pos.y);
        for (ix in this.controls) {
            var button = self.controls[ix];
            if (typeof button === 'object' && button && (!this.isMovementOrLookWheelEnable() || this.isWheel(ix))) {
                button.handleInputUp(pos, touch);
            }
        }
    },



    // handle input move events
    _inputMove: function (e) {
        if (e.type == "mousemove") {
            var mp = this.canvasToViewportPoint(this.mousePoint(e));
            this.handleInputMove(mp, null);
            return;
        }

        if (!e.changedTouches) {
            return;
        }
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            //console.log('move '+touch.identifier);
            if (this.touchesDown[touch.identifier] == true) {
                var tp = this.canvasToViewportPoint(this.touchPoint(touch));
                this.handleInputMove(tp, touch);
            }
        }

    },

    // handle input up events
    _inputUp: function (e) {
        if (e.type == "mouseup") {
            var mp = this.canvasToViewportPoint(this.mousePoint(e));
            this.handleInputUp(mp, null);
            return;
        }
        if (!e.changedTouches) {
            return;
        }
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            this.touchesDown[touch.identifier] = false;
            //console.log('up '+touch.identifier);
            var tp = this.canvasToViewportPoint(this.touchPoint(touch));
            this.handleInputUp(tp, touch);
        }
    },
    isButtonPressed: function () {
        for (var key in this.controls) {
            var control = this.controls[key];
            if (typeof button === 'object' && control.isClicked) {
                return true;
            }
        }
        return false;
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

                self.addButton(key, x, y, 75, 64, ability);
            }

        });

    },

    // add a button to the virtual controller
    addButton: function (key, x, y, w, h, ability) {
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
    },

    // on canvas resize scale guide entity to fit canvas bounds
    handleResize: function (event) {
        var scaleFitX = ige._bounds2d.x / 960;
        var scaleFitY = ige._bounds2d.y / 540;

        var guideScale = scaleFitX;
        if (scaleFitY < scaleFitX) {
            guideScale = scaleFitY;
        }

        if (this.guide) {
            this.guide.scaleTo(guideScale, guideScale, guideScale);
        }
    },

    _behaviour: function () {
        for (var key in this.controls) {
            var button = this.controls[key];
            if (typeof button !== 'object') return;
            if (button.isJoyStick) {
                var basePos = button.getPositionWrtPixiVP(button.base._pixiContainer.mousePosDown);
                var stickPos = button.getPositionWrtPixiVP(button.stick.mouseDown ?
                    button.stick._pixiContainer.lastMousePos :
                    button.stick._pixiContainer.mousePosDown,
                    true
                );
                if (basePos) {
                    button.base._pixiContainer.position.set(basePos.x, basePos.y);
                }
                if (stickPos) {
                    button.stick._pixiContainer.position.set(stickPos.x, stickPos.y);
                }
            }
            else {
                var originalPoints = button.originalPoints;
                if (originalPoints) {
                    var worldPoint = ige.pixi.viewport.toWorld(originalPoints);
                    button._pixiContainer.position.set(worldPoint.x, worldPoint.y);
                }
            }
        }
    }

});

// client side only
// if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = MobileControlsComponent; }
