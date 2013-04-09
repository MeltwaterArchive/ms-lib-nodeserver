// Copyright (c) 2013 MediaSift Ltd
// All rights reserved

// system includes
var fs = require("fs");
var path = require("path");

var winston = require("winston");
var gelf = require('winston-graylog2').Graylog2;

function dsLogging(appServer) {
	// create a default logger
	this.logger = this.makeLogger({});
	this.logger.notice("dsLogging: logging started with default log transport");

	// remember that we're using default transport
	this.usingDefaultTransport = true;

	// remember our app server
	this.appServer = appServer;

	// we want to know when the config changes
	this.appServer.on('configChanged', this.onConfigChanged_Logging.bind(this));
}
module.exports = dsLogging;

dsLogging.prototype.onConfigChanged_Logging = function(appServer, oldConfig, newConfig) {

	// does the new config include a section on logging?
	if (typeof newConfig.logging == "undefined") {
		// are we already using the default logger?
		if (this.usingDefaultTransport) {
			// yes we are - nothing to do
		}
		else {
			// create a default logger
			this.logger = this.makeLogger({});
			this.logger.notice("dsLogging: logging successfully reconfigured to use default log transport");

			// remember that we're using the default transport
			this.usingDefaultTransport = true;
		}
	}
	else if (oldConfig.logging != newConfig.logging) {
		// update our logger
		this.logger = this.makeLogger(newConfig.logging);
		this.logger.notice("dsLogging: logging successfully reconfigured to use configured log transport(s)");

		// remember that we're no longer using the default transport
		this.usingDefaultTransport = false;
	}
};

dsLogging.prototype.makeLogger = function(config) {
	// the logger to return
	var logger = new winston.Logger();

	// do we have a config to use?
	if (typeof config.transports == "undefined") {
		// no, we do not
		// add our console logger
		logger.add(winston.transports.dsConsole, { timestamp: true });
	}
	else {
		for (var i in config.transports) {
			// add this transport to the logger
			//
			// yes, using eval() is utterly evil, but there seems to be
			// no other way to do this :(
			logger.add(eval(config.transports[i].name), config.transports[i].options);
		}
	}

	// use the syslog levels by default
	logger.setLevels(winston.config.syslog.levels);

	// we need to setup our colours
	var syslogColors = {
		debug: 'rainbow',
		info: 'bold cyan',
		notice: 'bold white',
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

// setup lazy loading of all of our transports
fs.readdirSync(path.join(__dirname, 'transports')).forEach(function (file) {
  var transport = file.replace('.js', '');

  winston.transports.__defineGetter__(transport, function () {
    return require('./transports/' + transport);
  });
});