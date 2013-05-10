var serverCommon = process.env.SERVER_COMMON;

var sqsConnect = require (serverCommon + '/lib/sqsConnect')
  , appInitUtils = require(serverCommon + '/lib/appInitUtils');


var initActions = [
  appInitUtils.CONNECT_MONGO
];

appInitUtils.initApp( 'sqsTest', initActions, null, function() {
  sqsConnect.pollWorkerQueue (function (message, pollQueueCallback) {
    console.log (message);
  }, 1);
})

