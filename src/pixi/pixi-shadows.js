(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("pixi-shadows", [], factory);
	else if(typeof exports === 'object')
		exports["pixi-shadows"] = factory();
	else
		root["pixi-shadows"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/shadows/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/shadows/Shadow.js":
/*!*******************************!*\
  !*** ./src/shadows/Shadow.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _ShadowMaskFilter = __webpack_require__(/*! ./filters/ShadowMaskFilter */ "./src/shadows/filters/ShadowMaskFilter.js");

var _ShadowMaskFilter2 = _interopRequireDefault(_ShadowMaskFilter);

var _ShadowMapFilter = __webpack_require__(/*! ./filters/ShadowMapFilter */ "./src/shadows/filters/ShadowMapFilter.js");

var _ShadowMapFilter2 = _interopRequireDefault(_ShadowMapFilter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @class
 * @memberof PIXI.shadows
 *
 * @param range {number} The radius of the lit area in pixels.
 * @param [intensity=1] {number} The opacity of the lit area.
 * @param [pointCount=20] {number} The number of points that makes up this light.
 * @param [scatterRange=15] {number} The radius at which the points of the light should be scattered.
 */

var Shadow = function (_PIXI$Sprite) {
    _inherits(Shadow, _PIXI$Sprite);

    function Shadow(range, intensity, pointCount, scatterRange) {
        _classCallCheck(this, Shadow);

        var _this = _possibleConstructorReturn(this, (Shadow.__proto__ || Object.getPrototypeOf(Shadow)).call(this, PIXI.RenderTexture.create(range * 2, range * 2)));

        _this._range = range;
        _this._pointCount = pointCount || 20; //The number of lightpoins
        _this._scatterRange = scatterRange || (_this._pointCount == 1 ? 0 : 15);
        _this._intensity = intensity || 1;
        _this._radialResolution = 800;
        _this._depthResolution = 1; //per screen pixel
        _this._darkenOverlay = false;
        _this._overlayLightLength = Infinity;
        _this.anchor.set(0.5);

        _this._ignoreShadowCaster;

        _this.__createShadowMapSources();
        return _this;
    }
    // Create the texture to apply this mask filter to


    _createClass(Shadow, [{
        key: "__updateTextureSize",
        value: function __updateTextureSize() {
            this.texture.destroy();
            this.texture = PIXI.RenderTexture.create(this._range * 2, this._range * 2);
        }
        // Create the resources that create the shadow map

    }, {
        key: "__createShadowMapSources",
        value: function __createShadowMapSources() {
            if (this._shadowMapSprite) this._shadowMapSprite.destroy();
            if (this._shadowMapResultSprite) this._shadowMapResultSprite.destroy();
            if (this._shadowMapResultTexture) this._shadowMapResultTexture.destroy();

            // A blank texture/sprite to apply the filter to
            this._shadowMapResultTexture = PIXI.RenderTexture.create(this._radialResolution, this._pointCount);
            this._shadowMapResultTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            this._shadowMapSprite = new PIXI.Sprite(this._shadowMapResultTexture);
            this._shadowMapSprite.filters = [new _ShadowMapFilter2.default(this)];

            // The resulting texture/sprite after the filter has been applied
            this._shadowMapResultSprite = new PIXI.Sprite(this._shadowMapResultTexture);

            // Create the mask filter
            var filter = new _ShadowMaskFilter2.default(this);
            filter.blendMode = PIXI.BLEND_MODES.ADD;
            this.shadowFilter = filter;
            this.filters = [filter];
        }
        // Properly dispose all the created resources

    }, {
        key: "destroy",
        value: function destroy() {
            if (this._shadowMapSprite) this._shadowMapSprite.destroy();
            if (this._shadowMapResultSprite) this._shadowMapResultSprite.destroy();
            if (this._shadowMapResultTexture) this._shadowMapResultTexture.destroy();
            this.texture.destroy();
            return _get(Shadow.prototype.__proto__ || Object.getPrototypeOf(Shadow.prototype), "destroy", this).call(this);
        }
        // Don't render this sprite unless we are in the dedicated render step called by the shadow filter

    }, {
        key: "renderAdvancedWebGL",
        value: function renderAdvancedWebGL(renderer) {
            if (this.renderStep) _get(Shadow.prototype.__proto__ || Object.getPrototypeOf(Shadow.prototype), "renderAdvancedWebGL", this).call(this, renderer);
        }

        // Update the map to create the mask from

    }, {
        key: "update",
        value: function update(renderer, shadowCasterSprite, shadowOverlaySprite) {
            this._shadowCasterSprite = shadowCasterSprite;
            this._shadowOverlaySprite = shadowOverlaySprite;
            renderer.render(this._shadowMapSprite, this._shadowMapResultTexture, true, null, true);
        }

        // Attribute setters
        /**
         * @type {number} The radius of the lit area in pixels.
         */

    }, {
        key: "range",
        set: function set(range) {
            this._range = range;
            this.__updateTextureSize();
        }
        /**
         * @type {number} The number of points that makes up this light, for soft shadows. (More points = softer shadow edges + more intensive).
         */
        ,


        // Attribute getters
        get: function get() {
            return this._range;
        }
    }, {
        key: "pointCount",
        set: function set(count) {
            this._pointCount = count;
            this.__createShadowMapSources();
        }
        /**
         * @type {number} The opacity of the lit area. (may exceed 1).
         */
        ,
        get: function get() {
            return this._pointCount;
        }
    }, {
        key: "scatterRange",
        set: function set(range) {
            this._scatterRange = range;
        }
        /**
         * @type {number} The radius at which the points of the light should be scattered. (Greater range = software shadow).
         */
        ,
        get: function get() {
            return this._scatterRange;
        }
    }, {
        key: "intensity",
        set: function set(intensity) {
            this._intensity = intensity;
        }
        /**
         * @type {number} The number of rays to draw for the light. (Higher resolution = more precise edges + more intensive).
         */
        ,
        get: function get() {
            return this._intensity;
        }
    }, {
        key: "radialResolution",
        set: function set(resolution) {
            this._radialResolution = resolution;
            this.__createShadowMapSources();
        }
        /**
         * @type {number} The of steps to take per pixel. (Higher resolution = more precise edges + more intensive).
         */
        ,
        get: function get() {
            return this._radialResolution;
        }
    }, {
        key: "depthResolution",
        set: function set(resolution) {
            this._depthResolution = resolution;
        }
        /**
         * @type {PIXI.Sprite} A shadow caster to ignore while creating the shadows. (Can be used if sprite and light always overlap).
         */
        ,
        get: function get() {
            return this._depthResolution;
        }
    }, {
        key: "ignoreShadowCaster",
        set: function set(sprite) {
            this._ignoreShadowCaster = sprite;
        }
        /**
         * @type {boolean} Whther or not overlays in shadows should become darker (can create odd artifacts, is very experimental/unfinished)
         */
        ,
        get: function get() {
            return this._ignoreShadowCaster;
        }
    }, {
        key: "darkenOverlay",
        set: function set(bool) {
            this._darkenOverlay = bool;
        }
        /**
         * @type {number} How many pixels of the overlay should be lit up by the light
         */
        ,
        get: function get() {
            return this._darkenOverlay;
        }
    }, {
        key: "overlayLightLength",
        set: function set(length) {
            this._overlayLightLength = length;
        },
        get: function get() {
            return this._overlayLightLength;
        }
    }]);

    return Shadow;
}(PIXI.Sprite);

exports.default = Shadow;

/***/ }),

/***/ "./src/shadows/filters/FilterFuncs.js":
/*!********************************************!*\
  !*** ./src/shadows/filters/FilterFuncs.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
// Some functions to map a value as a color
var filterFuncs = exports.filterFuncs = "\nfloat colorToFloat(vec4 color){\n    return (color.r + (color.g + color.b * 256.0) * 256.0) * 255.0 - 8388608.0;\n}\nvec4 floatToColor(float f){\n    f += 8388608.0;\n    vec4 color;\n    color.a = 255.0;\n    color.b = floor(f / 256.0 / 256.0);\n    color.g = floor((f - color.b * 256.0 * 256.0) / 256.0);\n    color.r = floor(f - color.b * 256.0 * 256.0 - color.g * 256.0);\n    return color / 255.0;\n}\n";

/***/ }),

/***/ "./src/shadows/filters/ShadowFilter.js":
/*!*********************************************!*\
  !*** ./src/shadows/filters/ShadowFilter.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ShadowFilter = function (_PIXI$Filter) {
    _inherits(ShadowFilter, _PIXI$Filter);

    function ShadowFilter(width, height) {
        _classCallCheck(this, ShadowFilter);

        var _this = _possibleConstructorReturn(this, (ShadowFilter.__proto__ || Object.getPrototypeOf(ShadowFilter)).call(this, "\n            attribute vec2 aVertexPosition;\n            attribute vec2 aTextureCoord;\n            \n            uniform mat3 projectionMatrix;\n            uniform mat3 otherMatrix;\n            \n            varying vec2 vMaskCoord;\n            varying vec2 vTextureCoord;\n            \n            void main(void)\n            {\n                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n            \n                vTextureCoord = aTextureCoord;\n                vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;\n            }\n        ", "                    \n            varying vec2 vMaskCoord;\n            varying vec2 vTextureCoord;\n            \n            uniform sampler2D uSampler;\n            uniform sampler2D mask;\n            uniform vec4 maskClamp;\n            uniform float ambientLight;\n            \n            void main(void){            \n                vec4 original = texture2D(uSampler, vTextureCoord);\n                vec4 masky = texture2D(mask, vMaskCoord);\n            \n                original *= ambientLight + (1.0 - ambientLight) * (masky.r + masky.g + masky.b) / 3.0;\n            \n                gl_FragColor = original;\n            }\n        "));

        _this._width = width;
        _this._height = height;
        _this.tick = 0;

        _this.uniforms.ambientLight = 0.0;
        _this.uniforms.size = [_this._width, _this._height];
        _this._useShadowCastersAsOverlay = true;

        _this.__createCasterSources();
        _this.__createOverlaySources();
        _this.__createMaskSources();
        return _this;
    }
    // Shadow overlay objects


    _createClass(ShadowFilter, [{
        key: "__createOverlaySources",
        value: function __createOverlaySources() {
            if (this._shadowOverlayResultTexture) this._shadowOverlayResultTexture.destroy();
            if (this._shadowOverlayResultSprite) this._shadowOverlayResultSprite.destroy();

            if (!this._shadowOverlayContainer) this._shadowOverlayContainer = new PIXI.Container();

            // Create the final mask to apply to the container that this filter is applied to
            this._shadowOverlayResultTexture = PIXI.RenderTexture.create(this._width, this._height);
            this._shadowOverlayResultTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            this._shadowOverlayResultSprite = new PIXI.Sprite(this._shadowOverlayResultTexture);
        }
        // Shadow caster objects

    }, {
        key: "__createCasterSources",
        value: function __createCasterSources() {
            if (this._shadowCasterResultTexture) this._shadowCasterResultTexture.destroy();
            if (this._shadowCasterResultSprite) this._shadowCasterResultSprite.destroy();

            if (!this._shadowCasterContainer) this._shadowCasterContainer = new PIXI.Container();

            // Create the final mask to apply to the container that this filter is applied to
            this._shadowCasterResultTexture = PIXI.RenderTexture.create(this._width, this._height);
            this._shadowCasterResultTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            this._shadowCasterResultSprite = new PIXI.Sprite(this._shadowCasterResultTexture);
        }
        // Final mask to apply as a filter

    }, {
        key: "__createMaskSources",
        value: function __createMaskSources() {
            if (this._maskResultTexture) this._maskResultTexture.destroy();
            if (this._maskResultSprite) this._maskResultSprite.destroy();

            // Create maskMatrix for shader transform data
            if (!this._maskMatrix) this._maskMatrix = new PIXI.Matrix();

            // Create the final mask to apply to the container that this filter is applied to
            this._maskResultTexture = PIXI.RenderTexture.create(this._width, this._height);
            this._maskResultTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            if (!this._maskContainer) this._maskContainer = new PIXI.Container();
            this._maskResultSprite = new PIXI.Sprite(this._maskResultTexture);
        }
        // Update the mask texture (called from the Application mixin)

    }, {
        key: "update",
        value: function update(renderer) {
            var _this2 = this;

            // Shadows and objects will automatically be added to containers because of the Container mixin

            this.tick++; // Increase the tick so that shadows and objects know they can add themselves to the container again in their next update

            /* render shadow casters */
            // Remove the parent layer from the objects in order to properly render it to the container
            this._shadowCasterContainer.children.forEach(function (child) {
                child._activeParentLayer = null;
            });

            // Render all the objects onto 1 texture
            renderer.render(this._shadowCasterContainer, this._shadowCasterResultTexture, true, null, true);

            // Remove all the objects from the container
            this._shadowCasterContainer.children.length = 0;

            /* render shadow overlays */
            if (!this._useShadowCastersAsOverlay) {
                this._shadowOverlayContainer.children.forEach(function (child) {
                    child._activeParentLayer = null;
                });

                // Render all the objects onto 1 texture
                renderer.render(this._shadowOverlayContainer, this._shadowOverlayResultTexture, true, null, true);

                // Remove all the objects from the container
                this._shadowOverlayContainer.children.length = 0;
            }

            /* render shadows */

            // Update all shadows and indicate that they may properly be rendered now
            var overlay = this._useShadowCastersAsOverlay ? this._shadowCasterResultSprite : this._shadowOverlayResultSprite;
            this._maskContainer.children.forEach(function (shadow) {
                shadow.renderStep = true;
                shadow.update(renderer, _this2._shadowCasterResultSprite, overlay);
            });

            // Render all the final shadow masks onto 1 texture
            renderer.render(this._maskContainer, this._maskResultTexture, true, null, true);

            // Indicate that the shadows may no longer render
            this._maskContainer.children.forEach(function (shadow) {
                delete shadow.renderStep;
            });

            // Remove all the shadows from the container
            this._maskContainer.children.length = 0;
        }

        //  Apply the filter to a container

    }, {
        key: "apply",
        value: function apply(filterManager, input, output) {
            // Filter almost directly taken from the pixi mask filter
            var maskSprite = this._maskResultSprite;
            var tex = this._maskResultSprite.texture;

            if (!tex.valid) {
                return;
            }
            if (!tex.transform) {
                tex.transform = new PIXI.TextureMatrix(tex, 0.0);
            }

            this.uniforms.mask = tex;
            this.uniforms.otherMatrix = filterManager.calculateSpriteMatrix(this._maskMatrix, maskSprite);

            filterManager.applyFilter(this, input, output);
        }

        // Attribute setters
        /**
         * @type {number} The brightness that unlit areas of the world should have
         */

    }, {
        key: "ambientLight",
        set: function set(frac) {
            this.uniforms.ambientLight = frac;
        }
        /**
         * @type {number} The width of your application
         */
        ,


        // Attribute getters
        get: function get() {
            return this.uniforms.ambientLight;
        }
    }, {
        key: "width",
        set: function set(width) {
            this._width = width;

            this.uniforms.size = [this._width, this._height];
            this.__createOverlaySources();
            this.__createCasterSources();
            this.__createMaskSources();
        }
        /**
         * @type {number} The height of your application
         */
        ,
        get: function get() {
            return this._width;
        }
    }, {
        key: "height",
        set: function set(height) {
            this._height = height;

            this.uniforms.size = [this._width, this._height];
            this.__createOverlaySources();
            this.__createCasterSources();
            this.__createMaskSources();
        }
        /**
         * @type {boolean} Whether or not to use shadow casters as shadow overlays as well
         */
        ,
        get: function get() {
            return this._height;
        }
    }, {
        key: "useShadowCasterAsOverlay",
        set: function set(val) {
            this._useShadowCastersAsOverlay = val;
        },
        get: function get() {
            return this._useShadowCastersAsOverlay;
        }
    }]);

    return ShadowFilter;
}(PIXI.Filter);

exports.default = ShadowFilter;

/***/ }),

/***/ "./src/shadows/filters/ShadowMapFilter.js":
/*!************************************************!*\
  !*** ./src/shadows/filters/ShadowMapFilter.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _FilterFuncs = __webpack_require__(/*! ./FilterFuncs */ "./src/shadows/filters/FilterFuncs.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var maxDepthResolution = "2000.0";

var ShadowMapFilter = function (_PIXI$Filter) {
    _inherits(ShadowMapFilter, _PIXI$Filter);

    function ShadowMapFilter(shadow) {
        _classCallCheck(this, ShadowMapFilter);

        var _this = _possibleConstructorReturn(this, (ShadowMapFilter.__proto__ || Object.getPrototypeOf(ShadowMapFilter)).call(this, "\n            attribute vec2 aVertexPosition;\n            attribute vec2 aTextureCoord;\n            \n            uniform mat3 projectionMatrix;\n            uniform mat3 filterMatrix;\n            \n            varying vec2 vTextureCoord;\n            varying vec2 vFilterCoord;\n            \n            void main(void){\n                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n                vTextureCoord = aTextureCoord;\n            }\n        ", "\n            varying vec2 vMaskCoord;\n            varying vec2 vTextureCoord;\n            uniform vec4 filterArea;\n            \n            uniform sampler2D shadowCasterSampler;\n            uniform vec2 shadowCasterSpriteDimensions;\n\n            uniform bool hasIgnoreShadowCaster;\n            uniform sampler2D ignoreShadowCasterSampler;\n            uniform mat3 ignoreShadowCasterMatrix;\n            uniform vec2 ignoreShadowCasterDimensions;\n\n            uniform float lightRange;\n            uniform float lightScatterRange;\n            uniform vec2 lightLoc;\n\n            uniform float depthResolution;\n            uniform bool darkenOverlay;\n\n            uniform vec2 dimensions;\n\n            " + _FilterFuncs.filterFuncs + "\n            \n            void main(void){\n                float pi = 3.141592653589793238462643;\n                \n                // Cap the depthResolution (as I expect performance loss by having a big value, but I am not sure)\n                float depthRes = min(" + maxDepthResolution + ", depthResolution);\n\n                // The current coordinate on the texutre measured in pixels, as well as a fraction\n                vec2 pixelCoord = vTextureCoord * filterArea.xy;\n                vec2 normalizedCoord = pixelCoord / dimensions;\n                \n                // Extract the components of the normalized coordinate\n                float x = normalizedCoord.x;\n                float y = normalizedCoord.y;\n\n                // Calculate the offset of the lightPoint we are currently at\n                float offsetAngle = 2.0 * pi * y;\n                vec2 offset = vec2(cos(offsetAngle), sin(offsetAngle)) * lightScatterRange;\n\n                // Calculate the angle at which we are ray tracing\n                float angle = x * pi * 2.0;\n\n                // The distance at which we hit an object\n                float hitDistancePer = 1.0;\n\n                // Increase the distance until we hit an object or reach the maximum value\n                bool reached = false;\n                for(float dist=0.0; dist < " + maxDepthResolution + "; dist+=1.0){\n                    if(dist > depthRes) break;\n                    \n                    // Calculate the actual distance in pixel units, and use it to calculate the pixel coordinate to inspect\n                    float distance = dist / depthRes * lightRange;\n                    vec2 coord = lightLoc + offset + vec2(cos(angle), sin(angle)) * distance;\n                \n                    // Extract the pixel and check if it is opaque\n                    float opacity = texture2D(shadowCasterSampler, coord / shadowCasterSpriteDimensions).a;\n                    if((opacity > 0.0 && darkenOverlay) || opacity > 0.5){\n                        // Check if it isn't hitting something that should be ignore\n                        if(hasIgnoreShadowCaster){ \n                            vec2 l = (ignoreShadowCasterMatrix * vec3(coord, 1.0)).xy / ignoreShadowCasterDimensions;\n                            if(l.x >= -0.01 && l.x <= 1.01 && l.y >= -0.01 && l.y <= 1.01){\n                                // If the pixel at the ignoreShadowCaster is opaque here, skip this pixel\n                                if(opacity > 0.0){\n                                    continue;\n                                }\n                            }\n                        }\n\n                        // Calculate the percentage at which this hit occurred, and stop the loop\n                        if(!darkenOverlay){\n                            hitDistancePer = distance / lightRange;\n                            break;\n                        }\n                        reached = true;\n                    }else if(reached){\n                        hitDistancePer = (distance - 1.0) / lightRange;\n                        break;\n                    }\n                }\n\n                // Express the distance as a color in the map\n                gl_FragColor = floatToColor(hitDistancePer * 100000.0);\n            }\n        "));

        _this.uniforms.lightPointCount = shadow.pointCount;

        _this.uniforms.dimensions = [shadow.radialResolution, shadow.pointCount];
        _this.shadow = shadow;

        _this.autoFit = false;
        _this.padding = 0;

        _this.ignoreShadowCasterMatrix = new PIXI.Matrix();
        return _this;
    }

    _createClass(ShadowMapFilter, [{
        key: "apply",
        value: function apply(filterManager, input, output) {
            // Decide whether or not to darken the overlays
            this.uniforms.darkenOverlay = this.shadow._darkenOverlay;

            // Attach the object sampler
            var sc = this.shadow._shadowCasterSprite;
            this.uniforms.shadowCasterSpriteDimensions = [sc.width, sc.height];
            this.uniforms.shadowCasterSampler = sc._texture;

            // Use the world transform (data about the absolute location on the screen) to determine the lights relation to the objectSampler
            var wt = this.shadow.worldTransform;
            var scale = Math.sqrt(wt.a * wt.a + wt.b * wt.b);
            var range = this.shadow.range * scale;
            this.uniforms.lightRange = range;
            this.uniforms.lightScatterRange = this.shadow.scatterRange;
            this.uniforms.lightLoc = [wt.tx, wt.ty];
            this.uniforms.depthResolution = range * this.shadow.depthResolution;

            // Check if there is an object that the filter should attempt to ignore
            var isc = this.shadow.ignoreShadowCaster;
            this.uniforms.hasIgnoreShadowCaster = !!isc;
            if (isc) {
                // Calculate the tranform matrix in order to access the proper pixel of the ignoreObject
                isc.worldTransform.copy(this.ignoreShadowCasterMatrix);
                this.uniforms.ignoreShadowCasterMatrix = this.ignoreShadowCasterMatrix.invert();

                // Attach the ignore object
                this.uniforms.ignoreShadowCasterDimensions = [isc.width, isc.height];
                this.uniforms.ignoreShadowCasterSampler = isc._texture;
            }

            // Apply the filter
            filterManager.applyFilter(this, input, output);
        }
    }]);

    return ShadowMapFilter;
}(PIXI.Filter);

exports.default = ShadowMapFilter;

/***/ }),

/***/ "./src/shadows/filters/ShadowMaskFilter.js":
/*!*************************************************!*\
  !*** ./src/shadows/filters/ShadowMaskFilter.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _FilterFuncs = __webpack_require__(/*! ./FilterFuncs */ "./src/shadows/filters/FilterFuncs.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ShadowMaskFilter = function (_PIXI$Filter) {
    _inherits(ShadowMaskFilter, _PIXI$Filter);

    function ShadowMaskFilter(shadow) {
        _classCallCheck(this, ShadowMaskFilter);

        var _this = _possibleConstructorReturn(this, (ShadowMaskFilter.__proto__ || Object.getPrototypeOf(ShadowMaskFilter)).call(this, "\n            attribute vec2 aVertexPosition;\n            attribute vec2 aTextureCoord;\n            \n            uniform mat3 projectionMatrix;\n            uniform mat3 overlayMatrix;\n            uniform mat3 filterMatrix;\n            \n            varying vec2 vTextureCoord;\n            varying vec2 vOverlayCoord;\n            varying vec2 vFilterCoord;\n            \n            void main(void){\n                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n                vTextureCoord = aTextureCoord;\n                vOverlayCoord = (overlayMatrix * vec3(aTextureCoord, 1.0) ).xy;\n            }\n        ", "\n            varying vec2 vOverlayCoord;\n            varying vec2 vTextureCoord;\n            uniform vec4 filterArea;\n            \n            uniform sampler2D shadowOverlaySampler;\n\n            uniform vec2 dimensions;\n\n            uniform sampler2D shadowSampler;\n\n            uniform bool darkenOverlay;\n            uniform bool inverted;\n\n            uniform float overlayLightLength;\n\n            uniform float lightPointCount;\n            uniform float lightRange;\n            uniform float lightScatterRange;\n            uniform float lightIntensity;\n\n            " + _FilterFuncs.filterFuncs + "\n            \n            void main(void){\n                float pi = 3.141592653589793238462643;\n                \n                // The current coordinate on the texture measured in pixels\n                vec2 pixelCoord = vTextureCoord * filterArea.xy;\n\n                // The distance delta relative to the center\n                vec2 lightDelta = pixelCoord - dimensions / 2.0;\n                float distance = sqrt(lightDelta.x * lightDelta.x + lightDelta.y * lightDelta.y);\n                if (distance > lightRange) return;\n\n                // The final intensity of the light at this pixel\n                float totalIntensity = 0.0;\n\n                // The intensity of the pixel in the overlay map at this pixel\n                vec4 overlayPixel = texture2D(shadowOverlaySampler, vOverlayCoord);\n\n                // Go through all light points (at most 1000) to add them to the intensity\n                for(float lightIndex=0.0; lightIndex<1000.0; lightIndex++){\n                    if (lightIndex >= lightPointCount) break; // Stop the loop if we went over the pointCount\n\n                    // Calculate the offset of this lightPoint, relative the the center of the light\n                    float lightIndexFrac = (lightIndex + 0.5) / lightPointCount;\n                    float offsetAngle = 2.0 * pi * lightIndexFrac;\n                    vec2 offset = vec2(cos(offsetAngle), sin(offsetAngle)) * lightScatterRange;\n\n                    // Calculate the location of this pixel relative to the lightPoint, and check the depth map\n                    vec2 pointDelta = lightDelta - offset;\n                    float pointDistance = sqrt(pointDelta.x * pointDelta.x + pointDelta.y * pointDelta.y);\n                    float angle = mod(atan(pointDelta.y, pointDelta.x) + 2.0 * pi, 2.0 * pi);\n                    vec4 depthPixel = texture2D(shadowSampler, vec2(angle / (2.0 * pi), lightIndexFrac));\n\n                    // Extract the object distance from the depth map pixel\n                    float objectDistance = colorToFloat(depthPixel) / 100000.0 * lightRange;\n                    \n                    // Calculate the intensity of this pixel based on the overlaySampler and objectDistance\n                    float intensity = 0.0;\n                    if(darkenOverlay){\n                        if(objectDistance > pointDistance || objectDistance >= lightRange){\n                            intensity = 1.0 - distance / lightRange;\n                        }else if(overlayPixel.a > 0.5){\n                            intensity = 1.0 - distance / lightRange;\n                            intensity *= pow(1.0 - (distance - objectDistance) / (lightRange - objectDistance), 2.5) * overlayPixel.a;\n                        }\n                    }else{\n                        if(inverted){\n                            if(overlayPixel.a > 0.5){\n                                intensity = 1.0-overlayPixel.a;\n                            }else if (objectDistance > pointDistance || objectDistance >= lightRange) {\n                                intensity = 0.0;\n                            }else{\n                                intensity = 1.0;\n                            }\n                        }else{\n                            if (objectDistance > pointDistance || objectDistance >= lightRange) {\n                                intensity = 1.0 - distance / lightRange;\n                            }else if (overlayPixel.a > 0.5) {\n                                intensity = (1.0 - distance / lightRange) * (1.0 - (pointDistance - objectDistance) / overlayLightLength);\n                            }\n                        }\n                    }\n                    \n\n                    // Add the intensity to the total intensity\n                    totalIntensity += intensity / lightPointCount;\n                }\n\n                // Create a mask based on the intensity\n                gl_FragColor = vec4(vec3(lightIntensity * totalIntensity), 1.0);\n            }\n        "));

        _this.uniforms.shadowSampler = shadow._shadowMapResultTexture;
        _this.uniforms.lightPointCount = shadow._pointCount;

        _this.shadow = shadow;
        _this._inverted = false;

        _this.autoFit = false;
        _this.padding = 0;
        _this.overlayMatrix = new PIXI.Matrix();
        return _this;
    }

    _createClass(ShadowMaskFilter, [{
        key: "apply",
        value: function apply(filterManager, input, output) {
            // Decide whether or not to darken the overlays
            this.uniforms.darkenOverlay = this.shadow._darkenOverlay;

            // Attach the object sampler
            var sc = this.shadow._shadowOverlaySprite;
            this.uniforms.shadowOverlaySpriteDimensions = [sc.width, sc.height];
            this.uniforms.shadowOverlaySampler = sc._texture;

            // Use the world transform (data about the absolute location on the screen) to determine the lights relation to the objectSampler
            var wt = this.shadow.worldTransform;
            var scale = Math.sqrt(wt.a * wt.a + wt.b * wt.b);
            var range = this.shadow.range * scale;
            this.uniforms.lightRange = range;
            this.uniforms.lightScatterRange = this.shadow.scatterRange;
            this.uniforms.lightIntensity = this.shadow.intensity;

            // The length of the area of the overlay to be lit
            this.uniforms.overlayLightLength = this.shadow.overlayLightLength;

            // Invert the filter if specified
            this.uniforms.inverted = this._inverted;

            // Texture size increase in order to fit the sprite rectangle (even though we are only interested in a circle)
            // So we have to consider this in the texture size
            var texSize = 2 * this.shadow.range * (wt.a + wt.b);
            this.uniforms.dimensions = [texSize, texSize];

            // Calculate the object sampler position in relation to the light
            this.uniforms.overlayMatrix = filterManager.calculateSpriteMatrix(this.overlayMatrix, sc);

            // Apply the filter
            filterManager.applyFilter(this, input, output);
        }
    }]);

    return ShadowMaskFilter;
}(PIXI.Filter);

exports.default = ShadowMaskFilter;

/***/ }),

/***/ "./src/shadows/index.js":
/*!******************************!*\
  !*** ./src/shadows/index.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
        value: true
});

var _Container = __webpack_require__(/*! ./mixins/Container */ "./src/shadows/mixins/Container.js");

var _Container2 = _interopRequireDefault(_Container);

var _Application = __webpack_require__(/*! ./mixins/Application */ "./src/shadows/mixins/Application.js");

var _Application2 = _interopRequireDefault(_Application);

var _ShadowFilter = __webpack_require__(/*! ./filters/ShadowFilter */ "./src/shadows/filters/ShadowFilter.js");

var _ShadowFilter2 = _interopRequireDefault(_ShadowFilter);

var _ShadowMapFilter = __webpack_require__(/*! ./filters/ShadowMapFilter */ "./src/shadows/filters/ShadowMapFilter.js");

var _ShadowMapFilter2 = _interopRequireDefault(_ShadowMapFilter);

var _ShadowMaskFilter = __webpack_require__(/*! ./filters/ShadowMaskFilter */ "./src/shadows/filters/ShadowMaskFilter.js");

var _ShadowMaskFilter2 = _interopRequireDefault(_ShadowMaskFilter);

var _FilterFuncs = __webpack_require__(/*! ./filters/FilterFuncs */ "./src/shadows/filters/FilterFuncs.js");

var _FilterFuncs2 = _interopRequireDefault(_FilterFuncs);

var _Shadow = __webpack_require__(/*! ./Shadow */ "./src/shadows/Shadow.js");

var _Shadow2 = _interopRequireDefault(_Shadow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

PIXI.shadows = {
        init: function init(application) {
                // The objects that will cast shadows
                this.casterGroup = new PIXI.display.Group();
                this.casterLayer = new PIXI.display.Layer(this.casterGroup);

                // The objects that will remain ontop of the shadows
                this.overlayGroup = new PIXI.display.Group();
                this.overlayLayer = new PIXI.display.Layer(this.overlayGroup);

                // Make sure the caster objects aren't actually visible
                this.casterLayer.renderWebGL = function () {};
                this.overlayLayer.renderWebGL = function () {};

                // Create the shadow filter
                this.filter = new _ShadowFilter2.default(application.renderer.width, application.renderer.height);

                // Set up the container mixin so that it tells the filter about the available shadows and objects
                (0, _Container2.default)(this.casterGroup, this.overlayGroup, this.filter);

                // Overwrite the application render method
                (0, _Application2.default)(application, this.filter);

                // If a container is specified, set up the filter
                var container = new PIXI.Container();
                application.stage.addChild(container);

                // Set up the shadow layers
                application.stage.addChild(this.casterLayer, this.overlayLayer);

                // Set up pixi lights if available
                if (PIXI.lights) {
                        // Set up pixi-light's layers
                        this.diffuseLayer = new PIXI.display.Layer(PIXI.lights.diffuseGroup);
                        this.normalLayer = new PIXI.display.Layer(PIXI.lights.normalGroup);
                        this.lightLayer = new PIXI.display.Layer(PIXI.lights.lightGroup);
                        var diffuseBlackSprite = new PIXI.Sprite(this.diffuseLayer.getRenderTexture());
                        diffuseBlackSprite.tint = 0;

                        application.stage.addChild(this.diffuseLayer, diffuseBlackSprite, this.normalLayer, this.lightLayer);

                        // Add the shadow filter to the diffuse layer
                        this.diffuseLayer.filters = [this.filter];
                } else {

                        // Add the shadow filter to the container
                        container.filters = [this.filter];
                }

                // Rreturn the container to use
                return container;
        },
        Shadow: _Shadow2.default,

        // Making all classes available for if you want to augmnent this code without going into the source and properly building things afterwards
        __classes: {
                ContainerSetup: _Container2.default,
                ApplicationSetup: _Application2.default,
                ShadowFilter: _ShadowFilter2.default,
                ShadowMapFilter: _ShadowMapFilter2.default,
                ShadowMaskFilter: _ShadowMaskFilter2.default,
                FilterFuncs: _FilterFuncs2.default,
                Shadow: _Shadow2.default
        }
};
exports.default = PIXI.shadows;

/***/ }),

/***/ "./src/shadows/mixins/Application.js":
/*!*******************************************!*\
  !*** ./src/shadows/mixins/Application.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = augment;
function augment(application, shadowFilter) {
    // Replace the stage with a layered stage
    application.stage = new PIXI.display.Stage();

    // Remove the current render fucntion
    application.ticker.remove(application.render, application);

    // Overwrite the render function
    application.render = function () {
        // Update stage transforms
        var cacheParent = this.stage.parent;
        this.stage.parent = this.renderer._tempDisplayObjectParent;
        this.stage.updateTransform();
        this.stage.parent = cacheParent;

        // Update the shadow filter
        shadowFilter.update(this.renderer);

        // Render the stage without updating the transforms again
        this.renderer.render(this.stage, undefined, undefined, undefined, true);
    };

    // Reassign ticker because its setter initialises the render method
    application.ticker = application.ticker;
}

/***/ }),

/***/ "./src/shadows/mixins/Container.js":
/*!*****************************************!*\
  !*** ./src/shadows/mixins/Container.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = setup;

var _Shadow = __webpack_require__(/*! ../Shadow */ "./src/shadows/Shadow.js");

var _Shadow2 = _interopRequireDefault(_Shadow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setup(shadowCasterGroup, shadowOverlayGroup, shadowFilter) {
    var orTransform = PIXI.Container.prototype.updateTransform;
    PIXI.Container.prototype.updateTransform = function () {

        if (this.parentGroup == shadowCasterGroup) {
            if (this.tick != shadowFilter.tick) shadowFilter._shadowCasterContainer.children.push(this);
            this.tick = shadowFilter.tick;
        }

        if (this.parentGroup == shadowOverlayGroup) {
            if (this.tick != shadowFilter.tick) shadowFilter._shadowOverlayContainer.children.push(this);
            this.tick = shadowFilter.tick;
        }

        if (this instanceof _Shadow2.default) {
            if (this.tick != shadowFilter.tick) shadowFilter._maskContainer.children.push(this);
            this.tick = shadowFilter.tick;
        }

        return orTransform.apply(this, arguments);
    };
}

/***/ })

/******/ });
});
//# sourceMappingURL=pixi-shadows.js.map
