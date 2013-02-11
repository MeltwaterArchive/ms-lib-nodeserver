// Copyright (c) 2013 MediaSift Ltd
// All rights reserved

var winston = require("winston");
var gelf = require('winston-graylog2').Graylog2;

// Load our own transport classes
// They auto-register with Winston when they load
require("./syslog-transport");
require("./console-transport");

function dsLogging(server) {
	// create a default logger
	this.logger = this.makeLogger({});

	// remember our server
	this.server = server;

	// we want to know when the config changes
	server.on('configChanged', this.onConfigChanged_Logging.bind(this));
}
module.exports = dsLogging;

dsLogging.prototype.onConfigChanged_Logging = function(server, oldConfig, newConfig) {

	// does the new config include a section on logging?
	if (typeof newConfig.logging == "undefined") {
		// create a default logger
		this.logger = this.makeLogger({});
	}
	else {
		// update our logger
		this.logger = this.makeLogger(newConfig.logging);
	}
};

dsLogging.prototype.makeLogger = function(config) {
	// the logger to return
	var logger = new winston.Logger();

	// do we have a config to use?
	if (typeof config.transports == "undefined") {
		// no, we do not
		// add our console logger
		logger.add(winston.transports.dsConsole);
	}
	else {
		var transport = {};
		for (var transportName in config.transports) {
			// create the transport, so that we can get its prototype
			transport = new(config.transports[transportName])();

			// add this transport to the logger
			logger.add(transport.prototype, config.transports[transportName].options);
		}
	}

	// use the syslog levels by default
	logger.setLevels(winston.config.syslog.levels);

	// we need to setup our colours
	var syslogColors = {
		debug: 'rainbow',
		info: 'cyan',
		notice: 'white',
		warning: 'yellow',
		error: 'bold red',
		crit: 'inverse yellow',
		alert: 'bold inverse red',
		emerg: 'bold inverse magenta'
	};
	winston.addColors(syslogColors);

	// all done
	return logger;
};

