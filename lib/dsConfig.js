// Copyright (c) 2012 MediaSift Ltd
// All rights reserved

// our imports
var fs   = require('fs');
var path = require('path');
var util = require('util');
var dsFeature = require('./dsFeature');

// our constructor
dsConfig = function(appServer) {
    // call our parent constructor
    dsConfig.super_.call(this, appServer, {
        name: "dsConfig"
    });

    // the loaded configuration
    this.config = {};

    // the config files to track
    this.configFiles = [ ];

    // we want to know when the config has changed
    appServer.on("configChanged", this.onConfigChanged_Config.bind(this));
};

util.inherits(dsConfig, dsFeature);
module.exports = dsConfig;

dsConfig.prototype.onConfigChanged_Config = function(appServer, oldConfig, newConfig) {
    // update our cached config with the new config
    this.config = newConfig;
};

// ========================================================================
//
// Public API
//
// ------------------------------------------------------------------------

/**
 * Add a config file to the end of our list of config files to load
 *
 * @param {string} configFile path to the config file for us to watch
 */
dsConfig.prototype.addConfigFile = function addConfigFile(configFile) {
    // does the config file actually exist?
    if (!fs.existsSync(configFile)) {
        var msg = "cannot find config file '" + configFile + "'; cwd is '" + process.cwd() + "'";
        this.logError(msg);
        throw new Error(msg);
    }

    // add the config file to the list to watch
    this.configFiles.push(configFile);

    // add a log message
    this.logInfo('added config file ' + configFile + ' to our list to track');

    // all done
};

/**
 * Load all of the configs that we know about
 */
dsConfig.prototype.loadAllConfig = function loadAllConfig() {
    // keep the user informed
    this.logInfo("loading all known config file(s)");

    // load our new config from all known files
    var newConfig = {};
    var success   = this.loadAllConfigFiles(newConfig);

    // keep the user informed
    this.logInfo("finished loading all known config file(s)");

    // did we manage to load anything?
    if (success)
    {
        var oldConfig = this.config;
        this.config   = newConfig;

        // tell the app server's plugins that the config has changed
        this.logInfo("Notifying all plugins that the config has changed");
        this.appServer.emit('configChanged', this.appServer, oldConfig, this.config);
    }

    // all done
};

// ========================================================================
//
// Private API
//
// ------------------------------------------------------------------------

/**
 * Helper method - load all known config files
 *
 * @param  {object}  newConfig the object where the loaded config will go
 * @return {boolean}           true on success, false if there was a problem
 */
dsConfig.prototype.loadAllConfigFiles = function loadAllConfigFiles(newConfig) {
    // load all of the config files that we know about
    for (var i = 0; i < this.configFiles.length; i++) {
        if (!this.loadConfig(this.configFiles[i], newConfig)) {
            // failed to load
            return false;
        }
    }

    // signal success
    return true;
};

/**
 * Load one config file from disk, and merge into an existing config object
 */
dsConfig.prototype.loadConfig = function loadConfig(configFile, config) {
    // does the config file actually exist?
    if (!fs.existsSync(configFile)) {
        this.logError('cannot find config file ' + configFile + "; cwd is " + process.cwd());
        return false;
    }

    this.logDebug('reading config file: ' + configFile);
    data = fs.readFileSync(configFile, "utf-8");
    // did we actually load anything?
    if (data.length === 0)
    {
        // no, we did not
        // this happens when config files are changed - grrr
        this.logDebug("config file was empty");
        return;
    }

    // add our new config
    var rawConfig = {};
    try {
        rawConfig = JSON.parse(data);
    }
    catch (e) {
        this.logWarning("config file " + configFile + " is not valid JSON");
        return false;
    }

    // copy across the contents
    for (var prop in rawConfig) {
        if (rawConfig.hasOwnProperty(prop)) {
            config[prop] = rawConfig[prop];
        }
    }

    // watch this config file for changes
    fs.watchFile(configFile, this.updateConfig.bind(this));

    // success :)
    return true;
};

/**
 * React to config file changes on disk
 */
dsConfig.prototype.updateConfig = function updateConfig() {
    // keep the user informed :)
    this.logNotice("config file(s) has been edited ... reloading");

    // tell config manager to reload the configs
    var newConfig = {};
    var success   = this.loadAllConfigFiles(newConfig);

    // keep the user informed :)
    this.logNotice("finished reloading config file(s)");

    // tell all of our plugins that things have changed!
    if (success)
    {
        var oldConfig = this.config;
        this.config   = newConfig;
        this.appServer.emit('configChanged', this.appServer, oldConfig, this.config);
    }
};
