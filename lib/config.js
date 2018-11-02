/**
 * Create and export configuration variables
 */

// container for all the environment variables
var environment = {
    'httpPort' : 4000,
    'httpsPort' : 4001,
    'envName' : process.env.NODE_ENV,
    'hashingSecret' : process.env.HASH_SECRET,
    'stripe' : {
        'baseUrl' : process.env.STRIPE_URL,
        'secretKey' : process.env.STRIPE_API_KEY
    },
    'mailgun' : {
        'apiKey' : process.env.MAILGUN_API_KEY,
        'domain' : process.env.MAILGUN_DOMAIN,
        'baseUrl' : process.env.MAILGUN_URL
    }
};

// export the module
module.exports = environment;
