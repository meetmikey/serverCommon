var followLinkUtils = require('../lib/followLinkUtils')
  , appInitUtils = require('../lib/appInitUtils')
  , conf = require('../conf')
  , winston = require('../lib/winstonWrapper').winston
  , mongoose = require('../lib/mongooseConnect').mongoose

var initActions = [
  appInitUtils.CONNECT_MONGO
];

appInitUtils.initApp( 'recordURLDomainResult', initActions, conf, function() {

  var url = 'http://www.wired.com/some/thing';
  var isSuccess = false;

  followLinkUtils.recordURLDomainResult( url, isSuccess, function(err) {
    if ( err ) {
      winston.handleError(err);

    } else {
      winston.doInfo('success!');
    }
    mongoose.disconnect();
  });

});