// Copyright (c) 2012 MediaSift Ltd
// All rights reserved

var events = require('events');
var util   = require('util');

function dsFeature(server) {
    // we do not know who we are, yet
    this.name = "unknown feature";

    // remember our server object
    this.server = server;

    // by default, be less verbose in our logs
    this.debug = false;

    // we want to know when the config changes
    this.server.on('configChanged', this.onConfigChanged_Feature.bind(this));
}
module.exports = dsFeature;
util.inherits(dsFeature, events.EventEmitter);

dsFeature.prototype.onConfigChanged_Feature = function onConfigChanged_Feature(server, oldConfig, newConfig) {
    if (newConfig.debug !== undefined) {
        this.debug = newConfig.debug;
    }
    else {
        this.debug = false;
    }
};

// ========================================================================
//
// Logging support
//
// ------------------------------------------------------------------------

dsFeature.prototype.logDebug = function (msg) {
    // special case - we only emit debug log messages if debugging
    // has been switched on in the config file
    if (this.debug) {
        this.server.logManager.logger.debug(this.name + ":" + msg);
    }
};

dsFeature.prototype.logInfo = function(msg) {
    this.server.logManager.logger.info(this.name + ":" + msg);
};

dsFeature.prototype.logNotice = function(msg) {
    this.server.logManager.logger.notice(this.name + ":" + msg);
};

dsFeature.prototype.logWarning = function(msg) {
    this.server.logManager.logger.warning(this.name + ":" + msg);
};

dsFeature.prototype.logError = function(msg) {
    this.server.logManager.logger.error(this.name + ":" + msg);
};

dsFeature.prototype.logCrit = function(msg) {
    this.server.logManager.logger.crit(this.name + ":" + msg);
};

dsFeature.prototype.logAlert = function(msg) {
    this.server.logManager.logger.alert(this.name + ":" + msg);
};

dsFeature.prototype.logEmerg = function(msg) {
    this.server.logManager.logger.emerg(this.name + ":" + msg);
};
