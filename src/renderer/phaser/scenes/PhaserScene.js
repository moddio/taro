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
var PhaserScene = /** @class */ (function (_super) {
    __extends(PhaserScene, _super);
    function PhaserScene() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PhaserScene.prototype.patchUrl = function (url) {
        return url.replace(/^http(s)?:/i, location.protocol);
    };
    return PhaserScene;
}(Phaser.Scene));
//# sourceMappingURL=PhaserScene.js.map