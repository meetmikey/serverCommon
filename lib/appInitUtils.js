var serverCommon = process.env.SERVER_COMMON;

var async = require('async')
  , winston = require ('./winstonWrapper').winston
  , memwatch = require ('./memwatchWrapper').memwatch
  , mongooseConnect = require('./mongooseConnect')
  , esConnect = require('./esConnect')

var appInitUtils = this;

exports.CONNECT_ELASTIC_SEARCH = 'esConnect';
exports.CONNECT_MONGO = 'mongoConnect';
exports.MEMWATCH_MONITOR = 'memwatchMonitor';
exports.MEMWATCH_MONITOR_WITH_STATS = 'memwatchMonitorWithStats';

process.on('uncaughtException', function (err) {
  winston.doError('uncaughtException:', {stack : err.stack, message : err.message});
  process.exit(1);
});

exports.initApp = function( appName, actions, esConf, callback ) {

  winston.logBreak();
  winston.doInfo( appName + ' app starting...');

  if (process.env.NODE_ENV === 'production') {
    // ensure that secureConf file exists
    var secureConf = require ('../secureConf');
    if (typeof secureConf === 'undefined') {
      winston.doError ('no secureConf file... exiting now');
      process.exit (1);
    }
  }

  appInitUtils.esConf = esConf;

  if ( ( ! actions ) || ( ! ( actions.length > 0 ) ) ) {
    winston.doInfo( appName + ' app init successful, no required actions.');
    callback();

  } else {
    async.each( actions, appInitUtils.doInitAction, function( err ) {
      if ( err ) {
        winston.doError( appName + ' app init failed!', {err: err});
        process.exit(1);

      } else {
        winston.doInfo( appName + ' app init successful');
        callback();
      }
    });
  }
}

exports.doInitAction = function( action, callback ) {

  if ( ! action ) { callback( winston.makeMissingParamError('action') ); return; }

  switch( action ) {
    
    case appInitUtils.CONNECT_ELASTIC_SEARCH:
      esConnect.init( appInitUtils.esConf, callback );
      break;
    
    case appInitUtils.CONNECT_MONGO:
      mongooseConnect.init( callback );
      break;

    case appInitUtils.MEMWATCH_MONITOR:
      memwatch.monitor();
      callback();
      break;

    case appInitUtils.MEMWATCH_MONITOR_WITH_STATS:
      memwatch.monitor(true);
      callback();
      break;
    
    default:
      callback( winston.makeError('invalid init action', {action: action} ) );
  }
}