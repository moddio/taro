/* eslint-disable @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars */
var PhaserEntity = /** @class */ (function () {
    function PhaserEntity(entity) {
        this.entity = entity;
        this.evtListeners = {};
        Object.assign(this.evtListeners, {
            transform: entity.on('transform', this.transform, this),
            scale: entity.on('scale', this.scale, this),
            hide: entity.on('hide', this.hide, this),
            show: entity.on('show', this.show, this),
            destroy: entity.on('destroy', this.destroy, this)
        });
    }
    PhaserEntity.prototype.transform = function (data) { };
    PhaserEntity.prototype.scale = function (data) { };
    PhaserEntity.prototype.hide = function () {
        this.gameObject.setActive(false)
            .setVisible(false);
    };
    PhaserEntity.prototype.show = function () {
        this.gameObject.setActive(true)
            .setVisible(true);
    };
    PhaserEntity.prototype.destroy = function () {
        var _this = this;
        Object.keys(this.evtListeners).forEach(function (key) {
            _this.entity.off(key, _this.evtListeners[key]);
            delete _this.evtListeners[key];
        });
        this.gameObject.destroy();
        this.gameObject = null;
        this.evtListeners = null;
        this.entity = null;
    };
    return PhaserEntity;
}());
//# sourceMappingURL=PhaserEntity.js.map