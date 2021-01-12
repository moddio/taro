var igeClientConfig = {
	include: [
		'/lib/stats.js',
		'/lib/dat.gui.min.js',
		'/lib/msgpack.min.js',

		'/gameClasses/Player.js',
		'/gameClasses/Unit.js',
		'/gameClasses/ClientScore.js',
		'/gameClasses/MinimapUnit.js',
		'/gameClasses/Region.js',

		'/gameClasses/Item.js',
		'/gameClasses/Projectile.js',
		'/gameClasses/Particle.js',

		'/gameClasses/ClientNetworkEvents.js',
		'/gameClasses/components/GameComponent.js',
		'/gameClasses/components/MapComponent.js',
		'/gameClasses/components/InventoryComponent.js',
		'/gameClasses/components/SoundComponent.js',
		'/gameClasses/components/ControlComponent.js',
		'/gameClasses/components/MobileControlsComponent.js',
		'/gameClasses/components/TimerComponent.js',
		'/gameClasses/components/ShopComponent.js',
		'/gameClasses/components/RegionManager.js',
		'/gameClasses/components/TweenComponent.js',

		'/gameClasses/components/ui/MenuUiComponent.js',
		'/gameClasses/components/ui/RegionUi.js',
		'/gameClasses/components/ui/ThemeComponent.js',
		'/gameClasses/components/ui/PlayerUiComponent.js',
		'/gameClasses/components/ui/GameTextComponent.js',
		'/gameClasses/components/ui/ScoreboardComponent.js',
		'/gameClasses/components/ui/ItemUiComponent.js',
		'/gameClasses/components/ui/AdComponent.js',
		'/gameClasses/components/ui/DevConsoleComponent.js',
		'/gameClasses/components/ui/MapEditorComponent.js',
		'/gameClasses/components/ui/MapPanComponent.js',
		'/gameClasses/components/ui/UnitUiComponent.js',
		'/gameClasses/components/ui/VideoChatComponent.js',
		'/gameClasses/components/ui/TradeUiComponent.js',
		'/gameClasses/components/ui/MinimapComponent.js',

		'/gameClasses/components/script/ScriptComponent.js',
		'/gameClasses/components/script/VariableComponent.js',
		'/gameClasses/components/script/TriggerComponent.js',
		'/gameClasses/components/script/ActionComponent.js',
		'/gameClasses/components/script/ConditionComponent.js',
		'/gameClasses/components/unit/AbilityComponent.js',
		'/gameClasses/components/unit/AttributeComponent.js',

		'/gameClasses/Debris.js',

		/* Standard game scripts */
		'/gameClasses/Cursor.js',

		/* PIXI */
		'pixi/pixi-viewport.js',
		'pixi/pixi-cull.js',
		'pixi/IgePixi.js',
		'pixi/IgePixiMap.js',
		'pixi/IgePixiTexture.js',
		'pixi/IgePixiAnimation.js',
		'pixi/IgePixiFloatingText.js',
		'pixi/IgePixiChatBubble.js',
		'pixi/PixiAttributeBar.js',

		'/client.js',
		'/index.js'
	]
};

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = igeClientConfig; }