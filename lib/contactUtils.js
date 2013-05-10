
var winston = require('./winstonWrapper').winston
  , async = require('async')
  , ReceiveMRModel = require('../schema/contact').ReceiveMRModel
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

  var result = {
      sent: 0
    , corecipient: 0
    , recipient: 0
  }

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

      async.parallel([

        function( parallelCallback ) {
          ReceiveMRModel.collection.findOne( searchCriteria, function(err, foundContactData) {
            if ( err ) {
              parallelCallback( winston.makeMongoError( err ) );

            } else if ( ( ! foundContactData ) || ( ! foundContactData.value ) ) {
              //No foundContactData means zero values...
              parallelCallback();
            
            } else {
              result.recipient = foundContactData.value;
              parallelCallback();
            }
          });
        }

        , function( parallelCallback ) {
          SentAndCoReceiveMRModel.collection.findOne( searchCriteria, function(err, foundContactData) {
            if ( err ) {
              parallelCallback( winston.makeMongoError( err ) );

            } else if ( ( ! foundContactData ) || ( ! foundContactData.value ) ) {
              //No foundContactData means zero values...
              parallelCallback();
            
            } else {
              if ( foundContactData.value.sent ) {
                result.sent = foundContactData.value.sent;
              }
              if ( foundContactData.value.corecipient ) {
                result.corecipient = foundContactData.value.corecipient;
              }
              parallelCallback();
            }
          });
          
        }], function(err) {
          if ( err ) {
            callback(err);
          } else {
            callback( null, result, isSentByUser );
          }
        }
      );
    }
  });
}