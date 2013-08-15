
var mongoose = require('../lib/mongooseConnect').mongoose
  , appInitUtils = require('../lib/appInitUtils')
  , conf = require('../conf')
  , winston = require('../lib/winstonWrapper').winston
  , contactUtils = require('../lib/contactUtils')

var email = 'justin@mikeyteam.com';
var userId = '520313ca182f58df4b00000a';

var initActions = [
  appInitUtils.CONNECT_MONGO
];

appInitUtils.initApp( 'getContactData', initActions, conf, function() {

  var run = function() {

    winston.doInfo('running');

    contactUtils.getContactData( userId, email, function(err, contactData) {

      winston.doInfo('called back!');

      if ( err ) {
        winston.handleError(err);

      } else {
        winston.doInfo('contactData', {contactData: contactData});
      }
      cleanup();
    });
  }

  var cleanup = function() {
    mongoose.disconnect();
  }

  run();
});