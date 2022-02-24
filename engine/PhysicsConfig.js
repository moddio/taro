var igePhysicsConfig = {

	igePhysicsChoices: {
		/* Includes for the main IGE loader. Flags are indicated as:
		* c = client
		* s = server
		* a =
		* p = prototype
		*/

		// A little concerned about using the spread operator here
		// Going with concat over spread for performance

		/* Physics Libraries */
		planck: [
			['csap', 'Box2dComponent', './components/physics/box2d/Box2dComponent.js'],
			['csap', 'IgeBox2dWorld', './components/physics/box2d/IgeBox2dDebugPainter.js'],
			['csap', 'IgeEntityPhysics', './components/physics/box2d/IgeEntityBox2d.js'],
			['csap', 'dists', './components/physics/box2d/dists.js'],
			['csap', 'planck', './components/physics/box2d/dists/planck/planck.js']
		],

		box2dweb: [
			['csap', 'Box2dComponent', './components/physics/box2d/Box2dComponent.js'],
			['csap', 'IgeBox2dWorld', './components/physics/box2d/IgeBox2dDebugPainter.js'],
			['csap', 'IgeEntityPhysics', './components/physics/box2d/IgeEntityBox2d.js'],
			['csap', 'dists', './components/physics/box2d/dists.js'],
			['csap', 'box2dweb', './components/physics/box2d/dists/box2dweb/lib_box2d.js', 'box2dweb'],
			['csap', 'box2dninja', './components/physics/box2d/dists/box2dweb/box2d_ninja.js', 'box2dninja']
		],

		box2dts: [
			['csap', 'Box2dComponent', './components/physics/box2d/Box2dComponent.js'],
			['csap', 'IgeBox2dWorld', './components/physics/box2d/IgeBox2dDebugPainter.js'],
			['csap', 'IgeEntityPhysics', './components/physics/box2d/IgeEntityBox2d.js'],
			['csap', 'dists', './components/physics/box2d/dists.js'],
			['csap', 'box2dts', './components/physics/box2d/dists/flyoverbox2dts/bundle.js']
		],

		crash: [
			['csap', 'CrashComponent', './components/physics/crash/CrashComponent.js'],
			['csap', 'IgeEntityPhysics', './components/physics/crash/IgeEntityCrash.js'],
			// ['csap', 'rbush', './components/physics/crash/rbush.js', 'rbush'],
			['csap', 'sat', './components/physics/crash/sat.js', 'sat'],
			['csap', 'crash', './components/physics/crash/crash.js', 'crash']
		]
	},

	gameClasses: [
		['csap', 'Unit', '../src/gameClasses/Unit.js'],
		['csap', 'Region', '../src/gameClasses/Region.js'],
		['csap', 'Item', '../src/gameClasses/Item.js'],
		['csap', 'Projectile', '../src/gameClasses/Projectile.js'],
		['csap', 'Particle', '../src/gameClasses/Particle.js'],
		['csap', 'Debris', '../src/gameClasses/Debris.js'],
		['csap', 'Sensor', '../src/gameClasses/Sensor.js'],
		['csap', 'MapComponent', '../src/gameClasses/components/MapComponent.js']
	],

	loadSelectPhysics: function (physicsChoice) {
		this.loadFiles(this.igePhysicsChoices[physicsChoice]);
	},

	loadPhysicsGameClasses: function () {
		this.loadFiles(this.gameClasses);
	},

	loadFiles: function (physicsFiles) {
		var arr = physicsFiles;
		var arrCount = arr.length;
		var arrIndex, arrItem, itemJs;

		var argParse = require('node-arguments').process;
		var args = argParse(process.argv, { separator: '-' });

		if (!args['-deploy']) {
			// Loop the igeCoreConfig object's include array
			// and load the required files
			for (arrIndex = 0; arrIndex < arrCount; arrIndex++) {
				arrItem = arr[arrIndex];

				itemJs = `${arrItem[1]} = ` + `require("${arrItem[2]}")`;
				// Check if there is a specific object we want to use from the
				// module we are loading
				if (arrItem[3]) {
					itemJs += `.${arrItem[3]};`;
				} else {
					itemJs += ';';
				}
				eval(itemJs);
			}
		}
	}
};
if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = igePhysicsConfig; }
