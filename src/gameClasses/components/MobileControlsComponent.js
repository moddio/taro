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

            // Adam 4-Jan-2021 .... don't think we need this... not for mobile controls anyway - so I'm commenting it out
            /*
            var canvas = document.getElementById('igeFrontBuffer');
            this.canvas = {
                height: (canvas.style.height && parseInt(canvas.style.height.replace('px', ''))) || canvas.height,
                width: (canvas.style.width && parseInt(canvas.style.width.replace('px', ''))) || canvas.width
            };
            */         

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
	
	upPressed: function(){
		if (this.debug) console.log("UP PRESSED");
		var unit = ige.client.myPlayer.getSelectedUnit();
		unit.ability.moveUp();
		if (ige.isClient) {
			ige.network.send('playerKeyDown', { device: "key", key: "w" });
		}
	},
	
	downPressed: function(){
		if (this.debug) console.log("DOWN PRESSED");
		var unit = ige.client.myPlayer.getSelectedUnit();
		unit.ability.moveDown();
		if (ige.isClient) {
			ige.network.send('playerKeyDown', { device: "key", key: "s" });
		}		
	},
	
	leftPressed: function(){
		if (this.debug) console.log("LEFT PRESSED");
		var unit = ige.client.myPlayer.getSelectedUnit();
		unit.ability.moveLeft();
		if (ige.isClient) {
			ige.network.send('playerKeyDown', { device: "key", key: "a" });
		}
	},
	
	rightPressed: function(){
		if (self.debug) console.log("RIGHT PRESSED");
		var unit = ige.client.myPlayer.getSelectedUnit();
		unit.ability.moveRight();
		if (ige.isClient) {
			ige.network.send('playerKeyDown', { device: "key", key: "d" });
		}
	},
	
	upReleased: function(){
		if (this.debug) console.log("UP RELEASED");
		var unit = ige.client.myPlayer.getSelectedUnit();
		if (unit.direction.y == -1) unit.ability.stopMovingY();
		if (ige.isClient) {
			ige.network.send('playerKeyUp', { device: "key", key: "w" });
		}
	},
	
	downReleased: function(){
		if (this.debug) console.log("DOWN RELEASED");
		var unit = ige.client.myPlayer.getSelectedUnit();
		if (unit.direction.y == 1) unit.ability.stopMovingY();
		if (ige.isClient) {
			ige.network.send('playerKeyUp', { device: "key", key: "s" });
		}
	},
	
	leftReleased: function(){
		if (this.debug) console.log("LEFT RELEASED");
		var unit = ige.client.myPlayer.getSelectedUnit();
		if (unit.direction.x == -1) unit.ability.stopMovingX();
		if (ige.isClient) {
			ige.network.send('playerKeyUp', { device: "key", key: "a" });
		}
	},
	
	rightReleased: function(){
		if (this.debug) console.log("RIGHT RELEASED");
		var unit = ige.client.myPlayer.getSelectedUnit();
		if (unit.direction.x == 1) unit.ability.stopMovingX();
		if (ige.isClient) {
			ige.network.send('playerKeyUp', { device: "key", key: "d" });
		}
	},	

    // add a button or stick to the virtual controller
    addControl: function (key, x, y, w, h, ability) {
        w = w || 128;
        h = h || 128;

        var self = this;

        var isStick = (key == 'movementWheel' || key == 'lookWheel' || key == 'lookAndFireWheel');
        if (isStick) {

            if (key == 'movementWheel'){
                let moveStick = new Joystick({
                    outerScale: { x: 1.2, y:1.2 },
                    innerScale: { x: 0.5, y:0.5 },
                    onChange: (data) => { 

                        if (ige.client.myPlayer) {
                            
                            // Endel's joystick angles are in "Maths style" (zero degrees is EAST and positive anticlockwise)
                            // Convert into compass style angle (zero degrees NORTH and positive clockwise)
                            var compassAngle = (360-(data.angle-90))  % 360;

                            var tolerance = 12;

                            var isUp = (compassAngle <= 90-tolerance) || (compassAngle >= 270+tolerance);
                            var isDown = (compassAngle >= 90+tolerance) && (compassAngle <= 270-tolerance);
                            var isLeft = (compassAngle <= 360-tolerance) && (compassAngle >= 180+tolerance);
                            var isRight = (compassAngle >= tolerance) && (compassAngle <= 180-tolerance);

                            if (data.power > 0.5){
                                if (isUp && moveStick._isUp == false){
									self.upPressed();
                                }
                                if (!isUp && moveStick._isUp == true){
									self.upReleased();
                                }
                                if (isDown && moveStick._isDown == false){
									self.downPressed();
                                }
                                if (!isDown && moveStick._isDown == true){
									self.downReleased();
                                }
                                if (isLeft && moveStick._isLeft == false){
									self.leftPressed();
                                }
                                if (!isLeft && moveStick._isLeft == true){
									self.leftReleased();
                                }
                                if (isRight && moveStick._isRight == false){
									self.rightPressed();
                                }
                                if (!isRight && moveStick._isRight == true){
									self.rightReleased();
                                }
                                moveStick._isUp = isUp;
                                moveStick._isDown = isDown;
                                moveStick._isLeft = isLeft;
                                moveStick._isRight = isRight;
                            } else {
                              if(moveStick._isUp){
									self.upReleased();
                              }
                              if (moveStick._isLeft){
									self.leftPressed();
                              }
                              if (moveStick._isDown){
									self.downReleased();
                              }
                              if (moveStick._isRight){
									self.rightReleased();
                              }
                                moveStick._isUp = false;
                                moveStick._isDown = false;
                                moveStick._isLeft = false;
                                moveStick._isRight = false;
                            }

                        }

                    },
                    onEnd: () => {
                      var unit = ige.client.myPlayer.getSelectedUnit();
                      if(moveStick._isUp){
					      self.upReleased();
                      }
                      if (moveStick._isLeft){
					      self.leftReleased();
                      }
                      if (moveStick._isDown){
					      self.downReleased();
                      }
                      if (moveStick._isRight){
					      self.rightReleased();
                      }
                        moveStick._isUp = false;
                        moveStick._isDown = false;
                        moveStick._isLeft = false;
                        moveStick._isRight = false;
                    }
                });
                ige.pixi.mobileControls.addChild(moveStick);
                moveStick.position.set(x+32, y+12);

                moveStick._isUp = false;
                moveStick._isDown = false;
                moveStick._isLeft = false;
                moveStick._isRight = false;


            }

            if (key == 'lookWheel'){
                let lookStick = new Joystick({
                    outerScale: { x: 1.2, y:1.2 },
                    innerScale: { x: 0.5, y:0.5 },
                    onChange: (data) => { 

                        if (ige.client.myPlayer) {
                            
                            // Endel's joystick angles are in "Maths style" (zero degrees is EAST and positive anticlockwise)
                            // Convert into compass style angle (zero degrees NORTH and positive clockwise)
                            var compassAngle = -(data.angle-90);
                            
                            // simulate mouse movement 10 units away from player (scaled by joystick "power") character but at the angle
                            var unitTranslate = ige.client.myPlayer.getSelectedUnit()._translate;          
                            var mx = unitTranslate.x + Math.sin(compassAngle/360 * 2 * Math.PI)*10*data.power;
                            var my = unitTranslate.y - Math.cos(compassAngle/360 * 2 * Math.PI)*10*data.power;

                            ige.client.myPlayer.control.input.mouse.x = mx;    
                            ige.client.myPlayer.control.input.mouse.y = my;

                            ige.client.myPlayer.absoluteAngle = compassAngle;
                            ige.network.send("playerMouseMoved", [mx, my]);
                            ige.network.send('playerAbsoluteAngle', compassAngle);

                        }

                    }
                });
                ige.pixi.mobileControls.addChild(lookStick);
                lookStick.position.set(x+32, y+12);
            }

            if (key == 'lookAndFireWheel'){
                let fireStick = new Joystick({
                    redFireZone: true,
                    outerScale: { x: 1.2, y:1.2 },
                    innerScale: { x: 0.5, y:0.5 },
                    onChange: (data) => { 

                        if (ige.client.myPlayer) {
                            
                            // Endel's joystick angles are in "Maths style" (zero degrees is EAST and positive anticlockwise)
                            // Convert into compass style angle (zero degrees NORTH and positive clockwise)
                            var compassAngle = -(data.angle-90);
                            
                            // simulate mouse movement 10 units away from player (scaled by joystick "power") character but at the angle
                            var unitTranslate = ige.client.myPlayer.getSelectedUnit()._translate;          
                            var mx = unitTranslate.x + Math.sin(compassAngle/360 * 2 * Math.PI)*10*data.power;
                            var my = unitTranslate.y - Math.cos(compassAngle/360 * 2 * Math.PI)*10*data.power;

                            ige.client.myPlayer.control.input.mouse.x = mx;    
                            ige.client.myPlayer.control.input.mouse.y = my;

                            ige.client.myPlayer.absoluteAngle = compassAngle;
                            ige.network.send("playerMouseMoved", [mx, my]);
                            ige.network.send('playerAbsoluteAngle', compassAngle);
                            
                            // when fire stick is moved to the red ring...
                            if (data.power > 0.75){
                                // start firing
                                ige.client.myPlayer.control.keyDown('mouse','button1');
                            } else {
                                // otherwise stop firing
                                ige.client.myPlayer.control.keyUp('mouse','button1');
                            }

                        }

                    },

                    onEnd: () => {
                        // if the player lets go of the fire stick perform a keyup on mouse button1 to stop firing
                        if (ige.client.myPlayer) {
                            ige.client.myPlayer.control.keyUp('mouse','button1');
                        }
                    }

                });
                ige.pixi.mobileControls.addChild(fireStick);
                fireStick.position.set(x+32, y+12);
            }

        } else {

            var text = key.toUpperCase();
			
			var newButton = new PIXI.Sprite.from('https://cache.modd.io/asset/spriteImage/1549614640644_button1.png?version=123', { crossOrigin: true });
			ige.pixi.mobileControls.addChild(newButton);
			newButton.width=w;
			newButton.height=h;
			newButton.x = x;
			newButton.y = y;
			newButton._key = key.toLowerCase();
			
			var iconUrl = null;
			if (text == "BUTTON1") iconUrl = "https://cache.modd.io/asset/spriteImage/1610494864771_fightFist_circle.png";
			
			if (iconUrl){
				var icon = new PIXI.Sprite.from(iconUrl, { crossOrigin: true });
				ige.pixi.mobileControls.addChild(icon);
				icon.scale.set(0.5);
				icon.anchor.set(0.5);
				icon.position.set(x+(w / 2), y+(h / 2));
			} else {
				var label = new PIXI.Text(text, { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'center' });
				ige.pixi.mobileControls.addChild(label);
				label.anchor.set(0.5);
				label.position.set(x+(w / 2), y+(h / 2));
			}
			
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


// Endel Virtual Joystick:

var Direction = {
    LEFT : 'left',
    TOP : 'top',
    BOTTOM : 'bottom',
    RIGHT : 'right',
    TOP_LEFT : 'top_left',
    TOP_RIGHT : 'top_right',
    BOTTOM_LEFT : 'bottom_left',
    BOTTOM_RIGHT : 'bottom_right',
  }
  
  class JoystickSettings {
      
      constructor(){
          this.outer=null;
          this.inner=null;
          this.redFireZone = false;
          this.outerScale = { x: 1, y: 1 };
          this.innerScale = { x: 1, y: 1 };
          this.onChange = null;
          this.onStart = null;
          this.onEnd = null;
      }
  }
  
  class Joystick extends PIXI.Container {
  
    constructor(opts) {
      super();
	  
	  this.innerAlphaStandby = 0.5;
      
      this.settings = new JoystickSettings();
  
      this.settings = Object.assign({
        outerScale: { x: 1, y: 1 },
        innerScale: { x: 1, y: 1 },
      }, opts);
  
      if (!this.settings.outer) {
        const outer = new PIXI.Graphics();

        if (this.settings.redFireZone){
            outer.lineStyle(10,0xff0000);
            outer.beginFill(0x000000,0.5);
            outer.drawCircle(0, 0, 60);

        } else {
            outer.beginFill(0x000000);
            outer.drawCircle(0, 0, 60);
            outer.alpha = 0.5;
        }
        this.settings.outer = outer;
      }
  
      if (!this.settings.inner) {
        const inner = new PIXI.Graphics();
        inner.beginFill(0x000000);
        inner.drawCircle(0, 0, 35);
        inner.alpha = this.innerAlphaStandby;
        this.settings.inner = inner;
      }
  
      this.initialize();
    }
  
    initialize() {
      this.outer = this.settings.outer;
      this.inner = this.settings.inner;
  
      this.outer.scale.set(this.settings.outerScale.x, this.settings.outerScale.y);
      this.inner.scale.set(this.settings.innerScale.x, this.settings.innerScale.y);
  
      if ('anchor' in this.outer) { this.outer.anchor.set(0.5); }
      if ('anchor' in this.inner) { this.inner.anchor.set(0.5); }
  
      this.addChild(this.outer);
      this.addChild(this.inner);
  
      // this.outerRadius = this.containerJoystick.width / 2;
      this.outerRadius = 55;//this.width / 2.5;
      this.innerRadius = 52;//this.inner.width / 2;
  
      this.bindEvents();
    }
  
    bindEvents() {
      let that = this;
      this.interactive = true;
  
      let dragging = false;
      let eventData;
      let power;
      let startPosition;
  
      function onDragStart(event) {
        eventData = event.data;
        startPosition = eventData.getLocalPosition(that);
  
        dragging = true;
        that.inner.alpha = 1;
  
		if (that.settings.onStart){
			that.settings.onStart();
		}
      }
  
      function onDragEnd(event) {
        if (dragging == false) { return; }
  
        that.inner.position.set(0, 0);
  
        dragging = false;
        that.inner.alpha = that.innerAlphaStandby;
  
		if (that.settings.onEnd){
			that.settings.onEnd();
		}
      }
  
      function onDragMove(event) {
        if (dragging == false) { return; }
  
        let newPosition = eventData.getLocalPosition(that);
  
        let sideX = newPosition.x - startPosition.x;
        let sideY = newPosition.y - startPosition.y;
  
        let centerPoint = new PIXI.Point(0, 0);
        let angle = 0;
  
        if (sideX == 0 && sideY == 0) { return; }
  
        let calRadius = 0;
  
        if (sideX * sideX + sideY * sideY >= that.outerRadius * that.outerRadius) {
          calRadius = that.outerRadius;
        }
        else {
          calRadius = that.outerRadius - that.innerRadius;
        }
  
        /**
         * x:   -1 <-> 1
         * y:   -1 <-> 1
         *          Y
         *          ^
         *          |
         *     180  |  90
         *    ------------> X
         *     270  |  360
         *          |
         *          |
         */
  
        let direction = Direction.LEFT;
  
        if (sideX == 0) {
          if (sideY > 0) {
            centerPoint.set(0, (sideY > that.outerRadius) ? that.outerRadius : sideY);
            angle = 270;
            direction = Direction.BOTTOM;
          } else {
            centerPoint.set(0, -(Math.abs(sideY) > that.outerRadius ? that.outerRadius : Math.abs(sideY)));
            angle = 90;
            direction = Direction.TOP;
          }
          that.inner.position = centerPoint;
          power = that.getPower(centerPoint);
		  if (that.settings.onChange){
			that.settings.onChange({ angle, direction, power, });
          }
		  return;
        }
  
        if (sideY == 0) {
          if (sideX > 0) {
            centerPoint.set((Math.abs(sideX) > that.outerRadius ? that.outerRadius : Math.abs(sideX)), 0);
            angle = 0;
            direction = Direction.LEFT;
          } else {
            centerPoint.set(-(Math.abs(sideX) > that.outerRadius ? that.outerRadius : Math.abs(sideX)), 0);
            angle = 180;
            direction = Direction.RIGHT;
          }
  
          that.inner.position = centerPoint;
          power = that.getPower(centerPoint);
		  if (that.settings.onChange){
			that.settings.onChange({ angle, direction, power, });
		  }
          return;
        }
  
        let tanVal = Math.abs(sideY / sideX);
        let radian = Math.atan(tanVal);
        angle = radian * 180 / Math.PI;
  
        let centerX = 0;
        let centerY = 0;
  
        if (sideX * sideX + sideY * sideY >= that.outerRadius * that.outerRadius) {
          centerX = that.outerRadius * Math.cos(radian);
          centerY = that.outerRadius * Math.sin(radian);
        }
        else {
          centerX = Math.abs(sideX) > that.outerRadius ? that.outerRadius : Math.abs(sideX);
          centerY = Math.abs(sideY) > that.outerRadius ? that.outerRadius : Math.abs(sideY);
        }
  
        if (sideY < 0) {
          centerY = -Math.abs(centerY);
        }
        if (sideX < 0) {
          centerX = -Math.abs(centerX);
        }
  
        if (sideX > 0 && sideY < 0) {
          // < 90
        }
        else if (sideX < 0 && sideY < 0) {
          // 90 ~ 180
          angle = 180 - angle;
        }
        else if (sideX < 0 && sideY > 0) {
          // 180 ~ 270
          angle = angle + 180;
        }
        else if (sideX > 0 && sideY > 0) {
          // 270 ~ 369
          angle = 360 - angle;
        }
        centerPoint.set(centerX, centerY);
        power = that.getPower(centerPoint);
  
        direction = that.getDirection(centerPoint);
        that.inner.position = centerPoint;
  
		if (that.settings.onChange){
			that.settings.onChange({ angle, direction, power, });
		}
      };
  
      this.on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove)
    }
  
    getPower(centerPoint) {
      const a = centerPoint.x - 0;
      const b = centerPoint.y - 0;
      return Math.min(1, Math.sqrt(a * a + b * b) / this.outerRadius);
    }
  
    getDirection(center) {
      let rad = Math.atan2(center.y, center.x);// [-PI, PI]
      if ((rad >= -Math.PI / 8 && rad < 0) || (rad >= 0 && rad < Math.PI / 8)) {
        return Direction.RIGHT;
      } else if (rad >= Math.PI / 8 && rad < 3 * Math.PI / 8) {
        return Direction.BOTTOM_RIGHT;
      } else if (rad >= 3 * Math.PI / 8 && rad < 5 * Math.PI / 8) {
        return Direction.BOTTOM;
      } else if (rad >= 5 * Math.PI / 8 && rad < 7 * Math.PI / 8) {
        return Direction.BOTTOM_LEFT;
      } else if ((rad >= 7 * Math.PI / 8 && rad < Math.PI) || (rad >= -Math.PI && rad < -7 * Math.PI / 8)) {
        return Direction.LEFT;
      } else if (rad >= -7 * Math.PI / 8 && rad < -5 * Math.PI / 8) {
        return Direction.TOP_LEFT;
      } else if (rad >= -5 * Math.PI / 8 && rad < -3 * Math.PI / 8) {
        return Direction.TOP;
      } else {
        return Direction.TOP_RIGHT;
      }
    }
  
  
  }