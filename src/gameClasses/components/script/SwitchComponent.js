var SwitchComponent = IgeEntity.extend({
	classId: 'SwitchComponent',
	componentId: 'switchCondition',

	init: function (entity, options) {
		var self = this;
	},

	run: function (items, vars) {
        if (items == undefined || items.length <= 0) {
			return true;
		}
		let elemState;

		left = items[1]

		// loop over all cases 
		for(let elem in items[2]){
			right = items[2][elem]
			var leftVar = ige.variable.getValue(left, vars);
			var rightVar = ige.variable.getValue(right, vars);
			// if the operands are igeEntities, then compare their id's
			if (leftVar && leftVar._id != undefined && rightVar && rightVar._id != undefined) {
				leftVar = leftVar._id;
				rightVar = rightVar._id;
			}
			if (rightVar == undefined) {
				rightVar = !!rightVar;
			}
			if (leftVar == undefined) {
				leftVar = !!leftVar;
			}
			if (typeof leftVar != 'object') {
				var leftVar = JSON.stringify(leftVar);
			}
			if (typeof rightVar != 'object') {
				var rightVar = JSON.stringify(rightVar);
			}
			elemState = elem
			if(leftVar == rightVar) break;
		}
		console.log('pppp😋😋😋😋', {value : leftVar == rightVar, case: elemState } )
		return {value : leftVar == rightVar, case: elemState }// stringify is important for comparisons like region comparison
		
		
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = SwitchComponent; }
