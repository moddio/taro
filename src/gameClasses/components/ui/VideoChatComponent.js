var VideotChatComponent = IgeEntity.extend({
	classId: 'VideotChatComponent',
	componentId: 'videotChat',

	init: function (entity, options) {
		var self = this;
		self._entity = entity;
	}

});


if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = VideotChatComponent; }