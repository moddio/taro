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
var MobileControlsScene = /** @class */ (function (_super) {
    __extends(MobileControlsScene, _super);
    function MobileControlsScene() {
        return _super.call(this, { key: 'MobileControls' }) || this;
    }
    MobileControlsScene.prototype.create = function () {
        this.mobileControls.zIndex = 10;
        // make the mobileControls container fit to width and anchored to bottom
        this.mobileControls.y = window.innerHeight - 540;
        var scaleToFit = window.innerWidth / 960;
        this.mobileControls.scale.set(scaleToFit, scaleToFit);
    };
    return MobileControlsScene;
}(Phaser.Scene));
//# sourceMappingURL=MobileControlsScene.js.map