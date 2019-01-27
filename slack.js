var _Slack = require('slack-node');

module.exports = class SlackMessenger {

    constructor (webhookUri) {
        this._slack = new _Slack();
        this._slack.setWebhook(webhookUri);
    }

    send (msg) {
         this._slack.webhook({
            channel: "@jstover",
            username: "106Security",
            text: msg
        }, function(err, response) {
            console.log("Response from Slack: "  + response.response);
        });
    }
};



//var SM = new SlackMessenger('');
//SM.send("TEST");
