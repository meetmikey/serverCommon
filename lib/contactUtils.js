
var winston = require('./winstonWrapper').winston
  , SentAndCoReceiveMRModel = require('../schema/contact').SentAndCoReceiveMRModel
  , ObjectId = require('mongoose').Types.ObjectId

var contactUtils = this;

exports.getContactData = function( userId, email, callback ) {

  if ( ! userId ) { callback( winston.makeMissingParamError('userId') ); return; }
  if ( ! email ) { callback( winston.makeMissingParamError('email') ); return; }

  var userIdObjectId = new ObjectId( userId.toString() );

  var searchCriteria = {
    _id: {
        email: email
      , userId: userIdObjectId
    }
  };

  SentAndCoReceiveMRModel.collection.findOne( searchCriteria, function(err, foundContactData) {
    if ( err ) {
      callback( winston.makeMongoError( err ) );

    } else if ( ! foundContactData ) {
      //No foundContactData means zero sent, zero corecipient...
      callback( null, { sent: 0, corecipient: 0 } );
    
    } else {
      callback(null, foundContactData.value);
    }
  });
}