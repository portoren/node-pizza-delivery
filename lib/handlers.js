/**
 * HTTP request handlers
 */

// dependencies
var util = require('util');
var debug = util.debuglog('handlers');

var db = require('./data');
var helpers = require('./helpers');
var log = require('./log');

// module container
var handlers = {};

// users handler
handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for the users operations
handlers._users = {};

// users - post
// required data: firstName, lastName, email, password, address1, city, state, postalCode
// optional data: address2
handlers._users.post = function(data, callback){
    // Check that all required fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var email = typeof(data.payload.email) == 'string' && helpers.isValidEmailAddress(data.payload.email) ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var address1 = typeof(data.payload.address1) == 'string' && data.payload.address1.trim().length > 0 ? data.payload.address1.trim() : false;
    var city = typeof(data.payload.city) == 'string' && data.payload.city.trim().length > 0 ? data.payload.city.trim() : false;
    var state = typeof(data.payload.state) == 'string' && data.payload.state.trim().length > 0 ? data.payload.state.trim() : false;
    var postalCode = typeof(data.payload.postalCode) == 'string' && data.payload.postalCode.trim().length > 0 ? data.payload.postalCode.trim() : false;
    // check optional fields
    var address2 = typeof(data.payload.address2) == 'string' ? data.payload.address2.trim() : '';

    if(firstName && lastName && email && password && address1 && city && state && postalCode) {
        // create user id
        var userId = helpers.createRandomString(20);
        
        // hash the password
        var hashedPassword = helpers.hash(password);

        if(hashedPassword) {
            // create the user object
            var userObject = {
                'userId' : userId,
                'firstName' : firstName,
                'lastName' : lastName,
                'email' : email,
                'hashedPassword' : hashedPassword,
                'address1' : address1,
                'address2' : address2,
                'city' : city,
                'state' : state,
                'postalCode' : postalCode
            };

            // store the user object
            db.create('users', userId, userObject, function(err) {
                if(err) {
                    debug('error.post.users: ' + err);
                    callback(500, {'error' : 'Could not create the user'});
                } else {
                    callback(200, {'userId' : userId});
                }
            });
        } else {
            callback(500, {'error' : 'Could not hash the user\'s password'});
        }
    } else {
        callback(400, {'error' : 'Missing required field(s)'});
    }
};

// users - get
// required data: userId
// optional data: none
handlers._users.get = function(data, callback){
    // check that userId is valid
    var userId = typeof(data.queryStringObject.userId) == 'string' && data.queryStringObject.userId.trim().length == 20 ? data.queryStringObject.userId.trim() : false;
    
    if(userId) {
        // get the token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // verify if token is valid for the given user
        handlers._validateToken(token, function(tokenObj){
            if(tokenObj && tokenObj.userId == userId) {
                // lookup the user 
                db.read('users', userId, function(err, userObject){
                    if(!err && userObject) {
                        // remove the hashed password the the user object
                        delete userObject.hashedPassword;
                        callback(200, userObject);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {'error' : 'Missing required token in header, or the token is invalid'});
            }
        });
    } else {
        callback(400, {'error' : 'Missing required field'});
    }
};

// users - put
// required data: userId
// optional data: firstName, lastName, email, password, address1, address2, city, state, postalCode (at least one must be provided)
handlers._users.put = function(data, callback){
    // check that userId is valid
    var userId = typeof(data.payload.userId) == 'string' && data.payload.userId.trim().length == 20 ? data.payload.userId.trim() : false;
    
    // check optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var email = typeof(data.payload.email) == 'string' && helpers.isValidEmailAddress(data.payload.email) ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var address1 = typeof(data.payload.address1) == 'string' && data.payload.address1.trim().length > 0 ? data.payload.address1.trim() : false;
    var address2 = typeof(data.payload.address2) == 'string' ? data.payload.address2.trim() : false;
    var city = typeof(data.payload.city) == 'string' && data.payload.city.trim().length > 0 ? data.payload.city.trim() : false;
    var state = typeof(data.payload.state) == 'string' && data.payload.state.trim().length > 0 ? data.payload.state.trim() : false;
    var postalCode = typeof(data.payload.postalCode) == 'string' && data.payload.postalCode.trim().length > 0 ? data.payload.postalCode.trim() : false;

    if(userId) {
        if(firstName || lastName || password || email || address1 || address2 || city || state || postalCode) {
            // get the token from headers
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // verify if token is valid for the given user
            handlers._validateToken(token, function(tokenObj){
                if(tokenObj && tokenObj.userId == userId) {
                    // lookup the user 
                    db.read('users', userId, function(err, userObject){
                        if(!err && userObject) {
                            // update the fields neccesary
                            if(firstName) {
                                userObject.firstName = firstName;
                            }
                            if(lastName) {
                                userObject.lastName = lastName;
                            }
                            if(email) {
                                userObject.email = email;
                            }
                            if(address1) {
                                userObject.address1 = address1;
                            }
                            if(address2) {
                                userObject.address2 = address2;
                            }
                            if(city) {
                                userObject.city = city;
                            }
                            if(state) {
                                userObject.state = state;
                            }
                            if(postalCode) {
                                userObject.postalCode = postalCode;
                            }
                            if(password) {
                                var hashedPassword = helpers.hash(password);
                                // check if password was hashed
                                if(hashedPassword) {
                                    userObject.hashedPassword = hashedPassword;
                                } else {
                                    debug('error.put.users: Could not hash the user\'s password: ' + password);
                                }
                            }

                            // store the new updates
                            db.update('users', userId, userObject, function(err){
                                if(!err) {
                                    callback(200);
                                } else {
                                    debug('error.put.users: ' + err);
                                    callback(500, {'error' : 'Could not update the user'});
                                }
                            });
                        } else {
                            callback(400, {'error' : 'The specified user does not exist'});
                        }
                    });  
                } else {
                    callback(403, {'error' : 'Missing required token in header, or the token is invalid'});
                }
            });
        } else {
            callback(400, {'error' : 'Missing fields to update'});
        }  
    } else {
        callback(400, {'error' : 'Missing required field'});
    }
};

// users - delete
// required fields: userId
// optional fields: none
handlers._users.delete = function(data, callback){
     // check that userId is valid
     var userId = typeof(data.queryStringObject.userId) == 'string' && data.queryStringObject.userId.trim().length == 20 ? data.queryStringObject.userId.trim() : false;
    
     if(userId) {
        // get the token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // verify if token is valid for the given user
        handlers._validateToken(token, function(tokenObj){
            if(tokenObj && tokenObj.userId == userId) {
                // lookup the user 
                db.read('users', userId, function(err, userObject){
                    if(!err && userObject) {
                        db.delete('users', userId, function(err) {
                            if(!err) {
                                callback(200);
                            } else {
                                debug('error.delete.users: ' + err);
                                callback(500, {'error' : 'Could not delete the user'});
                            }
                        });
                    } else {
                    debug('error.delete.users: ' + err);
                    callback(400, {'error' : 'The specified user does not exist'});
                    }
                });
            } else {
                callback(403, {'error' : 'Missing required token in header, or the token is invalid'});
            }
        });
     } else {
         callback(400, {'error' : 'Missing required field'});
     }
};


// tokens handler
handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the tokens operations
handlers._tokens = {};

// tokens - post
// required data: userId, password
// optional data: none
handlers._tokens.post = function(data, callback) {
    // Check that all required fields
    var userId = typeof(data.payload.userId) == 'string' && data.payload.userId.trim().length == 20 ? data.payload.userId.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(userId && password) {
        // lookup the user
        db.read('users', userId, function(err, userData){
            if(!err && userData) {
                // check the password
                if (userData.hashedPassword == helpers.hash(password)) {
                    // create token with random name and set expiration date 1 hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'userId' : userId,
                        'tokenId' : tokenId,
                        'expires' : expires
                    };

                    // stores the new token
                    db.create('tokens', tokenId, tokenObject, function(err){
                        if(!err) {
                            callback(200, {'tokenId' : tokenId});
                        } else {
                            debug('error.post.tokens: ' + err);
                            callback(500, {'error' : 'Could not create a new token'});
                        }
                    });
                } else {
                    callback(400, {'error' : 'Authentication failed'});
                }
            } else {
                callback(400, {'error' : 'Authentication failed'});
            }
        });
    } else {
        callback(400, {'error' : 'Missing required field(s)'});
    }
};

// tokens - put
// required data: tokenId, extend
// optional data: none
handlers._tokens.put = function(data, callback) {
    // check required fields
    var tokenId = typeof(data.payload.tokenId) == 'string' && data.payload.tokenId.trim().length == 20 ? data.payload.tokenId.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    
    if(tokenId && extend) {
        // lookup the token 
        db.read('tokens', tokenId, function(err, tokenObject){
            if(!err && tokenObject) {
                // check that token is not already expired
                if(tokenObject.expires > Date.now()) {
                    // updates the expiration date
                    tokenObject.expires = Date.now() + 1000 * 60 * 60;
                    // stores the updated token
                    db.update('tokens', tokenId, tokenObject, function(err){
                        if(!err) {
                            callback(200);
                        } else {
                            debug('error.put.tokens: ' + err);
                            callback(500, {'error' : 'Could not update the token\'s expiration'});
                        }
                    });
                } else {
                    callback(400, {'error' : 'The token has already expired and cannot be extended'});
                }
            } else {
                callback(400, {'error' : 'Specified token does not exist'});
            }
        });
    } else {
        callback(400, {'error' : 'Missing or invalid required field(s)'});
    }
};

// tokens - delete
// required data: tokenId
// optional data: none
handlers._tokens.delete = function(data, callback) {
    // check required fields
    var tokenId = typeof(data.queryStringObject.tokenId) == 'string' && data.queryStringObject.tokenId.trim().length == 20 ? data.queryStringObject.tokenId.trim() : false;
    
    if(tokenId) {
        // lookup the token 
        db.read('tokens', tokenId, function(err, tokenObject){
            if(!err && tokenObject) {
               db.delete('tokens', tokenId, function(err) {
                   if(!err) {
                       callback(200);
                   } else {
                       debug('error.delete.tokens: ' + err);
                       callback(500, {'error' : 'Could not delete token'});
                   }
               });
            } else {
               debug('error.delete.tokens: ' + err);
               callback(400, {'error' : 'Specified token does not exist'});
            }
        });
    } else {
        callback(400, {'error' : 'Missing required field'});
    }
};


// products handler
handlers.products = function(data, callback) {
    var acceptableMethods = ['get'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._products[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for the products operations
handlers._products = {};

// products - get
// required data: none
// optional data: none
handlers._products.get = function(data, callback) {
    // get the token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // verify if token is valid for the given user
    handlers._validateToken(token, function(tokenObj){
        if(tokenObj) {
            callback(200, {'pizzas' : db.products});
        } else {
            callback(403, {'error' : 'Missing required token in header, or the token is invalid'});
        }
    });
};


// cart handler
handlers.cart = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._cart[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for the users operations
handlers._cart = {};

// cart - post
// required data: none
// optional data: none
handlers._cart.post = function(data, callback) {
    // get the token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // verify if token is valid for the given user
    handlers._validateToken(token, function(tokenObj){
        if(tokenObj) {
            var cartId = helpers.createRandomString(20);
            var cartData = {
                'cartId' : cartId,
                'userId' : tokenObj.userId,
                'products' : [],
                'payment' : {
                    'total' : 0,
                    'tax' : 0,
                    'currency' : 'USD'
                }
            };
            db.create('carts', cartId, cartData, function(err){
                if(!err) {
                    callback(200, cartData);
                } else {
                    callback(500, {'error' : 'Could not create the cart'});
                }
            });
        } else {
            callback(403, {'error' : 'Missing required token in header, or the token is invalid'});
        }
    });
};

// cart - get
// required data: cartId
// optional data: none
handlers._cart.get = function(data, callback) {
    // check required fields
    var cartId = typeof(data.queryStringObject.cartId) == 'string' && data.queryStringObject.cartId.trim().length == 20 ? data.queryStringObject.cartId.trim() : false;
    
    if(cartId) {
        // get the token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // verify if token is valid for the given user
        handlers._validateToken(token, function(tokenObj){
            if(tokenObj) {
                // look up the cart
                db.read('carts', cartId, function(err, cartData){
                    if(!err) {
                        callback(200, cartData);
                    } else {
                        callback(400, {'error' : 'Specified cart does not exist'});
                    }
                });
            } else {
                callback(403, {'error' : 'Missing required token in header, or the token is invalid'});
            }
        });
    } else {
        callback(400, {'error' : 'Missing required field'});
    }
};

// cart - put
// required data: cartId, product (object)
// optional data: none
handlers._cart.put = function(data, callback) {
    // validate required data
    var cartId = typeof(data.payload.cartId) == 'string' && data.payload.cartId.trim().length == 20 ? data.payload.cartId.trim() : false;
    var product = typeof(data.payload.product) == 'object' && typeof(data.payload.product.id) == 'number' && data.payload.product.quantity > 0 ? data.payload.product : false;

    if(cartId && product) {
        // get the token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // verify if token is valid for the given user
        handlers._validateToken(token, function(tokenObj){
            if(tokenObj) {
                // look up the cart
                db.read('carts', cartId, function(err, cartData){
                    if(!err) {
                        var isNewItem = true;
                        // check if product already exists in the cart
                        cartData.products.forEach(function(item){
                            if(item.id == product.id) {
                                item.quantity += product.quantity;
                                isNewItem = false;
                            }
                        });
                        
                        // add to cart only new products
                        if(isNewItem) {
                            cartData.products.push(product);
                        }

                        // calculate totals
                        var total = 0;
                        var tax = 0;
                        cartData.products.forEach(function(item){
                            db.products.forEach(function(pizza){
                                if(item.id == pizza.id) {
                                    total += pizza.price.total * item.quantity;
                                    tax += pizza.price.tax * item.quantity;
                                }
                            });
                        });

                        // update cart totals
                        cartData.payment.total = total;
                        cartData.payment.tax = tax;

                        // save cart data
                        db.update('carts', cartId, cartData, function(err){
                            if(!err) {
                                callback(200, cartData);
                            } else {
                                callback(500, {'error' : 'Could not update cart'});
                            }
                        });
                    } else {
                        callback(400, {'error' : 'Specified cart does not exist'});
                    }
                });
            } else {
                callback(403, {'error' : 'Missing required token in header, or the token is invalid'});
            }
        });
    } else {
        callback(400, {'error' : 'Missing or Invalid required field(s)'});
    }
};


// checkout handler
handlers.checkout = function(data, callback) {
    var acceptableMethods = ['post'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._checkout[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for the users operations
handlers._checkout = {};

// checkout - post
// required data: cartId, stripeToken
// optional data: none
handlers._checkout.post = function(data, callback) {
    // validate payload data
    var cartId = typeof(data.payload.cartId) == 'string' && data.payload.cartId.trim().length == 20 ? data.payload.cartId.trim() : false;
    var stripeToken = typeof(data.payload.stripeToken) == 'string' && data.payload.stripeToken.trim().length > 4 ? data.payload.stripeToken.trim() : false;

    if(cartId && stripeToken) {
        // get the token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // verify if token is valid for the given user
        handlers._validateToken(token, function(tokenObj){
            if(tokenObj) {
                // get user data
                db.read('users', tokenObj.userId, function(err, userObj){
                    if(!err) {
                        // get cart data
                        db.read('carts', cartId, function(err, cartObj){
                            if(!err) {
                                // check if cart has products
                                if(cartObj.products && cartObj.products.length > 0) {
                                    // format cart total
                                    var cartTotal = cartObj.payment.total * 100;
                                    // proceed with the charge via stripe
                                    helpers.createStripeCharge(cartTotal, cartObj.payment.currency, stripeToken, userObj.email, function(stripeChargeId){
                                        if(stripeChargeId){
                                            // get current time
                                            var currentTime = Date.now();
                                            // create order details
                                            var orderDetails = [];
                                            cartObj.products.forEach(function(item){
                                                db.products.forEach(function(product){
                                                    if(item.id == product.id) {
                                                        orderDetails.push({
                                                            'id' : item.id,
                                                            'name' : product.name,
                                                            'price' : product.price,
                                                            'quantity' : item.quantity
                                                        });
                                                    }
                                                });
                                            });
                                            // create order object
                                            var orderObj = {
                                                'number' : helpers.createRandomString(5).toUpperCase() + '-' + currentTime,
                                                'customer' : userObj.firstName + ' ' + userObj.lastName,
                                                'chargeId' : stripeChargeId,
                                                'items' : orderDetails,
                                                'totals' : cartObj.payment,
                                                'datetime' : new Date(currentTime).toLocaleString() 
                                            };
                                            // save order
                                            db.create('orders', orderObj.number, orderObj, function(err) {
                                                if(!err) {
                                                    // delete cart
                                                    db.delete('carts', cartId, function(err){
                                                        if(err) {
                                                            log.error('Could not delete the cart', cartObj);
                                                            debug(err);
                                                        }
                                                    });
                                                } else {
                                                    log.error('Could not save the order', orderObj);
                                                    debug(err);
                                                }
                                            });
                                            // @TODO create email template
                                            var emailOrderTemplate = JSON.stringify(orderObj);
                                            // email the user a receipt
                                            helpers.sendMailgunEmail(userObj.email, 'Order has been placed', emailOrderTemplate, function(messageId){
                                                if(!messageId) {
                                                    log.error('Could not email the user receipt', orderObj);
                                                    debug(err);
                                                }
                                            });
                                            // log the order placed
                                            log.msg('An order has been placed', orderObj);
                                            // go back to the client
                                            callback(200);
                                        } else {
                                            callback(503, {'error' : 'Could not process the charge, please review your payment information'});
                                        }
                                    });
                                } else {
                                    callback(400, {'error' : 'Cart is empty'});
                                }
                            } else {
                                callback(400, {'error' : 'Could not retrieve cart details'});
                            }
                        });
                    } else {
                        callback(500, {'error' : 'Could not retrieve user information'});
                    }
                });
            } else {
                callback(403, {'error' : 'Missing required token in header, or the token is invalid'});
            }
        });
    } else {
        callback(400, {'error' : 'Missing or Invalid required field(s)'});
    }
};


// ping handler
handlers.ping = function(data, callback) {
    callback(200);
};


// not found handler
handlers.notFound = function(data, callback) {
    callback(404);
};


// checks if a specified token is valid and return it in that case
handlers._validateToken = function(tokenId, callback){
    // look up the token
    db.read('tokens', tokenId, function(err, tokenObject){
        if(!err && tokenObject) {
            if(tokenObject.expires > Date.now()) {
                callback(tokenObject);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};


// export the module
module.exports = handlers;