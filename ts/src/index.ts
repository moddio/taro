const Game = IgeClass.extend({
	classId: 'Game',

	init (App: typeof Client, options?: Record<string, unknown>) {
		// Create the engine
		ige = new IgeEngine(options);
		console.log('ige initialized', ige.isClient, ige.isServer); // debug?

		if (ige.isClient) ige.client = new App();
		if (ige.isServer) ige.server = new App(options);
	}
});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') {
	module.exports = Game; // TBD: Use ESM exports instead.
} else {
	/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
	const game = new Game(Client);
}
