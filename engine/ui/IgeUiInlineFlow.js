var IgeUiInlineFlow = IgeUiElement.extend({
	classId: 'IgeUiInlineFlow',

	init: function () {
		IgeUiElement.prototype.init.call(this);
	},

	tick: function (ctx) {
		// Loop children and re-position them
		var arr = this._children;
		var arrCount = arr.length; var i;
		var item; var itemY; var currentX = 0;

		for (i = 0; i < arrCount; i++) {
			item = arr[i];
			itemX = item._bounds2d.x;
			item.left(currentX);
			currentX += itemX;
		}

		// call the super-class tick
		IgeUiElement.prototype.tick.call(this, ctx);
	}
});
