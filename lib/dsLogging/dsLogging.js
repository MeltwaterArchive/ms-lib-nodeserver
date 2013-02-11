// Copyright (c) 2013 MediaSift Ltd
// All rights reserved

// system includes
var fs = require("fs");
var path = require("path");

var winston = require("winston");
var gelf = require('winston-graylog2').Graylog2;

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

	console.log(config);

	// do we have a config to use?
	if (typeof config.transports == "undefined") {
		// no, we do not
		// add our console logger
		logger.add(winston.transports.dsConsole);
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
		notice: 'white',
		warning: 'yellow',
		error: 'bold red',
		crit: 'inverse yellow',
		alert: 'bold inverse red',
		emerg: 'bold inverse magenta'
	};
	winston.addColors(syslogColors);

	logger.info("alive!");

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