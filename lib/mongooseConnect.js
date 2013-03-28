var serverCommon = process.env.SERVER_COMMON;

var mongoose = require('mongoose')
  , attachment = require ('../schema/attachment')
  , link = require ('../schema/link')
  , link = require ('../schema/linkInfo')
  , mail = require ('../schema/mail')
  , user = require ('../schema/user')
  , active = require ('../schema/active')
  , onboard = require ('../schema/onboard')
  , conf = require('../conf')
  , secureConf = require ('../secureConf')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston

var environment = process.env.NODE_ENV


var mongooseConnect = this;

exports.mongoose = mongoose;

exports.init = function( callback ) {

  var mongoPath = '';
  var mongoHost = '';
  if ( environment == 'production' ) {
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

  mongoose.connect(mongoPath, function (err) {
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