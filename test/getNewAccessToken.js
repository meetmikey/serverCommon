var serverCommon = process.env.SERVER_COMMON;
var googleUtils = require ('../lib/googleUtils')
  , appInitUtils = require(serverCommon + '/lib/appInitUtils');


var initActions = [
  appInitUtils.CONNECT_MONGO
];

appInitUtils.initApp( 'addUserToDownloadQueue', initActions, null, function() {
  console.log ('ehllo')
  googleUtils.getAccessToken ("514265596a9290970a000007", function (err, newAccessToken) {
    if (err) {
      winston.handleError (err);
    }
    console.log (newAccessToken);
  });
})