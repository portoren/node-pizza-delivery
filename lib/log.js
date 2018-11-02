/**
 * Logging tasks
 */

// dependencies
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var util = require('util');
var debug = util.debuglog('log');

// module container
var log = {};

// base path
log.baseDir = path.join(__dirname,'..','.logs',path.sep);

// append log line to errors.log
log.error = function(errorMessage, errorData){
    // build the log data
    var logData = {
        'datetime' : Date.now(),
        'message' : errorMessage,
        'data' : errorData
    };

    // write data to a file
    log.append('errors', JSON.stringify(logData), function(err){
        if(!err) {
            debug('Logging to file succeeded');
        } else {
            debug('Logging to file failed');
        }
    });
};

// append log line to messages.log
log.msg = function(message, dataObj){
    // build the log data
    var logData = {
        'datetime' : Date.now(),
        'message' : message,
        'data' : dataObj
    };

    // write data to a file
    log.append('messages', JSON.stringify(logData), function(err){
        if(!err) {
            debug('Logging to file succeeded');
        } else {
            debug('Logging to file failed');
        }
    });
};

// function to append log to file
log.append = function(fileName, strLine, callback) {
    // open the file for writting
    fs.open(log.baseDir + fileName + '.log', 'a', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // add a breakline 
            strLine = strLine + '\n';
            // write to file
            fs.appendFile(fileDescriptor, strLine, function(err) {
                if(!err) {
                    // close the file
                    fs.close(fileDescriptor, function(err) {
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing log file');
                        }
                    });
                } else {
                    callback('Error writting to log file');
                }
            });
        } else {
            debug(err);
            callback('Could not open log file for appending');
        }
    });
};

// list all the logFiles, and optionally include the compressed ones. 
log.list = function(includeCompressed, callback){
    fs.readdir(log.baseDir, function(err, files){
        if(!err && files && files.length > 0) {
            var fileList = [];
            files.forEach(function(fileName){
                // add uncompressed files
                if(fileName.indexOf('.log') > -1) {
                    fileList.push(fileName);
                }
                // add compressed files
                if(fileName.indexOf('.gz.b64') > -1 && includeCompressed) {
                    fileList.push(fileName);
                }
            });
            callback(false, fileList);
        } else {
            callback(err, files);
        }
    });
};

// rotate a logFile compressing it and truncating it.
log.rotate = function(fileName, callback){
    // compress log file
    log._compress(fileName, function(err){
        if(!err) {
            // truncate log file
            fs.truncate(log.baseDir + fileName, function(err){
                if(!err) {
                    callback(false);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};

// compress a .log file into a .gz.b64 file
log._compress = function(fileName, callback) {
    var destFileName = fileName.replace('.log','') + '-' + Date.now() + '.gz.b64';

    // read the source file
    fs.readFile(log.baseDir + fileName, 'utf8', function(err, inputString){
        if(!err && inputString) {
            // compress the data using gzip
            zlib.gzip(inputString, function(err, buffer){
                if(!err && buffer) {
                    // open destination file
                    fs.open(log.baseDir + destFileName, 'wx', function(err, fileDescriptor) {
                        if(!err && fileDescriptor) {
                            // write destination file
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err){
                                if(!err) {
                                    // close destination file
                                    fs.close(fileDescriptor, function(err){
                                        if(!err) {
                                            callback(false);
                                        } else {
                                            callback(err);
                                        }
                                    });
                                } else {
                                    callback(err);
                                }
                            });
                        } else {   
                            callback(err);
                        }
                    });
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};

// decompress a .gz.b64 file into a string variable
log._decompress = function(fileName, callback) {
    // read the source file
    fs.readFile(log.baseDir + fileName, 'utf8', function(err, fileContents){
        if(!err && fileContents) {
            var inputBuffer = Buffer.from(fileContents, 'base64');
            // decompress file contents
            zlib.unzip(inputBuffer, function(err, outputBuffer){
                if(!err && outputBuffer) {
                    var outputString = outputBuffer.toString();
                    callback(false, outputString);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};


// export module
module.exports = log;