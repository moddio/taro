/* Box2D Physics to Entity Components */
var box2dUtilities = [
	['csap', 'PhysicsComponent', 'components/physics/PhysicsComponent.js'],
	['csap', 'IgeBox2dWorld', 'components/physics/box2d/IgeBox2dDebugPainter.js'],
	['csap', 'IgeEntityPhysics', 'components/physics/box2d/IgeEntityBox2d.js'],
	['csap', 'dists', 'components/physics/box2d/dists.js'],
];

var nonbox2dUtil = [
	['csap', 'IgeEntityPhysics', 'components/physics/box2d/IgeEntityCrash.js'],
];

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
		planck: box2dUtilities.concat([
			['csap', 'planck', 'components/physics/box2d/dists/planck/planck.js']
		]),

		box2dweb: box2dUtilities.concat([
			['csap', 'box2dweb', 'components/physics/box2d/dists/box2dweb/lib_box2d.js', 'box2dweb'],
			['csap', 'box2dninja', 'components/physics/box2d/dists/box2dweb/box2d_ninja.js', 'box2dninja']
		]),

		box2dts: box2dUtilities.concat([
			['csap', 'box2dts', 'components/physics/box2d/dists/flyoverbox2dts/bundle.js']
		]),

		crash: nonbox2dUtil.concat([
			['csap', 'rbush', 'components/physics/crash/rbush.js', 'rbush'],
			['csap', 'sat', 'components/physics/crash/sat.js', 'sat'],
			['csap', 'crash', 'components/physics/crash/crash.js', 'crash']
		])
	},

	selectPhysics: function (physicsChoice) {
		return this.igePhysicsChoices[physicsChoice];
	},

	loadPhysics: function (physicsChoice) {
		var arr = this.selectPhysics(physicsChoice);
		var arrCount = arr.length;
		var arrIndex, arrItem, itemJs;

		var argParse = require('node-arguments').process;
		var args = argParse(process.argv, { separator: '-' });

		if (!args['-deploy']) {
			// Loop the igeCoreConfig object's include array
			// and load the required files
			console.log(arr);
			for (arrIndex = 0; arrIndex < arrCount; arrIndex++) {
				arrItem = arr[arrIndex];

				itemJs = `${arrItem[1]} = ` + `require("../engine/${arrItem[2]}")`;
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
