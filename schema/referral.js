var mongoose = require ('mongoose')
  , Schema = mongoose.Schema
  , constants = require('../constants')

var Referral = new Schema({
    oldUserId: {type: Schema.ObjectId}
  , newUserId: {type: Schema.ObjectId}
  , timestamp: {type: Date, default: Date.now}
  , source: {type: String, enum: [
      constants.REFERRAL_SOURCE_TWITTER
    , constants.REFERRAL_SOURCE_FACEBOOK
    , constants.REFERRAL_SOURCE_DIRECT
    , constants.REFERRAL_SOURCE_LIKE
    ]}
  , originURL: {type: String}
});

Referral.index({oldUserId: 1, newUserId: 1}, {unique: true});

mongoose.model('Referral', Referral);
exports.ReferralModel = mongoose.model('Referral');