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

	// speed up or slow down ige.timeScale depending on discrepancy between client & server's time.
	timeSync: function (serverTime) {
		
		var latency = Math.floor(Date.now() - this.lastTimeSyncSentAt); // ping (round trip)
		
		if (statsPanels.latency) {
			statsPanels.latency._latencyPanel.update(latency, 1000);
		}	
		$('#updateping').html(Math.floor(latency)); // round trip time
	}
};

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgeTimeSyncExtension; }