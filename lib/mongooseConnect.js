
var mongoose = require('mongoose')
  , attachment = require ('../schema/attachment')
  , link = require ('../schema/link')
  , mail = require ('../schema/mail')
  , user = require ('../schema/user')
  , conf = require('../conf')

var useMongoHQ = process.env.USE_MONGOHQ

if (process.env.USE_MONGOHQ == 'true') {
  var mongoPath = 'mongodb://' + conf.mongo.mongohqLocal.user + ':' + conf.mongo.mongohqLocal.pass;
  mongoPath += '@' + conf.mongo.mongohqLocal.host + ':' + conf.mongo.mongohqLocal.port + '/' + conf.mongo.mongohqLocal.db;
  console.log (mongoPath)
}
else {
  var mongoPath = 'mongodb://' + conf.mongo.local.host + '/' + conf.mongo.local.db;
}

mongoose.connect(mongoPath, function (err) {
  if (err) throw err;
});

exports.mongoose = mongoose;