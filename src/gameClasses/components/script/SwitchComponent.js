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

		const {argument, cases} = items;

		// loop over all cases
		for(let elem in cases){
			caseValue = `case${cases[elem].value}`;
			var caseVar = ige.variable.getValue(argument, vars);
			var argumentVar = ige.variable.getValue(caseValue, vars);
			// if the operands are igeEntities, then compare their id's
			if (caseVar && caseVar._id != undefined && argumentVar && argumentVar._id != undefined) {
				caseVar = caseVar._id;
				argumentVar = argumentVar._id;
			}
			if (argumentVar == undefined) {
				argumentVar = !!argumentVar;
			}
			if (caseVar == undefined) {
				caseVar = !!caseVar;
			}
			if (typeof caseVar != 'object') {
				var caseVar = JSON.stringify(caseVar);
			}
			if (typeof argumentVar != 'object') {
				var argumentVar = JSON.stringify(argumentVar);
			}
			elemState = elem;
			if(caseVar == argumentVar) break;
		}
		return {value : caseVar == argumentVar, case: elemState };// stringify is important for comparisons like region comparison


	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
	module.exports = SwitchComponent;
}
