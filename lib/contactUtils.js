
var winston = require('./winstonWrapper').winston
  , SentAndCoReceiveMRModel = require('../schema/contact').SentAndCoReceiveMRModel
  , UserModel = require('../schema/user').UserModel
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

  var contactData = {
      sent: 0
    , corecipient: 0
  };
  var isSentByUser = false;

  UserModel.findById( userId, function(err, thisUser) {
    if ( err ) {
      callback(err);

    } else if ( ! thisUser ) {
      callback( winston.makeError('no user found', {userId: userId}) );

    } else {
      
      if ( thisUser.email == email ) {
        isSentByUser = true;
      }

      SentAndCoReceiveMRModel.collection.findOne( searchCriteria, function(err, foundContactData) {
        if ( err ) {
          callback( winston.makeMongoError( err ) );

        } else if ( ! foundContactData ) {
          //No foundContactData means zero sent, zero corecipient...
          callback( null, contactData, isSentByUser );
        
        } else {
          contactData.sent = foundContactData.value.sent;
          contactData.corecipient = foundContactData.value.corecipient;
          callback( null, contactData, isSentByUser );
        }
      });
    }
  });

}