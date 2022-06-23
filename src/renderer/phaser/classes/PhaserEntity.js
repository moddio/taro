var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var PhaserEntity = /** @class */ (function (_super) {
    __extends(PhaserEntity, _super);
    function PhaserEntity(scene, entity) {
        var _this = _super.call(this, scene) || this;
        _this.entity = entity;
        _this.evtListeners = {};
        var translate = entity._translate;
        _this.setPosition(translate.x, translate.y);
        scene.add.existing(_this);
        Object.assign(_this.evtListeners, {
            transform: entity.on('transform', _this.transformEntity, _this, false),
            scale: entity.on('scale', _this.scaleEntity, _this, false),
            destroy: entity.on('destroy', _this.destroyEntity, _this, false)
        });
        return _this;
    }
    PhaserEntity.prototype.transformEntity = function (data) {
        this.setPosition(data.x, data.y);
    };
    PhaserEntity.prototype.destroyEntity = function () {
        var _this = this;
        Object.keys(this.evtListeners).forEach(function (key) {
            _this.entity.off(key, _this.evtListeners[key]);
            delete _this.evtListeners[key];
        });
        this.evtListeners = null;
        this.entity = null;
        this.destroy();
    };
    return PhaserEntity;
}(Phaser.GameObjects.Container));
//# sourceMappingURL=PhaserEntity.js.map