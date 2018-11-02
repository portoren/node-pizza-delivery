/**
 * Helpers for various tasks
 */

// dependencies
var crypto = require('crypto');
var https = require('https');
var url = require('url');
var querystring = require('querystring');
var util = require('util');
var debug = util.debuglog('helpers');

var config = require('./config');


// container for helpers
var helpers = {};

// create a ramdom string
helpers.createRandomString = function(len) {
    if(typeof(len) == 'number' && len > 0) {
        var possibleCharacters = 'qwertyuiopasdfghjklzxcvbnm1234567890';
        var str = '';
        for(i = 1; i <= len; i++) {
            str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        }
        return str;
    } else {
        return false;
    }
};

// creates a SHA256 hash
helpers.hash = function(str) {
    if(typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// parses a JSON string to an Object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (err) {
        debug(err);
        return {};
    }
};

// validates email address
helpers.isValidEmailAddress = function(email) {
    if(typeof(email) == 'string' && email.trim().length > 0) {
        var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        return re.test(email.trim().toLowerCase());
    } else {
        return false;
    }
};

// send email usgin Mailgun. If success callback returns the message id, otherwise false
helpers.sendMailgunEmail = function(email, subject, text, callback) {
    // validate input parameters
    email = typeof(email) == 'string' && helpers.isValidEmailAddress(email) ? email : false;
    subject = typeof(subject) == 'string' && subject.trim().length > 0 ? subject.trim() : false;
    text = typeof(text) == 'string' && text.trim().length > 0 ? text.trim() : false;

    if(email && subject && text) {
        // configure payload object
        var payload = {
            'from' : 'admin@' + config.mailgun.domain,
            'to' : email,
            'subject' : subject,
            'html' : text
        };

        // stringify the payload
        var strPayload = querystring.stringify(payload);

        // configure request details
        var parsedApiUrl = url.parse(config.mailgun.baseUrl, true);

        var requestDetails = {
            'protocol' : parsedApiUrl.protocol,
            'hostname' : parsedApiUrl.hostname,
            'method' : 'POST',
            'path' : parsedApiUrl.path + config.mailgun.domain + '/messages',
            'headers' : {
                'Authorization' : 'Basic ' + Buffer.from('api:' + config.mailgun.apiKey).toString('base64'),
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-length' : Buffer.byteLength(strPayload)
            }
        };

        // instantiate the request object
        var req = https.request(requestDetails, function(res){
            // Grab the status of the send request
            var status = res.statusCode;

            var data = '';

            // A chunk of data has been recieved.
            res.on('data', function(chunk){
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            res.on('end', function(){
                if(status == 200) {
                    callback(JSON.parse(data).id);
                } else {
                    callback(false);
                    debug('Status code returned was ' + status);
                }
            });
        });

        // bind to the error event so it doesn't get thrown
        req.on('error', function(e){
            callback(false);
            debug(e);
        });

        // add the payload
        req.write(strPayload);

        // end the request
        req.end();
    } else {
        callback(false);
        debug('Some parameters were missing or invalid: ', email, subject, text);
    }
}

// create a charge in Stripe and if success callback return the charge id, otherwise false
helpers.createStripeCharge = function(amount, currency, token, email, callback) {
    // validate input parameter
    amount = typeof(amount) == 'number' && amount >= 50 ? amount : false;
    currency = typeof(token) == 'string' && currency.trim().length == 3 ? currency.trim().toLowerCase() : false;
    token = typeof(token) == 'string' && token.trim().length > 0 ? token.trim() : false;
    email = typeof(email) == 'string' && helpers.isValidEmailAddress(email) ? email : false;
   
    if(amount && currency && token && email) {
        // configure payload object
        var payload = {
            'amount' : amount,
            'currency' : currency,
            'source' : token,
            'receipt_email' : email
        };

        // stringify the payload
        var strPayload = querystring.stringify(payload);

        // configure request details
        var parsedApiUrl = url.parse(config.stripe.baseUrl, true);

        var requestDetails = {
            'protocol' : parsedApiUrl.protocol,
            'hostname' : parsedApiUrl.hostname,
            'method' : 'POST',
            'path' : parsedApiUrl.path,
            'headers' : {
                'Authorization' : 'Basic ' + Buffer.from(config.stripe.secretKey + ':').toString('base64'),
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-length' : Buffer.byteLength(strPayload)
            }
        };

        // instantiate the request object
        var req = https.request(requestDetails, function(res){
            // Grab the status of the send request
            var status = res.statusCode;

            var data = '';

            // A chunk of data has been recieved.
            res.on('data', function(chunk){
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            res.on('end', function(){
                if(status == 200) {
                    callback(JSON.parse(data).id);
                } else {
                    callback(false);
                    debug('Status code returned was ' + status);
                }
                debug(JSON.parse(data));
            });
        });

        // bind to the error event so it doesn't get thrown
        req.on('error', function(e){
            callback(false);
            debug(e);
        });

        // add the payload
        req.write(strPayload);

        // end the request
        req.end();
    } else {
        callback(false);
        debug('Some parameters were missing or invalid: ', amount, currency, token, email);
    }
}

// Export module
module.exports = helpers;