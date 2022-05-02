var moddioConfig =
    process.env.ENV === 'standalone'
    	? []
    	: [
    		{ name: 'ClusterClientComponent', path: '../../ClusterClientComponent' },
    		{ name: 'ClusterServerComponent', path: '../../ClusterServerComponent' },
    		{ name: 'HttpComponent', path: '../../HttpComponent' }
    	];
var defaultConfig = [
	{ name: 'ServerNetworkEvents', path: '../server/ServerNetworkEvents' },

	{ name: 'ScriptComponent', path: '../src/gameClasses/components/script/ScriptComponent' },
	{ name: 'TriggerComponent', path: '../src/gameClasses/components/script/TriggerComponent' },

	{ name: 'ConditionComponent', path: '../src/gameClasses/components/script/ConditionComponent' },
	{ name: 'ActionComponent', path: '../src/gameClasses/components/script/ActionComponent' },
	{ name: 'VariableComponent', path: '../src/gameClasses/components/script/VariableComponent' },

	{ name: 'Player', path: '../src/gameClasses/Player' },
	{ name: 'Unit', path: '../src/gameClasses/Unit' },
	{ name: 'Sensor', path: '../src/gameClasses/Sensor' },
	{ name: 'Debris', path: '../src/gameClasses/Debris' },

	{ name: 'MapComponent', path: '../src/gameClasses/components/MapComponent' },
	{ name: 'ShopComponent', path: '../src/gameClasses/components/ShopComponent' },
	{ name: 'GameComponent', path: '../src/gameClasses/components/GameComponent' },
	{ name: 'ItemComponent', path: '../src/gameClasses/components/ItemComponent' },
	{ name: 'TimerComponent', path: '../src/gameClasses/components/TimerComponent' },
	{ name: 'ControlComponent', path: '../src/gameClasses/components/ControlComponent' },
	{ name: 'InventoryComponent', path: '../src/gameClasses/components/InventoryComponent' },

	{ name: 'GameTextComponent', path: '../src/gameClasses/components/ui/GameTextComponent' },
	{ name: 'ScoreboardComponent', path: '../src/gameClasses/components/ui/ScoreboardComponent' },
	{ name: 'AdComponent', path: '../src/gameClasses/components/ui/AdComponent' },
	{ name: 'RegionUi', path: '../src/gameClasses/components/ui/RegionUi' },
	{ name: 'VideoChatComponent', path: '../src/gameClasses/components/ui/VideoChatComponent' },
	{ name: 'SoundComponent', path: '../src/gameClasses/components/SoundComponent' },

	{ name: 'AbilityComponent', path: '../src/gameClasses/components/unit/AbilityComponent' },
	{ name: 'AttributeComponent', path: '../src/gameClasses/components/unit/AttributeComponent' },
	{ name: 'AIComponent', path: '../src/gameClasses/components/unit/AIComponent' },

	{ name: 'Item', path: '../src/gameClasses/Item' },
	{ name: 'Projectile', path: '../src/gameClasses/Projectile' },
	{ name: 'Region', path: '../src/gameClasses/Region' },
	{ name: 'RegionManager', path: '../src/gameClasses/components/RegionManager' }
];

var config = {
	include: moddioConfig.concat(defaultConfig)
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = config;
}
