var mongoose = require('mongoose')
  , attachment = require ('../schema/attachment')
  , link = require ('../schema/link')
  , linkInfo = require ('../schema/linkInfo')
  , mail = require ('../schema/mail')
  , user = require ('../schema/user')
  , attachmentInfo = require ('../schema/attachmentInfo')
  , active = require ('../schema/active')
  , queueFail = require ('../schema/queueFail')
  , onboard = require ('../schema/onboard')
  , conf = require('../conf')
  , utils = require('./utils')
  , winston = require ('./winstonWrapper').winston

var environment = process.env.NODE_ENV

var mongooseConnect = this;

exports.mongoose = mongoose;

exports.init = function( callback ) {

  var mongoConf = {};

  if ( environment == 'production' ) {
    mongoConf = conf.mongo.mongoHQProd;

  } else if ( environment == 'development' ) {
    mongoConf = conf.mongo.objectRocketDev;

  } else { //local...
    mongoConf = conf.mongo.local;
  }

  var connectionInfo = mongooseConnect.getConnectionInfoFromConf( mongoConf );

  if ( ( ! connectionInfo ) || ( ! connectionInfo.mongoPath ) ) {
    callback( winston.makeError('no mongo path') );

  } else {
    winston.doInfo('mongooseConnect: mongoPath', {path: connectionInfo.logSafeMongoPath, useSSL: connectionInfo.useSSL});

    mongoose.connect( connectionInfo.mongoPath, connectionInfo.options, function (mongoErr) {
      if (mongoErr) {
        callback( winston.makeMongoError(mongoErr) );

      } else {
        callback();
      }
    });
  }
}

exports.getConnectionInfoFromConf = function( mongoConf ) {
  var fullMongoPath = '';
  var logSafeMongoPath = '';
  if ( mongoConf.host ) {
    fullMongoPath = mongooseConnect.getMongoPath( mongoConf.host, mongoConf, true );
    logSafeMongoPath = mongooseConnect.getMongoPath( mongoConf.host, mongoConf, true, true );

  } else if ( mongoConf.hosts && ( utils.isArray( mongoConf.hosts ) ) ) {
    var first = true;
    for ( var i=0; i<mongoConf.hosts.length; i++ ) {
      var host = mongoConf.hosts[i];
      if ( ! first ) {
        fullMongoPath += ',';
        logSafeMongoPath += ',';
      }
      fullMongoPath += mongooseConnect.getMongoPath( host, mongoConf, first );
      logSafeMongoPath += mongooseConnect.getMongoPath( host, mongoConf, first, true );

      first = false;
    }
  }

  var useSSL = false;
  if ( mongoConf.useSSL ) {
    useSSL = true;
  }

  var options = mongooseConnect.getConnectionOptions( useSSL );

  var connectionInfo = {
      mongoPath: fullMongoPath
    , logSafeMongoPath: logSafeMongoPath
    , useSSL: useSSL
    , options: options
  }
  return connectionInfo;
}

exports.getMongoPath = function( host, mongoConf, includeDB, hideUserAndPass ) {
  
  if ( ( ! host ) || ( ! mongoConf ) ) {
    return '';
  }

  var mongoPath = 'mongodb://';

  if ( mongoConf.user ) {
    if ( hideUserAndPass ) {
      mongoPath += '<user>';
    } else {
      mongoPath += mongoConf.user;
    }
    if ( mongoConf.pass ) {
        mongoPath += ':';
      if ( hideUserAndPass ) {
        mongoPath += '<pass>';
      } else {
        mongoPath += mongoConf.pass;
      }
    }
    mongoPath += '@';
  }

  mongoPath += host;
  if ( mongoConf.port ) {
    mongoPath += ':' + mongoConf.port;
  }

  if ( includeDB && mongoConf.db ) {
    mongoPath += '/' + mongoConf.db;
  }

  return mongoPath;
}

exports.getConnectionOptions = function( useSSL ) {

  var options = {
    server : {
      socketOptions : {
        keepAlive : 1
      }
    },
    replset : {
      socketOptions : {
        keepAlive : 1
      }
    }
  };

  if ( useSSL ) {
    //overkill, but different version of mongoose look for different flags.
    options['server']['socketOptions']['ssl'] = true;
    options['server']['ssl'] = true;
    options['replset']['socketOptions']['ssl'] = true;
    options['replset']['ssl'] = true;
    options['ssl'] = true;
  }

  return options;
}

exports.disconnect = function() {
  mongoose.disconnect();
}