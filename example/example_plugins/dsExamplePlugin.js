var util = require("util");

var dsFeature = require("../../lib/dsFeature.js");

function dsExamplePlugin(appServer) {
	dsExamplePlugin.super_.call(this, appServer, {
		name: "examplePlugin"
	});
}
module.exports = dsExamplePlugin;
util.inherits(dsExamplePlugin, dsFeature);

dsExamplePlugin.prototype.onConfigChanged = function(oldConfig, newConfig) {
	this.logNotice("config changed");
};

dsExamplePlugin.prototype.onPluginRemoved_ExamplePlugin = function() {

};