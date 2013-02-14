var serverCommon = process.env.SERVER_COMMON;

var mongoose = require('mongoose')
  , attachment = require ('../schema/attachment')
  , link = require ('../schema/link')
  , mail = require ('../schema/mail')
  , user = require ('../schema/user')
  , conf = require('../conf')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston

var useMongoHQ = process.env.USE_MONGOHQ

var mongooseConnect = this;

exports.mongoose = mongoose;

exports.init = function() {
  var mongoPath = 'mongodb://' + conf.mongo.local.host + '/' + conf.mongo.local.db;

  if (process.env.USE_MONGOHQ == 'true') {
    var mongoPath = 'mongodb://' + conf.mongo.mongohqLocal.user + ':' + conf.mongo.mongohqLocal.pass;
    mongoPath += '@' + conf.mongo.mongohqLocal.host + ':' + conf.mongo.mongohqLocal.port + '/' + conf.mongo.mongohqLocal.db;
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