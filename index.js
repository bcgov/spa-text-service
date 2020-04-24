// British Columbia Health Gateway Proxy
// See LICENSE

var winston = require('winston'),
    express = require('express');
    
// Set logging level within proxy
var log_level = process.env.LOG_LEVEL || 'info';

const SERVICE_AUTH_TOKEN = process.env.SERVICE_AUTH_TOKEN || 'NO_TOKEN';

//
// create winston logger
//
const logger = winston.createLogger({
    level: log_level,
    transports: [ new winston.transports.Console() ]
 });

//
// Init express
//
var app = express();

// Add status endpoint
app.get('/status', function (req, res) {
    res.send('OK');
});

app.post('/text', function (req, res) {
    const envNames = JSON.parse(req.get('SPA_TEXT_NAME'));
    let response = {};

    if (req.get('Authorization') === 'spatext ' + SERVICE_AUTH_TOKEN) {
        // Loop through environment variables searching for requested props.
        for (let envName in envNames) {
            if (envName && envName.length > 9 && envName.substring(0, 9).toUpperCase() === 'SPA_TEXT_') {
                response[envName] = process.env[envName];
            }
        }
        res.send(JSON.stringify(response));
    } else {
        res.sendStatus(401);
        log('Could not authenticate service.');
    }
    
    
});
app.listen(8080);

function log( message ) {
    logger.info( message );
}

log('spa-text-service started on port 8080');

