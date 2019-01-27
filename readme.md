##Setup##

Extends Matt Martz's Node Alarm Proxy to include presence detection and Slack notifications.  See https://github.com/NodeAlarmProxy/NodeAlarmProxy for more info.

To install: 
Download and run `npm install .`

To configure:
The `config-example.js` shows a setup configuration.  Replace the init parameters with your own and save as config.js.

To start server:
`node server.js` will start the server running.  

Recommended to run with PM2 to load on boot and keep alive.  

Log files will capture events as well with a timestamp in the specified timezone.  Slack messages will send based on level set in config file.

Geofence presence detect uses ifttt.com's 'Alert when you enter an area.' to update cell in a Google Sheet.  Sheet must be published as public as a single sheet as a CSV with the URL specified in the config file.  Headers should be "Status" and "Name" and values should be "Home" or "Away" for status and name should match the name in the config file people array.