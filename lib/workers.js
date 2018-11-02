/**
 * Primary file for workers tasks
 */

// dependencies
var util = require('util');
var debug = util.debuglog('workers');

var log = require('./log');

// module container
var workers = {};

// look up for log files that must be rotated (compress)
workers._rotateLogs = function(){
    // list all the (non compressed) log files
    log.list(false, function(err, list){
        if(!err && list && list.length > 0) {
            list.forEach(function(fileName){
                log.rotate(fileName, function(err){
                    if(!err) {
                        debug('Success rotating logFile');
                    } else {
                        debug('Error rotataing logFile', err);
                    }
                });
            });
        } else {
            debug('Could not find any log to rotate');
        }
    });
};

// timer to execute the log-rotation once per day
workers._logRotationLoop = function(){
    setInterval(function(){
        workers._rotateLogs();
    }, 1000 * 60 * 60 * 24);

    // send to console in yellow
    console.log('\x1b[33m%s\x1b[0m', 'Worker: Log rotation is runnig');
};

// init function
workers.init = function(){
    // compress all the logs immediately
    workers._rotateLogs();

    // call compression loop
    workers._logRotationLoop();
};

// export the object
module.exports = workers;