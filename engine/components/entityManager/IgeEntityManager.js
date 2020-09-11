var IgeEntityManager = IgeEventingClass.extend({
	classId: 'IgeEntityManager',
	componentId: 'entityManager',

	init: function (entity, options) {
		this._entity = entity;
		this._options = options;
		// Create queue arrays that will store entities waiting to
		// be mounted or unmounted
		this._mountQueue = [];
		this._unMountQueue = [];
		this._maxMountsPerOp = 0;
		this._maxUnMountsPerOp = 0;
		this.lastExecutionTime = Date.now();
		this.allowedIds = ['player', undefined, 'projectile', 'minimapUnit'];

		// Create the _orphans array on the entity
		entity._orphans = {};

		// Set a method (behaviour) that will be called on every update
		entity.addBehaviour('entManager', this._updateBehaviour, false);
	},
	/**
	 * Called each update frame from the component parent and calls various private
	 * methods to ensure that entities that should be mounted are mounted and those
	 * that are to be unmounted are unmounted.
	 * @private
	 */
	_updateBehaviour: function (ctx, tickDelta) {
		var self = this.entityManager;

		// Draw visible area rect
		// console.log(this._entity._category, this._entity._id)
		// if (true || ige.client.removeOutsideEntities) {
		// var rect = ige.client.vp1.viewArea();

		/*new IgeEntity()
			.id('visArea')
			.texture(this.gameTexture.simpleBox)
			.opacity(0.5)
			.mount(ige.$('objectScene'));*/

		/*ige.$('visArea')
			.translateTo(rect.x + (rect.width / 2), rect.y + (rect.height / 2), 0)
			.height(rect.height)
			.width(rect.width);*/
		var currentTime = Date.now();
		if (currentTime - self.lastExecutionTime >= 150) {
			self.lastExecutionTime = currentTime;

			// Get our instance back
			ige.entityManagerUpdateBehaviour++;

			self._updateOrphans();
			self._updateChildren();

			self._processMountQueue();
			self._processUnMountQueue();
		}


	},

	/**
	 * Checks all the mounted entities of our component parent are still supposed
	 * to be in the scenegraph and if not, adds them to the un-mount queue. Also
	 * marks any entities that are non-managed but also off-screen as inView = false.
	 * @private
	 */
	_updateOrphans: function () {
		var arr = this._entity._children,
			arrCount = arr.length,
			viewportArr = ige._children,
			vpCount = viewportArr.length,
			item,
			itemAabb,
			vpIndex,
			inVisibleArea;
		ige.entityManagerUpdateorphan++;

		while (arrCount--) {
			item = arr[arrCount];
			ige.totalOrphans++;
			if (item._managed) {
				if (item.aabb) {
					if (item._mode === 1 || (item._parent && item._parent._mountMode === 1)) {
						itemAabb = item.bounds3dPolygon().aabb();
					} else {
						itemAabb = item.aabb();
						item.height = item.height || 5;
						item.width = item.width || 5;
					}

					inVisibleArea = false;
					// Check the entity to see if its bounds are "inside" any
					// viewport's visible area
					// for (vpIndex = 0; vpIndex < vpCount; vpIndex++) {
					var isIntersecting = ige.client.vp1.viewArea().intersects(itemAabb);
					if (isIntersecting || this.exceptions(item, ige.client.vp1.viewArea())) {
						inVisibleArea = true;
						// break;
					}
					// }


					if (!inVisibleArea) {
						// Check for managed mode 1 (static entities that can be unmounted)
						// or managed mode 2 (dynamic and should just be marked as inView = false)
						if (item._managed === 1) {
							// The entity is not inside the viewport visible area
							// and is managed mode 1 (static) so unmount it
							this._unMountQueue.push(item);
						} else if (item._managed === 2) {
							// The entity is dynamic so mark is as inView = false
							item._inView = false;
						}
					} else if (item._managed === 2) {
						// The entity is dynamic so mark is as inView = true
						item._inView = true;
					}
				} else {
					this._unMountQueue.push(item);
				}
			}
		}
	},
	exceptions: function (item, viewArea) {
		// if entity is engine entity then always show or show show entity if it is just created;
		if (!item._category) return true;

		var self = this;
		var parentAABB = item.parent() && item.parent().aabb();

		if (item._category == 'item' && item.getOwnerUnit()) {
			parentAABB = item.getOwnerUnit().aabb();
		}


		var checkTranslateInView = function () {
			var translate = {
				x: item._translate.x,
				y: item._translate.y,
				height: item.height() || 5,
				width: item.width() || 5
			};

			return viewArea.intersects(translate);
		}

		var checkItemIsBeingUsed = function () {
			if (item._category === 'item') {
				// console.log(item.id(), item.isBeingUsed)
				return item.isBeingUsed; // if item is being used mount it on scene
			}
			else if (item._category === 'unit' && item._stats.itemIds && item._stats.itemIds.length > 0) {

				// if item is being used mount its owner too on scene
				var itemIsBeingUsed = item._stats.itemIds.find(function (itemId) {
					if (itemId) {
						var entity = ige.$(itemId);
						if (entity && entity.isBeingUsed) {
							return true;
						}
					}
				});

				// console.log(item.id(), item._stats.name, itemIsBeingUsed);
				if (itemIsBeingUsed) {
					return true;
				}
			}
		}

		if (item._alive) {
			return (
				this.allowedIds.includes(item._category) || // exceptional categories that should always be streaming eg. player
				(ige.client.myplayer && ige.client.myplayer._stats.selectedUnitId == item.id()) ||// always stream my player
				(item._category === 'unit' && item.minimapUnit) || // if unit has minimap 
				checkTranslateInView() ||
				item._category === 'item' && item._parent && item._parent.id() != 'baseScene' && viewArea.intersects(parentAABB) || // always stream spriteOnly items which are mouned over unit
				checkItemIsBeingUsed()
			)
		}
		return false;
	},
	/**
	 * Checks all the un-mounted entities of our component parent to see if they are
	 * now inside the visible area of a viewport and if so, queues them for re-mounting.
	 * @private
	 */
	_updateChildren: function () {
		var orphans = this._entity._orphans,
			viewportArr = ige._children,
			vpCount = viewportArr.length,
			item,
			itemAabb,
			vpIndex,
			inVisibleArea;
		ige.entityManagerUpdateChildren++;

		for (var itemKey in orphans) {
			ige.totalChildren++;
			item = orphans[itemKey];

			if (item._managed) {
				if (item.aabb) {
					if (item._mode === 1 || (item._parent && item._parent._mountMode === 1)) {
						itemAabb = item.bounds3dPolygon().aabb();
					} else {
						itemAabb = item.aabb();
						item.height = item.height || 5;
						item.width = item.width || 5;
					}

					inVisibleArea = false;

					// Check the entity to see if its bounds are "inside" any
					// viewport's visible area
					// for (vpIndex = 0; vpIndex < vpCount; vpIndex++) {
					var isIntersecting = ige.client.vp1.viewArea().intersects(itemAabb);
					if (isIntersecting || this.exceptions(item, ige.client.vp1.viewArea())) {
						inVisibleArea = true;
						// break;
					}
					// }

					if (inVisibleArea) {
						// Check for managed mode 1 (static entities that can be mounted)
						// or managed mode 2 (dynamic and should just be marked as inView = true)
						if (item._managed === 1) {
							// The entity is inside the viewport visible area
							// and is managed mode 1 (static) so mount it
							this._mountQueue.push(item);
						} else if (item._managed === 2) {
							// The entity is dynamic so mark is as inView = true
							item._inView = true;
						}
					}
				} else {
					this._mountQueue.push(item);
				}
			}
		}
	},

	/**
	 * Loops any entities queued for mounting and mounts them.
	 * @private
	 */
	_processMountQueue: function () {
		var arr = this._mountQueue,
			arrCount = arr.length,
			item;

		while (arrCount--) {
			item = arr[arrCount];
			if (item._category) {
				if (item._alive) {

					// mount entity on owner if item is spriteOnly or jointType is weld joint
					if (item._category && item._category === 'item' &&
						item.getOwnerUnit() && item._stats.currentBody &&
						item._stats.currentBody.type == 'spriteOnly'
					) {
						var owner = item.getOwnerUnit();
						if (owner && owner._stats.currentItemIndex === item._stats.slotIndex) {
							item.mount(owner);
						}
					}
					else {
						item.mount(this._entity);
					}
				}
				else {
					item.destroy();
					delete this._entity._orphans[item._id];
				}
			}
			else {
				// this._entity._orphans.pull(item);
				item.mount(this._entity);
			}
		}

		this._mountQueue = [];
	},

	/**
	 * Loops any entities queued for un-mounting and un-mounts them.
	 * @private
	 */
	_processUnMountQueue: function () {
		var arr = this._unMountQueue,
			arrCount = arr.length,
			item;

		while (arrCount--) {
			item = arr[arrCount];
			item.unMount();

			this._entity._orphans[item._id] = item;
		}

		this._unMountQueue = [];
	}
});