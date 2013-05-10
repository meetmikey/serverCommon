
var followLinkUtils = require('../lib/followLinkUtils')
  , winston = require('../lib/winstonWrapper').winston
  , appInitUtils = require('../lib/appInitUtils')
  , conf = require('../conf')
  , mongoose = require('../lib/mongooseConnect').mongoose


var linkInfoId = "5171cdef5c3291961ce7d706";
var userId = '5171c34cc610151f79000005';

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