var mongoose = require ('mongoose')
  , Schema = mongoose.Schema
  , constants = require('../constants')

var ExtraDays = new Schema({
    userId: {type: Schema.ObjectId, index: true}
  , numExtraDays: {type: Number}
  , grantorLastName: {type: String}
  , timestamp: {type: Date, default: Date.now}
});

mongoose.model('ExtraDays', ExtraDays);
exports.ExtraDaysModel = mongoose.model('ExtraDays');