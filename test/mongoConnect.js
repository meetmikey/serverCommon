var serverCommon = process.env.SERVER_COMMON;

var mongoose = require('mongoose')
  , winston = require('../lib/winstonWrapper').winston
  , conf = require('../conf')
  
var mongoConf = conf.mongo.objectRocketDev;

var port = mongoConf.port;
port = 20065;

mongoPath = 'mongodb://' + mongoConf.user + ':' + mongoConf.pass;
mongoPath += '@' + mongoConf.host + ':' + port + '/' + mongoConf.db;

winston.info('mongooseConnect: mongoPath: ' + mongoPath)

var con = mongoose.createConnection(mongoPath, {server: {ssl:true}});
console.log('con: ', con)

/*
mongoose.connect(mongoPath, {server: {ssl:true}}, function (err) {
  if (err) {
    winston.doMongoError(err);
    process.exit(1);
  } else {
    winston.doInfo('connected!');
  }
});

setTimeout( function() {
  mongoose.disconnect();
}, 3000);

*/