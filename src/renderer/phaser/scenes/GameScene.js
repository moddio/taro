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
var GameScene = /** @class */ (function (_super) {
    __extends(GameScene, _super);
    function GameScene() {
        var _this = _super.call(this, { key: 'Game' }) || this;
        // TODO use phaser time instead of pixi ticker
        // TODO use phaser loader instead of pixi loader
        _this.trackEntityById = {};
        return _this;
    }
    GameScene.prototype.preload = function () {
    };
    GameScene.prototype.create = function () {
    };
    GameScene.prototype.update = function (time, delta) {
        ige.engineStep();
        ige.input.processInputOnEveryFps();
        this.updateAllEntities(time, delta);
        // TODO depth sort entities
        ige._renderFrames++;
    };
    GameScene.prototype.updateAllEntities = function (time, delta) {
        for (var entityId in this.trackEntityById) {
            if (this.trackEntityById[entityId]._destroyed) {
                delete this.trackEntityById[entityId];
                break;
            }
            var entity = ige.$(entityId);
            if (entity) {
                // handle entity behaviour and transformation offsets
                if (ige.gameLoopTickHasExecuted) {
                    if (entity._deathTime && entity._deathTime <= ige._tickStart) {
                        // Check if the deathCallBack was set
                        if (entity._deathCallBack) {
                            entity._deathCallBack.apply(entity);
                            delete entity._deathCallBack;
                        }
                        entity.destroy();
                    }
                    if (entity._behaviour && !entity.isHidden()) {
                        entity._behaviour();
                    }
                    // handle streamUpdateData
                    if (ige.client.myPlayer) {
                        var updateQueue = ige.client.entityUpdateQueue[entityId];
                        if (updateQueue && updateQueue.length > 0) {
                            var nextUpdate = updateQueue[0];
                            // Don't run if we're...
                            if (entity._category === 'item' && (
                            // updating item's owner unit, but the owner hasn't been created yet
                            (nextUpdate.ownerUnitId && !ige.$(nextUpdate.ownerUnitId)) ||
                                // or changing item's state to selected/unselected,
                                ((nextUpdate.stateId === 'selected' || nextUpdate.stateId === 'unselected')
                                    // but owner doesn't exist yet
                                    && !entity.getOwnerUnit()))) {
                                // console.log("detected update for item that don't have owner unit yet", entity.id(), nextUpdate)
                            }
                            else {
                                // console.log("entityUpdateQueue", entityId, nextUpdate)
                                entity.streamUpdateData([nextUpdate]);
                                ige.client.entityUpdateQueue[entityId].shift();
                            }
                        }
                    }
                }
                // update transformation using incoming network stream
                if (ige.network.stream && ige._renderLatency !== undefined) {
                    entity._processTransform();
                }
                if (entity._translate && !entity.isHidden()) {
                    var x = entity._translate.x;
                    var y = entity._translate.y;
                    var rotate = entity._rotate.z;
                    if (entity._category == 'item') {
                        var item = entity;
                        var ownerUnit = item.getOwnerUnit();
                        if (ownerUnit) {
                            // if ownerUnit's transformation hasn't been processed yet,
                            // then it'll cause item to drag behind. so we're running it now
                            ownerUnit._processTransform();
                            // immediately rotate items for my own unit
                            if (ownerUnit == ige.client.selectedUnit) {
                                if (item._stats.currentBody &&
                                    item._stats.currentBody.jointType == 'weldJoint') {
                                    rotate = ownerUnit._rotate.z;
                                }
                                else if (ownerUnit == ige.client.selectedUnit) {
                                    // angleToTarget is updated at 60fps
                                    rotate = ownerUnit.angleToTarget;
                                }
                            }
                            item.anchoredOffset = item.getAnchoredOffset(rotate);
                            if (item.anchoredOffset) {
                                x = ownerUnit._translate.x + item.anchoredOffset.x;
                                y = ownerUnit._translate.y + item.anchoredOffset.y;
                                rotate = item.anchoredOffset.rotate;
                            }
                        }
                    }
                    if (entity.tween && entity.tween.isTweening) {
                        entity.tween.update();
                        x += entity.tween.offset.x;
                        y += entity.tween.offset.y;
                        rotate += entity.tween.offset.rotate;
                    }
                    entity.transformPixiEntity(x, y, rotate);
                    // TODO use phaser animation
                    // handle animation
                    if (entity.pixianimation) {
                        if (entity.pixianimation.animating) {
                            if (!entity.pixianimation.fpsCount) {
                                entity.pixianimation.fpsCount = 0;
                            }
                            if (entity.pixianimation.fpsCount > entity.pixianimation.fpsSecond) {
                                entity.pixianimation.animationTick();
                                entity.pixianimation.fpsCount = 0;
                            }
                            entity.pixianimation.fpsCount += delta;
                        }
                    }
                }
            }
        }
        if (ige.gameLoopTickHasExecuted) {
            ige.gameLoopTickHasExecuted = false;
        }
    };
    return GameScene;
}(Phaser.Scene));
//# sourceMappingURL=GameScene.js.map