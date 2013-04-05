// Copyright (c) 2013 Mediasift Ltd
// All rights reserved

var util      = require("util");
var dsFeature = require("./dsFeature.js");

function dsStats(appServer) {
	// call our parent constructor
	dsStats.super_.call(this, appServer, {
		name: "dsStats"
	});

	// our active config
	this.config = {};

	// our link to statsd
	this.metrics = undefined;

	// our stats to report
	this.stats = {};

	// our routes
	appServer.httpManager.routes.dsStats = {
		"put": [
			{
				route: "/stats/statsd/:host/:port",
				handler: this.onPutStatsdHost.bind(this)
			},
			{
				route: "/stats/prefix/:prefix",
				handler: this.onPutPrefix.bind(this)
			}
		]
	};

	// listen for things happening
	this.appServer.on('configChanged', this.onConfigChanged_Stats.bind(this));
}
util.inherits(dsStats, dsFeature);
module.exports = dsStats;

dsStats.prototype.onConfigChanged_Stats = function(appServer, oldConfig, newConfig) {
	// do we have a statsd server configured at all?
	if (newConfig.stats === undefined) {
		// no - so bail
		if (this.metrics !== undefined) {
			this.logNotice("Closing connection to statsd server at " + this.config.host + ":" + this.config.port);
			this.stopConnection();
			this.config = {};
		}

		return;
	}

	// if we get here, then there are stats of some kind configured
	//
	// make sure the config is valid
	if (newConfig.stats.prefix === undefined) {
		this.logError("missing 'stats.prefix' setting in the config");

		return;
	}

	// did we have a statsd server configured before?
	if (this.metrics === undefined) {
		// no - so configure one
		this.config = newConfig.stats;
		this.logNotice("Opening connection to statsd server at " + this.config.host + ":" + this.config.port);
		this.startConnection();

		return;
	}

	// if we get here, we already had a connection of some kind
	// are we now logging to a different server?
	if (this.config.host !== newConfig.stats.host || this.config.port !== newConfig.stats.port) {
		// yes ... close and create a new connection
		this.logNotice("Switching connection to statsd server at " + newConfig.stats.host + ":" + newConfig.stats.port);
		this.stopConnection();
		this.config = newConfig.stats;
		this.startConnection();
	}
};

dsStats.prototype.startConnection = function() {
	this.metrics = new lynx(this.config.host, this.config.port);
};

dsStats.prototype.stopConnection = function() {
	this.metrics.close();
};

dsStats.prototype.onPutStatsdHost = function(req, res, next) {
	var newConfig = this.appServer.configManager.config;

	// we're being told where to connect to
	newConfig.stats.host = req.params.host;
	newConfig.stats.port = req.params.port;

	// update our behaviour
	this.appServer.emit('configChanged', this.appServer, this.appServer.configManager.config, newConfig);

	// all done
	res.send(200);
	return next();
};

dsStats.prototype.onPutPrefix = function(req, res, next) {
	var newConfig = this.appServer.configManager.config;

	// we're being given a new prefix to remember
	newConfig.stats.prefix = req.params.prefix;

	// update our behaviour
	this.appServer.emit('configChanged', this.appServer, this.appServer.configManager.config, newConfig);

	// all done
	res.send(200);
	return next();
};

dsStats.prototype.increment = function(key) {
	// do we have live metrics atm?
	if (this.metrics === undefined) {
		// no
		return;
	}

	this.metrics.increment(this.config.prefix + '.' + key);
};

dsStats.prototype.set = function(key, value) {
	// do we have live metrics atm?
	if (this.metrics === undefined) {
		// no
		return;
	}

	this.metrics.set(this.config.prefix + '.' + key, value);
};