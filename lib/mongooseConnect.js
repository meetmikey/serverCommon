
var mongoose = require('mongoose')
  , conf = require('../conf')

var mongoPath = 'mongodb://' + conf.mongo.local.host + '/' + conf.mongo.local.db;

mongoose.connect(mongoPath, function (err) {
  if (err) throw err;
});

exports.mongoose = mongoose;