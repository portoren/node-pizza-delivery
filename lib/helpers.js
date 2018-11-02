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

helpers.composeReceipt = function(orderObj) {
    // js literals
    var top = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
<head>
<meta name="viewport" content="width=device-width" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Pizza Delivery Receipt</title>
<style type="text/css">
img {
max-width: 100%;
}
body {
-webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em;
}
body {
background-color: #f6f6f6;
}
@media only screen and (max-width: 640px) {
  body {
    padding: 0 !important;
  }
  h1 {
    font-weight: 800 !important; margin: 20px 0 5px !important;
  }
  h2 {
    font-weight: 800 !important; margin: 20px 0 5px !important;
  }
  h3 {
    font-weight: 800 !important; margin: 20px 0 5px !important;
  }
  h4 {
    font-weight: 800 !important; margin: 20px 0 5px !important;
  }
  h1 {
    font-size: 22px !important;
  }
  h2 {
    font-size: 18px !important;
  }
  h3 {
    font-size: 16px !important;
  }
  .container {
    padding: 0 !important; width: 100% !important;
  }
  .content {
    padding: 0 !important;
  }
  .content-wrap {
    padding: 10px !important;
  }
  .invoice {
    width: 100% !important;
  }
}
</style>
</head>
`;

var header = `
<body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;"
  bgcolor="#f6f6f6">

  <table class="body-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;"
    bgcolor="#f6f6f6">
    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
      <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;"
        valign="top"></td>
      <td class="container" width="600" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;"
        valign="top">
        <div class="content" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
          <table class="main" width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;"
            bgcolor="#fff">
            <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
              <td class="content-wrap aligncenter" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; text-align: center; margin: 0; padding: 20px;"
                align="center" valign="top">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;"
                      valign="top">
                      <h1 class="aligncenter" style="font-family: 'Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif; box-sizing: border-box; font-size: 32px; color: #000; line-height: 1.2em; font-weight: 500; text-align: center; margin: 40px 0 0;"
                        align="center">Receipt</h1>
                    </td>
                  </tr>
                  <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;"
                      valign="top">
                      <h2 class="aligncenter" style="font-family: 'Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif; box-sizing: border-box; font-size: 24px; color: #000; line-height: 1.2em; font-weight: 400; text-align: center; margin: 40px 0 0;"
                        align="center">Thanks for using Pizza Delivery Inc.</h2>
                    </td>
                  </tr>
                  <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    <td class="content-block aligncenter" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; text-align: center; margin: 0; padding: 0 0 20px;"
                      align="center" valign="top">
                      <table class="invoice" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; text-align: left; width: 80%; margin: 40px auto;">
                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 5px 0;"
                            valign="top">${orderObj.customer}<br style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />Order 
                            # ${orderObj.number}<br style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />${orderObj.datetime}</td>
                        </tr>
                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 5px 0;"
                            valign="top">
                            <table class="invoice-items" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; margin: 0;">
`;

var bottom = `
                              <tr class="total" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                <td class="alignright" width="80%" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; text-align: right; border-top-width: 2px; border-top-color: #333; border-top-style: solid; border-bottom-color: #333; border-bottom-width: 2px; border-bottom-style: solid; font-weight: 700; margin: 0; padding: 5px 0;"
                                  align="right" valign="top">Total</td>
                                <td class="alignright" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; text-align: right; border-top-width: 2px; border-top-color: #333; border-top-style: solid; border-bottom-color: #333; border-bottom-width: 2px; border-bottom-style: solid; font-weight: 700; margin: 0; padding: 5px 0;"
                                  align="right" valign="top">$ ${Number(orderObj.totals.total).toFixed(2)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    <td class="content-block aligncenter" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; text-align: center; margin: 0; padding: 0 0 20px;"
                      align="center" valign="top">
                      Pizza Delivery Inc. 123 Van Ness, San Francisco 94102
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <div class="footer" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
            <table width="100%" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
              <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                <td class="aligncenter content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; vertical-align: top; color: #999; text-align: center; margin: 0; padding: 0 0 20px;"
                  align="center" valign="top">Questions? Email <a href="mailto:" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">support@pizzadelivery.inc</a></td>
              </tr>
            </table>
          </div>
        </div>
      </td>
      <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;"
        valign="top"></td>
    </tr>
  </table>
</body>
</html>
`;

    // build details
    var receiptDetails = '';
    orderObj.items.forEach(function(item){
        var detail = `
            <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; border-top-width: 1px; border-top-color: #eee; border-top-style: solid; margin: 0; padding: 5px 0;"
                valign="top">${item.quantity + ' ' + item.name}</td>
            <td class="alignright" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; text-align: right; border-top-width: 1px; border-top-color: #eee; border-top-style: solid; margin: 0; padding: 5px 0;"
                align="right" valign="top">$ ${Number(item.price.total * item.quantity).toFixed(2)}</td>
            </tr>`;

        receiptDetails += detail;
    });

    return top + header + receiptDetails + bottom;
};

// Export module
module.exports = helpers;