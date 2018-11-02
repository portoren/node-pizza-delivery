/**
 * Primary file for workers tasks
 */

// dependencies
var util = require('util');
var debug = util.debuglog('workers');

var log = require('./log');
var db = require('./data');

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

// delete expired files
workers._collectGarbage = function(){
    // set current time
    var currentTime = Date.now();
    // define directories to purge by expiration
    var dirsToPurge = [
        {
            'dir' : 'tokens',
            'id' : 'tokenId'
        },
        {
            'dir' : 'carts',
            'id' : 'cartId'
        }
    ];
    dirsToPurge.forEach(function(entity){
        // list all files
        db.list(entity.dir, function(err, list){
            if(!err) {
                list.forEach(function(file){
                    // read each file
                    db.read(entity.dir, file, function(err, data){
                        if(!err) {
                            // check for expiration
                            if(data.expires < currentTime){
                                // delete the file
                                db.delete(entity.dir, data[entity.id], function(err){
                                    if(err) {
                                        log.error('Could not delete expired object in ' + entity.dir, err);
                                    }
                                });
                            }
                        } else {
                            log.error(`Could not read file ${entity.dir + '/' + file + '.json'} to validate expiration`, err);
                        }
                    });
                });
            } else {
                log.error(`Could not list ${entity.dir} to purge`, err);
            }
        });
    });
};

// timer to execute the garbageCollector once per hour
workers._garbageCollectorLoop = function(){
    setInterval(function(){
        workers._rotateLogs();
    }, 1000 * 60 * 60);

    // send to console in yellow
    console.log('\x1b[33m%s\x1b[0m', 'Worker: Garbage collector is runnig');
};

// init function
workers.init = function(){
    // compress all the logs immediately
    workers._rotateLogs();

    // call compression loop
    workers._logRotationLoop();

    // collect garbage
    workers._collectGarbage();

    // call garbage collector loop
    workers._garbageCollectorLoop();
};

// export the object
module.exports = workers;