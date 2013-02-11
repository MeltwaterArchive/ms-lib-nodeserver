// Copyright (c) 2013 MediaSift Ltd
// All rights reserved

var util = require('util');
var winston = require('winston');
var os = require('os');
var syslog = require('node-syslog');

dsSyslog = function (options) {
	// call our constructor
	dsSyslog.super_.call(this, options);

	// deal with the options being empty
	options = options || {};

	// create our syslog connector
	this.syslog = syslog.init(
		dsSyslogTransport.log,
		syslog.LOG_PID | syslog.LOG_NDELAY,
		syslog.LOG_LOCAL5
	);

	// all done
};
util.inherits(dsSyslog, winston.Transport);
module.exports = dsSyslog;

// expose the name of this transport on the prototype
dsSyslog.prototype.name = 'dsSyslog';

// expose our core process name in the prototype
dsSyslog.prototype.processName = 'unknown-process';

// Core logging method exposed to Winston
dsSyslog.prototype.log = function (level, msg, meta, callback) {

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