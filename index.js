// British Columbia Health Gateway Proxy
// See LICENSE

var https = require('https'),
    http = require('http'),
    winston = require('winston'),
    stringify = require('json-stringify-safe'),
    express = require('express'),
    moment = require('moment'),
    proxy = require('http-proxy-middleware');
    
const bodyParser = require('body-parser');

// Set logging level within proxy
var log_level = process.env.LOG_LEVEL || 'info';
var contentTypePlain = {'content-type': 'text/plain'};

const SERVICE_AUTH_TOKEN = process.env.SERVICE_AUTH_TOKEN || 'NO_TOKEN';

//
// create winston logger
//
const logger = winston.createLogger({
    level: log_level,
    // format: winston.format.simple(),
    // defaultMeta: { service: 'user-service' },
    transports: [ new winston.transports.Console() ]
 });

//
// Init express
//
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

// Add status endpoint
app.get('/status', function (req, res) {
    res.send('OK');
});

app.post('/text', function (req, res) {
    const body = req.body;
    let response = {};

    if (req.get('Authorization') === 'spatext ' + SERVICE_AUTH_TOKEN) {
        // Loop through environment variables searching for requested props.
        for (let i=0; i<body.length; i++) {
            const envName = body[i];
            if (envName && envName.length > 9 && envName.substring(0, 9).toUpperCase() === 'SPA_TEXT_') {
                response[envName] = process.env[envName];
            }
        }
        res.send(process.env);
        //res.send(response);
    } else {
        // Debugging purposes only.
        // res.send('Recieved: ' + req.get('Authorization') + '\nExpected: spatext ' + SERVICE_AUTH_TOKEN)
        
        res.sendStatus(401);
    }
    
    
});
app.listen(8080);

// Wrapper for logging - keep environment checks to single location
function log( message, isError = false ) {
    if (process.env.USE_SPLUNK && process.env.USE_SPLUNK == 'true') {

        if (isError) {
            logSplunkError(message);
        } else {
            logSplunkInfo(message)
        }

    } else {
        logger.info( message );
    }
}

function logSplunkError (message) {

    // log locally
    logger.error(message);

    var body = JSON.stringify({
        message: message
    })

    var options = {
        hostname: process.env.LOGGER_HOST,
        port: process.env.LOGGER_PORT,
        path: '/log',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Splunk ' + process.env.SPLUNK_AUTH_TOKEN,
            'Content-Length': Buffer.byteLength(body),
            'logsource': process.env.HOSTNAME,
            'timestamp': moment().format('DD-MMM-YYYY'),
            'program': 'spa-text-service',
            'serverity': 'error'
        }
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Body chunk: ' + JSON.stringify(chunk));
        });
        res.on('end', function () {
            console.log('End of chunks');
        });
    });

    req.on('error', function (e) {
        console.error('error sending to splunk-forwarder: ' + e.message);
    });

    // write data to request body
    req.write(body);
    req.end();
}

function logSplunkInfo (message) {

    // log locally
    logger.info(message);

    var body = JSON.stringify({
        message: message
    })

    var options = {
        hostname: process.env.LOGGER_HOST,
        port: process.env.LOGGER_PORT,
        path: '/log',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Splunk ' + process.env.SPLUNK_AUTH_TOKEN,
            'Content-Length': Buffer.byteLength(body),
            'logsource': process.env.HOSTNAME,
            'timestamp': moment().format('DD-MMM-YYYY'),
            'method': 'spa-text-service - Pass Through',
            'program': 'spa-text-service',
            'serverity': 'info'
        }
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Body chunk: ' + JSON.stringify(chunk));
        });
        res.on('end', function () {
            console.log('End of chunks');
        });
    });

    req.on('error', function (e) {
        console.error('error sending to splunk-forwarder: ' + e.message);
    });pathnameParts

    // write data to request body
    req.write(body);
    req.end();
}

log('spa-text-service started on port 8080');

