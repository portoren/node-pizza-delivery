/**
 * Functions needed to handle data files
 */

// dependencies
var fs = require('fs');
var path = require('path');

var helpers = require('./helpers');

// container for the module (to be exported)
var db = {};

// base dir 
db.baseDir = path.join(__dirname, '..', '.data', path.sep);

// create a data file and write it
db.create = function(dir, file, data, callback) {
    // open the file for writting
    fs.open(db._composeFileName(dir, file), 'wx', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // convert data to string
            var stringData = JSON.stringify(data);

            // write to file
            fs.writeFile(fileDescriptor, stringData, function(err) {
                if(!err) {
                    // close the file
                    fs.close(fileDescriptor, function(err) {
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    });
                } else {
                    callback('Error writting to new file');
                }
            });
        } else {
            callback('Could not create new file, it may already exist');
        }
    });
};

// read a data file
db.read = function(dir, file, callback) {
    fs.readFile(db._composeFileName(dir, file), 'utf-8', function(err, data){
        if(!err && data) {
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    });
};

// update a data file
db.update = function(dir, file, data, callback) {
    // open the file for writting
    fs.open(db._composeFileName(dir, file), 'r+', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // convert data to string
            var stringData = JSON.stringify(data);

            // truncate data inside file
            fs.truncate(fileDescriptor, function(err) {
                if(!err) {
                    // write to file
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                        if(!err) {
                            // close the file
                            fs.close(fileDescriptor, function(err) {
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing existing file');
                                }
                            });
                        } else {
                            callback('Error writting to existing file');
                        }
                    });
                } else {
                    callback('Error truncating file');
                }
            });
        } else {
            callback('Could not open a file for updating, it may not exist yet');
        }
    });
};

// delete a data file
db.delete = function(dir, file, callback) {
    // unlink the file
    fs.unlink(db._composeFileName(dir, file), function(err) {
        if(!err) {
            callback(false);
        } else {
            callback('Error deleting file ' + db._composeFileName(dir, file));
        }
    });
};

// list all data files in a directory, without extension
db.list = function(dir, callback){
    fs.readdir(db.baseDir + dir + path.sep, function(err, files){
        if(!err && files && files.length > 0) {
            var filesNoExtention = [];
            files.forEach(function(fileName){
                filesNoExtention.push(fileName.replace('.json',''));
            });
            callback(false, filesNoExtention);
        } else {
            callback(err, files);
        }
    });
};

// hardcoded product list
db.products = [
    {
        "id": 298740,
        "name": "Regular Pizza",
        "price": {
            "total": 20,
            "tax": 1.76,
            "currency": "USD"
        }
    },
    {
        "id": 298741,
        "name": "Margherita Pizza",
        "price": {
            "total": 22,
            "tax": 1.94,
            "currency": "USD"
        }
    },
    {
        "id": 298742,
        "name": "Quattro Formaggi Pizza",
        "price": {
            "total": 24.5,
            "tax": 2.16,
            "currency": "USD"
        }
    },
    {
        "id": 298743,
        "name": "Quattro Stagioni Pizza",
        "price": {
            "total": 24.5,
            "tax": 2.16,
            "currency": "USD"
        }
    },
    {
        "id": 298744,
        "name": "Slice and Co. Special Pizza",
        "price": {
            "total": 24.5,
            "tax": 2.16,
            "currency": "USD"
        }
    },
    {
        "id": 298745,
        "name": "Hawaiian Pizza",
        "price": {
            "total": 24.5,
            "tax": 2.16,
            "currency": "USD"
        }
    },
    {
        "id": 298746,
        "name": "Vegetarian Pizza",
        "price": {
            "total": 24.5,
            "tax": 2.16,
            "currency": "USD"
        }
    },
    {
        "id": 298747,
        "name": "Meat Lover's Pizza",
        "price": {
            "total": 24.5,
            "tax": 2.16,
            "currency": "USD"
        }
    },
];


//
// PRIVATE functions
//
// compose absolute JSON file name from a given dir and file names
db._composeFileName = function(dir, file) {
    return db.baseDir + dir + path.sep + file + '.json';
}


// export the module
module.exports = db;
