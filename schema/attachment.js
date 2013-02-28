var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EmailUserSchema = new Schema({
    name: {type: String}
  , email: {type: String}
});

var EmailUser = {
    name: {type: String}
  , email: {type: String}
};

var Attachment = new Schema({
    userId: {type: Schema.ObjectId, required: true}
  , mailId: {type: Schema.ObjectId, index: true, required: true}
  , filename: {type: String}
  , contentType: {type: String}
  , fileSize: {type: Number}
  , sentDate: {type: Date, default: Date.now}
  , sender: EmailUser
  , recipients: {type: [EmailUserSchema]}
  , image: {type: String}
  , mailCleanSubject: {type: String}
  , mailBodyText: {type: String}
  , mailBodyHTML: {type: String}
  , hash: {type: String, required: true}
  , gmThreadId: {type: String}
  , gmMsgId : {type : String}
  , indexState: {type : String, enum : ['done', 'error']}
  , indexError : {type : String}
  , timestamp: {type: Date, default: Date.now}
  , isPromoted: {type : Boolean}
  , isDeleted: {type : Boolean}
});

Attachment.index({ userId: 1, gmThreadId: 1 });
Attachment.index({ hash: 1, fileSize: 1 });
Attachment.index({ userId: 1, sentDate: -1 });

mongoose.model('Attachment', Attachment);
exports.AttachmentModel = mongoose.model('Attachment')