// Copyright (c) 2013 Mediasift Ltd
// All rights reserved

function dsTimer(delay, callback) {
	// how frequently we want to trigger this event
	this.delay = delay;

	// the callback we're going to call
	this.callback = callback;

	// start the timer
	setTimeout(this.onTimer.bind(this), delay);
}

dsTimer.prototype.onTimer = function()
{
	// remember when we were called
	var start = new Date().getTime();

	// call the callback
	this.callback();

	// how long did that take?
	var end  = new Date().getTime();
	var diff = end - start;

	// we need to re-queue ourselves now
	if (diff > this.delay) {
		// we took too long - we want to run ASAP
		setTimeout(this.onTimer.bind(this), 1);
	}
	else {
		// we can afford to wait a little bit
		setTimeout(this.onTimer.bind(this), this.delay - diff);
	}
}