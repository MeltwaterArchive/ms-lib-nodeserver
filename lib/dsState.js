// Copyright (c) 2012 MediaSift Ltd
// All rights reserved

// Copyright (c) 2012 MediaSift Ltd
// All rights reserved

// core module imports
var fs      = require('fs');
var path    = require('path');
var util    = require('util');

// our imports
var dsFeature = require('./dsFeature');

// our constructor
function dsState(appServer) {
    // call our parent constructor
    dsState.super_.call(this, appServer, {
        name: "dsState"
    });

    // where should we save our files?
    this.stateCacheFile = undefined;

    // is the cache out of date?
    this.dirty = false;

    // listen for config changes
    this.appServer.on('configChanged', this.onConfigChanged_State.bind(this));

    // check the dirty flag periodically
    this.appServer.on('every30secs', this.persistState.bind(this));
}
util.inherits(dsState, dsFeature);
module.exports = dsState;

dsState.prototype.onConfigChanged_State = function (appServer, oldConfig, newConfig) {
    // what has changed?
    if (oldConfig.stateCacheFile == newConfig.stateCacheFile) {
        // nothing
        return;
    }

    // something has changed ... but what?
    if (oldConfig.stateCacheFile === undefined && newConfig.stateCacheFile !== undefined) {
        // the user now has a state cache file defined
        this.stateCacheFile = newConfig.stateCacheFile;
        this.logNotice("Now using file " + this.stateCacheFile + " for the persistent state cache");

        // load the file ONLY when the process is first started!!
        if (appServer.state.isEmpty()) {
            this.loadState(appServer.state);
        }
        return;
    }

    if (oldConfig.stateCacheFile !== undefined && newConfig.stateCacheFile === undefined) {
        // the user wants to stop using the state cache
        this.logNotice("No longer using file " + this.stateCacheFile + " for the persistent state cache");
        this.stateCacheFile = undefined;
        return;
    }

    // if we get here, the user wants to start saving state to a different file now
    this.log("Switching persistent state cache from " + this.stateCacheFile + " to " + newConfig.stateCacheFile);
    this.persistState();
    this.stateCacheFile = newConfig.stateCacheFile;
};

dsState.prototype.loadState = function loadState(newState) {
    if (this.stateCacheFile === undefined)
    {
        // nothing to load
        return newState;
    }

    if(!path.existsSync(this.stateCacheFile)) {
        // no file to load
        this.logWarning("Cannot find file " + this.stateCacheFile + " to load");
        return newState;
    }

    data = fs.readFileSync(this.stateCacheFile, 'utf-8');
    // did we actually load anything?
    if (data.length === 0)
    {
        // no, we did not
        // this.logWarning("State file was empty");
        return;
    }

    // load up our state
    var rawState = JSON.parse(data);

    // copy them across to our state object
    for (var prop in rawState) {
        if (rawState.hasOwnProperty(prop)) {
            newState[prop] = rawState[prop];
        }
    }

    // log what has happened to the config
    this.logInfo('Loaded existing state from cache file ' + this.stateCacheFile);

    // all done
};

dsState.prototype.persistState = function persistState() {
    // do we have anywhere to save the state?
    if (this.stateCacheFile === undefined)
    {
        // no we do not
        // this.log('no cache filename defined');
        return;
    }

    // do we have any state to save?
    if (this.appServer.state === undefined)
    {
        // no, we do not
        // this.log('no state object to persist');
        return;
    }

    // is the cache marked as dirty?
    if (!this.dirty)
    {
        // no, it is not
        // this.log('cache not marked as dirty');
        return;
    }

    // if we get here, then we have state to save
    // convert the state into JSON
    var state = JSON.stringify(this.appServer.state);

    // write the state to disk
    fs.writeFile(this.stateCacheFile, state);

    // mark the cache as clean
    this.dirty = false;

    // all done
    this.logDebug('Persistent state cache updated');
};

dsState.prototype.markAsDirty = function () {
    // mark the persistent cache as dirty
    if (!this.dirty) {
        this.dirty = true;
        this.logInfo('Marking persistent cache as dirty');
    }
};