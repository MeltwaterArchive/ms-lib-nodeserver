// Copyright (c) 2013 MediaSift Ltd
// All rights reserved

var util = require('util'),
winston = require('winston'),
os = require('os');

dsConsole = function (options) {
	// call our constructor
	dsConsole.super_.call(this, options);

};
util.inherits(dsConsole, winston.transports.Console);
module.exports = dsConsole;

// expose the name of this transport on the prototype
dsConsole.prototype.name = 'dsConsole';

// Core logging method exposed to Winston
dsConsole.prototype.log = function (level, msg, meta, callback) {

	var output = _log({
		colorize:    this.colorize,
		json:        this.json,
		level:       level,
		message:     msg,
		meta:        meta,
		stringify:   this.stringify,
		timestamp:   this.timestamp,
		prettyPrint: this.prettyPrint,
		raw:         this.raw,
		label:       this.label
	});

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

	// add the level
	output += options.colorize ? winston.config.colorize(options.level) : options.level;

	// add the message
	output += (' ' + options.message);

	// add the metadata
	output += meta;

	// all done
	return output;
};