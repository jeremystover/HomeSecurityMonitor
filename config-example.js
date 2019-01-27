exports.password = '';  //Envisalink password
exports.serverpassword=''; //Password you want for proxy server
exports.host = '';  //Envisalink host IP Address
exports.port = 4025;
exports.zoneLabels = ['','','']; //from dsc panel - leave first element array empty - zone 1 goes next, zone 2, etc.
exports.ignoreZones = [1,2]; //matches index from zoneLabels - ignores on info messages, will still log and send on alert/alarm if no one is home.
exports.tz = 'America/Los_Angeles';
exports.people = [ //array of arrays with each representing a person to track.  IP is static assigned IP when on same wifi, mac address of device for bluetooth
    ['jeremy', '1.1.1.25', 'EE:EE:EE:EE:EE:EE']
];
exports.googleSheet = 'https://docs.google.com/spreadsheets/d/e/2PACX-docidnumberhere/pub?gid=0&single=true&output=csv'; //use file publish to post a single sheet in csv format and copy that link here.  sheet should have "Status,Name" as headers and use IFTTT to set row cells to Home or Away under Status column and use names that match people array names above.
exports.slackWebhook = "https://hooks.slack.com/services/..."; //from Slack - see using api and webhooks to send messages
exports.logFileNames = {"zones":"zone.log","errors":"error.log"}; //names of log files
exports.refresh = 600; //frequency to check whether people are home
exports.slackMessageLevel = 2; //0 - none, 1 - alarm alerts when no one home but door open, 2 - all open/close and arrive/leave plus alerts