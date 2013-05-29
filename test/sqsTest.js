var serverCommon = process.env.SERVER_COMMON;

var sqsConnect = require (serverCommon + '/lib/sqsConnect')
  , appInitUtils = require(serverCommon + '/lib/appInitUtils')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston


var initActions = [
  appInitUtils.CONNECT_MONGO
];

appInitUtils.initApp( 'sqsTest', initActions, null, function() {
  sqsConnect.pollWorkerQueue (function (message, pollQueueCallback) {
    winston.doInfo('message', {message: message});
  }, 1);
})

