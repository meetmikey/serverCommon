
var winston = require('./winstonWrapper').winston
  , utils = require('./utils')
  , ReferralModel = require('../schema/referral').ReferralModel
  , constants = require ('../constants')
  , ResumeDownloadStateModel = require ('../schema/onboard').ResumeDownloadStateModel
  , MailBoxModel = require ('../schema/mail').MailBoxModel
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
          referralUtils.createResumeDownloadNow (oldUserId, callback);
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


exports.createResumeDownloadNow = function (userId, callback) {
  // find the mailbox info
  MailBoxModel.findOne ({userId : userId}, function (err, foundMailbox) {
    if (err) {
      callback( winston.makeMongoError( err ) );

    }
    else if (!foundMailbox) {
      callback( winston.makeError( 'No mailbox found', {userId: userId} ) );

    }
    else{
      var resume = new ResumeDownloadStateModel({
        userId : userId,
        mailBoxId : foundMailbox._id,
        maxUid : foundMailbox.uidNext -1,
        resumeAt : Date.now()
      });

      resume.save (function (err) {
        if (err) {
          callback( winston.makeMongoError( err ) );
        }
        else {
          callback();
        }
      });
    }
  });
}