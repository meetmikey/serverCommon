var mongoose = require('../lib/mongooseConnect').mongoose;
var Schema = mongoose.Schema;

var EmailUser = {
    name: {type: String}
  , email: {type: String}
};

var Attachment = new Schema({
    userId: {type: Schema.ObjectId, index: true, required: true}
  , mailId: {type: Schema.ObjectId, index: true, required: true}
  , filename: {type: String}
  , contentType: {type: String}
  , size: {type: Number}
  , sentDate: {type: Date, default: Date.now}
  , sender: EmailUser
  , image: {type: String}
  , timestamp: {type: Date, default: Date.now}
});

mongoose.model('Attachment', Attachment);
exports.AttachmentModel = mongoose.model('Attachment')