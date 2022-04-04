var Particle = IgeEntityPhysics.extend({
	classId: 'Particle',

	init: function (emitter) {
		this._emitter = emitter;
		IgeEntityPhysics.prototype.init.call(this);

		// Set the rectangle colour (this is read in the Rectangle.js smart texture)
		this._rectColor = emitter.color;

		this.addComponent(IgeVelocityComponent)
			.texture(emitter.texture)
			.width((emitter.size && emitter.size.width) ? emitter.size.width : 5)
			.height((emitter.size && emitter.size.height) ? emitter.size.height : 5)
			.layer(emitter._layer)
			.depth(emitter._depth)
			.category('particle');
	},

	destroy: function () {
		// Remove ourselves from the emitter
		if (this._emitter !== undefined) {
			this._emitter._particles.pull(this);
		}
		IgeEntityPhysics.prototype.destroy.call(this);
	}
});
