// Copyright (c) 2013 Mediasift Ltd
// All rights reserved

var util      = require("util");
var dsFeature = require("./dsFeature.js");
var lynx      = require("lynx");

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
		"post": [
			{
				route: "/stats/monitoring",
				handler: this.onPostMonitoring.bind(this)
			}
		],
		"put": [
			{
				route: "/stats/statsd/:host/:port",
				handler: this.onPutStatsdHost.bind(this)
			},
			{
				route: "/stats/prefix",
				handler: this.onPutPrefix.bind(this)
			}
		],
		"del": [
			{
				route: "/stats/prefix",
				handler: this.onDeletePrefix.bind(this)
			}
		],
		"get": [
			{
				route: "/stats/monitoring",
				handler: this.onGetMonitoring.bind(this)
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

	// are we monitoring?
	if (newConfig.stats.monitoring === undefined || !newConfig.stats.monitoring) {
		// not any more
		//
		// were we monitoring originally?
		if (this.isMonitoring()) {
			this.logNotice("Closing connection to statsd server at " + this.config.host + ":" + this.config.port);
			this.stopConnection();
		}

		// remember the new config
		this.config = newConfig.stats;

		// all done
		return;
	}

	// if we get here, we have been asked to start a connection, or to
	// re-configure an existing connection
	//
	// but only when the prefix has been set
	if (newConfig.stats.prefix === undefined) {
		// not any more
		//
		// were we monitoring originally?
		if (this.isMonitoring()) {
			this.logNotice("Closing connection to statsd server at " + this.config.host + ":" + this.config.port);
			this.stopConnection();
		}

		// remember the new config
		this.config = newConfig.stats;

		// all done
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

	// log what has happened
	this.logNotice("Setting stats prefix to " + req.params.prefix);

	// update our behaviour
	this.appServer.emit('configChanged', this.appServer, this.appServer.configManager.config, newConfig);

	// all done
	res.send(200);
	return next();
};

dsStats.prototype.onDeletePrefix = function(req, res, next) {
	var newConfig = this.appServer.configManager.config;

	// we're being given a new prefix to remember
	newConfig.stats.prefix = undefined;

	// log what has happened
	this.logNotice("Deleting stats prefix");

	// update our behaviour
	this.appServer.emit('configChanged', this.appServer, this.appServer.configManager.config, newConfig);

	// all done
	res.send(200);
	return next();
};

dsStats.prototype.onPostMonitoring = function(req, res, next) {
	var newConfig = this.appServer.configManager.config;

	// what are we doing?
	if (req.params.monitoring) {
		newConfig.stats.monitoring = true;
		this.logNotice("Switching on stats monitoring");
	}
	else {
		newConfig.stats.monitoring = false;
		this.logNotice("Switching off stats monitoring");
	}

	// update our behaviour
	this.appServer.emit('configChanged', this.appServer, this.appServer.configManager.config, newConfig);

	// all done
	res.send(200);
	return next();
};

dsStats.prototype.onGetMonitoring = function(req, res, next) {
	// our result object
	var result = {
		monitoring: this.isMonitoring()
	};

	// all done
	res.send(200, result);
	return next();
};

dsStats.prototype.isMonitoring = function() {
	if (this.appServer.configManager.config.stats === undefined ||
		this.appServer.configManager.config.stats.monitoring === undefined ||
		!this.appServer.configManager.config.stats.monitoring) {
		return false;
	}

	return true;
};

dsStats.prototype.increment = function(key) {
	// do we have live metrics atm?
	if (this.metrics === undefined) {
		// no
		return;
	}

	this.metrics.increment(this.config.prefix + '.' + key);
};

dsStats.prototype.count = function(key, value) {
	// do we have live metrics atm?
	if (this.metrics === undefined) {
		// no
		return;
	}

	// log the stats
	this.logInfo(this.config.prefix + '.' + key + ": " + value);

	this.metrics.count(this.config.prefix + '.' + key, value, 1);
};