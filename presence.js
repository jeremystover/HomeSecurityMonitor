var BTWatch = require('btwatch');
const getCSV = require('get-csv');
const ping = require('ping');
const EventEmitter = require('events').EventEmitter;

module.exports = class Presence extends EventEmitter  {

    constructor (people, refreshSeconds, csvSheet) {
        super();
        console.log("Initializing presence.");
        var _this = this;
        this.refresh = (refreshSeconds?refreshSeconds:600); //default 10 minutes
        this.people = people;

        this.isSomeoneHome = function() {
            var r = false;
            for (var p in this.people) if (this.people[p].isHome()) r = true;
            return r;
        }
        this.googleSheet = csvSheet;
        //set the bluetooth value
        for (var p in this.people) BTWatch.watch(this.people[p].mac);


        BTWatch.on('change', function (inRange, macAddress) {
            console.log("bt response:" + macAddress + ":" + inRange);
            for (var p in _this.people) {
                if ((inRange && macAddress==_this.people[p].mac && !_this.people[p].bluetooth.home) || (!inRange && macAddress==_this.people[p].mac && _this.people[p].bluetooth.home)) {
                    _this.people[p].bluetooth.home = !_this.people[p].bluetooth.home;
                    _this.people[p].bluetooth.lastChange = new Date();
                    _this.people[p].isHome(); //emit event
                }
            }
        });

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

        //set the ping value
        for (var p in this.people) {
            ping.promise.probe(this.people[p].host).then(function(isAlive){
                console.log('got ' + _this.people[p].name + ' ping ' + isAlive.alive);
                if ((isAlive.alive && !_this.people[p].ping.home) || (!isAlive.alive && _this.people[p].ping.home)) {
                    _this.people[p].ping.home = !_this.people[p].ping.home;
                    _this.people[p].ping.lastChange = new Date();
                    _this.people[p].isHome();
                }
            });
        }
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
