var mongoose = require ('mongoose')
  , Schema = mongoose.Schema
  , constants = require('../constants')

var UserUpgrade = new Schema({
    userId: {type: Schema.ObjectId, index: true}
  , billingPlan: {type: String, enum: ['free', 'basic', 'pro'], required: true}
  , stripeCustomerId: {type: String}
  , timestamp: {type: Date, default: Date.now}
  , status: {type: String, enum: ['success', 'fail']}
});

mongoose.model('UserUpgrade', UserUpgrade);
exports.UserUpgradeModel = mongoose.model('UserUpgrade');