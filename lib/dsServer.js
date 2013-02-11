// Copyright (c) 2012 MediaSift Ltd.
// All rights reserved

var events = require("events");
var util   = require("util");

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
}

module.exports = dsServer;
util.inherits(dsServer, events.EventEmitter);