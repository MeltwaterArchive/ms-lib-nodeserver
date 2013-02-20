// Copyright (c) 2012 MediaSift Ltd
// All rights reserved

var events = require('events');
var util   = require('util');

function dsFeature(appServer, options) {
    options = options || {};

    // every feature *must* have a name
    if (options.name === undefined) {
        throw new Error("missing options.name");
    }

    // who are we?
    this.name = options.name;

    // remember our server object
    this.appServer = appServer;

    // by default, be less verbose in our logs
    this.debug = false;

    // we want to know when the config changes
    this.appServer.on('configChanged', this.onConfigChanged_Feature.bind(this));
}
module.exports = dsFeature;
util.inherits(dsFeature, events.EventEmitter);

dsFeature.prototype.onConfigChanged_Feature = function onConfigChanged_Feature(appServer, oldConfig, newConfig) {
    if (newConfig.debug !== undefined) {
        this.debug = newConfig.debug;
    }
    else {
        this.debug = false;
    }
};

// ========================================================================
//
// HTTP support
//
// ------------------------------------------------------------------------

dsFeature.prototype.getHttpRoutes = function() {
    // by default, a feature publishes no HTTP routing
    return {};
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
        this.appServer.logManager.logger.debug(this.name + ": " + msg);
    }
};

dsFeature.prototype.logInfo = function(msg) {
    this.appServer.logManager.logger.info(this.name + ": " + msg);
};

dsFeature.prototype.logNotice = function(msg) {
    this.appServer.logManager.logger.notice(this.name + ": " + msg);
};

dsFeature.prototype.logWarning = function(msg) {
    this.appServer.logManager.logger.warning(this.name + ": " + msg);
};

dsFeature.prototype.logError = function(msg) {
    this.appServer.logManager.logger.error(this.name + ": " + msg);
};

dsFeature.prototype.logCrit = function(msg) {
    this.appServer.logManager.logger.crit(this.name + ": " + msg);
};

dsFeature.prototype.logAlert = function(msg) {
    this.appServer.logManager.logger.alert(this.name + ": " + msg);
};

dsFeature.prototype.logEmerg = function(msg) {
    this.appServer.logManager.logger.emerg(this.name + ": " + msg);
};
