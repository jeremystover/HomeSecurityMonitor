const getCSV = require('get-csv');
const arpScanner = require('arpscan');
const EventEmitter = require('events').EventEmitter;

module.exports = class Presence extends EventEmitter  {

    constructor (people, refreshSeconds, csvSheet, pingMisses) {
        super();
        console.log("Initializing presence.");
        var _this = this;
        this.refresh = (refreshSeconds?refreshSeconds:600); //default 10 minutes
        this.people = people;
        this.pingMisses = pingMisses;

        this.isSomeoneHome = function() {
            var r = false;
            for (var p in this.people) if (this.people[p].isHome()) r = true;
            return r;
        }
        this.googleSheet = csvSheet;

        setInterval(function() {
            console.log("Checking presence B");
            _this.checkHome();
        }, this.refresh*1000);

        _this.checkHome();

    }

    checkHome(){
        //if (! _this) return;
        var cState = this.isSomeoneHome();

        console.log("Checking for updates.");
        //set the fence value
        getCSV(this.googleSheet + '&r=' + getInt(), {headers: true})
        .then(rows => {
            console.log("Got sheet response");
            for (var r in rows) {
                for (var p in this.people) {
                    if (this.people[p].name == rows[r].Name) {
                        if ((rows[r].Status == "Home" && !this.people[p].fence.home) || (rows[r].Status != "Home" && this.people[p].fence.home)) {
                            this.people[p].fence.home = !this.people[p].fence.home;
                            this.people[p].fence.lastChange = new Date();
                            this.people[p].isHome(); //dispatches event
                        } else {
                            console.log("Not dispatching home event. " + rows[r].Status + "//" + this.people[p].fence.home);
                        }
                    }
                }
            }
        });

        arpScanner((function (err, data){
            if(err) console.log("Error with ARP Scan." + err);

            for (var p in this.people) {
                var foundIp = false;
                for (var d in data) {
                    if (data[d].ip == this.people[p].host) {
                        var emitEvent = !this.people[p].ping.home;
                        this.people[p].ping.home = true;
                        this.people[p].ping.lastChange = new Date();
                        this.people[p].missedCount = 0;
                        if (emitEvent) this.people[p].isHome();
                        console.log("Ping Home. " + this.people[p].name);
                    }
                }
                if (!foundIp) {
                    this.people[p].missedCount = this.people[p].missedCount + 1;
                    if (this.people[p].missedCount > this.pingMisses && this.people[p].ping.home) {
                        this.people[p].ping.home = false;
                        this.people[p].ping.lastChange = new Date();
                        this.people[p].isHome();
                        console.log("Ping Away. " + this.people[p].name);
                    }
                }
            }
        }).bind(this), {});

        if (this.isSomeoneHome()!=cState) {
            //there was a change, emit an event
            this.emit('SomeoneHome', this.isSomeoneHome(), this);
        }
    }
}

function getInt() {
    min = 1;
    max = 10000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


//TEST
/*

const SlackMessenger = require('./slack.js');
const slack = new SlackMessenger('');

var jeremy = new Person('', '', '');
var elyse = new Person('','','');
var people = [jeremy,elyse];

var presence = new Presence(people, 5, '');

presence.jeremy.on('left', function() {console.log("Sending slack message."); slack.send('Jeremy left.')});
presence.jeremy.on('arrived', function() {console.log("Sending slack message."); slack.send('Jeremy arrived.')});
presence.elyse.on('left', function() {console.log("Sending slack message."); slack.send('Elyse left.')});
presence.elyse.on('arrived', function() {console.log("Sending slack message."); slack.send('Elyse arrived.')});
console.log("Listeners waiting");
*/
