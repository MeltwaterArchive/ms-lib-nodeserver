// Copyright (c) 2013 Mediasift Ltd
// All rights reserved

// core imports
var util = require("util");

// our imports
var restify   = require("restify");
var dsFeature = require("./dsFeature");

dsAssetFolders = function(appServer) {
    // call our parent constructor
    dsAssetFolders.super_.call(this, appServer, {
        name: "dsAssetFolders"
    });

    // what is the list of folders to serve?
    this.assetFolders = [];

    // listen for config changes
    this.appServer.on("configChanged", this.onConfigChanged_AssetFolders.bind(this));
};
util.inherits(dsAssetFolders, dsFeature);
module.exports = dsAssetFolders;

dsAssetFolders.prototype.onConfigChanged_AssetFolders = function(appServer, oldConfig, newConfig) {
    // do we have any config for static assets?
    if (newConfig.httpServer.assetFolders === undefined) {
        // nothing to do
        return;
    }

    // if we get here, then we have a list of static folders :)
    this.assetFolders = newConfig.httpServer.assetFolders;

    // tell the HTTP server to update the list
    this.appServer.emit('httpRoutingChanged', this);
};

dsAssetFolders.prototype.getHttpRoutes = function() {
    // the routes that we will return
    var routes = {
        get: []
    };

    // temp variable to hold the regex that we're going to build
    var regexString="";

    // add in all of the folders that contain static assets
    for (var i = 0; i < this.assetFolders.length; i++) {
        regexString = this.assetFolders[i] + "/*";
        regexString = regexString.replace(/\//g, "\\/");
        routes.get.push({
            route: new RegExp(regexString),
            handler: restify.serveStatic({
                directory: PUB_DIR
            })
        });
    }

    // all done
    return routes;
};