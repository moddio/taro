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
		var pcScript;

		this._loadingCount = 0;

		// Load the clientConfig.js file into browser memory
		ccScript = document.createElement('script');
		ccScript.src = `${igeRoot}CoreConfig.js`;

		/*
		* Significant changes below
		* Let's test loading PhysicsConfig here
		*/
		pcScript = document.createElement('script');
		pcScript.src = `${igeRoot}PhysicsConfig.js`;

		ccScript.onload = function () {
			self.coreConfigReady();
		};

		// var loadingError = function (configType) {
		// 	throw new Error(`ERROR LOADING ${igeRoot}${configType}Config.js` + ' - does it exist?');
		// };

		// ccScript.addEventListener('error', loadingError('Core'), true);
		// pcScript.addEventListener('error', loadingError('Physics'), true);

		var documentHead = document.getElementsByTagName('head')[0];
		documentHead.appendChild(ccScript);
		documentHead.appendChild(pcScript);

		var coreAndPhysics = igeCoreConfig.include.concat()
	};

	IgeLoader.prototype.coreConfigReady = function () {
		var self = this;

		if (typeof (igeCoreConfig) !== 'undefined') {
			// Load the client config
			ccScript = document.createElement('script');
			ccScript.src = `${igeClientRoot}ClientConfig.js`;
			ccScript.onload = function () {
				self.clientConfigReady();
			};
			ccScript.addEventListener('error', function () {
				throw new Error('ERROR LOADING ClientConfig.js - does it exist?');
			}, true);

			document.getElementsByTagName('head')[0].appendChild(ccScript);
		} else {
			throw new Error('ERROR READING igeCoreConfig object - was it specified in CoreConfig.js?');
		}
	};

	IgeLoader.prototype.physicsConfigReady = function () {

	}

	IgeLoader.prototype.clientConfigReady = function () {
		// Add the two array items into a single array
		this._coreList = igeCoreConfig.include;
		this._clientList = igeClientConfig.include;
		// this._physicsList = igePhysicsConfig.selectPhysics(asdfasdf);

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

		/*
		* Significant changes above
		*/
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
				throw new Error(`ERROR LOADING ${url} - does it exist?`);
			}, true);

			document.getElementsByTagName('head')[0].appendChild(script);
		}
	};

	return new IgeLoader();
}());
