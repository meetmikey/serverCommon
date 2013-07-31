
var winston = require('./winstonWrapper').winston
  , upgradeUtils = require('./upgradeUtils')
  , mailDownloadUtils = require('./mailDownloadUtils')
  , ReferralModel = require('../schema/referral').ReferralModel

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
      upgradeUtils.updateUserAccountStatusByUserId( oldUserId, false, callback );
    }
  });
}