var mongoose = require ('mongoose')
  , Schema = mongoose.Schema
  , constants = require('../constants')

var UserUpgradeEvent = new Schema({
    userId: {type: Schema.ObjectId, index: true}
  , billingPlan: {type: String, enum: ['free', 'basic', 'pro', 'team'], required: true}
  , stripeCustomerId: {type: String}
  , stripeCardToken: {type: String}
  , timestamp: {type: Date, default: Date.now}
  , status: {type: String, enum: ['success', 'fail']}
  , failReason: {type: String}
});

mongoose.model('UserUpgradeEvent', UserUpgradeEvent);
exports.UserUpgradeEventModel = mongoose.model('UserUpgradeEvent');