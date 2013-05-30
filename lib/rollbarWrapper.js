var conf = require('../conf')
  , rollbar = require('rollbar')

var environment = process.env.NODE_ENV;

rollbar.init(conf.rollbar.token, {
    handler: 'inline'
  , environment: environment
});

rollbar.trackMessage = function(message, level) {

  if ( ! conf.rollbar.turnedOn ) {
    return;
  }

  if ( level && ( level == 'info' ) || ( level == 'warning' ) ) {
    return;
  }

  if ( environment != 'production' ) {
    return;
  }

  rollbar.reportMessage( message, level );
}

exports.rollbar = rollbar