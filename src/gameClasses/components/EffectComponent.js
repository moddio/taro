var EffectComponent = IgeEntity.extend({
	classId: 'EffectComponent',
	componentId: 'effect',

	init: function (entity) {
		var self = this;
		// Store the entity that this component has been added to
		this._entity = entity;

		// attach particle emitters on this item, so we can emit particles
		self.particleEmitters = {}

		if (entity._stats.effects)
		{
			for (event in entity._stats.effects)
			{
				// load particle emitters
				var particles = entity._stats.effects[event].particles
				self.particleEmitters[event] = {}
				for (particleTypeId in particles)
				{
					var particleData = particles[particleTypeId]
					if (particleData)
					{
						// console.log("particleData", particleData, particleData.dimensions)
						if (particleData.dimensions == undefined)
						{
							particleData.dimensions = { width: 5, height: 5 }
						}

						if (particleData['z-index'] === undefined)
						{
							particleData['z-index'] = {
								layer: 3,
								depth: 5
							};
						}

						self.particleEmitters[event][particleTypeId] = new IgeParticleEmitter() // Set the particle entity to generate for each particle
							.layer(particleData['z-index'].layer)
							.depth(particleData['z-index'].depth)
							.color(particleData.color)
							.size(particleData.dimensions.height, particleData.dimensions.width)
							.particle(Particle)
							.lifeBase(parseFloat(particleData.lifeBase)) // Set particle life to 300ms
							.quantityBase(parseFloat(particleData.quantityBase)) // Set output to 60 particles a second (1000ms) 
							.quantityTimespan(parseFloat(particleData.quantityTimespan))
							.deathOpacityBase(parseFloat(particleData.deathOpacityBase)) // Set the particle's death opacity to zero so it fades out as it's lifespan runs out
							.velocityVector(
								new IgePoint3d(parseFloat(particleData.velocityVector.baseVector.x), parseFloat(particleData.velocityVector.baseVector.y), 0),
								new IgePoint3d(parseFloat(particleData.velocityVector.minVector.x), parseFloat(particleData.velocityVector.minVector.y), 0),
								new IgePoint3d(parseFloat(particleData.velocityVector.maxVector.x), parseFloat(particleData.velocityVector.maxVector.y), 0)
							)
							.particleMountTarget(ige.client.mainScene) // Mount new particles to the object scene
							.translateTo(parseFloat(particleData.mountPosition.x), parseFloat(-particleData.mountPosition.y), 0) // Move the particle emitter to the bottom of the ship
							.mount(self._entity);
					}
				}
			}
		}

	},

	// start particle and/or sound effect
	start: function (event) {
		var self = this
		if (this._entity._stats.effects && this._entity._stats.effects[event])
		{
			var data = this._entity._stats.effects[event]

			// emit particles
			// the particle emitter must be within myPlayer's camera viewing range
			if (
				self._entity._translate.x > ige.client.vp1.camera._translate.x - 1000 &&
				self._entity._translate.x < ige.client.vp1.camera._translate.x + 1000 &&
				self._entity._translate.y > ige.client.vp1.camera._translate.y - 1000 &&
				self._entity._translate.y < ige.client.vp1.camera._translate.y + 1000
			)
			{
				for (particleTypeId in data.particles)
				{
					if (self.particleEmitters[event] && self.particleEmitters[event][particleTypeId])
					{
						self.particleEmitters[event][particleTypeId].emitOnce()
					}
				}
			}

			// play sound
			for (soundId in data.sound)
			{
				if (this._entity._stats.effects && this._entity._stats.effects[event])
				{
					var data = this._entity._stats.effects[event]
					if (data.sound && data.sound[soundId])
					{
						// console.log('play sound called',this._entity)
						ige.sound.playSound(data.sound[soundId], this._entity._translate, soundId);
					}
				}
			}
		}
	}

});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = EffectComponent; }