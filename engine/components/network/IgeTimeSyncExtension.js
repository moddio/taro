/**
 * Adds client/server time sync capabilities to the network system.
 * This handles calculating the time difference between the clock
 * on the server and the clock on connected clients.
 */
var IgeTimeSyncExtension = {
	/**
	 * Gets / sets the number of milliseconds between client/server
	 * clock sync events. The shorter the time, the more accurate the
	 * client simulation will be but the more network traffic you
	 * will transceive. Default value of ten seconds (10000) is usually
	 * enough to provide very accurate results without over-using the
	 * bandwidth.
	 * @param val
	 * @return {*}
	 */
	timeSyncInterval: function (val) {
		if (val !== undefined) {
			this._timeSyncInterval = val;
			return this._entity;
		}

		return this._timeSyncInterval;
	},

	timeSyncStart: function () {
		if (ige.isClient) {
			this._timeSyncStarted = true;

			// Send a time sync request now so we
			// have a starting value to work with


			var self = this;

			console.log('Starting client/server clock sync running every', this._timeSyncInterval);
			this._timeSyncTimer = setInterval(function () {
				self._sendTimeSync(ige.network.id());
			}, this._timeSyncInterval);
		}

		return this._entity;
	},

	timeSyncStop: function () {
		this.log('Stopping client/server clock sync...');
		clearInterval(this._timeSyncTimer);
		this._timeSyncStarted = false;

		return this._entity;
	},

	_sendTimeSync: function (clientId) {

		// Send the time sync command
		// console.trace()
		//var timePassedSinceTick = Date.now() - ige._timeScaleLastTimestamp;
		this.send('_igeNetTimeSync', [ige._currentTime], clientId);
		this.lastTimeSyncSentAt = Date.now()
	},

	_onTimeSync: function (data, clientId) {
		if (ige.isClient) {

			var serverTime = parseInt(data[0]);
			// update ping
			if (this.lastTimeSyncSentAt) {
				this.timeSync(serverTime);
			}
		}

		if (ige.isServer) {
			this._sendTimeSync(clientId); // send response
		}
	},

	/**
	 * Converts a timestamp on the client to approx. time
	 * on the server using the difference in client/server
	 * clocks and the network latency between this client
	 * and the server.
	 * @param {Number} time The client timestamp (usually
	 * the result of new Date().getTime() or
	 * ige.currentTime()).
	 */
	timeToServerTime: function (time) {
		if (time !== undefined) {
			return time + this._latency;
		}

		return this._latency;
	},


	// speed up or slow down ige.timeScale depending on discrepancy between client & server's time.
	timeSync: function (serverTime) {
		
		var latency = Math.floor(Date.now() - this.lastTimeSyncSentAt); // ping (round trip)
		if (statsPanels.latency) {
			statsPanels.latency._latencyPanel.update(this._latency, 1000);
		}
		// this.rttSamples.push(latency)
		// var serverTimeElapsed = serverTime - this.lastServerTime;
		// var clientTimeElapsed = ige._currentTime - this.lastClientTime
		// this.totalServerTimeElapsed.push(serverTimeElapsed)
		// this.totalClientTimeElapsed.push(clientTimeElapsed)
		
		// ige._currentTime = Math.max(ige._currentTime, serverTime) // make sure clientTime isn't going back in time

		// collect 5 RTT first, and use the average value to compute client's currentTime
		// while (this.rttSamples.length >= 5) {
		// 	this.rttSamples.shift()
		// }

		// while (this.totalClientTimeElapsed.length >= 5) {
		// 	this.totalClientTimeElapsed.shift()
		// }

		// while (this.totalServerTimeElapsed.length >= 5) {
		// 	this.totalServerTimeElapsed.shift()
		// }

		// var totalRTT = this.rttSamples.reduce((previous, current) => current += previous);
		
		// if (this.totalClientTimeElapsed.length >= 4) {
		// 	var avgServerTimeElapsed = this.totalServerTimeElapsed.reduce((previous, current) => current += previous);
		// 	var avgClientTimeElapsed = this.totalClientTimeElapsed.reduce((previous, current) => current += previous);
		// 	var timeScale = avgServerTimeElapsed / avgClientTimeElapsed					
		// 	ige._timeScale = (ige._timeScale * 3/4) + (timeScale * 1/4) // average out timescale
		// }
		
		ige._currentTime = Math.max(serverTime - 100, Math.min(ige._currentTime, serverTime)) // time shouldn't go backwards
		$('#updateping').html(Math.floor(latency)); // round trip time

		// if (ige._currentTime < serverTime - 200 || serverTime + 200 < ige._currentTime) {
		// 	// if difference is too high, immediately sync the time
		// 	ige._currentTime = Math.max(ige._currentTime, serverTime) // time shouldn't go backwards
		// 	ige._timeScale = 1
		// 	this.totalServerTimeElapsed = []
		// 	this.totalClientTimeElapsed = []
		// } else {
			
		// 	this._latency = totalRTT / this.rttSamples.length;
		// 	$('#updateping').html(Math.floor(this._latency)); // round trip time
		// 	// if time difference between client & server is greater than 500ms, instantly sync the times
		
		// 	// var timePassedSinceTick = Date.now() - ige._timeScaleLastTimestamp;
		// 	var diff = (serverTime - ige._currentTime) / 5
		// 	adj = Math.max(-25, Math.min(25, diff)) // keep the adj within -10, 10 range
		// 	// console.log("currentTime", this._latency/2, ige._currentTime, "serverTime", serverTime, "adj", adj, "timePassedSinceTick", timePassedSinceTick)
		// 	ige._currentTime = Math.max(ige._currentTime, ige._currentTime + adj); // update currentTime based on serverTime with RTT considered.
		// 	// ige._timeScale = ige._timeScale * (1 + adj);
		// }

		// this.lastServerTime = serverTime
		// this.lastClientTime = ige._currentTime
					
		// ige._timeScaleLastTimestamp = Date.now(); // without this, when returning from a different tab, _currentTime will increment by [time spent away from game tab] x 2
	}
};

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgeTimeSyncExtension; }