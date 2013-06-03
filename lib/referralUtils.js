
var winston = require('./winstonWrapper').winston
  , utils = require('./utils')
  , ReferralModel = require('../schema/referral').ReferralModel
  , UserModel = require('../schema/user').UserModel

var referralUtils = this;

exports.saveReferral = function( oldUserId, newUserId, source, originURL, callback ) {

  if ( ! oldUserId ) { callback( winston.makeMissingParamError('oldUserId') ); return; }
  if ( ! newUserId ) { callback( winston.makeMissingParamError('newUserId') ); return; }

  var referral = new ReferralModel({
      oldUserId: oldUserId
    , newUserId: newUserId
  });
  if ( source ) {
    referral.source = source;
  }
  if ( originURL ) {
    referral.originURL = originURL;
  }

  referral.save(function(err) {
    if ( err ) {
      callback( winston.makeMongoError(err) );

    } else {
      referralUtils.updateUserDaysLimit( oldUserId, function(err) {
        if ( err ) {
          callback( err );

        } else {
          //TODO: Kick off resume download job.  Need Sagar here.
          callback();
        }
      });
    }
  });
}

exports.updateUserDaysLimit = function( oldUserId, callback ) {

  if ( ! oldUserId ) { callback( winston.makeMissingParamError('oldUserId') ); return; }

  ReferralModel.find({oldUserId: oldUserId}, function(err, foundReferrals) {
    if ( err ) {
      callback( winston.makeMongoError(err) );

    } else {
      var newDaysLimit = referralUtils.calculateDaysLimit( foundReferrals );
      var updateSet = {$set:{
        daysLimit: newDaysLimit
      }};
      UserModel.findByIdAndUpdate(oldUserId, updateSet, function(err) {
        if ( err ) {
          callback( winston.makeMongoError( err ) );

        } else {
          callback();
        }
      });
    }
  });
}

exports.calculateDaysLimit = function( foundReferrals ) {
  var daysLimit = constants.BASE_DAYS_LIMIT
  
  if ( utils.isArray( foundReferrals ) && foundReferrals.length ) {
    var extraDays = foundReferrals.length * constants.REFERRAL_EXTRA_DAYS;
    daysLimit += extraDays;
  }

  return daysLimit;
}