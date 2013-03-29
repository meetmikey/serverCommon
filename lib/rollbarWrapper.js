var conf = require('../conf')
  , rollbar = require('rollbar')

var environment = process.env.NODE_ENV;

rollbar.init("53df19b3bc7244dcbe8bde98d62ccebd", {
    handler: 'inline'
  , environment: environment
});

exports.rollbar = rollbar