// Copyright (c) 2013 MediaSift Ltd
// All rights reserved

var util = require('util');
var winston = require('winston');
var os = require('os');
var syslog = require('node-syslog');

var dsSyslogTransport = winston.transports.dsSyslog = function (options) {
	this.name = 'dsSyslogTransport';
	this.level = options.level;
	this.options = options;

	if (typeof this.syslog == "undefined"){
		this.syslog = syslog.init(
			"meteor",
			syslog.LOG_PID | syslog.LOG_NDELAY,
			syslog.LOG_LOCAL5
		);
	}

};

util.inherits(dsSyslogTransport, winston.Transport);

dsSyslogTransport.prototype.log = function (level, msg, meta, callback) {

	level = level.toUpperCase();
	if (level == "ERROR") {
		level = "ERR";
	}

	var log_level = syslog["LOG_" + level];
	if (typeof log_level === "undefined"){
		throw new Error("Invalid syslog level: " + level);
	}

	// Meta formatting
	if (meta){
		meta = " - " + meta;
		if (meta.toString() == "[object Array]"){
			meta = meta.join(",");
		} else if (meta.toString() == "[object Object]"){
			meta = util.inspect(meta);
		} else {
			meta = meta.toString();
		}
	}

	msg = msg + meta;

	syslog.log(log_level, msg);

	this.emit('logged');
	callback(null, true);

};