var ScriptComponent = IgeEntity.extend({
	classId: 'ScriptComponent',
	componentId: 'script',

	init: function () {
		var self = this;

		// self.logStr = "";
		self.entryCount = 0;
		self.showLog = false;
		self.errorLogs = {};
		self.currentScript = undefined;
		self.currentActionName = '';
		self.scriptCache = {};
		self.scriptTime = {};
		self.scriptRuns = {};
		self.last50Actions = [];

		ScriptComponent.prototype.log('initializing Script Component');
	},

	runScript: function (scriptId, localVariables) {
		var timings = false;
		if (timings) var started = new Date();
		var self = this

		self.currentScriptId = scriptId;
		if (ige.game.data.scripts[scriptId]) {
			//var actions = JSON.parse(JSON.stringify(ige.game.data.scripts[scriptId].actions));
			var actions = self.getScriptActions(scriptId, timings);
			if (actions) {

				var cmd = ige.action.run(actions, localVariables)
				if (cmd == 'return') {
					ige.log("script return called")
					return;
				}
			}
		}

		if (timings) {
			var now = new Date();
			var elapsed = now - started;
			self.scriptRuns[scriptId] = self.scriptRuns[scriptId] || 0;
			self.scriptRuns[scriptId]++;
			self.scriptTime[scriptId] = self.scriptTime[scriptId] || 0;
			if (self.scriptRuns[scriptId] > 1) {
				self.scriptTime[scriptId] += elapsed;
				var avg = self.scriptTime[scriptId] / (self.scriptRuns[scriptId] - 1);
				if (self.scriptRuns[scriptId] % 100 == 0) {
					console.log('runScript: ' + scriptId + ' ' + ige.game.data.scripts[scriptId].name + ' [' + avg + ' ms avg in ' + self.scriptRuns[scriptId] + 'x]');
				}
			}
		}
	},

	getScriptActions: function (scriptId, timings) {
		var self = this;
		if (self.scriptCache[scriptId] && (typeof mode === 'undefined' || (typeof mode === 'string' && mode != 'sandbox'))) {
			return self.scriptCache[scriptId];
		} else {
			var script = ige.game.data.scripts[scriptId];
			if (!script.actions) return null;
			if (script) {
				if (timings) {
					var started = new Date();
					for (var i = 0; i < 1000; i++) {
						self.scriptCache[scriptId] = JSON.parse(JSON.stringify(script.actions));
					}
					var now = new Date();
					var elapsed = (now - started) / 1000;
					console.log('parse time: ' + elapsed + ' ms ' + script.name);
					console.log('*************************************');
					console.log(script.actions);
				} else {
					self.scriptCache[scriptId] = JSON.parse(JSON.stringify(script.actions));
				}
				return self.scriptCache[scriptId];
			}
		}
		return null;
	},

	scriptLog: function (str, tabCount) {
		if (this.entryCount > 50000)
			return;

		this.entryCount++

		tabs = ""
		for (i = 0; i < tabCount; i++) {
			tabs += "    "
		}

		// if (ige.server.isScriptLogOn)
		// console.log(tabs+str)

		// this.logStr = this.logStr  + tabs + str

		// if (this.entryCount > 50000)
		// {

		// 	var filename = "logs/"+ige.server.serverId+"script.log"

		// 	fs.writeFile(filename, this.logStr, function(err) {
		// 	    if(err) {
		// 	        return ScriptComponent.prototype.log(err);
		// 	    }
		// 	}); 

		// 	ScriptComponent.prototype.log("file saved: ", filename)
		// 	this.logStr = ""
		// 	// this.entryCount = 0
		// }
	},
	recordLast50Action: function (action) {
		var self = this;

		if (self.last50Actions.length > 50) {
			self.last50Actions.shift();
		}

		var scriptName = "[scriptName undefined]"
		if (ige.game.data.scripts[this.currentScriptId]) {
			scriptName = ige.game.data.scripts[this.currentScriptId].name
		}

		var record = "script '" + scriptName + "' in Action '" + action + "'";
		self.last50Actions.push(record);
	},
	errorLog: function (message) {
		var script = ige.game.data.scripts[this.currentScriptId]
		var log = "Script error '" + ((script) ? script.name : '') + "' in Action '" + this.currentActionName + "' : " + message
		this.errorLogs[this.currentActionName] = log
		ige.devLog("script errorLog", log, message)
		ScriptComponent.prototype.log(log)
		return log;
	}

})

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = ScriptComponent; }