var serverCommon = process.env.SERVER_COMMON;

var mongoose = require('mongoose')
  , attachment = require ('../schema/attachment')
  , link = require ('../schema/link')
  , mail = require ('../schema/mail')
  , user = require ('../schema/user')
  , active = require ('../schema/active')
  , conf = require('../conf')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston

var environment = process.env.NODE_ENV
var useMongoHQ = process.env.USE_MONGOHQ

var mongooseConnect = this;

exports.mongoose = mongoose;

exports.init = function() {

  var mongoPath = '';
  if ( environment == 'production' ) {

  } else if ( environment == 'development' ) {
    var mongoConf = conf.mongo.objectRocketDev;
    mongoPath = 'mongodb://' + mongoConf.user + ':' + mongoConf.pass;
    mongoPath += '@' + mongoConf.host + ':' + mongoConf.port + '/' + mongoConf.db;

  } else { //local...
    if (process.env.USE_MONGOHQ == 'true') {
      var mongoConf = conf.mongo.mongoHQLocal;
      mongoPath = 'mongodb://' + mongoConf.user + ':' + mongoConf.pass;
      mongoPath += '@' + mongoConf.host + ':' + mongoConf.port + '/' + mongoConf.db;
    } else {
      mongoPath = 'mongodb://' + conf.mongo.local.host + '/' + conf.mongo.local.db;
    }
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