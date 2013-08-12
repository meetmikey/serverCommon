
var followLinkUtils = require('../lib/followLinkUtils')
  , winston = require('../lib/winstonWrapper').winston
  , appInitUtils = require('../lib/appInitUtils')
  , conf = require('../conf')
  , mongoose = require('../lib/mongooseConnect').mongoose


var linkInfoId = '520575b399b7b56821055989';
var userId = '52057434744a7eb11200000a';

//https://docs.google.com/a/sse.stanford.edu/spreadsheet/ccc?key=0AioMgL26ri9TdGJ1QU5FZlJYLUxuQzBCSllUbmFRbUE#gid=0

var initActions = [
    appInitUtils.CONNECT_ELASTIC_SEARCH
  , appInitUtils.CONNECT_MONGO
];

appInitUtils.initApp( 'testFollowGoogleLink', initActions, conf, function() {

  var job = {
      jobType: 'followLink'
    , linkInfoId: linkInfoId
    , userId: userId
  }

  followLinkUtils.doFollowLinkJob( job, function(err) {
    if ( err ) {
      winston.handleError(err);

    } else {
      winston.doInfo('done!');
    }
    mongoose.disconnect();
  });

});