var serverCommon = process.env.SERVER_COMMON;

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
  , winston = require (serverCommon + '/lib/winstonWrapper').winston

var environment = process.env.NODE_ENV

var mongooseConnect = this;

exports.mongoose = mongoose;

exports.init = function( callback ) {

  var mongoPath = '';
  var mongoHost = '';

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

  if ( environment == 'production' ) {
    var mongoConf = conf.mongo.mongoHQProd;

    if ( mongoConf.useSSL ) {
      winston.doInfo('mongo is using ssl');
      options['server']['socketOptions']['ssl'] = true;
    }

    //options ['replset'] ['rs_name'] = 

    mongoHosts = mongoConf.hosts;
    var mongoPath1 = '';
    var mongoPath2 = '';

    mongoPath1 = 'mongodb://' + mongoConf.user + ':' + mongoConf.pass;
    mongoPath1 += '@' + mongoHosts[0] + ':' + mongoConf.port + '/' + mongoConf.db;

    mongoPath2 = 'mongodb://' + mongoConf.user + ':' + mongoConf.pass;
    mongoPath2 += '@' + mongoHosts[1] + ':' + mongoConf.port;

    //mongoose.connect('mongodb://username:password@host:port/database,mongodb://username:password@host:port,mongodb://username:password@host:port?options...' [, options]);
    //mongodb://<user>:<password>@mikeyteam.m0.mongolayer.com:27017,mikeyteam.m1.mongolayer.com:27017/mikeyDBProd

    mongoose.connect(mongoPath1+','+mongoPath2, options, function (err) {
      if (err) {
        callback( winston.makeMongoError(err) );

      } else {
        callback();
      }
    });

  } else if ( environment == 'development' ) {
    var mongoConf = conf.mongo.objectRocketDev;
    mongoHost = mongoConf.host;
    mongoPath = 'mongodb://' + mongoConf.user + ':' + mongoConf.pass;
    mongoPath += '@' + mongoConf.host + ':' + mongoConf.port + '/' + mongoConf.db;


    mongoose.connect(mongoPath, options, function (err) {
      if (err) {
        callback( winston.makeMongoError(err) );

      } else {
        callback();
      }
    });

  } else { //local...
    mongoHost = conf.mongo.local.host;
    mongoPath = 'mongodb://' + conf.mongo.local.host + '/' + conf.mongo.local.db;


    mongoose.connect(mongoPath, options, function (err) {
      if (err) {
        callback( winston.makeMongoError(err) );

      } else {
        callback();
      }
    });
  }

  winston.info('mongooseConnect: mongo host: ' + mongoHost)

}

exports.disconnect = function() {
  mongoose.disconnect();
}