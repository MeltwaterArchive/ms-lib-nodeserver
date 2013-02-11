// Copyright (c) 2013 MediaSift Ltd
// All rights reserved

var util = require('util'),
winston = require('winston'),
os = require('os');

var dsConsoleTransport = winston.transports.dsConsole = function (options) {
	this.name = 'dsConsoleTransport';
	this.level = options.level;
	this.options = options;
};

util.inherits(dsConsoleTransport, winston.Transport);

dsConsoleTransport.prototype.log = function (level, msg, meta, callback) {
	this.options.level = level;
	this.options.message = msg;
	this.options.meta = meta;

	var output = _log(this.options);

	if (level === 'error' || level === 'crit' || level === 'alert' || level === 'emerg') {
		process.stderr.write(output + '\n');
	} else {
		process.stdout.write(output + '\n');
	}

	this.emit('logged');
	callback(null, true);

};

var _log = function (options) {

	var output = "";
	var meta = options.meta;

	if (options.timestamp){
		output += (new Date()).toString() + " ";
	}

	// Always put in the process stuff
	output += os.hostname().split(".")[0] + " " + process.title + "["+process.pid+"] ";

	// Meta formatting
	if (meta){
		if (meta.toString() == "[object Array]"){
			meta = meta.join(",");
		} else if (meta.toString() == "[object Object]"){
			meta = util.inspect(meta, false, null, options.colorize);
		} else {
			meta = meta.toString();
		}
	}

	output += options.colorize ? winston.config.colorize(options.level) : options.level;
	output += (' ' + options.message);
	output += meta;

	return output;
};