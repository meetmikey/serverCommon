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
  , winston = require (serverCommon + '/lib/winstonWrapper').winston

var environment = process.env.NODE_ENV

var mongooseConnect = this;

exports.mongoose = mongoose;

exports.init = function() {

  var mongoPath = '';
  if ( environment == 'production' ) {
    var mongoConf = conf.mongo.objectRocketProd;
    mongoPath = 'mongodb://' + mongoConf.user + ':' + mongoConf.pass;
    mongoPath += '@' + mongoConf.host + ':' + mongoConf.port + '/' + mongoConf.db;

  } else if ( environment == 'development' ) {
    var mongoConf = conf.mongo.objectRocketDev;
    mongoPath = 'mongodb://' + mongoConf.user + ':' + mongoConf.pass;
    mongoPath += '@' + mongoConf.host + ':' + mongoConf.port + '/' + mongoConf.db;

  } else { //local...
    mongoPath = 'mongodb://' + conf.mongo.local.host + '/' + conf.mongo.local.db;
  }

  winston.info('mongooseConnect: mongoPath: ' + mongoPath)

  mongoose.connect(mongoPath, function (err) {
    if (err) {
      winston.doMongoError(err);
      process.exit(1);
    }
  });
}

exports.disconnect = function() {
  mongoose.disconnect();
}

mongooseConnect.init();