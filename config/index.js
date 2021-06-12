var localConfig = require('./local');
var stagingConfig = require('./staging');
var productionConfig = require('./production');

module.exports = {
	local: localConfig,
	staging: stagingConfig,
	production: productionConfig,
	default: productionConfig
};
