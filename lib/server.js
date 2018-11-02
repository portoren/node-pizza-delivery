/**
 * Primary file for the web server
 */

// dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var path = require('path');
var fs = require('fs');
var util = require('util');
var debug = util.debuglog('server');

var config = require('./config');
var handlers = require('./handlers');
var helpers = require('./helpers');

// module container
var server = {};

// instantiate the HTTP server
server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req, res);
});

// instantiate the HTTPS server
server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
    server.unifiedServer(req, res);
});

// init function
server.init = function(){
    // start the HTTP server
    server.httpServer.listen(config.httpPort, function(){
        console.log('\x1b[33m%s\x1b[0m', 'HTTP server is listening on port ' + config.httpPort);
    });

    // start the HTTPS server
    server.httpsServer.listen(config.httpsPort, function(){
        console.log('\x1b[33m%s\x1b[0m', 'HTTPS server is listening on port ' + config.httpsPort);
    });
};

// All the server logic for both the http and https servers
server.unifiedServer = function(req, res) {

    // get url and parse it
    var parsedUrl = url.parse(req.url, true);

    // get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // get the query string object
    var queryStringObject = parsedUrl.query;

    // get the HTTP method
    var method = req.method.toLowerCase();

    // get the HTTP headers
    var headers = req.headers;

    // get the payload
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();

        // choose a handler to attend the request
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // create data object to be sent to choosen handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        chosenHandler(data, function(statusCode, responsePayload){
            // check the status code
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // check the response payload 
            responsePayload = typeof(responsePayload) == 'object' ? responsePayload : {};

            // stringify the response payload
            var payloadString = JSON.stringify(responsePayload);

            // set and send the reponse
            res.setHeader('Content-Type','application/json')
            res.writeHead(statusCode);
            res.end(payloadString);

            // if the response is 200 print green, otherwise print red
            if(statusCode == 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode + ' ' + payloadString);
            } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode + ' ' + payloadString);
            }
        });
    });
};

// router map
server.router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'products' : handlers.products,
    'cart' : handlers.cart,
    'checkout' : handlers.checkout,
};

// export the module
module.exports = server;