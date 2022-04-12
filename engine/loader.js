var pathArray = window.location.href.split('/');
var igeRoot = `http://${pathArray[2]}/engine/`;
var igeClientRoot = `http://${pathArray[2]}/src/`;

console.log('igeRoot', igeRoot);

window.igeLoader = (function () {
	// Load the engine stylesheet
	// var css = document.createElement('link');
	// css.rel = 'stylesheet';
	// css.type = 'text/css';
	// css.media = 'all';
	// css.href = igeRoot + 'css/ige.css';

	// document.getElementsByTagName('head')[0].appendChild(css);

	var IgeLoader = function () {
		var self = this;
		var ccScript;

		this._loadingCount = 0;

		// Load the clientConfig.js file into browser memory
		ccScript = document.createElement('script');
		ccScript.src = `${igeRoot}CoreConfig.js`;
		ccScript.onload = function () {
			self.loadCoreConfig();
		};
		ccScript.addEventListener('error', function () {
			throw (`ERROR LOADING ${igeRoot}CoreConfig.js` + ' - does it exist?');
		}, true);

		// Load the physicsConfig.js file into browser memory
		pcScript = document.createElement('script');
		pcScript.src = `${igeRoot}PhysicsConfig.js`;

		ccScript.addEventListener('error', function () {
			throw (`ERROR LOADING ${igeRoot}PhysicsConfig.js` + ' - does it exist?');
		}, true);

		document.getElementsByTagName('head')[0].appendChild(ccScript);
		document.getElementsByTagName('head')[0].appendChild(pcScript);
	};

	IgeLoader.prototype.loadCoreConfig = function () {
		var self = this;

		if (typeof (igeCoreConfig) !== 'undefined') {
			// Load the client config
			ccScript = document.createElement('script');
			ccScript.src = `${igeClientRoot}ClientConfig.js`;
			ccScript.onload = function () {
				self.loadClientConfig();
			};
			ccScript.addEventListener('error', function () {
				throw ('ERROR LOADING ClientConfig.js - does it exist?');
			}, true);

			document.getElementsByTagName('head')[0].appendChild(ccScript);
		} else {
			throw ('ERROR READING igeCoreConfig object - was it specified in CoreConfig.js?');
		}
	};

	IgeLoader.prototype.loadClientConfig = function () {
		// Add the two array items into a single array
		this._coreList = igeCoreConfig.include;
		this._clientList = igeClientConfig.include;

		this._fileList = [];
		for (i = 0; i < this._coreList.length; i++) {
			// Check that the file should be loaded on the client
			if (this._coreList[i][0].indexOf('c') > -1) {
				this._fileList.push(igeRoot + this._coreList[i][2]);
			}
		}

		for (i = 0; i < this._clientList.length; i++) {
			this._fileList.push(igeClientRoot + this._clientList[i]);
		}

		this.loadNext();
	};

	IgeLoader.prototype.loadPhysicsConfig = function (clientPhysicsEngine, serverPhysicsEngine, callback) {
		// this.fileList should be empty after loadNext runs the first time
		// but lets show it and comment it out
		// this._fileList = [];
		this.callback = callback;
		// ternary to create an empty array if we are passed physicsEngine = ''
		this._physicsList = igePhysicsConfig.igePhysicsChoices[clientPhysicsEngine] ?
			igePhysicsConfig.igePhysicsChoices[clientPhysicsEngine] :
			// we need to have an IgeEntityPhysics class no matter what
			// 3/31/22 ran into an issue with this hack when I tried to add a file to PhysicsConfig
			[igePhysicsConfig.igePhysicsChoices[serverPhysicsEngine][1]];

		this._physicsGameClasses = igePhysicsConfig.gameClasses;
		for (i = 0; i < this._physicsList.length; i++) {
			// Check that the file should be loaded on the client
			if (this._physicsList[i][0].indexOf('c') > -1) {
				this._fileList.push(igeRoot + this._physicsList[i][2].slice(2));
			}
		}

		for (i = 0; i < this._physicsGameClasses.length; i++) {
			// Check that the file should be loaded on the client
			if (this._physicsGameClasses[i][0].indexOf('c') > -1) {
				this._fileList.push(igeClientRoot + this._physicsGameClasses[i][2].slice(7));
			}
		}

		this.loadNext();
	};

	IgeLoader.prototype.loadNext = function () {
		var url = this._fileList.shift();
		var script = document.createElement('script');
		var self = this;

		if (url !== undefined) {
			script.src = url;
			script.onload = function () {
				self.loadNext();
			};

			script.addEventListener('error', function () {
				throw (`ERROR LOADING ${url} - does it exist?`);
			}, true);

			document.getElementsByTagName('head')[0].appendChild(script);
		} else {
			if (typeof this.callback === 'function') {
				this.callback();
			}
		}
	};

	return new IgeLoader();
}());
