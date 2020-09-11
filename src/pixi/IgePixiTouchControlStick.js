/**
 * Input entity that supports multitouch
 * 
 */
var IgePixiTouchControlStick = IgeEntity.extend({
    classId: 'IgePixiTouchControlStick',
    componentId: 'pixiTouchControlStick',

    init: function (w, h) {
        IgeEntity.prototype.init.call(this);

        var self = this;

        this._w = w;
        this._h = h;

        this.textures = {};

        this._touchId = null;

        this.mode = 'move'; // or 'look'

        this.arrowsPressed = [];
        this.arrowsPressed['up'] = false;
        this.arrowsPressed['down'] = false;
        this.arrowsPressed['left'] = false;
        this.arrowsPressed['right'] = false;
        this.isJoyStick = true;
        var joyBase = new PIXI.Sprite.from('https://cache.modd.io/asset/spriteImage/1516311229439_stick0.png');
        var joyStick = new PIXI.Sprite.from('https://cache.modd.io/asset/spriteImage/1516311240366_stick1.png');
        var joyArrows = new PIXI.Sprite.from('https://cache.modd.io/asset/spriteImage/1516311248393_stick2.png');

        // default to 128x128px (in the 960x540 layout)
        w = w || 128;
        h = h || 128;

        var self = this;
        this.width(w)
            .height(h)
            .translateTo(0, 0);

        this.base = new IgeEntity();
        this.base._pixiContainer = joyBase;
        this.base._pixiContainer.alpha = 0;
        this.base._pixiContainer.pivot.set(w / 2, h / 2);
        this.base
            .translateTo(0, 0)
            .width(w)
            .height(h)
            .depth(1)
            .mount(ige.pixi.mobileControls);


        this.stick = new IgeEntity();
        this.stick._pixiContainer = joyStick;
        this.stick.isStick = true;
        this.stick._pixiContainer.position.set(0, 0);
        this.stick._pixiContainer.alpha = 0;
        this.stick._pixiContainer.pivot.set(w / 2, h / 2);
        this.stick.translateTo(0, 0)
            .width(w)
            .height(h)
            .depth(2)
            .mount(ige.pixi.mobileControls);

        // this.arrows = new IgeEntity();
        // this.arrows._pixiContainer = joyArrows;
        // this.arrows._pixiContainer.pivot.set(0.5);
        // this.arrows.translateTo(0, 0)
        //     .width(w)
        //     .height(h)
        //     .depth(3)
        //     // .texture(this.textures.joyArrows)
        //     .mount(this.base._pixiContainer);

    },

    // check if this control contains a viewport point
    containsPoint: function (p) {
        if (p && this._aabb && p.x >= this._aabb.x) {
            if (p.x <= this._aabb.x + this._aabb.width) {
                if (p.y >= this._aabb.y) {
                    if (p.y <= this._aabb.y + this._aabb.height) {
                        return true;
                    }
                }
            }
        }
        return false;
    },
    checkTouchIsForLookOrMove: function (touch) {
        if (touch && touch.clientX <= (window.innerWidth / 2)) {
            return 'move';
        }
        else {
            return 'look'
        }
    },
    // harmonized mouse / touch input handler
    // touch object will be null if mouse
    handleInputDown: function (pos, touch) {
        if (this.mode == 'lookandfire' || (this.checkTouchIsForLookOrMove(touch) == this.mode)) {
            this.updateOpacity(0.5);
            if (!ige.pixi.viewport.last) return;
            var tp = ige.pixi.viewport.toWorld(ige.pixi.viewport.last);
            dx = tp.x / ige._bounds2d.x;
            dy = tp.y / ige._bounds2d.y;

            var sca = ige._bounds2d.x / 960;
            // var x = Math.abs(viewPortBounds.x) + 150;
            // var y = (Math.abs(viewPortBounds.y) + Math.abs(viewPortBounds.height)) / 2;
            this._downPos = {
                x: (ige._bounds2d.x) * dx,
                y: (ige._bounds2d.y) * dy
            }
            tp.x -= 20;
            tp.y -= 20;
            this.base._pixiContainer.mousePosDown = _.cloneDeep(ige.pixi.viewport.last);
            this.stick._pixiContainer.mousePosDown = _.cloneDeep(ige.pixi.viewport.last);
            this.base._pixiContainer.position.set(tp.x, tp.y);
            this.stick._pixiContainer.position.set(tp.x, tp.y);
            this.base.translateTo(this._downPos.x, this._downPos.y, 0);
            this.stick.translateTo(this._downPos.x, this._downPos.y, 0);
        }

        //console.log('tc inputdown '+pos.x+' '+pos.y);
        if ((this.checkTouchIsForLookOrMove(touch) == this.mode) || this.mode == 'lookandfire') {
            if (touch && this._touchId == null) {
                this._touchId = touch.identifier;
                this.handleInputMove(pos, touch); // hack
            }
        }
    },
    getPositionWrtPixiVP: function (position = ige.pixi.viewport.last, forStick) {
        if (ige.pixi.viewport && position) {
            var tp = ige.pixi.viewport.toWorld(position);
            if (forStick) {
                tp.x -= 13;
                tp.y -= 13;
            } else {
                tp.x -= 20;
                tp.y -= 20;
            }
            return tp;
        }
    },

    // harmonized mouse / touch input handler
    // touch object will be null if mouse
    handleInputMove: function (pos, touch) {

        //console.log('tc inputmove '+pos.x+' '+pos.y);
        if (touch) {
            if (this._touchId == touch.identifier) {
                this.updateStickPosition(touch, false);
            }
        }
    },

    // update position of stick
    updateStickPosition: function (touch, isRelease) {
        var tp = ige.mobileControls.touchPoint(touch);
        var stickPosDown = this.getPositionWrtPixiVP(tp, true);
        // in 'look and fire' mode we translate the stick to wherever the user moved their finger
        // dx and dy are relative to touch down position

        // var sca = ige._bounds2d.x / 960;
        // this._stickPos = {
        //     x: (ige._bounds2d.x / sca) * (tp.x / ige._bounds2d.x),
        //     y: (ige._bounds2d.y / sca) * (tp.y / ige._bounds2d.y)
        // }
        var mousePosDown = this.getPositionWrtPixiVP(this.stick._pixiContainer.mousePosDown, true);
        var currentPos = this.getPositionWrtPixiVP(this.stick._pixiContainer.lastMousePos, true);
        dx = (mousePosDown.x - currentPos.x) / this.stick.width();
        dy = (mousePosDown.y - currentPos.y) / this.stick.height();
        dx *= 2;
        dy *= 2;
        var dist = Math.sqrt(dx * dx + dy * dy);

        this.stick._pixiContainer.lastMousePos = tp;

        var deltaDistance = 0.6;
        if (dx > deltaDistance) dx = 1;
        if (dx < -deltaDistance) dx = -1;
        if (dy > deltaDistance) dy = 1;
        if (dy < -deltaDistance) dy = -1;

        if (isRelease) {
            var downPos = this.stick._pixiContainer.mousePosDown;
            if (this._firing && this.mode == 'lookandfire') {
                this._firing = false;
                ige.network.send('playerKeyUp', { device: 'key', key: 'button1' });
                // this.stick.texture(this.textures.joyStick2);
                this.isMoving = false;
            }
            this.stick.mouseDown = false;
            this.stick._pixiContainer.alpha = 0;
            this.base._pixiContainer.alpha = 0;
        } else {
            this.stick.translateTo(tp.x, tp.y, 0);
            this.isMoving = true;
            this.stick.mouseDown = true;
            this.base._pixiContainer.alpha = 0.3;
            this.stick._pixiContainer.alpha = 0.6;
        }

        // if this is a movement stick send arrows as appropriate
        if (this.mode == 'move') {
            if (isRelease) {
                this.updateArrows(0, 0);
            }
            else {
                this.updateArrows(dx, dy);
            }
        }

        // if this is a look stick send simulated mouse move as appropriate
        if (this.mode == 'look') {
            // don't send simulated mousemove when releasing stick
            if (!isRelease) {
                this.updateLook(dx, dy);
            }
        }

        // look and fire
        if (this.mode == 'lookandfire') {
            // don't send simulated mousemove when releasing stick
            if (!isRelease) {
                this.updateLook(dx, dy);

                if (dist >= 1.2) {
                    if (!this._firing) {
                        this._firing = true;
                        ige.network.send('playerKeyDown', { device: 'key', key: 'button1' });
                        // this.stick.texture(this.textures.joyStick3);
                    }
                } else {
                    if (this._firing) {
                        this._firing = false;
                        ige.network.send('playerKeyUp', { device: 'key', key: 'button1' });
                        // this.stick.texture(this.textures.joyStick2);
                    }
                }
            }
        }

    },

    updateArrows: function (dx, dy) {
        var thresh = 1;
        var isUp = dy >= thresh;
        var isDown = dy <= -thresh;
        var isLeft = dx >= thresh;
        var isRight = dx <= -thresh;
        var isStop = dx == 0 && dy == 0;
        if (this.arrowsPressed['up'] != isUp) {
            if (isUp) {
                ige.network.send('playerKeyDown', { device: 'key', key: 'up' });
            } else {
                ige.network.send('playerKeyUp', { device: 'key', key: 'up' });
            }
            this.arrowsPressed['up'] = isUp;
        }

        if (this.arrowsPressed['down'] != isDown) {
            if (isDown) {
                ige.network.send('playerKeyDown', { device: 'key', key: 'down' });
            } else {
                ige.network.send('playerKeyUp', { device: 'key', key: 'down' });
            }
            this.arrowsPressed['down'] = isDown;
        }

        if (this.arrowsPressed['left'] != isLeft) {
            if (isLeft) {
                ige.network.send('playerKeyDown', { device: 'key', key: 'left' });
            } else {
                ige.network.send('playerKeyUp', { device: 'key', key: 'left' });
            }
            this.arrowsPressed['left'] = isLeft;
        }

        if (this.arrowsPressed['right'] != isRight) {
            if (isRight) {
                ige.network.send('playerKeyDown', { device: 'key', key: 'right' });
            } else {
                ige.network.send('playerKeyUp', { device: 'key', key: 'right' });
            }
            this.arrowsPressed['right'] = isRight;
        }

        if (isStop) {
            _.forEach(this.arrowsPressed, function (value, key) {
                if (key && value) {
                    ige.network.send('playerKeyUp', { device: 'key', key: key });
                    this.arrowsPressed[key] = false;
                }
            })
        }
    },

    // send simulated mousemove
    // dx and dy values -1 to 1
    updateLook: function (dx, dy) {
        var mousePosDown = this.getPositionWrtPixiVP(this.stick._pixiContainer.mousePosDown, true);
        var currentPos = this.getPositionWrtPixiVP(this.stick._pixiContainer.lastMousePos, true);
        var unitTranslate = ige.client.myPlayer.getSelectedUnit()._translate;

        var difference = {
            x: mousePosDown.x - currentPos.x,
            y: mousePosDown.y - currentPos.y,
        }
        // convert dx,dy to canvas coords
        var canvasPos = new IgePoint2d(
            dx * ige._bounds2d.x2,
            dy * ige._bounds2d.y2
        );

        // var newMousePosition = this.getPositionWrtPixiVP(this.stick._pixiContainer.lastMousePos, true);
        var newMousePosition = {
            x: unitTranslate.x - difference.x,
            y: unitTranslate.y - difference.y,
        }


        var angle = 0;
        angle = Math.atan2(dy, dx);
        angle = parseFloat(angle.toPrecision(5));


        if (ige.client.myPlayer) {
            ige.client.myPlayer.absoluteAngle = angle;
            ige.client.myPlayer.control.input.mouse.x = newMousePosition.x;
            ige.client.myPlayer.control.input.mouse.y = newMousePosition.y;
        }

        ige.network.send('playerAbsoluteAngle', angle);
        ige.network.send("playerMouseMoved", [newMousePosition.x, newMousePosition.y]);
    },

    // harmonized mouse / touch input handler
    // touch object will be null if mouse
    handleInputUp: function (pos, touch) {
        if (touch && this._touchId == touch.identifier) {
            this._touchId = null;
            this.updateOpacity(0);
            this.updateStickPosition(touch, true);
        }

    },

    // set stick mode using editor key id
    setMode: function (keyId) {

        this.mode == 'move'; // default
        if (keyId == 'lookWheel') {
            this.mode = 'look';
        }
        if (keyId == 'lookAndFireWheel') {
            this.mode = 'lookandfire';
        }

        this.base.texture(this.textures.joyBase2);
        this.stick.texture(this.textures.joyStick2);

        this.updateOpacity(0);

        return this; // fluent
    },

    updateOpacity: function (value) {
        // this.arrows.opacity(value);
        this.base.opacity(value);
        this.stick.opacity(value);
    },

});