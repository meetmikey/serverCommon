var winston = require('../lib/winstonWrapper').winston
  , appInitUtils = require('../lib/appInitUtils')
  , conf = require('../conf')
  , mongoose = require('../lib/mongooseConnect').mongoose

var initActions = [
  appInitUtils.CONNECT_MONGO
];

appInitUtils.initApp( 'testReplConn', initActions, conf, function() {

  console.log ("repl connection success")

});