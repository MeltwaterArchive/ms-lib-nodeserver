// Copyright (c) 2012 MediaSift Ltd.
// All rights reserved

var events = require("events");
var util   = require("util");

var dsLogging = require("./dsLogging");
var dsConfig  = require("./dsConfig.js");
var dsPlugins = require("./dsPlugins.js");
var dsTimers  = require("./dsTimers.js");

function dsServer() {

	// call our parent constructor
	dsServer.super_.call(this);

	// we need to allow unlimited listeners
	this.setMaxListeners(0);

	// a helper to look after our logging
	this.logManager = new dsLogging(this);

	// a helper to look after configuration
	this.configManager = new dsConfig(this);

	// our modular features
	// the default features are listed in config.default.json
	this.features = {};

	// a helper for looking after the features we provide
	this.featuresManager = new dsPlugins(this, "feature", this.features);

    // a helper for looking after timer events
    this.timers = new dsTimers(this);

    // by default, debugging is disabled
    this.debug = false;

	// we want to know when the config changes
	this.on('configChanged', this.onConfigChanged_Server.bind(this));
}

module.exports = dsServer;
util.inherits(dsServer, events.EventEmitter);

dsServer.prototype.onConfigChanged_Server = function(server, oldConfig, newConfig) {
    if (newConfig.debug !== undefined) {
        this.debug = newConfig.debug;
    }
    else {
        this.debug = false;
    }
};

dsServer.prototype.logDebug = function (msg) {
    // special case - we only emit debug log messages if debugging
    // has been switched on in the config file
    if (this.debug) {
        this.server.logManager.logger.debug(this.name + ":" + msg);
    }
};

dsServer.prototype.logInfo = function(msg) {
    this.logManager.logger.info(this.name + ": " + msg);
};

dsServer.prototype.logNotice = function(msg) {
    this.logManager.logger.notice(this.name + ": " + msg);
};

dsServer.prototype.logWarning = function(msg) {
    this.logManager.logger.warning(this.name + ": " + msg);
};

dsServer.prototype.logError = function(msg) {
    this.logManager.logger.error(this.name + ": " + msg);
};

dsServer.prototype.logCrit = function(msg) {
    this.logManager.logger.crit(this.name + ": " + msg);
};

dsServer.prototype.logAlert = function(msg) {
    this.logManager.logger.alert(this.name + ": " + msg);
};

dsServer.prototype.logEmerg = function(msg) {
    this.logManager.logger.emerg(this.name + ": " + msg);
};
