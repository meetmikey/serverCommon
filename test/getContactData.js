
var mongoose = require('../lib/mongooseConnect').mongoose
  , conf = require('../conf')
  , winston = require('../lib/winstonWrapper').winston
  , SentAndCoReceiveMRModel = require('../schema/contact').SentAndCoReceiveMRModel
  , ObjectId = require('mongoose').Types.ObjectId

var email = 'anands@sse.stanford.edu';
var userId = '5119c7b60746d47552000005';

var run = function() {

  winston.doInfo('running');

  var userIdObjectId = new ObjectId( userId.toString() );

  var searchCriteria = {
    _id: {
        email: email
      , userId: userIdObjectId
    }
  };

  SentAndCoReceiveMRModel.collection.findOne( searchCriteria, function(err, foundContactData) {
    if ( err ) {
      winston.doMongoError( err );
    } else {

      console.log('CONSOLE LOG FOUND CONTACT DATA', foundContactData);
      winston.doInfo('FOUND CONTACT DATA', {foundContactData: foundContactData});
    }
    cleanup();
  });
}

var cleanup = function() {
  mongoose.disconnect();
}

run();