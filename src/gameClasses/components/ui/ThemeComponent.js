var ThemeComponent = IgeEntity.extend({
	classId: 'ThemeComponent',
	componentId: 'theme',

	init: function()
	{
		var self = this
		self.applyTheme(ige.client.server)
	},

	applyTheme: function(server)
	{

		if (ige.game.data.settings.images && ige.game.data.settings.images.logo)
		{
			$(".game-title").html(
				$("<img/>", {
					src: ige.game.data.settings.images.logo,
					height:'75px'
				})
			)
		}
		else
		{
			$(".game-title").html(server.gameName)
		}

		
	}


});


if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = ThemeComponent; }