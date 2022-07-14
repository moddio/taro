/**
 * The client-side net.io component. Handles all client-side
 * networking systems.
 */
var IgeNetIoClient = {
	version: '1.0.0',
	_initDone: false,
	_idCounter: 0,
	_requests: {},
	_state: 0,
	usedServers: [],

	/**
	 * Gets the current socket id.
	 * @returns {String} The id of the socket connection to the server.
	 */
	id: function () {
		return this._id || '';
	},

	/**
	 * Starts the network for the client.
	 * @param {*} url The game server URL.
	 * @param {Function=} callback A callback method to call once the
	 * network has started.
	 */
	start: function (server, callback) {
		if (this._state === 3) {
			// We're already connected
			if (typeof (callback) === 'function') {
				callback(server);
			}
		} else {
			this.artificialDelay = 0;
			this.lagVariance = 0;

			var self = this;

			var gameId = ige.client.servers[0].gameId;

			self._startCallback = callback;

			var sortedServers = [server];
			var ignoreServerIds = [server.id];

			while (server = ige.client.getBestServer(ignoreServerIds)) {
				ignoreServerIds.push(server.id);
				sortedServers.push(server);
			}

			sortedServers.reduce(function (p, server) {
				var defer = $.Deferred();

				p.then(function () {
					// console.log(server, self._state);
					// if client's is not connected yet
					if (self._state < 2) {
						if (window.isStandalone) {
							console.log('connecting to a standalone server');
							url = `ws://${window.location.hostname}:2001`;
						} else {
							url = server.url;
						}

						self._url = url;

						var msg = `Connecting to net.io server at "${self._url}"...`;

						self.log(msg);
						console.log(msg);

						window.connectedServer = server;

						if (typeof (WebSocket) !== 'undefined') {
							self.connectToGS(url)
								.done(function () {
									window.activatePlayGame = true;
									// if (gameId && typeof analyticsUrl != 'undefined' && analyticsUrl) {
									// 	$.post(`${analyticsUrl}api/game-report/game-access/${gameId}/gs-connected`)
									// 		.then(function () { }, function (xhr, status, error) {
									// 			$.post('/api/log', {
									// 				event: 'gs-connected',
									// 				game: gameId,
									// 				status: xhr.status,
									// 				text: xhr.statusText
									// 			});
									// 		});
									// }
									defer.resolve();
								})
								.fail(function (err) {
									console.log('connection failed, retrying...', err || '');
									// defer.resolve();
								});
						} else {
							defer.reject('websockets are not available');
						}
					} else {
						defer.resolve();
					}
				});

				return defer;
			}, $.when())
				.done(function () {
					// we have gone through every possible server
					// and still client's not connected properly
					console.log('final stage', self._state);
					if (self._state < 3) {
						console.log('disconnecting from the server');
						self._state = 0; // Disconnected
						self._onDisconnectFromServer.apply(self, arguments);

						if (gameId && typeof analyticsUrl != undefined) {
							$.post(`${analyticsUrl}api/game-report/game-access/${gameId}/could-not-connect`)
								.fail(function (xhr) {
									$.post('/api/log', {
										event: 'could-not-connect',
										game: gameId,
										status: xhr.status,
										text: xhr.statusText
									});
								});
						}

						if ($('#menu-wrapper').is(':visible')) {
							$('#play-game-button .content').addClass('bg-danger');
							$('#play-game-button .content').html(
								'<i class=\'fa fa-group pr-3\'></i>' +
								'<div class="p-1">' +
								'<div>' +
								'<span>Connection Failed</span>' +
								'</div>' +
								'<div>' +
								'<small style=\'font-size: 10px;\'>Please select a different server</small>' +
								'</div>' +
								'</div>');
							$('#play-game-button').prop('disabled', false);
							console.log(ige.client.eventLog);
							window.activatePlayGame = true;
						} else {
							ige.menuUi.onDisconnectFromServer('igeNetIoClient #143');
						}
					}
				})
				.fail(function (error) {
					$.post('/api/log', {
						event: 'could-not-connect',
						game: gameId,
						text: error.toString()
					});
				});
		}
	},

	/**
	 * @param {string} url the game server URL
	 */
	connectToGS: function (url) {
		var self = this;
		var defer = $.Deferred();

		if (!url) {
			defer.reject('invalid url provided');
			return defer.promise();
		}

		this._io = new NetIo.Client(url);
		self._state = 1; // Connecting

		var timer = setTimeout(function () {
			console.log('connection timed out', url);
			// self._io.disconnect('connection timed out');

			clearTimeout(timer);

			self._state = 0;
			self._io.disconnect('Client timed out');

			defer.reject();
		}, 7000);

		// Define connect listener
		this._io.on('connect', function (clientId) {
			self._state = 2; // Connected
			self._id = clientId;
			self._onConnectToServer.apply(self, arguments);
		});

		// Define message listener
		this._io.on('message', function (data) {
			// if data receive before init queue that data
			if (!self._initDone && data && data.cmd != 'init') {
				if (!self.dataB4Init) {
					self.dataB4Init = [];
				}
				self.dataB4Init.push(arguments);
			}

			if (data.cmd) {
				var i; var commandCount = 0;

				// Check if the data is an init packet
				if (data.cmd === 'init') {
					clearTimeout(timer);

					// Set flag to show we've now received an init command
					self._initDone = true;
					self._state = 3; // Connected and init done

					// Setup the network commands storage
					self._networkCommandsLookup = data.ncmds;

					// Fill the reverse lookup on the commands
					for (i in self._networkCommandsLookup) {
						if (self._networkCommandsLookup.hasOwnProperty(i)) {
							self._networkCommandsIndex[self._networkCommandsLookup[i]] = i;
							commandCount++;
						}
					}

					// Setup default commands
					self.define('_igeRequest', function () { self._onRequest.apply(self, arguments); });
					self.define('_igeResponse', function () { self._onResponse.apply(self, arguments); });
					self.define('_igeNetTimeSync', function () { self._onTimeSync.apply(self, arguments); });

					self.log(`Received network command list with count: ${commandCount}`);

					// Setup time scale and current time
					ige.timeScale(parseFloat(data.ts));

					// Now fire the start() callback
					if (typeof (self._startCallback) === 'function') {
						self._startCallback({ url: url });
						delete self._startCallback;
					}

					// apply dataB4Init queue data
					if (self.dataB4Init && self.dataB4Init.length > 0) {
						for (var i = 0; i < self.dataB4Init.length; i++) {
							self._onMessageFromServer.apply(self, self.dataB4Init[i]);
						}
					}
					self.timeSyncStart();

					// setTimeout(function () {
					// 	if (location.protocol === 'http:' && location.search.indexOf('redirected=true') > -1) {
					// 		// Rollbar.info("Redirect User stayed connected for 10s, current socket state" + self._state);
					// 	}

					// 	if (window.history) {
					// 		var parts = location.href.split('?');
					// 		var domain = parts[0];
					// 		var queryString = parts[1] || '';
					// 		var queryParameters = queryString.split('&');

					// 		// remove query param redirect from string to prevent it's misuse on reload
					// 		queryParameters = queryParameters.filter(function (params) {
					// 			return params.indexOf('redirected=') === -1;
					// 		});

					// 		queryString = queryParameters.join('&');
					// 		var url = [domain, queryString].join('?');

					// 		window.history.pushState(null, "", url)
					// 	}
					// }, 10000);

					defer.resolve();
				}
			} else {
				self._onMessageFromServer.apply(self, arguments);
			}
		});

		// Define disconnect listener
		self._io.on('disconnect', function (data) {
			var reason = data.reason;
			var code = data.code;
			var wasClean = data.wasClean;

			ige.menuUi.onDisconnectFromServer('igeNetIoClient #263', reason);
		});

		// Define error listener
		this._io.on('error', function () {
			console.log('socket error', arguments);
			// Rollbar.critical("Error in socket connection", { arguments: arguments });
			self._onError.apply(self, arguments);
		});

		return defer.promise();
	},

	stop: function () {
		// Check we are connected
		if (self._state === 3) {
			this._io.disconnect('Client requested disconnect');
		}
	},

	/**
	 * Gets / sets a network command and callback. When a network command
	 * is received by the client, the callback set up for that command will
	 * automatically be called and passed the data from the incoming network
	 * packet.
	 * @param {String} commandName The name of the command to define.
	 * @param {Function} callback A function to call when the defined network
	 * command is received by the network.
	 * @return {*}
	 */
	define: function (commandName, callback) {
		if (commandName !== undefined && callback !== undefined) {
			// Check if this command has been defined by the server
			if (this._networkCommandsLookup[commandName] !== undefined) {
				this._networkCommands[commandName] = callback;
			} else {
				this.log(`Cannot define network command "${commandName}" because it does not exist on the server. Please edit your server code and define the network command there before trying to define it on the client!`, 'error');
			}

			return this._entity;
		} else {
			this.log('Cannot define network command either the commandName or callback parameters were undefined!', 'error');
		}
	},

	/**
	 * Sends a network message with the given command name
	 * and data.
	 * @param commandName
	 * @param data
	 */
	send: function (commandName, data) {
		var self = this;
		var commandIndex = this._networkCommandsLookup[commandName];
		var ciEncoded;

		// console.log("sending");
		if (commandIndex !== undefined) {
			if (this.debug()) {
				console.log(`Sending "${commandName}" (index ${commandIndex}) with data:`, data);
				this._debugCounter++;
			}

			ciEncoded = String.fromCharCode(commandIndex);

			if (ige.env) {
				setTimeout(function (ci, d) {
					self._io.send([ci, d]);
				}, (Math.random() * self.lagVariance) + self.artificialDelay, ciEncoded, data);
			} else {
				this._io.send([ciEncoded, data]);
			}
			// console.log("sent");
		} else {
			// console.log("error ?");
			this.log(`Cannot send network packet with command "${commandName}" because the command has not been defined!`, 'error');
		}
	},

	/**
	 * Sends a network request. This is different from a standard
	 * call to send() because the recipient code will be able to
	 * respond by calling ige.network.response(). When the response
	 * is received, the callback method that was passed in the
	 * callback parameter will be fired with the response data.
	 * @param {String} commandName
	 * @param {Object} data
	 * @param {Function} callback
	 */
	request: function (commandName, data, callback) {
		// Build the request object
		var req = {
			id: this.newIdHex(),
			cmd: commandName,
			data: data,
			callback: callback,
			timestamp: new Date().getTime()
		};

		// Store the request object
		this._requests[req.id] = req;

		// Send the network request packet
		this.send(
			'_igeRequest',
			{
				id: req.id,
				cmd: commandName,
				data: req.data
			}
		);
	},

	/**
	 * Sends a response to a network request.
	 * @param {String} requestId
	 * @param {Object} data
	 */
	response: function (requestId, data) {
		// Grab the original request object
		var req = this._requests[requestId];

		if (req) {
			// Send the network response packet
			this.send(
				'_igeResponse',
				{
					id: requestId,
					cmd: req.commandName,
					data: data
				}
			);

			// Remove the request as we've now responded!
			delete this._requests[requestId];
		}
	},

	/**
	 * Generates a new 16-character hexadecimal unique ID
	 * @return {String}
	 */
	newIdHex: function () {
		this._idCounter++;
		return (this._idCounter + (Math.random() * Math.pow(10, 17) + Math.random() * Math.pow(10, 17) + Math.random() * Math.pow(10, 17) + Math.random() * Math.pow(10, 17))).toString(16);
	},

	_onRequest: function (data) {
		// The message is a network request so fire
		// the command event with the request id and
		// the request data
		this._requests[data.id] = data;

		if (this.debug()) {
			console.log('onRequest', data);
			this._debugCounter++;
		}

		if (this._networkCommands[data.cmd]) {
			this._networkCommands[data.cmd](data.id, data.data);
		}

		this.emit(data.cmd, [data.id, data.data]);
	},

	_onResponse: function (data) {
		var id,
			req;

		// The message is a network response
		// to a request we sent earlier
		id = data.id;

		// Get the original request object from
		// the request id
		req = this._requests[id];

		if (this.debug()) {
			console.log('onResponse', data);
			this._debugCounter++;
		}

		if (req) {
			// Fire the request callback!
			req.callback(req.cmd, data.data);

			// Delete the request from memory
			delete this._requests[id];
		}
	},

	/**
	 * Called when the network connects to the server.
	 * @private
	 */
	_onConnectToServer: function () {
		this.log('Connected to server!');
		this.emit('connected');
	},

	/**
	 * Called when data from the server is received on the client.
	 * @param data
	 * @private
	 */
	_onMessageFromServer: function (data) {
		var ciDecoded = data[0].charCodeAt(0);
		var commandName = this._networkCommandsIndex[ciDecoded];
		// console.log("name = " + commandName, data);

		if (commandName === '_snapshot') {
			var snapshot = _.cloneDeep(data)[1];
			var newSnapshotTimeStamp = snapshot[snapshot.length - 1][1];

			// see how far apart the newly received snapshot is from currentTime
			if (snapshot.length) {
				var obj = {};
				// iterate through each entities
				for (var i = 0; i < snapshot.length; i++) {
					var ciDecoded = snapshot[i][0].charCodeAt(0);
					var commandName = this._networkCommandsIndex[ciDecoded];
					var entityData = snapshot[i][1];

					if (commandName === '_igeStreamData') {
						var entityData = snapshot[i].slice(1).split('&');
						var entityId = entityData[0];
						entityData.splice(0, 1); // removing entityId

						entityData = [
							parseInt(entityData[0], 16), // x
							parseInt(entityData[1], 16), // y
							parseInt(entityData[2], 16) / 1000 // rotation
						];

						obj[entityId] = entityData;
					} else {
						this._networkCommands[commandName](entityData);
					}
				}

				if (Object.keys(obj).length) {
					// sync server's timestamp with client's

					if (ige._currentTime > newSnapshotTimeStamp + 100 || ige._currentTime < newSnapshotTimeStamp - 100) {
						ige.timeDiscrepancy = newSnapshotTimeStamp - Date.now();
					} else {
						ige.timeDiscrepancy += ((newSnapshotTimeStamp - Date.now()) - ige.timeDiscrepancy) / 5; // rubberband
					}

					// add the new snapshot into empty array
					if (ige.snapshots.length == 0) {
						ige.snapshots.push([newSnapshotTimeStamp, obj]);
					} // if not empty, add it as ascending order based on timestamp
					else {
						var i = 0;
						while (ige.snapshots[i] && ige.snapshots[i][0] < newSnapshotTimeStamp) {
							i++;
							var spliceIndex = i;
						}

						if (spliceIndex != undefined) {
							ige.snapshots.splice(spliceIndex, 0, [newSnapshotTimeStamp, obj]);
						}
					}
				}
			}
		} else {
			if (this._networkCommands[commandName]) {
				if (this.debug()) {
					console.log(`Received "${commandName}" (index ${ciDecoded}) with data:`, data[1]);
					this._debugCounter++;
				}

				this._networkCommands[commandName](data[1]);
			}

			this.emit(commandName, data[1]);
		}
	},

	/**
	 * Called when the client is disconnected from the server.
	 * @param data
	 * @private
	 */
	_onDisconnectFromServer: function (data) {
		if (data === 'booted') {
			this.log('Server rejected our connection because it is not accepting connections at this time!', 'warning');
		} else {
			this.log('Disconnected from server!');
		}
		this.emit('disconnected');
	},

	/**
	 * Called when the client has an error with the connection.
	 * @param {Object} data
	 * @private
	 */
	_onError: function (data) {
		this.log(`Error with connection: ${data.reason}`, 'error');
	}
};

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = IgeNetIoClient; }
