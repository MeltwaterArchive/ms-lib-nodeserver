// Copyright (c) 2012 MediaSift Ltd.
// All rights reserved

var events = require("events");
var util   = require("util");

var dsLogging    = require("./dsLogging");
var dsConfig     = require("./dsConfig.js");
var dsHttpServer = require("./dsHttpServer.js");
var dsPlugins    = require("./dsPlugins.js");
var dsState      = require("./dsState.js");
var dsStats      = require("./dsStats.js");
var dsTimers     = require("./dsTimers.js");

function dsAppServer(options) {

	// call our parent constructor
	dsAppServer.super_.call(this);

    // what is our name?
    if (options.name === undefined) {
        throw new Error("missing options.name");
    }
    this.name = options.name;

	// we need to allow unlimited listeners
	this.setMaxListeners(0);

	// a helper to look after our logging
	this.logManager = new dsLogging(this);

	// a helper to look after configuration
	this.configManager = new dsConfig(this);

	// a helper for looking after the features we provide
	this.featuresManager = new dsPlugins(this, {
        name: "FeaturesManager",
        type: "feature",
        folders: [ APP_DIR + "/features", TOP_DIR + "/node_modules" ],
        configRoot: "features"
    });

	// a helper for looking after our persistent state
	this.stateManager = new dsState(this);

	// our persistent state
	this.state = {};

    // a helper for looking after timer events
    this.timers = new dsTimers(this);

    // a helper for looking after our HTTP server
    this.httpManager = new dsHttpServer(this);

    // support for logging metrics to statsd
    this.statsManager = new dsStats(this);

    // by default, debugging is disabled
    this.debug = false;

	// we want to know when the config changes
	this.on('configChanged', this.onConfigChanged_AppServer.bind(this));
}
module.exports = dsAppServer;
util.inherits(dsAppServer, events.EventEmitter);

// ========================================================================
//
// Support for dealing with reloaded config files
//
// ------------------------------------------------------------------------

dsAppServer.prototype.onConfigChanged_AppServer = function(appServer, oldConfig, newConfig) {
    if (newConfig.debug !== undefined) {
        this.debug = newConfig.debug;
    }
    else {
        this.debug = false;
    }
};

// ========================================================================
//
// Logging support
//
// ------------------------------------------------------------------------

dsAppServer.prototype.logDebug = function (msg) {
    // special case - we only emit debug log messages if debugging
    // has been switched on in the config file
    if (this.debug) {
        this.logManager.logger.debug(this.name + ":" + msg);
    }
};

dsAppServer.prototype.logInfo = function(msg) {
    this.logManager.logger.info(this.name + ": " + msg);
};

dsAppServer.prototype.logNotice = function(msg) {
    this.logManager.logger.notice(this.name + ": " + msg);
};

dsAppServer.prototype.logWarning = function(msg) {
    this.logManager.logger.warning(this.name + ": " + msg);
};

dsAppServer.prototype.logError = function(msg) {
    this.logManager.logger.error(this.name + ": " + msg);
};

dsAppServer.prototype.logCrit = function(msg) {
    this.logManager.logger.crit(this.name + ": " + msg);
};

dsAppServer.prototype.logAlert = function(msg) {
    this.logManager.logger.alert(this.name + ": " + msg);
};

dsAppServer.prototype.logEmerg = function(msg) {
    this.logManager.logger.emerg(this.name + ": " + msg);
};
