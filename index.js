/**
 * Main file for node-pizza-delivery-api
 */

// load env variables
require('./lib/env').config();

// dependencies
var config = require('./lib/config');
var server = require('./lib/server');
var workers = require('./lib/workers');

// module container
var app = {};

// init function
app.init = function(){
    // show environment
    console.log('\x1b[34m%s\x1b[0m', 'Starting node-pizza-delivery in *' + config.envName + '* mode');

    // init server
    server.init();

    // init workers
    workers.init();
};

// app execution
app.init();

// export the module
module.exports = app;