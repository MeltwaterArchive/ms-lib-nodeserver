// Copyright (c) 2012 MediaSift Ltd.
// All rights reserved

function dsTimers(server) {

	// our main server object
	this.server = server;

    // setup timed events that dynamically-loaded code can listen for
    var sec  = 1000;
    var min  = sec * 60;
    var hour = min * 60;

    setInterval(this.onTimer.bind(this), sec,      "every1sec");
    setInterval(this.onTimer.bind(this), sec * 5,  'every5secs');
    setInterval(this.onTimer.bind(this), sec * 10, 'every10secs');
    setInterval(this.onTimer.bind(this), sec * 30, "every30secs");
    setInterval(this.onTimer.bind(this), min,      "every1min");
    setInterval(this.onTimer.bind(this), min * 5,  "every5mins");
    setInterval(this.onTimer.bind(this), min * 15, "every15mins");
    setInterval(this.onTimer.bind(this), min * 30, "every30mins");
    setInterval(this.onTimer.bind(this), hour,     "every1hour");
}

module.exports = dsTimers;

// ------------------------------------------------------------------------
// timer events
//
// Having our core server code emit timer events like this is an extremely
// convenient way to support any modules that want to execute periodically
// because we can make sure the event includes a reference to the main
// server object :)

dsTimers.prototype.onTimer = function (eventToSend) {
    this.server.emit(eventToSend, this.server);
};

