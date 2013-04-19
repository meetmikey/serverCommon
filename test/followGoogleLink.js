
var followLinkUtils = require('../lib/followLinkUtils')
  , winston = require('../lib/winstonWrapper').winston
  , appInitUtils = require('../lib/appInitUtils')
  , conf = require('../conf')
  , mongoose = require('../lib/mongooseConnect').mongoose


var linkInfoId = "517056d15c3291961ce7d52d";
var userId = '517056a050a26f7526000006';

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