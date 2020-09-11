var Sensor = IgeEntityBox2d.extend({
    classId: 'Sensor',

    init: function (ownerUnit, radius) {
        var self = this;
        self.category('sensor')
        self.ownerUnitId = ownerUnit.id()        
        IgeEntityBox2d.prototype.init.call(this, {});
        this.updateRadius(radius);
        if (ige.isServer) {
            self.mount(ige.$('baseScene'));
            this.streamMode(0);
            this.addBehaviour('sensorBehaviour', this._behaviour);
        
        }
    },

    getOwnerUnit: function() {
        return ige.$(this.ownerUnitId);
    },

    updateRadius: function(radius) {
        if (radius > 0) {
            // console.log("updatingRadius to", radius)
            this._stats = {
                currentBody: {
                    width: radius * 2,
                    height: radius * 2,
                    bullet: true,
                    fixedRotation: true,
                    fixtures: [{
                        density: 0,
                        friction: 0,
                        restitution: 0,
                        isSensor: true,
                        shape: {
                            type: 'circle'
                        },
                    }],
                    collidesWith : {
                        units: true,
                        items: true
                    }
                }
            };

            var ownerUnit = ige.$(this.ownerUnitId)
            if (ownerUnit) {
                var defaultData = { 
                    translate: {
                        x: ownerUnit._translate.x,
                        y: ownerUnit._translate.y
                    }
                };

                this.updateBody(defaultData);
            } else {
                console.log("ownerUnit doesn't exist!!");
            }
        } else {
            this.destroyBody()
        }
    },

    _behaviour: function (ctx) {
        var ownerUnit = this.getOwnerUnit();
        if (ownerUnit) {
            if (this.body) {
                this.translateTo(ownerUnit._translate.x, ownerUnit._translate.y); // keep sensor following its owner unit
            }
        } else {
            // destroy ownerless sensors
            this.remove();
        }
        this.processBox2dQueue();
    }
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = Sensor; }
