// Copyright (c) 2012 MediaSift Ltd.
// All rights reserved

function dsTimers(appServer) {

    // setup the duration for timed events, which modules can use
    // as parameters to setInterval
    var sec  = 1000;
    var min  = sec * 60;
    var hour = min * 60;

    this.every1sec   = sec;
    this.every5secs  = sec * 5;
    this.every10secs = sec * 10;
    this.every30secs = sec * 30;
    this.every1min   = min;
    this.every5mins  = min * 5;
    this.every10mins = min * 10;
    this.every15mins = min * 15;
    this.every30mins = min * 30;
    this.every1hour  = hour;
}
module.exports = dsTimers;