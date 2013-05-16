var serverCommon = process.env.SERVER_COMMON;

var mongoose = require('../lib/mongooseConnect').mongoose
  , winston = require('../lib/winstonWrapper').winston
  , conf = require('../conf')
  , appInitUtils = require('../lib/appInitUtils')
  , UserModel = require('../schema/user').UserModel
  
initActions = [
  appInitUtils.CONNECT_MONGO
];

appInitUtils.initApp('mongoConnect', initActions, conf, function() {

  UserModel.count( function(err, userCount) {
    if ( err ) {
      winston.handleMongoErr(err);
    } else {
      winston.doInfo('success', {userCount: userCount});
    }
    mongoose.disconnect();
  });

});