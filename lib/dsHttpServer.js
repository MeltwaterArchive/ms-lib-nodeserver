// Copyright (c) 2013 Mediasift Ltd
// All rights reserved

var restify = require('restify');
var util    = require('util');
var dsFeature = require('./dsFeature.js');

function dsHttpServer(appServer) {
	// call our parent constructor
	dsHttpServer.super_.call(this, appServer);

	// who are we?
	this.name = 'dsHttpServer';

	// our HTTP server
	this.server = undefined;

	// the config for our HTTP server
	this.serverConfig = undefined;

	// our expected list of routes
	this.routes = {};

	// listen for things happening
	this.appServer.on('configChanged', this.onConfigChanged_HttpServer.bind(this));
	this.appServer.on('httpRoutingChanged', this.onHttpRoutingChanged_HttpServer.bind(this));
}
util.inherits(dsHttpServer, dsFeature);
module.exports = dsHttpServer;

dsHttpServer.prototype.onConfigChanged_HttpServer = function (appServer, oldConfig, newConfig) {
	// do we have a HTTP server configured at all?
	if (newConfig.httpServer === undefined) {
		// no - so bail
		if (this.server !== undefined) {
			this.logNotice("Shutting down the HTTP server");
			this.stopServer();
			this.serverConfig = undefined;
		}

		return;
	}

	// did we have a HTTP server before?
	if (this.server === undefined) {
		// no - so start one
		this.serverConfig = newConfig.httpServer;
		this.logNotice("Starting up the HTTP server on port " + this.serverConfig.port);
		this.startServer();

		return;
	}

	// yes we did ... has the port changed?
	if (this.serverConfig.port !== newConfig.httpServer.port) {
		// yes ... best do something about that
		this.changeServerPort(this.serverConfig.port, newConfig.httpServer.port);
		this.serverConfig = newConfig.httpServer;
	}
};

dsHttpServer.prototype.onHttpRoutingChanged_HttpServer = function(feature) {
	// get the routes that this feature supports
	var featureRoutes = feature.getHttpRoutes();

	// do we have any existing routes to drop first?
	if (this.routes[feature.name] !== undefined) {
		this.removeRoutes(this.routes[feature.name]);
	}
	this.routes[feature.name] = undefined;

	// do we have any routes to add?
	if (featureRoutes.isEmpty()) {
		// no routes ... nothing to do
		return;
	}

	// add the new routes
	this.routes[feature.name] = featureRoutes;
	this.addRoutes(featureRoutes);
};

dsHttpServer.prototype.onFeatureShutdown = function(feature) {
	// do we have any existing routes to drop?
	if (this.routes[feature.name] !== undefined) {
		this.removeRoutes(this.routes[feature.name]);
		this.routes[feature.name] = undefined;
	}
};

dsHttpServer.prototype.startServer = function() {
	// start up the restful server :)
	this.server = restify.createServer();
	this.server.listen(this.serverConfig.port, function() {
		this.logNotice("HTTP server active on port " + this.serverConfig.port);

		// now add in the defined routes
		for(var i in this.routes) {
			if (this.routes.hasOwnProperty(i)) {
				this.addRoute(this.routes[i]);
			}
		}
	}.bind(this));
};

dsHttpServer.prototype.stopServer = function() {
	// close the socket
	this.server.close(this.serverConfig.port);

	// delete the HTTP server
	this.server = undefined;

	// delete our HTTP routes
	this.routes = {};

	// keep the user informed
	this.logNotice("HTTP server stopped");
};

dsHttpServer.prototype.changeServerPort = function(oldPort, newPort) {
	// do we have a server yet?
	if (this.server === undefined) {
		// no, we do not
		this.logWarning("Attempt to switch HTTP server port before HTTP server started");
		return;
	}

	// keep the user informed
	this.logNotice("Switching the HTTP server from port " + oldPort + " to " + newPort);

	// close the socket
	this.server.close();

	// open a new socket
	this.server.listen(newPort);
};

dsHttpServer.prototype.addRoutes = function(routes) {
	// do we have a server to add routes to?
	if (this.server === undefined) {
		// no we do not
		return;
	}

	var i = 0;

	// GET
	if (routes.get !== undefined) {
		for (i = 0; i < routes.get.length; i++) {
			this.server.get(routes.get[i].route, routes.get[i].handler);
			this.logInfo("Added HTTP server endpoint: GET " + routes.get[i].route);
		}
	}

	// POST
	if (routes.post !== undefined) {
		for (i = 0; i < routes.post.length; i++) {
			this.server.post(routes.post[i].route, routes.post[i].handler);
			this.logInfo("Added HTTP server endpoint: POST " + routes.post[i].route);
		}
	}

	// PUT
	if (routes.put !== undefined) {
		for (i = 0; i < routes.put.length; i++) {
			this.server.put(routes.put[i].route, routes.put[i].handler);
			this.logInfo("Added HTTP server endpoint: PUT " + routes.put[i].route);
		}
	}

	// DELETE
	if (routes.del !== undefined) {
		for (i = 0; i < routes.del.length; i++) {
			this.server.del(routes.del[i].route, routes.del[i].handler);
			this.logInfo("Added HTTP server endpoint: DEL " + routes.del[i].route);
		}
	}

	// HEAD
	if (routes.head !== undefined) {
		for (i = 0; i < routes.head.length; i++) {
			this.server.head(routes.head[i].route, routes.head[i].handler);
			this.logInfo("Added HTTP server endpoint: HEAD " + routes.head[i].route);
		}
	}

};

dsHttpServer.prototype.removeRoutes = function(routes) {
	// do we have a server to remove routes from?
	if (this.server === undefined) {
		// no, we do not
		return;
	}

	var i = 0;

	// GET
	if (routes.get !== undefined) {
		for (i = 0; i < routes.get.length; i++) {
			this.server.get(routes.get[i].route, undefined);
			this.logInfo("Removed HTTP server endpoint: GET " + routes.get[i].route);
		}
	}

	// POST
	if (routes.post !== undefined) {
		for (i = 0; i < routes.post.length; i++) {
			this.server.post(routes.post[i].route, undefined);
			this.logInfo("Removed HTTP server endpoint: POST " + routes.post[i].route);
		}
	}

	// PUT
	if (routes.put !== undefined) {
		for (i = 0; i < routes.put.length; i++) {
			this.server.put(routes.put[i].route, undefined);
			this.logInfo("Removed HTTP server endpoint: PUT " + routes.put[i].route);
		}
	}

	// DELETE
	if (routes.del !== undefined) {
		for (i = 0; i < routes.del.length; i++) {
			this.server.del(routes.del[i].route, undefined);
			this.logInfo("Removed HTTP server endpoint: DEL " + routes.del[i].route);
		}
	}

	// HEAD
	if (routes.head !== undefined) {
		for (i = 0; i < routes.head.length; i++) {
			this.server.head(routes.head[i].route, undefined);
			this.logInfo("Removed HTTP server endpoint: HEAD " + routes.head[i].route);
		}
	}
}