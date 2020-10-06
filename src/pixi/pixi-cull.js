
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    'use strict';
    
    PIXI.extras.cull = {
        Simple: require('./simple'),
        SpatialHash: require('./spatial-hash')
    };
    
    },{"./simple":2,"./spatial-hash":3}],2:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    // pixi-cull.SpatialHash
    // Copyright 2018 YOPEY YOPEY LLC
    // David Figatner
    // MIT License
    
    var Simple = function () {
        /**
         * creates a simple cull
         * @param {object} [options]
         * @param {boolean} [options.visible=visible] parameter of the object to set (usually visible or renderable)
         * @param {boolean} [options.calculatePIXI=true] calculate pixi.js bounding box automatically; if this is set to false then it uses object[options.AABB] for bounding box
         * @param {string} [options.dirtyTest=true] only update spatial hash for objects with object[options.dirtyTest]=true; this has a HUGE impact on performance
         * @param {string} [options.AABB=AABB] object property that holds bounding box so that object[type] = { x: number, y: number, width: number, height: number }; not needed if options.calculatePIXI=true
         */
        function Simple(options) {
            _classCallCheck(this, Simple);
    
            options = options || {};
            this.visible = options.visible || 'visible';
            this.calculatePIXI = typeof options.calculatePIXI !== 'undefined' ? options.calculatePIXI : true;
            this.dirtyTest = typeof options.dirtyTest !== 'undefined' ? options.dirtyTest : true;
            this.renderable = options.visible || 'renderable';
            this.AABB = options.AABB || 'AABB';
            this.dirty = options.dirty || 'dirty';
            this.lists = [[]];
        }
    
        /**
         * add an array of objects to be culled
         * @param {Array} array
         * @param {boolean} [staticObject] set to true if the object's position/size does not change
         * @return {Array} array
         */
    
    
        _createClass(Simple, [{
            key: 'addList',
            value: function addList(array, staticObject) {
                this.lists.push(array);
                if (staticObject) {
                    array.staticObject = true;
                }
                if (this.calculatePIXI && this.dirtyTest) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;
    
                    try {
                        for (var _iterator = array[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var object = _step.value;
    
                            this.updateObject(object);
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }
                }
                return array;
            }
    
            /**
             * remove an array added by addList()
             * @param {Array} array
             * @return {Array} array
             */
    
        }, {
            key: 'removeList',
            value: function removeList(array) {
                this.lists.splice(this.lists.indexOf(array), 1);
                return array;
            }
    
            /**
             * add an object to be culled
             * @param {*} object
             * @param {boolean} [staticObject] set to true if the object's position/size does not change
             * @return {*} object
             */
    
        }, {
            key: 'add',
            value: function add(object, staticObject) {
                if (staticObject) {
                    object.staticObject = true;
                }
                if (this.calculatePIXI && (this.dirtyTest || staticObject)) {
                    this.updateObject(object);
                }
                this.lists[0].push(object);
                return object;
            }
    
            /**
             * remove an object added by add()
             * @param {*} object
             * @return {*} object
             */
    
        }, {
            key: 'remove',
            value: function remove(object) {
                this.lists[0].splice(this.lists[0].indexOf(object), 1);
                return object;
            }
    
            /**
             * cull the items in the list by setting visible parameter
             * @param {object} bounds
             * @param {number} bounds.x
             * @param {number} bounds.y
             * @param {number} bounds.width
             * @param {number} bounds.height
             * @param {boolean} [skipUpdate] skip updating the AABB bounding box of all objects
             */
    
        }, {
            key: 'cull',
            value: function cull(bounds, skipUpdate) {
                if (this.calculatePIXI && !skipUpdate) {
                    this.updateObjects();
                }
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;
    
                try {
                    for (var _iterator2 = this.lists[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var list = _step2.value;
                        var _iteratorNormalCompletion3 = true;
                        var _didIteratorError3 = false;
                        var _iteratorError3 = undefined;
    
                        try {
                            for (var _iterator3 = list[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                var object = _step3.value;
                                try {
                                    if(!object.tileMap) {
                                        var box = object[this.AABB];
                                        object[this.visible] = box.x + box.width > bounds.x && box.x < bounds.x + bounds.width && box.y + box.height > bounds.y && box.y < bounds.y + bounds.height;
                                        object[this.renderable] = object[this.visible];
                                    }
                                }
                                catch(e){
                                }
                            }
                        } catch (err) {
                            _didIteratorError3 = true;
                            _iteratorError3 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                    _iterator3.return();
                                }
                            } finally {
                                if (_didIteratorError3) {
                                    throw _iteratorError3;
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }
    
            /**
             * update the AABB for all objects
             * automatically called from update() when calculatePIXI=true and skipUpdate=false
             */
    
        }, {
            key: 'updateObjects',
            value: function updateObjects() {
                if (this.dirtyTest) {
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;
    
                    try {
                        for (var _iterator4 = this.lists[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var list = _step4.value;
    
                            if (!list.staticObject) {
                                var _iteratorNormalCompletion5 = true;
                                var _didIteratorError5 = false;
                                var _iteratorError5 = undefined;
    
                                try {
                                    for (var _iterator5 = list[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                        var object = _step5.value;
    
                                        if (!object.staticObject && object[this.dirty]) {
                                            this.updateObject(object);
                                            object[this.dirty] = false;
                                        }
                                    }
                                } catch (err) {
                                    _didIteratorError5 = true;
                                    _iteratorError5 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                            _iterator5.return();
                                        }
                                    } finally {
                                        if (_didIteratorError5) {
                                            throw _iteratorError5;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        _didIteratorError4 = true;
                        _iteratorError4 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                _iterator4.return();
                            }
                        } finally {
                            if (_didIteratorError4) {
                                throw _iteratorError4;
                            }
                        }
                    }
                } else {
                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;
    
                    try {
                        for (var _iterator6 = this.lists[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                            var _list = _step6.value;
    
                            if (!_list.staticObject) {
                                var _iteratorNormalCompletion7 = true;
                                var _didIteratorError7 = false;
                                var _iteratorError7 = undefined;
    
                                try {
                                    for (var _iterator7 = _list[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                                        var _object = _step7.value;
    
                                        if (!_object.staticObject) {
                                            this.updateObject(_object);
                                        }
                                    }
                                } catch (err) {
                                    _didIteratorError7 = true;
                                    _iteratorError7 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion7 && _iterator7.return) {
                                            _iterator7.return();
                                        }
                                    } finally {
                                        if (_didIteratorError7) {
                                            throw _iteratorError7;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        _didIteratorError6 = true;
                        _iteratorError6 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                _iterator6.return();
                            }
                        } finally {
                            if (_didIteratorError6) {
                                throw _iteratorError6;
                            }
                        }
                    }
                }
            }
    
            /**
             * update the has of an object
             * automatically called from updateObjects()
             * @param {*} object
             */
    
        }, {
            key: 'updateObject',
            value: function updateObject(object) {
                var box = object.getLocalBounds();
                object[this.AABB] = object[this.AABB] || {};
                object[this.AABB].x = object.x + (box.x - object.pivot.x) * object.scale.x;
                object[this.AABB].y = object.y + (box.y - object.pivot.y) * object.scale.y;
                object[this.AABB].width = box.width * object.scale.x;
                object[this.AABB].height = box.height * object.scale.y;
            }
    
            /**
             * returns an array of objects contained within bounding box
             * @param {object} boudns bounding box to search
             * @param {number} bounds.x
             * @param {number} bounds.y
             * @param {number} bounds.width
             * @param {number} bounds.height
             * @return {object[]} search results
             */
    
        }, {
            key: 'query',
            value: function query(bounds) {
                var results = [];
                var _iteratorNormalCompletion8 = true;
                var _didIteratorError8 = false;
                var _iteratorError8 = undefined;
    
                try {
                    for (var _iterator8 = this.lists[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                        var list = _step8.value;
                        var _iteratorNormalCompletion9 = true;
                        var _didIteratorError9 = false;
                        var _iteratorError9 = undefined;
    
                        try {
                            for (var _iterator9 = list[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                                var object = _step9.value;
    
                                var box = object[this.AABB];
                                if (box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width && box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height) {
                                    results.push(object);
                                }
                            }
                        } catch (err) {
                            _didIteratorError9 = true;
                            _iteratorError9 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion9 && _iterator9.return) {
                                    _iterator9.return();
                                }
                            } finally {
                                if (_didIteratorError9) {
                                    throw _iteratorError9;
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError8 = true;
                    _iteratorError8 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion8 && _iterator8.return) {
                            _iterator8.return();
                        }
                    } finally {
                        if (_didIteratorError8) {
                            throw _iteratorError8;
                        }
                    }
                }
    
                return results;
            }
    
            /**
             * iterates through objects contained within bounding box
             * stops iterating if the callback returns true
             * @param {object} bounds bounding box to search
             * @param {number} bounds.x
             * @param {number} bounds.y
             * @param {number} bounds.width
             * @param {number} bounds.height
             * @param {function} callback
             * @return {boolean} true if callback returned early
             */
    
        }, {
            key: 'queryCallback',
            value: function queryCallback(bounds, callback) {
                var _iteratorNormalCompletion10 = true;
                var _didIteratorError10 = false;
                var _iteratorError10 = undefined;
    
                try {
                    for (var _iterator10 = this.lists[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                        var list = _step10.value;
                        var _iteratorNormalCompletion11 = true;
                        var _didIteratorError11 = false;
                        var _iteratorError11 = undefined;
    
                        try {
                            for (var _iterator11 = list[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                                var object = _step11.value;
    
                                var box = object[this.AABB];
                                if (box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width && box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height) {
                                    if (callback(object)) {
                                        return true;
                                    }
                                }
                            }
                        } catch (err) {
                            _didIteratorError11 = true;
                            _iteratorError11 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion11 && _iterator11.return) {
                                    _iterator11.return();
                                }
                            } finally {
                                if (_didIteratorError11) {
                                    throw _iteratorError11;
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError10 = true;
                    _iteratorError10 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion10 && _iterator10.return) {
                            _iterator10.return();
                        }
                    } finally {
                        if (_didIteratorError10) {
                            throw _iteratorError10;
                        }
                    }
                }
    
                return false;
            }
    
            /**
             * get stats (only updated after update() is called)
             * @return {SimpleStats}
             */
    
        }, {
            key: 'stats',
            value: function stats() {
                var visible = 0,
                    count = 0;
                var _iteratorNormalCompletion12 = true;
                var _didIteratorError12 = false;
                var _iteratorError12 = undefined;
    
                try {
                    for (var _iterator12 = this.lists[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                        var list = _step12.value;
    
                        list.forEach(function (object) {
                            visible += object.visible ? 1 : 0;
                            count++;
                        });
                    }
                } catch (err) {
                    _didIteratorError12 = true;
                    _iteratorError12 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion12 && _iterator12.return) {
                            _iterator12.return();
                        }
                    } finally {
                        if (_didIteratorError12) {
                            throw _iteratorError12;
                        }
                    }
                }
    
                return { total: count, visible: visible, culled: count - visible };
            }
        }]);
    
        return Simple;
    }();
    
    /**
     * @typedef {object} SimpleStats
     * @property {number} total
     * @property {number} visible
     * @property {number} culled
     */
    
    module.exports = Simple;
    
    },{}],3:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    // Copyright 2018 YOPEY YOPEY LLC
    // David Figatner
    // MIT License
    
    var SpatialHash = function () {
        /**
         * creates a spatial-hash cull
         * @param {object} [options]
         * @param {number} [options.size=1000] cell size used to create hash (xSize = ySize)
         * @param {number} [options.xSize] horizontal cell size
         * @param {number} [options.ySize] vertical cell size
         * @param {boolean} [options.calculatePIXI=true] calculate bounding box automatically; if this is set to false then it uses object[options.AABB] for bounding box
         * @param {boolean} [options.visible=visible] parameter of the object to set (usually visible or renderable)
         * @param {boolean} [options.simpleTest=true] iterate through visible buckets to check for bounds
         * @param {string} [options.dirtyTest=true] only update spatial hash for objects with object[options.dirtyTest]=true; this has a HUGE impact on performance
         * @param {string} [options.AABB=AABB] object property that holds bounding box so that object[type] = { x: number, y: number, width: number, height: number }
         * @param {string} [options.spatial=spatial] object property that holds object's hash list
         * @param {string} [options.dirty=dirty] object property for dirtyTest
         */
        function SpatialHash(options) {
            _classCallCheck(this, SpatialHash);
    
            options = options || {};
            this.xSize = options.xSize || options.size || 1000;
            this.ySize = options.ySize || options.size || 1000;
            this.AABB = options.type || 'AABB';
            this.spatial = options.spatial || 'spatial';
            this.calculatePIXI = typeof options.calculatePIXI !== 'undefined' ? options.calculatePIXI : true;
            this.visibleText = typeof options.visibleTest !== 'undefined' ? options.visibleTest : true;
            this.simpleTest = typeof options.simpleTest !== 'undefined' ? options.simpleTest : true;
            this.dirtyTest = typeof options.dirtyTest !== 'undefined' ? options.dirtyTest : true;
            this.visible = options.visible || 'visible';
            this.renderable = options.visible || 'renderable';
            this.dirty = options.dirty || 'dirty';
            this.width = this.height = 0;
            this.hash = {};
            this.objects = [];
            this.containers = [];
        }
    
        /**
         * add an object to be culled
         * side effect: adds object.spatialHashes to track existing hashes
         * @param {*} object
         * @param {boolean} [staticObject] set to true if the object's position/size does not change
         * @return {*} object
         */
    
    
        _createClass(SpatialHash, [{
            key: 'add',
            value: function add(object, staticObject) {
                object[this.spatial] = { hashes: [] };
                if (this.calculatePIXI && this.dirtyTest) {
                    object[this.dirty] = true;
                }
                if (staticObject) {
                    object.staticObject = true;
                }
                this.updateObject(object);
                this.containers[0].push(object);
            }
    
            /**
             * remove an object added by add()
             * @param {*} object
             * @return {*} object
             */
    
        }, {
            key: 'remove',
            value: function remove(object) {
                this.containers[0].splice(this.list[0].indexOf(object), 1);
                this.removeFromHash(object);
                return object;
            }
    
            /**
             * add an array of objects to be culled
             * @param {PIXI.Container} container
             * @param {boolean} [staticObject] set to true if the objects in the container's position/size do not change
             * note: this only works with pixi v5.0.0rc2+ because it relies on the new container events childAdded and childRemoved
             */
    
        }, {
            key: 'addContainer',
            value: function addContainer(container, staticObject) {
                var added = function (object) {
                    object[this.spatial] = { hashes: [] };
                    this.updateObject(object);
                }.bind(this);
    
                var removed = function (object) {
                    this.removeFromHash(object);
                }.bind(this);
    
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;
    
                try {
                    for (var _iterator = container.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var object = _step.value;
    
                        object[this.spatial] = { hashes: [] };
                        this.updateObject(object);
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
    
                container.cull = {};
                this.containers.push(container);
                container.on('childAdded', added);
                container.on('childRemoved', removed);
                container.cull.added = added;
                container.cull.removed = removed;
                if (staticObject) {
                    container.cull.static = true;
                }
            }
    
            /**
             * remove an array added by addContainer()
             * @param {PIXI.Container} container
             * @return {PIXI.Container} container
             */
    
        }, {
            key: 'removeContainer',
            value: function removeContainer(container) {
                var _this = this;
    
                this.containers.splice(this.containers.indexOf(container), 1);
                container.children.forEach(function (object) {
                    return _this.removeFromHash(object);
                });
                container.off('added', container.cull.added);
                container.off('removed', container.cull.removed);
                delete container.cull;
                return container;
            }
    
            /**
             * update the hashes and cull the items in the list
             * @param {AABB} AABB
             * @param {boolean} [skipUpdate] skip updating the hashes of all objects
             * @return {number} number of buckets in results
             */
    
        }, {
            key: 'cull',
            value: function cull(AABB, skipUpdate) {
                var _this2 = this;
    
                if (!skipUpdate) {
                    this.updateObjects();
                }
                this.invisible();
                var objects = this.query(AABB, this.simpleTest);
                objects.forEach(function (object) {
                    return object[_this2.visible] = true;
                });
                return this.lastBuckets;
            }
    
            /**
             * set all objects in hash to visible=false
             */
    
        }, {
            key: 'invisible',
            value: function invisible() {
                var _this3 = this;
    
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;
    
                try {
                    for (var _iterator2 = this.containers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var container = _step2.value;
    
                        container.children.forEach(function (object) {
                            return object[_this3.visible] = false;
                        });
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }
    
            /**
             * update the hashes for all objects
             * automatically called from update() when skipUpdate=false
             */
    
        }, {
            key: 'updateObjects',
            value: function updateObjects() {
                var _this4 = this;
    
                if (this.dirtyTest) {
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;
    
                    try {
                        for (var _iterator3 = this.objects[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var object = _step3.value;
    
                            if (object[this.dirty]) {
                                this.updateObject(object);
                                object[this.dirty] = false;
                            }
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                _iterator3.return();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
    
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;
    
                    try {
                        for (var _iterator4 = this.containers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var container = _step4.value;
                            var _iteratorNormalCompletion5 = true;
                            var _didIteratorError5 = false;
                            var _iteratorError5 = undefined;
    
                            try {
                                for (var _iterator5 = container.children[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                    var _object = _step5.value;
    
                                    if (_object[this.dirty]) {
                                        this.updateObject(_object);
                                        _object[this.dirty] = false;
                                    }
                                }
                            } catch (err) {
                                _didIteratorError5 = true;
                                _iteratorError5 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                        _iterator5.return();
                                    }
                                } finally {
                                    if (_didIteratorError5) {
                                        throw _iteratorError5;
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        _didIteratorError4 = true;
                        _iteratorError4 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                _iterator4.return();
                            }
                        } finally {
                            if (_didIteratorError4) {
                                throw _iteratorError4;
                            }
                        }
                    }
                } else {
                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;
    
                    try {
                        for (var _iterator6 = this.containers[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                            var _container = _step6.value;
    
                            if (!_container.cull.static) {
                                _container.children.forEach(function (object) {
                                    return _this4.updateObject(object);
                                });
                            }
                        }
                    } catch (err) {
                        _didIteratorError6 = true;
                        _iteratorError6 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                _iterator6.return();
                            }
                        } finally {
                            if (_didIteratorError6) {
                                throw _iteratorError6;
                            }
                        }
                    }
                }
            }
    
            /**
             * update the has of an object
             * automatically called from updateObjects()
             * @param {*} object
             * @param {boolean} [force] force update for calculatePIXI
             */
    
        }, {
            key: 'updateObject',
            value: function updateObject(object) {
                var AABB = void 0;
                if (this.calculatePIXI) {
                    var box = object.getLocalBounds();
                    AABB = object[this.AABB] = {
                        x: object.x + (box.x - object.pivot.x) * object.scale.x,
                        y: object.y + (box.y - object.pivot.y) * object.scale.y,
                        width: box.width * object.scale.x,
                        height: box.height * object.scale.y
                    };
                } else {
                    AABB = object[this.AABB];
                }
    
                var spatial = object[this.spatial];
                if (!spatial) {
                    spatial = object[this.spatial] = { hashes: [] };
                }
    
                var _getBounds = this.getBounds(AABB),
                    xStart = _getBounds.xStart,
                    yStart = _getBounds.yStart,
                    xEnd = _getBounds.xEnd,
                    yEnd = _getBounds.yEnd;
    
                // only remove and insert if mapping has changed
    
    
                if (spatial.xStart !== xStart || spatial.yStart !== yStart || spatial.xEnd !== xEnd || spatial.yEnd !== yEnd) {
                    if (spatial.hashes.length) {
                        this.removeFromHash(object);
                    }
                    for (var y = yStart; y <= yEnd; y++) {
                        for (var x = xStart; x <= xEnd; x++) {
                            var key = x + ',' + y;
                            this.insert(object, key);
                            spatial.hashes.push(key);
                        }
                    }
                    spatial.xStart = xStart;
                    spatial.yStart = yStart;
                    spatial.xEnd = xEnd;
                    spatial.yEnd = yEnd;
                }
            }
    
            /**
             * returns an array of buckets with >= minimum of objects in each bucket
             * @param {number} [minimum=1]
             * @return {array} array of buckets
             */
    
        }, {
            key: 'getBuckets',
            value: function getBuckets() {
                var minimum = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    
                var hashes = [];
                for (var key in this.hash) {
                    var hash = this.hash[key];
                    if (hash.length >= minimum) {
                        hashes.push(hash);
                    }
                }
                return hashes;
            }
    
            /**
             * gets hash bounds
             * @param {AABB} AABB
             * @return {Bounds}
             * @private
             */
    
        }, {
            key: 'getBounds',
            value: function getBounds(AABB) {
                var xStart = Math.floor(AABB.x / this.xSize);
                var yStart = Math.floor(AABB.y / this.ySize);
                var xEnd = Math.floor((AABB.x + AABB.width) / this.xSize);
                var yEnd = Math.floor((AABB.y + AABB.height) / this.ySize);
                return { xStart: xStart, yStart: yStart, xEnd: xEnd, yEnd: yEnd };
            }
    
            /**
             * insert object into the spatial hash
             * automatically called from updateObject()
             * @param {*} object
             * @param {string} key
             */
    
        }, {
            key: 'insert',
            value: function insert(object, key) {
                if (!this.hash[key]) {
                    this.hash[key] = [object];
                } else {
                    this.hash[key].push(object);
                }
            }
    
            /**
             * removes object from the hash table
             * should be called when removing an object
             * automatically called from updateObject()
             * @param {object} object
             */
    
        }, {
            key: 'removeFromHash',
            value: function removeFromHash(object) {
                var spatial = object[this.spatial];
                while (spatial.hashes.length) {
                    var key = spatial.hashes.pop();
                    var list = this.hash[key];
                    list.splice(list.indexOf(object), 1);
                }
            }
    
            /**
             * get all neighbors that share the same hash as object
             * @param {*} object in the spatial hash
             * @return {Array} of objects that are in the same hash as object
             */
    
        }, {
            key: 'neighbors',
            value: function neighbors(object) {
                var _this5 = this;
    
                var results = [];
                object[this.spatial].hashes.forEach(function (key) {
                    return results = results.concat(_this5.hash[key]);
                });
                return results;
            }
    
            /**
             * returns an array of objects contained within bounding box
             * @param {AABB} AABB bounding box to search
             * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
             * @return {object[]} search results
             */
    
        }, {
            key: 'query',
            value: function query(AABB, simpleTest) {
                simpleTest = typeof simpleTest !== 'undefined' ? simpleTest : true;
                var buckets = 0;
                var results = [];
    
                var _getBounds2 = this.getBounds(AABB),
                    xStart = _getBounds2.xStart,
                    yStart = _getBounds2.yStart,
                    xEnd = _getBounds2.xEnd,
                    yEnd = _getBounds2.yEnd;
    
                for (var y = yStart; y <= yEnd; y++) {
                    for (var x = xStart; x <= xEnd; x++) {
                        var entry = this.hash[x + ',' + y];
                        if (entry) {
                            if (simpleTest) {
                                var _iteratorNormalCompletion7 = true;
                                var _didIteratorError7 = false;
                                var _iteratorError7 = undefined;
    
                                try {
                                    for (var _iterator7 = entry[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                                        var object = _step7.value;
    
                                        var box = object[this.AABB];
                                        if (box.x + box.width > AABB.x && box.x < AABB.x + AABB.width && box.y + box.height > AABB.y && box.y < AABB.y + AABB.height) {
                                            results.push(object);
                                        }
                                    }
                                } catch (err) {
                                    _didIteratorError7 = true;
                                    _iteratorError7 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion7 && _iterator7.return) {
                                            _iterator7.return();
                                        }
                                    } finally {
                                        if (_didIteratorError7) {
                                            throw _iteratorError7;
                                        }
                                    }
                                }
                            } else {
                                results = results.concat(entry);
                            }
                            buckets++;
                        }
                    }
                }
                this.lastBuckets = buckets;
                return results;
            }
    
            /**
             * iterates through objects contained within bounding box
             * stops iterating if the callback returns true
             * @param {AABB} AABB bounding box to search
             * @param {function} callback
             * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
             * @return {boolean} true if callback returned early
             */
    
        }, {
            key: 'queryCallback',
            value: function queryCallback(AABB, callback, simpleTest) {
                simpleTest = typeof simpleTest !== 'undefined' ? simpleTest : true;
    
                var _getBounds3 = this.getBounds(AABB),
                    xStart = _getBounds3.xStart,
                    yStart = _getBounds3.yStart,
                    xEnd = _getBounds3.xEnd,
                    yEnd = _getBounds3.yEnd;
    
                for (var y = yStart; y <= yEnd; y++) {
                    for (var x = xStart; x <= xEnd; x++) {
                        var entry = this.hash[x + ',' + y];
                        if (entry) {
                            for (var i = 0; i < entry.length; i++) {
                                var object = entry[i];
                                if (simpleTest) {
                                    var _AABB = object.AABB;
                                    if (_AABB.x + _AABB.width > _AABB.x && _AABB.x < _AABB.x + _AABB.width && _AABB.y + _AABB.height > _AABB.y && _AABB.y < _AABB.y + _AABB.height) {
                                        if (callback(object)) {
                                            return true;
                                        }
                                    }
                                } else {
                                    if (callback(object)) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
                return false;
            }
    
            /**
             * get stats
             * @return {Stats}
             */
    
        }, {
            key: 'stats',
            value: function stats() {
                var visible = 0,
                    count = 0;
                var _iteratorNormalCompletion8 = true;
                var _didIteratorError8 = false;
                var _iteratorError8 = undefined;
    
                try {
                    for (var _iterator8 = this.containers[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                        var list = _step8.value;
    
                        for (var i = 0; i < list.children.length; i++) {
                            var object = list.children[i];
                            visible += object.visible ? 1 : 0;
                            count++;
                        }
                    }
                } catch (err) {
                    _didIteratorError8 = true;
                    _iteratorError8 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion8 && _iterator8.return) {
                            _iterator8.return();
                        }
                    } finally {
                        if (_didIteratorError8) {
                            throw _iteratorError8;
                        }
                    }
                }
    
                return {
                    total: count,
                    visible: visible,
                    culled: count - visible
                };
            }
    
            /**
             * helper function to evaluate hash table
             * @return {number} the number of buckets in the hash table
             * */
    
        }, {
            key: 'getNumberOfBuckets',
            value: function getNumberOfBuckets() {
                return Object.keys(this.hash).length;
            }
    
            /**
             * helper function to evaluate hash table
             * @return {number} the average number of entries in each bucket
             */
    
        }, {
            key: 'getAverageSize',
            value: function getAverageSize() {
                var total = 0;
                for (var key in this.hash) {
                    total += this.hash[key].length;
                }
                return total / this.getBuckets().length;
            }
    
            /**
             * helper function to evaluate the hash table
             * @return {number} the largest sized bucket
             */
    
        }, {
            key: 'getLargest',
            value: function getLargest() {
                var largest = 0;
                for (var key in this.hash) {
                    if (this.hash[key].length > largest) {
                        largest = this.hash[key].length;
                    }
                }
                return largest;
            }
    
            /**
             * gets quadrant bounds
             * @return {Bounds}
             */
    
        }, {
            key: 'getWorldBounds',
            value: function getWorldBounds() {
                var xStart = Infinity,
                    yStart = Infinity,
                    xEnd = 0,
                    yEnd = 0;
                for (var key in this.hash) {
                    var split = key.split(',');
                    var x = parseInt(split[0]);
                    var y = parseInt(split[1]);
                    xStart = x < xStart ? x : xStart;
                    yStart = y < yStart ? y : yStart;
                    xEnd = x > xEnd ? x : xEnd;
                    yEnd = y > yEnd ? y : yEnd;
                }
                return { xStart: xStart, yStart: yStart, xEnd: xEnd, yEnd: yEnd };
            }
    
            /**
             * helper function to evalute the hash table
             * @param {AABB} [AABB] bounding box to search or entire world
             * @return {number} sparseness percentage (i.e., buckets with at least 1 element divided by total possible buckets)
             */
    
        }, {
            key: 'getSparseness',
            value: function getSparseness(AABB) {
                var count = 0,
                    total = 0;
    
                var _ref = AABB ? this.getBounds(AABB) : this.getWorldBounds(),
                    xStart = _ref.xStart,
                    yStart = _ref.yStart,
                    xEnd = _ref.xEnd,
                    yEnd = _ref.yEnd;
    
                for (var y = yStart; y < yEnd; y++) {
                    for (var x = xStart; x < xEnd; x++) {
                        count += this.hash[x + ',' + y] ? 1 : 0;
                        total++;
                    }
                }
                return count / total;
            }
        }]);
    
        return SpatialHash;
    }();
    
    /**
     * @typedef {object} Stats
     * @property {number} total
     * @property {number} visible
     * @property {number} culled
     */
    
    /**
     * @typedef {object} Bounds
     * @property {number} xStart
     * @property {number} yStart
     * @property {number} xEnd
     * @property {number} xEnd
     */
    
    /**
      * @typedef {object} AABB
      * @property {number} x
      * @property {number} y
      * @property {number} width
      * @property {number} height
      */
    
    module.exports = SpatialHash;
    
    },{}]},{},[1]);