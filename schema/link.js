var mongoose = require('../lib/mongooseConnect').mongoose;
var Schema = mongoose.Schema;

var EmailUser = {
    name: {type: String}
  , email: {type: String}
};

var Link = new Schema({
    userId: {type: Schema.ObjectId, index: true, required: true}
  , mailId: {type: Schema.ObjectId, index: true, required: true}
  , url: {type: String, required: true}
  , isPromoted: {type: Boolean, index: true, default: false}
  , hasBeenDiffboted: {type: Boolean, default: false}
  , sentDate: {type: Date, default: Date.now}
  , sender: EmailUser
  , image: {type: String}
  , timestamp: {type: Date, default: Date.now}
});

mongoose.model('Link', Link);
exports.LinkModel = mongoose.model('Link')