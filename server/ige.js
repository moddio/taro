const Q = require('q');
const _ = require('lodash');
const publicIp = require('public-ip');
request = require('request');
const OS = require('os');
const http = require('http');
const cluster = require('cluster');

// var oldLogFunction = console.log;
// console.log = function(args) {
// 	oldLogFunction(new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }), args)
// }

console.log('########################################################');
console.log('########################################################\n');
console.log('Executing IGE Under Node.js Version ' + process.version);

// Set a global variable for the location of
// the node_modules folder
modulePath = '../server/node_modules/';
function generateId() {
	let text = '';
	let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
	for (var i = 0; i < 24; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
  
	return text;
}

// Load the CoreConfig.js file
igeCoreConfig = require('../engine/CoreConfig.js');

var arr = igeCoreConfig.include,
	arrCount = arr.length,
	arrIndex,
	arrItem,
	itemJs;

// Check if we are deploying, if so don't include core modules
var argParse = require("node-arguments").process,
	args = argParse(process.argv, {separator:'-'});

if (!args['-deploy']) {
	// Loop the igeCoreConfig object's include array
	// and load the required files
	for (arrIndex = 0; arrIndex < arrCount; arrIndex++) {
		arrItem = arr[arrIndex];
		if (arrItem[0].indexOf('s') > -1) {
			itemJs = arrItem[1] + ' = ' + 'require("../engine/' + arrItem[2] + '")';
			// Check if there is a specific object we want to use from the
			// module we are loading
			if (arrItem[3]) {
				itemJs += '.' + arrItem[3] + ';';
			} else {
				itemJs += ';';
			}
			eval(itemJs);
		}
	}
} else {
	// Just include the basics to run IgeNode
	IgeBase = require('../engine/core/IgeBase');
	IgeClass = require('../engine/core/IgeClass');
}

if (process.env.ENV == 'dev')
{
	// Include the control class
	IgeNode = require('./IgeNode');	
	var igeNode = new IgeNode(); // master IgeNode
}
else
{
	var self = this;
	// Start the app
	IgeNode = require('./IgeNode');	
	var igeNode = new IgeNode();

	if (cluster.isMaster) // master cluster!
	{
		// Fork workers.
		var debug = process.execArgv.indexOf('--debug') !== -1;
		cluster.setupMaster({
			execArgv: process.execArgv.filter(function(s) { return s !== '--debug' })
		});
	} 
	else // slave workers! ;-;
	{
		// Workers can share any TCP connection
		// In this case it is an HTTP server
		// Include the control class

		process.env.cluster = 'worker';

		console.log(`Worker ${process.pid} started`);
	}
}