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

  followLinkUtils.checkURLDomain( url, function(err, isDomainOK) {
    if ( err ) {
      winston.handleError(err);

    } else if ( ! isDomainOK ) {
      winston.doInfo('domain is NOT ok!');
      
    } else {
      winston.doInfo('domain is ok!');
    }
    mongoose.disconnect();
  });

});