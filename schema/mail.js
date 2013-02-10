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

var Mail = new Schema({
    userId: {type: Schema.ObjectId, index: true, required: true}
  , messageId: {type: String, index: true}
  , sender: EmailUser
  , recipients: {type: [EmailUserSchema]}
  , subject: {type: String}
  , cleanSubject: {type: String}
  , bodyText: {type: String}
  , bodyHTML: {type: String}
  , numAttachments: {type: Number}
  , sentDate: {type: Date}
  , timestamp: {type: Date, default: Date.now}
  , uid : {type : Number, required : true, index: true}
  , seqNo : {type : Number}
  , mailboxId : {type : Schema.ObjectId}
  , s3Path : {type : String}
  , size : {type : Number}
  , mailReaderState: {type: String, enum: ['none', 'started', 'softFail', 'hardFail', 'done'], default: 'none'}
  , gmDate : {type: Date}
  , gmThreadId : {type : String}
  , gmMsgId : {type : String}
  , gmLabels : {type : [String]}
  , hasAttachment : {type : Boolean, index: true}
});

// TODO: should i index hasAttachment, uid jointly for efficient sort?

var MailBox = new Schema ({
    userId : {type : Schema.ObjectId, index : true, required : true}
  , uidValidity : {type : Number, required : true}
  , name : {type : String, required : true}
  , uidNext : {type : Number, required : true}
  , totalMessages : {type : Number, required: true}
})

mongoose.model ('MailBox', MailBox)
mongoose.model('Mail', Mail);
exports.MailModel = mongoose.model('Mail');
