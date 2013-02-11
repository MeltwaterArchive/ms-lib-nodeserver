// Copyright (c) 2012 MediaSift Ltd
// All rights reserved

var fs = require('fs');
var path = require('path');
var util = require('util');

var dsFeature = require('./dsFeature.js');

function dsPlugins(server, type, loadedList) {
    // call our parent constructor
    dsPlugins.super_.call(this, server);

    // who are we?
    this.name = 'dsPlugins';

    // what kind of plugins are we loading?
    this.type = type;

    // in the config, what will be the name of our path to search?
    this.configPathName = type + 'sPath';

    // in the config, what will be the name of the list to load?
    this.configListName = type + 's';

    // keep track of the plugins we have loaded
    this.plugins = loadedList;

    // listen for config changes
    server.on('configChanged', this.onConfigChanged.bind(this));
}
util.inherits(dsPlugins, dsFeature);
module.exports = dsPlugins;

dsPlugins.prototype.onConfigChanged = function onConfigChanged(server, oldConfig, newConfig) {
    // @TODO: disable plugins no longer listed in config file

    this.logNotice("dsPlugins[" + this.type + "]: config has changed");

    // do we have any new plugins?
    if (newConfig[this.configPathName] === undefined) {
        this.logNotice("dsPlugins[" + this.type + "]: no config for plugins");
        this.logDebug(JSON.stringify(newConfig));
        return;
    }

    // activate any new plugins
    this.addPlugins(server, oldConfig, newConfig, newConfig[this.configPathName], newConfig[this.configListName]);
};

dsPlugins.prototype.addPlugins = function addPlugins(server, oldConfig, newConfig, pluginsPath, plugins) {
    for (var pluginName in plugins)
    {
        // does the plugin already exist?
        if (this.plugins[pluginName] === undefined) {
            // load it from disk
            this.plugins[pluginName] = this.loadPlugin(pluginsPath, pluginName);

            // did it work?
            if (this.plugins[pluginName] !== undefined) {
                // yes it did - we need to initialise the plugin now

                // save on typing
                var plugin = this.plugins[pluginName];

                // call the plugin's initialiser
                plugin.init();

                // tell the plugin that the config has changed
                if (Object.getPrototypeOf(plugin).onConfigChanged !== undefined) {
                    plugin.onConfigChanged(server, oldConfig, newConfig);
                }

                // now tell the world about our new plugin
                this.server.emit('pluginInitialised', plugin);
            }
        }
    }
};

dsPlugins.prototype.loadPlugin = function loadPlugin(pluginsPath, pluginName) {
    var filename = this.findPlugin(pluginsPath, pluginName);
    if (filename === undefined)
    {
        this.logWarning("WARNING: unable to find " + this.type + ": " + pluginName + "; skipping");
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
    var plugin = new(require(filename))(this.server);

    return plugin;
};

dsPlugins.prototype.findPlugin = function(pluginsPath, pluginName) {

    for (var i = 0; i < pluginsPath.length; i++) {
        var searchDir = pluginsPath[i];

        if (searchDir.substr(0, 1) != '/' && searchDir.substr(1, 1) != ':'){
            // relative path ... assume relative from top folder
            searchDir = './' + searchDir;
        }

        try {
            // does the file exist?
            var modulename = fs.realpathSync(searchDir + '/' + pluginName);
            if (fs.existsSync(modulename + "/package.json")) {
                // success!
                return modulename;
            }
        }
        catch (e)
        {
            // do nothing
        }
    }

    // if we get here, then the file was not found
    return undefined;
};