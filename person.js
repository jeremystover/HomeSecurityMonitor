const EventEmitter = require('events').EventEmitter;

module.exports = class Person extends EventEmitter {

    constructor (name, host, mac, refresh) {
        super();
        console.log("Initializing Person " + name);
        this.name = name;
        this.host = host;
        this.mac = mac;
        this.lastChange = new Date();
        this.fence = {'home': false, 'lastChange': new Date()};
        this.ping = {'home': false, 'lastChange': new Date()};
        this.bluetooth = {'home': false, 'lastChange': new Date()};
        this._currentValue = false;
        this.refresh = refresh;

        this.on('left', function(p) {
            console.log(p.name + " has left.");
        });

        this.on('arrived', function(p) {
            console.log(p.name + " has arrived.");
        });

        this.isHome = function () {

            var newValue = false;
            var newLastChange = Date();

            if (this.ping.home && this.ping.lastChange > (Date() - this.refresh * 1000)) {
                // if we have a recent ping that's probably a safe bet for home, but not a safe bet for away
                newValue = true;
                newLastChange = this.ping.lastChange;
            } else if (this.bluetooth.home && this.bluetooth.lastChange > (Date() - this.refresh * 1000)) {
                // if we have a recent bluetooth ping that's also a safe bet
                newValue = true;
                newLastChange = this.bluetooth.lastChange;
            } else if (this.fence.lastChange > (Date() - this.refresh * 3 * 1000)) {
                //if we have a relatively recently (3xrecent) fence come/go, that's probably a safe bet
                newValue = this.fence.home;
                newLastChange = this.fence.lastChange;
            } else {
                //we have a mess.   Let's go with the fence.
                newValue = this.fence.home;
                newLastChange = this.fence.lastChange;
            }
            if (newValue !== this._currentValue) {
                //this is a change in state.  try to do an event
                console.log("FIRING EVENT!");
                if (this._currentValue) {
                    console.log("LEFT EVENT from " + this.name);
                    this.emit('left', this);
                } else {
                    console.log("ARRIVED EVENT from " + this.name);
                    this.emit('arrived', this);
                }
                this.lastChange = newLastChange;
                this._currentValue = newValue;
            }
            return newValue;
        }
    }
}