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
  if ( environment == 'production' ) {
    var secureConf = require ('../secureConf');
    var mongoConf = secureConf.mongo.mongoHQProd;
    mongoHost = mongoConf.host;
    mongoPath = 'mongodb://' + mongoConf.user + ':' + mongoConf.pass;
    mongoPath += '@' + mongoConf.host + ':' + mongoConf.port + '/' + mongoConf.db;

  } else if ( environment == 'development' ) {
    var mongoConf = conf.mongo.objectRocketDev;
    mongoHost = mongoConf.host;
    mongoPath = 'mongodb://' + mongoConf.user + ':' + mongoConf.pass;
    mongoPath += '@' + mongoConf.host + ':' + mongoConf.port + '/' + mongoConf.db;

  } else { //local...
    mongoHost = conf.mongo.local.host;
    mongoPath = 'mongodb://' + conf.mongo.local.host + '/' + conf.mongo.local.db;
  }

  winston.info('mongooseConnect: mongo host: ' + mongoHost)

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
  }

  mongoose.connect(mongoPath, options, function (err) {
    if (err) {
      callback( winston.makeMongoError(err) );

    } else {
      callback();
    }
  });
}

exports.disconnect = function() {
  mongoose.disconnect();
}