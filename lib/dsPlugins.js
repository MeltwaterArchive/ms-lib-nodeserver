// Copyright (c) 2012 MediaSift Ltd
// All rights reserved

var fs = require('fs');
var path = require('path');
var util = require('util');

var async = require('async');
var dsFeature = require('./dsFeature.js');

function dsPlugins(appServer, options) {
    // call our parent constructor
    dsPlugins.super_.call(this, appServer, {
        name: options.name
    });

    // deal with options
    options = options || {};

    // what are we loading?
    if (options.type === undefined) {
        throw new Error("missing options.type");
    }
    this.type = options.type;

    // where are the plugins located
    if (options.folders === undefined) {
        throw new Error("missing options.folders");
    }
    if (! options.folders instanceof Object) {
        throw new Error("options.folders must be an array");
    }
    this.folders = options.folders;

    // where do we look for the list?
    if (options.configRoot === undefined) {
        throw new Error("missing options.configRoot");
    }
    this.configRoot = options.configRoot;

    // when we trigger events, what do we start the name of our events with?
    this.emitPrefix = this.type.charAt(0).toLowerCase() + this.type.slice(1);

    // keep track of the plugins we have loaded
    this.plugins = {};

    // listen for config changes
    appServer.on('configChanged', this.onConfigChanged_Plugins.bind(this));
}
util.inherits(dsPlugins, dsFeature);
module.exports = dsPlugins;

dsPlugins.prototype.onConfigChanged_Plugins = function (appServer, oldConfig, newConfig) {
    // do we have any plugins configured?
    if (newConfig[this.configRoot] === undefined) {
        this.logNotice("no config for '" + this.configRoot + "' found");
        this.logDebug(JSON.stringify(newConfig));
    }

    // build up a new list of plugins to replace the old list
    var newPlugins = {};

    // work through the configured list of plugins
    for (var pluginName in newConfig[this.configRoot]) {
        if (newConfig[this.configRoot].hasOwnProperty(pluginName)) {
            // do we already have this plugin?
            if (this.plugins[pluginName] === undefined) {
                // no, it is a new plugin
                this.logNotice("Loading " + this.type + ": " + pluginName);
                this.addPlugin(newPlugins, pluginName, newConfig);
            }
            else {
                // yes ... keep it in the list
                newPlugins[pluginName] = this.plugins[pluginName];
                // remove it from the old list
                this.plugins[pluginName] = undefined;
            }
        }
    }

    // we need to de-activate the plugins we already have
    async.each(this.plugins, this.removePlugin.bind(this), function(){});

    // make the new list the king
    this.plugins = newPlugins;
};

dsPlugins.prototype.addPlugin = function (pluginsList, pluginName, newConfig) {
    // load the plugin into our list
    pluginsList[pluginName] = this.loadPlugin(pluginName);

    // did it work?
    if (pluginsList[pluginName] === undefined) {
        // no, it did not
        return;
    }

    // yes it did - we need to initialise the plugin now
    //
    // save on typing
    var plugin = pluginsList[pluginName];

    // tell the plugin that the config has changed
    var methodName = 'onConfigChanged';
    if (Object.getPrototypeOf(plugin)[methodName] !== undefined) {
        plugin[methodName](this.appServer, {}, newConfig);
    }

    // now tell the world about our new plugin
    this.appServer.emit(this.emitPrefix + 'Initialised', plugin);
};

dsPlugins.prototype.removePlugin = function(pluginName) {
    // find the plugin
    var plugin = this.plugins[pluginName];

    // tell the plugin that it is to be unloaded
    var methodName = 'onPluginRemoved';
    if (Object.getPrototypeOf(plugin)[methodName] !== undefined) {
        plugin[methodName]();
    }

    // remove it from the list
    this.plugins[pluginName] = undefined;

    // all done
};

dsPlugins.prototype.loadPlugin = function loadPlugin(pluginName) {
    var filename = this.findPlugin(pluginName);
    if (filename === undefined)
    {
        this.logWarning("unable to find " + this.type + " '" + pluginName + "'; skipping");
        return undefined;
    }

    // try and show a prettier filename
    var displayFilename = filename;
    var cwd = process.cwd() + '/';

    if (filename.substr(0, cwd.length) == cwd) {
        displayFilename = filename.substr(cwd.length);
    }

    // load it, baby!
    this.logDebug("Loading " + this.type + ": " + displayFilename);
    var plugin = new(require(filename))(this.appServer);

    return plugin;
};

dsPlugins.prototype.findPlugin = function(pluginName) {
    // search our list of folders where plugins can be found
    //
    // we search backwards, assuming that the folders later in the list
    // are meant to override folders earlier in the list
    for (var i = this.folders.length - 1; i >= 0; i--)
    {
        // which folder are we looking in?
        var searchDir = this.folders[i];

        this.logInfo("searching in " + searchDir);

        try {
            // what's the basename of the module we are looking for?
            var pathToModule = searchDir + '/' + pluginName;

            // where do we want to look for the module?
            var filenames = [
                pathToModule + "/package.json",
                pathToModule + ".js"
            ];

            for (var j = 0; j < filenames.length; j++) {
                var filename = filenames[j];

                this.logInfo("searching for " + filename);

                if (fs.existsSync(filename)) {
                    return pathToModule;
                }
            }
        }
        catch (e)
        {
            // do nothing
        }
    }

    // if we get here, then the file was not found
    this.logWarning("plugin " + pluginName + " not found");
    return undefined;
};