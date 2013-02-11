// Copyright (c) 2012 MediaSift Ltd
// All rights reserved

var events = require('events');
var util   = require('util');

function dsFeature() {
    this.name = "unknown feature";

    // by default, be less verbose
    this.debug = false;

}
module.exports = dsFeature;
util.inherits(dsFeature, events.EventEmitter);

dsFeature.prototype.init_Feature = function init_Feature(server) {
    // we want to know when the config changes
    server.on('configChanged', this.onConfigChanged_Feature.bind(this));
};

dsFeature.prototype.onConfigChanged_Feature = function onConfigChanged_Feature(server, oldConfig, newConfig) {
    if (newConfig.debug !== undefined) {
        this.debug = newConfig.debug;
    }
    else {
        this.debug = false;
    }
};

dsFeature.prototype.log = function log(msg) {
    util.log(this.name + ": " + msg);
};

dsFeature.prototype.debug = function debug(msg) {
    if (this.debug) {
        util.log("** DEBUG: " + this.name + ": " + msg);
    }
};