
var mongoose = require('mongoose')
  , attachment = require ('../schema/attachment')
  , link = require ('../schema/link')
  , mail = require ('../schema/mail')
  , user = require ('../schema/user')
  , conf = require('../conf')

var mongoPath = 'mongodb://' + conf.mongo.local.host + '/' + conf.mongo.local.db;

mongoose.connect(mongoPath, function (err) {
  if (err) throw err;
});

exports.mongoose = mongoose;