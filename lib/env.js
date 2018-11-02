/**
 * Basic adaptation of Scott Motte's dotenv library (@motdotla) to read .env.${NODE_ENV} files
 */

// dependencies
var fs = require('fs');
var path = require('path');

// object container
var env = {};

env.log = function (message) {
    console.log('\x1b[31m%s\x1b[0m', '[env] ' + message);
};

// Parses src into an Object
env.parse = function (src) {
    var obj = {};

    // convert Buffers before splitting into lines and processing
    src.toString().split('\n').forEach(function (line, idx) {
        // matching "KEY' and 'VAL' in 'KEY=VAL'
        var keyValueArr = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        // matched?
        if (keyValueArr != null) {
            var key = keyValueArr[1];

            // default undefined or missing values to empty string
            var value = keyValueArr[2] || '';

            // expand newlines in quoted values
            var len = value ? value.length : 0
            if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"') {
                value = value.replace(/\\n/gm, '\n');
            }

            // remove any surrounding quotes and extra spaces
            value = value.replace(/(^['"]|['"]$)/g, '').trim();

            obj[key] = value;
        } else {
            env.log(`did not match key and value when parsing line ${idx + 1}: ${line}`);
        }
    });

    return obj;
}

// populates process.env from a .env.${NODE_ENV} file
env.config = function () {
    // validates current environment
    var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' && process.env.NODE_ENV.length > 0 ? process.env.NODE_ENV.toLowerCase() : 'local';
    process.env['NODE_ENV'] = currentEnvironment;

    // build the path for the proper .env file
    var dotenvPath = path.resolve(process.cwd(), '.env' + '.' + currentEnvironment);

    try {
        // specifying an encoding returns a string instead of a buffer
        var parsed = env.parse(fs.readFileSync(dotenvPath, { 'encoding': 'utf8' }));

        Object.keys(parsed).forEach(function (key) {
            if (!process.env.hasOwnProperty(key)) {
                process.env[key] = parsed[key];
            } else {
                env.log(`"${key}" is already defined in \`process.env\` and will not be overwritten`);
            }
        })

        return true;
    } catch (e) {
        env.log(e.message);
        return false;
    }
};

module.exports = env;