const Presence  = require('./presence.js');
const Person = require('./person.js');
const SlackMessenger = require('./slack.js');
const nap = require('./nodealarmproxy.js');
const config = require("./config.js");
const nest = require('unofficial-nest-api');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const moment = require('moment-timezone');
const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});
const appendTimestamp = format((info, opts) => {
  if(opts.tz)
    info.timestamp = moment().tz(opts.tz).format();
  return info;
});

const logger = createLogger({
  level: 'info',
  format: combine (format.json(),  appendTimestamp({tz: config.tz}), myFormat),
  defaultMeta: {service: 'user-service'},
  transports: [
    new transports.File({ filename: config.logFileNames.errors, level: 'error' }),
    new transports.File({ filename: config.logFileNames.zones })
  ]
});

var nestIsReady = false;
if (config.nest.toggleAwayWithPresence) {
    nest.login(config.nest.username, config.nest.password, function (err, data) {
        if (err) {
            logger.error("Nest login failed.");
            logger.error(err.message);
            slack.send("Nest login failed.");
            nestIsReady = false;
        } else {
            logger.info("Log in to Nest success.");
            slack.send("Nest login success.");
            nestIsReady = true;
        }
    });
}

var slack = new SlackMessenger(config.slackWebhook);
var ppl = [];
for (var p in config.people) {
	var x = new Person(config.people[p][0], config.people[p][1], config.people[p][2], config.refresh);
	x.on('left', function(pp) {
		logger.info(pp.name + ' left.');
		if (config.slackMessageLevel > 1) slack.send(pp.name + ' left.');
	});
	x.on('arrived', function (pp) {
		logger.info(pp.name + ' arrived.');
        if (config.slackMessageLevel > 1) slack.send(pp.name + ' arrived.');
	});
	ppl.push(x);
}

var presence = new Presence(ppl, config.refresh, config.googleSheet);
presence.on('SomeoneHome', function(isHome, p) {
    if (isHome) {
        if (nestIsReady) {
            nest.setAway(false);
            logger.info("Nest set to Home");
            if (config.slackMessageLevel>1)slack.send("Nest set to Home");
        }
    } else {
        if (nestIsReady) {
            nest.setAway(true);
            logger.info("Nest set to Away");
            if (config.slackMessageLevel>1)slack.send("Nest set to Away");
        }
    }
    if (config.slackMessageLevel>1) slack.send((isHome?"Someone is home.":"Everyone gone."));
    logger.info((isHome?"Someone is home.":"Everyone gone."));
});

logger.info("Security Server Watch Started.");
slack.send("Security Server Watch Started.");

var alarm = nap.initConfig({ password:config.password, //replace config.* with appropriate items
        serverpassword:config.serverpassword,
        actualhost:config.host,
        actualport:config.port,
        serverhost:'0.0.0.0',
        serverport:config.port,
        zone:16,
        partition:1,
        proxyenable:true,
        atomicEvents:true
});

var watchevents = ['609','610'];
var zone_labels = config.zoneLabels;
alarm.on('zoneupdate', function(data) {
        if (watchevents.indexOf(data.code) != -1) {
                var msg = zone_labels[data.zone] + " is " + (data.code==609?'open. ':'closed. ');
                for (var p in presence.people) msg = msg + presence.people[p].name + ' is ' + (presence.people[p].isHome()?'home. ':'away. ');
				logger.info(msg);

                if (presence.isSomeoneHome()) { //skip it - no need to alert
                    if (config.slackMessageLevel > 1 && !config.ignoreZones.includes(data.zone)) slack.send(msg); //for now to test it.
				} else { //no one is home, but a door opened...
                    if (config.slackMessageLevel > 0) slack.send("ALERT: NO ONE HOME.  DOOR OPENED.  " + msg);
				}
        }
});
